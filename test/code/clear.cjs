const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Clear";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `clearPerf() is defined (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
        t.ok(typeof epitelete.clearPerf === "function");
    }
)

test(
    `clearPerf clears list of document keys (${testGroup})`,
    async t => {
        t.plan(3)
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            t.ok("TIT" in epitelete.getDocuments(), "Can not clearPerf because no document was added.");
            epitelete.clearPerf()
            t.same(epitelete.getDocuments(), {});
            t.same(epitelete.history, {});
        } catch (err) {
            t.error(err);
        }
    }
)
