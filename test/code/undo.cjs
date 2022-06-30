const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;
const _ = require("lodash");


const testGroup = "Undo";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `undo stack length with writePerf does not exceed historySize (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId, options: {historySize:3}});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const _doc = _.cloneDeep(documents[bookCode]);
            const lukeDoc = _.cloneDeep(_doc);
            // console.log("Luke:",JSON.stringify(lukeDoc, null, 4));
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            let newBlocks = [];
            sequence3.blocks = newBlocks;
            for (let i = 0; i < epitelete.options.historySize + 1; i++){
                const newDoc = await epitelete.writePerf(bookCode,
                    sequenceId3,
                    sequence3
                );
            }
            t.equal(epitelete.history[bookCode].stack.length, epitelete.options.historySize, 'should be equal to epitelete.options.historySize')
        } catch (err) {
            t.error(err);
        }
        t.end()
    }
)

test(
    `canUndo false with empty document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            const canUndo = epitelete.canUndo(bookCode);
            t.notOk(canUndo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `canUndo false with unchanged document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode)
            const canUndo = epitelete.canUndo(bookCode);
            t.notOk(canUndo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `canUndo true with changed document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            const doc = await epitelete.readPerf(bookCode);
            const lukeDoc = doc;
            // console.log("Luke:",JSON.stringify(lukeDoc, null, 4));
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            sequence3.blocks = [];
            const newDoc = await epitelete.writePerf(bookCode,
                sequenceId3,
                sequence3
            );
            const canUndo = epitelete.canUndo(bookCode);
            t.ok(canUndo);
            t.equal(epitelete.history[bookCode].cursor, 0, 'expected the history.cursor to be 0')
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `cannot undoPerf with unchanged document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode)
            const undoPerf = epitelete.undoPerf(bookCode);
            t.notOk(undoPerf);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `can undoPerf with changed document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode)
            const documents = epitelete.getDocuments();
            const _doc = _.cloneDeep(documents[bookCode]);
            const lukeDoc = _.cloneDeep(_doc);
            // console.log("Luke:",JSON.stringify(lukeDoc, null, 4));
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            let newBlocks = [];
            sequence3.blocks = newBlocks;
            const newDoc = await epitelete.writePerf(bookCode,
                sequenceId3,
                sequence3
            );
            const undoPerf = epitelete.undoPerf(bookCode);
            t.ok(undoPerf);
            t.deepEqual(undoPerf, _doc, 'expect undoPerf should return the original doc')
        }catch (err){
            t.error(err);
        }
        t.end();
    }
)

test(
    `multiple undo/redo (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const historySize = 5;
            const epitelete = new Epitelete({proskomma, docSetId, options:{historySize}});
            const bookCode = "3JN";
            const doc1 = await epitelete.readPerf(bookCode);
            const history = epitelete.history[bookCode];
            const sequenceId = doc1.main_sequence_id;
            const sequence = doc1.sequences[sequenceId]
            const initialBlocksCount = sequence.blocks.length;

            const n = historySize;
            t.ok(n <= initialBlocksCount, "");
            let auxDoc = doc1;

            //Write to history n times
            for (let index = 1; index < n; index++) {
                const auxSequence = auxDoc.sequences[sequenceId];
                auxSequence.blocks.shift();
                auxDoc = await epitelete.writePerf(bookCode, sequenceId, auxSequence);
                t.equal(history.stack.length, index+1);
            }
            const newBlocksCount = auxDoc.sequences[sequenceId].blocks.length;
            t.equal(newBlocksCount, initialBlocksCount - n + 1);

            //Undo n times
            for (let index = 1; index < n; index++) {
                auxDoc = epitelete.undoPerf(bookCode);
                const expectedBlockCount = newBlocksCount + index;
                t.equal(auxDoc.sequences[sequenceId].blocks.length, expectedBlockCount);
            }
            t.equal(auxDoc.sequences[sequenceId].blocks.length, initialBlocksCount);

            //Redo n times
            for (let index = 1; index < n; index++) {
                auxDoc = epitelete.redoPerf(bookCode);
                const expectedBlockCount = initialBlocksCount - index;
                t.equal(auxDoc.sequences[sequenceId].blocks.length, expectedBlockCount);
            }
            t.equal(auxDoc.sequences[sequenceId].blocks.length, newBlocksCount);

            //Undo n times to then test stack slicing
            for (let index = 1; index < n; index++) {
                auxDoc = epitelete.undoPerf(bookCode);
            }

            //Write one more time to check stack slicing
            const auxSequence = auxDoc.sequences[sequenceId];
            auxSequence.blocks.shift();
            auxDoc = await epitelete.writePerf(bookCode, sequenceId, auxSequence);

            t.equal(history.stack.length, 2);
            t.equal(history.cursor, 0);

        }catch (err){
            t.error(err);
        }
        t.end();
    }
)
