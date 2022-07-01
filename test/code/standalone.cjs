const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Standalone";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const documentPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "perf_mrk.json")));

test(
    `Instantiate Epitelete in standalone mode (${testGroup})`,
    async t => {
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
        t.end()
    }
)
