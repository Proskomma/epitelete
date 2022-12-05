const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;
import deepCopy from 'rfdc/default';

const testGroup = "Write";

const proskomma = new Proskomma([
    {
        name: "org",
        type: "string",
        regex: "^[^\\s]+$"
    },
    {
        name: "lang",
        type: "string",
        regex: "^[^\\s]+$"
    },
    {
        name: "abbr",
        type: "string",
        regex: "^[A-za-z0-9_-]+$"
    }
]);
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `roundtrip unchanged PERF (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const lukeDoc = documents[bookCode];
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            const newDoc = await epitelete.writePerf(bookCode, sequenceId3, sequence3);
            t.deepEqual(newDoc,lukeDoc, "expect to be unchanged");
        } catch (err) {
            t.error(err);
            console.log(err);
        }
    }
)

test(
    `roundtrip changed PERF (${testGroup})`,
    async t => {
        t.plan(2);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            const doc = await epitelete.readPerf(bookCode);
            const oldDoc = deepCopy(doc);
            // console.log("Luke:",JSON.stringify(lukeDoc, null, 4));
            const sequences = doc.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            doc.sequences[sequenceId3].blocks = [];
            const sequence3 = doc.sequences[sequenceId3];
            const newDoc = await epitelete.writePerf(bookCode,sequenceId3,sequence3);
            t.notDeepEqual(newDoc,oldDoc, "expect to be changed");
            t.deepEqual(newDoc.sequences[sequenceId3].blocks,[],
                "expected new blocks to be one less than original"
            );
        } catch (err) {
            t.error(err);
        }
    }
)

test(
    `Fail on wrong bookCode (${testGroup})`,
    async t => {
        t.plan(2);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            const bookCode1 = "LK"
            const doc = await epitelete.readPerf(bookCode);
            const sequences = doc.sequences;
            t.ok(sequences);
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            const newDoc = await epitelete.writePerf(bookCode1, sequenceId3, sequence3);
            t.fail('Did not throw!');
        } catch (err) {
            if (err.toString() !== 'document not found: LK') {
                t.fail(err)
                throw err
            }
            else{
                t.pass('Success')
            }
        }
    }
)

test(
    `Fail on wrong sequenceId (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const lukeDoc = documents[bookCode];
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            const newDoc = await epitelete.writePerf(bookCode, sequenceId3+'12', sequence3);
            t.fail('Expected error')
        } catch (err) {
            if(!err.toString().includes('not found')) {
                t.fail('unexpected error')
            }
            else{
                t.pass('Success')
            }
        }
    }
)

test(
    `test writePerf for ProskommaJsonValidator with wrong sequence (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const lukeDoc = documents[bookCode];
            const sequences = lukeDoc?.sequences;
            const sequenceId3 = Object.keys(sequences)[3];
            const sequence3 = sequences[sequenceId3];
            const newDoc = await epitelete.writePerf(bookCode, sequenceId3, sequence3+'12');
            t.fail('Expected validation error but writePerf did not throw')
        } catch (err) {
            if (!err.toString().includes('is not valid')) {
                t.fail(`Expected validation error, not ${err.toString()}`)
            }
            else{
                t.pass('Success')
            }
        }
    }
)

const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));

test(
    `writes perf and merges alignment (${testGroup})`,
    async t => {
        t.plan(3);
        const docSetId = "DCS/en_ult";
        const epitelete = new Epitelete({ docSetId });
        const bookCode = "TIT";
        const readOptions = { readPipeline: "stripAlignmentPipeline" };
        const writeOptions = { writePipeline: "mergeAlignmentPipeline" };

        const unaligned = await epitelete.sideloadPerf(bookCode, alignedPerf, readOptions);

        t.isNotDeepEqual(alignedPerf, unaligned, "alignment stripped")

        const sequenceId = unaligned["main_sequence_id"];
        const sequence = unaligned.sequences[sequenceId];

        const merged = await epitelete.writePerf(bookCode, sequenceId, sequence, writeOptions);
        // const mergeNoAtts = merged;
        // console.log(JSON.stringify(merged," ",4));

        t.deepEqual(alignedPerf, merged, "writePipeline mergeAlignmentPipeline roundtripped");

        const undone = await epitelete.undoPerf(bookCode, readOptions);

        t.deepEqual(unaligned, undone, "undoing with filter returns same as reading previous with filter");
    }
)