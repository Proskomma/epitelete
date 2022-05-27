const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Standalone";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `test instantiate Epitelete in standalone mode (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eBible/fra_fraLSG";
            const epitelete = new Epitelete({ docSetId });
            const bookCode = "JON";
            t.ok(epitelete.backend === "standalone");
            try {
                await epitelete.fetchPerf(bookCode);
                t.fail("standalone instance should not fetchPerf");
            } catch (err) {
                t.pass("standalone instance fails at readPerf");
            }
            const perfJSON = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_jon_document.json")));
            await epitelete.sideloadPerf(bookCode, perfJSON);
            const savedDoc = await epitelete.readPerf(bookCode);
            t.deepEqual(savedDoc, perfJSON, "perfJSON is saved in memory");
        } catch (err) {
            t.fail(err);
        }
        t.end()
    }
)
