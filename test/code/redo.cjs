const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;
const _ = require("lodash");


const testGroup = "Redo";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

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
    `test can't redo with unchanged document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode)
            const canRedo = epitelete.canRedo(bookCode);
            t.notOk(canRedo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)




test(
    `test can't redo with changed document (${testGroup})`,
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
            const canRedo = epitelete.canRedo(bookCode);
            t.notOk(canRedo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)



test(
    `test can redo with changed document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            const perf = await epitelete.readPerf(bookCode);
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
            const canRedo = epitelete.canRedo(bookCode);
            t.notOk(canRedo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)


test(
    `test can redo after undo (${testGroup})`,
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
            epitelete.undoPerf(bookCode);
            const canRedo = epitelete.canRedo(bookCode);
            t.ok(canRedo);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `test shouldn't be redoPerf with unchanged document (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode)
            const redoPerf = epitelete.redoPerf(bookCode);
            t.notOk(redoPerf);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `test can't redoPerf with changed document (${testGroup})`,
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
            const redoPerf = epitelete.redoPerf(bookCode);
            t.notOk(redoPerf);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)

test(
    `test can redoPerf after undoPerf (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            const perf = await epitelete.readPerf(bookCode);
            const perfKeys = Object.keys(perf.sequences);
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
            const undonePerf = epitelete.undoPerf(bookCode);
            const undonePerfKeys = Object.keys(undonePerf.sequences);
            const redonePerf = epitelete.redoPerf(bookCode);
            const redonePerfKeys = Object.keys(redonePerf.sequences);
            t.ok(redonePerf);

            t.equal(perfKeys.length, undonePerfKeys.length);
            t.equal(perfKeys.length, redonePerfKeys.length);
            const perfKeysSet = new Set([...perfKeys, ...undonePerfKeys, ...redonePerfKeys]);
            t.equal(perfKeys.length, perfKeysSet.size);
        }catch (err){
            t.error(err);
        }
        t.end();
    }

)