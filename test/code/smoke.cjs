const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Smoke";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `Instantiate Epitelete (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            t.doesNotThrow(() => new Epitelete({proskomma, docSetId: "DBL/eng_engWEBBE"}));
            t.throws(() => new Epitelete({proskomma}), /docSetId is required/);
            t.throws(() => new Epitelete({}), /docSetId is required/);
            t.throws(() => new Epitelete({ proskomma, docSetId: "eBible/fra_fraLSG"}),/docSetId is not present/)
        } catch (err) {
            t.error(err)
        }
    },
);

test(
    `Instantiate Epitelete with options (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.doesNotThrow(() => new Epitelete({proskomma, docSetId:"DBL/eng_engWEBBE", options: {}}));
            t.doesNotThrow(() => new Epitelete({proskomma, docSetId:"DBL/eng_engWEBBE", options: {historySize: 10}}));
            t.throws(() => new Epitelete({banana: "split"}), /docSetId is required/);
        } catch (err) {
            t.error(err)
        }
    },
);
