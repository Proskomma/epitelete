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
    `test the undoStack with writePerf dose not exceed MAX_UNDO (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
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
            for (let i = 0; i < epitelete.STACK_LIMIT + 1; i++){
                const newDoc = await epitelete.writePerf(bookCode,
                    sequenceId3,
                    sequence3
                );
            }
            t.equal(epitelete.history.stack[bookCode].length, epitelete.STACK_LIMIT, 'should be equal to STACK_LIMIT')
        } catch (err) {
            t.error(err);
        }
        t.end()
    }
)

test(
    `test can't Undo with empty document (${testGroup})`,
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
    `test can't Undo with unchanged document (${testGroup})`,
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
    `test can Undo with changed document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
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
            const newDoc = await epitelete.writePerf(bookCode,
                sequenceId3,
                sequence3
            );
            const canUndo = epitelete.canUndo(bookCode);
            t.ok(canUndo);
            t.equal(epitelete.history.cursor[bookCode], 1, 'expected the history.cursor to be 1')
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `test can't redo with empty document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            const canRedo = epitelete.canRedo(bookCode);
            t.notOk(canRedo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `test shouldn't be undoPerf with unchanged document (${testGroup})`,
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
    `test can undoPerf with changed document (${testGroup})`,
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