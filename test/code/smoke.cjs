const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const perf2html = require("../../src/perf2html").default;
const Epitelete = require("../../src/index").default;
const _ = require("lodash");


const testGroup = "Smoke";

const pk = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
pk.loadSuccinctDocSet(succinctJson);

test(
    `Instantiate Epitelete (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.doesNotThrow(() => new Epitelete(pk, "DBL/eng_engWEBBE"));
            t.throws(() => new Epitelete(pk), "2 arguments");
            t.throws(() => new Epitelete(pk, "eBible/fra_fraLSG"),"docSetId is not present");
        } catch (err) {
            console.log(err);
        }
    },
);

// fetchPerf tests

test(
    `fetchPerf() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete(pk, docSetId);
        t.ok(typeof epitelete.fetchPerf === "function");
        t.end();
    }
)

test(
    `fetchPerf should not fetch wrong bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LU";
            await epitelete.fetchPerf(bookCode);
            t.fail("fetchPerf with bad bookCode should throw but didn't");
        } catch (err) {
            t.pass("fetchPerf throws on bad bookCode");
        }
    }
)

test(
    `fetchPerf() returns config output (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LUK";
            const doc = await epitelete.fetchPerf(bookCode);
            for (const k of ["headers", "tags", "sequences", "mainSequence"]) {
                t.ok(k in doc);
            }
        } catch (err) {
            t.error(err)
            console.log(err);
        }
        t.end()
    }
)

test(
    `fetchPerf() adds document to documents property (${testGroup})`,
    async t => {
        t.plan(2);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete(pk, docSetId);
        const bookCode = "MRK";
        t.notOk(bookCode in epitelete.documents);
        await epitelete.fetchPerf(bookCode);
        t.ok(bookCode in epitelete.documents)
    }
)

test(
    `readPerf() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete(pk, docSetId);
        t.ok(typeof epitelete.readPerf === "function");
        t.end();
    }
)

test(
    `readPerf should not read wrong bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LU";
            await epitelete.readPerf(bookCode);
            t.fail("readPerf with bad bookCode should throw but didn't");
        } catch (err) {
            t.pass("readPerf throws on bad bookCode");
        }
    }
)

test(
    `readPerf returns same as fetchPerf (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LUK";
            const readOutput = await epitelete.readPerf(bookCode);
            const fetchedOutput = await epitelete.fetchPerf(bookCode);
            t.deepEqual(readOutput,fetchedOutput);
        } catch (err) {
            t.error(err);
        }
        t.end()
    }
)

test(
    `localBookCodes() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete(pk, docSetId);
        t.ok(typeof epitelete.localBookCodes === "function");
        t.end();
    }
)

test(
    `localBookCodes returns list of document keys (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCodes = ["LUK", "MRK", "3JN", "GEN"];
            for (const bookCode of bookCodes) {
                await epitelete.readPerf(bookCode);
            }
            const localBookCodes = epitelete.localBookCodes();
            t.ok(localBookCodes)
            t.deepEqual(localBookCodes, bookCodes);
        } catch (err) {
            t.error(err);
            console.log(err);
        }
        t.end()
    }
)

test(
    `bookHeaders returns USFM headers for available book codes (${testGroup})`,
    async t => {
        debugger;
        try {
            const expectedMinHeaderCount = `5`;
            const expectedBookCount = 81;
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);

            const bookHeaders = epitelete.bookHeaders();
            // console.log('bookHeaders returns:', JSON.stringify(bookHeaders, null,2));
            const bookCodes = Object.keys(bookHeaders);
            // console.log('available book codes:', bookCodes);
            const bookCount = bookCodes.length;
            // console.log('number of books:', bookCount);

            t.ok(bookCodes)
            t.equal(bookCount, expectedBookCount, 'expected ' + expectedBookCount + ' books');
            for (const bookCode of bookCodes) {
                const headers = bookHeaders[bookCode];
                const headerCount = Object.keys(headers).length;
                t.ok(headerCount >= expectedMinHeaderCount, bookCode + ' expected at least ' + expectedMinHeaderCount + ' fields');
            }
        } catch (err) {
            t.error(err);
            console.log(err);
        }
        t.end()
    }
)

test(
    `clearPerf() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete(pk, docSetId);
        t.ok(typeof epitelete.clearPerf === "function");
        t.end();
    }
)

test(
    `clearPerf clears list of document keys (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            t.ok("LUK" in epitelete.documents, "Can not clearPerf because no document was added.");
            epitelete.clearPerf()
            t.same(epitelete.documents, {});
        } catch (err) {
            t.error(err);
            console.log(err);
        }
        t.end()
    }
)

test(
    `test the unchanged PERF (round trip) perfWrite (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.documents;
            const lukeDoc = documents[bookCode];
            const sequences = lukeDoc?.sequences;
            // console.log('sequences',sequences);
            const sequenceId3 = Object.keys(sequences)[3];
            // console.log('sequenceId3',sequenceId3);
            const sequence3 = sequences[sequenceId3];
            // console.log('sequence3',sequence3);
            const newDoc = await epitelete.perfWrite(bookCode, sequenceId3, sequence3);
            t.deepEqual(newDoc,lukeDoc, "expect to be unchanged");
        } catch (err) {
            t.error(err);
            console.log(err);
        }
        t.end()
    }
)

test(
    `test the changed PERF (round trip) perfWrite (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete(pk, docSetId);
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.documents;
            const _doc = _.cloneDeep(documents[bookCode]);
            const lukeDoc = _.cloneDeep(_doc);
            const sequences = lukeDoc?.sequences;
            // console.log('sequences',sequences);
            const sequenceId3 = Object.keys(sequences)[3];
            // console.log('sequenceId3',sequenceId3);
            const sequence3 = sequences[sequenceId3];
            let newBlocks = [];
            console.log('before sequence3',sequence3);
            sequence3.blocks = newBlocks;
            console.log('after sequence3',sequence3);
            const newDoc = await epitelete.perfWrite(bookCode, 
                sequenceId3, 
                sequence3
            );
            console.log("newDoc sequence=", newDoc.sequences[sequenceId3])
            t.notDeepEqual(newDoc,_doc, "expect to be changed");
            t.equal(newDoc.sequences[sequenceId3].blocks.length,
                newBlocks.length, 
                "expected new blocks to be one less than orginal"
            );
        } catch (err) {
            t.error(err);
            console.log(err);
        }
        t.end()
    }
)
