const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Standalone";

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
const documentPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "MRK-eBible-fra_fraLSG-perf_v0.2.1.json")));

test(
    `Instantiate Epitelete in standalone mode (${testGroup})`,
    async t => {
        t.plan(4)
        try {
            const docSetId = "DBL/eBible/fra_fraLSG";
            const epitelete = new Epitelete({ docSetId });
            const bookCode = "MRK";
            t.ok(epitelete.backend === "standalone");
            try {
                await epitelete.fetchPerf(bookCode);
                t.fail("standalone instance should not fetchPerf");
            } catch (err) {
                t.pass("standalone instance fails at readPerf");
            }
            const sideloaded = await epitelete.sideloadPerf(bookCode, documentPerf);
            const savedDoc = await epitelete.readPerf(bookCode);
            t.deepEqual(savedDoc, documentPerf, "documentPerf is saved in memory");
            const mainSequence = documentPerf.sequences[documentPerf.main_sequence_id];
            t.ok(await epitelete.writePerf(bookCode, documentPerf.main_sequence_id, mainSequence));
            
        } catch (err) {
            t.fail(err);
        }
    }
)
