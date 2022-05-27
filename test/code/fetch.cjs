const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Fetch";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

// fetchPerf tests

test(
    `fetchPerf() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
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
            const epitelete = new Epitelete({ proskomma, docSetId });
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
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "LUK";
            const doc = await epitelete.fetchPerf(bookCode);
            for (const k of ["headers", "tags", "sequences", "mainSequence"]) {
                t.ok(k in doc);
            }
        } catch (err) {
            t.error(err)
        }
        t.end()
    }
)

test(
    `fetchPerf() adds document to documents property (${testGroup})`,
    async t => {
        t.plan(2);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
        const bookCode = "MRK";
        t.notOk(bookCode in epitelete.getDocuments());
        await epitelete.fetchPerf(bookCode);
        t.ok(bookCode in epitelete.getDocuments())
    }
)
