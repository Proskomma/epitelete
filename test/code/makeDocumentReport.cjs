const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Reports";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `makeDocumentReport() is defined (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        t.ok(typeof epitelete.makeDocumentReport === "function");
    }
)

test(
    `makeDocumentReport() throws on bad bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        t.throws(
            () => epitelete.makeDocumentReport(
                "banana",
                "wordSearch",
                {
                    perf: {},
                    searchString: "foo"
                }
            ),
            /banana/
        );
    }
)

test(
    `makeDocumentReport() throws on bad reportName (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        t.throws(
            () => epitelete.makeDocumentReport(
                "LUK",
                "banana",
                {
                    perf: {},
                    searchString: "foo"
                }
            ),
            /banana/
        );
    }
)

test(
    `makeDocumentReport() throws when inputs do not match spec (${testGroup})`,
    async t => {
        t.plan(3);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        t.throws(
            () => epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    extra: "baa",
                    perf: {},
                    searchString: "foo"
                }
            ),
            /3 provided/
        );
        t.throws(
            () => epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    perf: {},
                    "baa": "foo"
                }
            ),
            /searchString not provided/
        );
        t.throws(
            () => epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    perf: "perf",
                    "searchString": {}
                }
            ),
            /searchString must be text/
        );
    }
)


test(
    `makeDocumentReport() returns output with valid args (${testGroup})`,
    async t => {
        t.plan(2);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        const output = epitelete.makeDocumentReport(
            "LUK",
            "wordSearch",
            {
                perf: {},
                searchString: "Zacharias"
            }
        );
        t.ok('matches' in output);
        t.ok(output.matches.includes("1:5"));
    }
)
