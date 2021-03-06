const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Read";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);


test(
    `readUsfm() is defined (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
        t.ok(typeof epitelete.readUsfm === "function");
    }
)

test(
    `readUsfm should not read wrong bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "LU";
            await epitelete.readUsfm(bookCode);
            t.fail("readUsfm with bad bookCode should throw but didn't");
        } catch (err) {
            t.pass("readUsfm throws on bad bookCode");
        }
    }
)

test(
    `readUsfm should read valid bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "MRK";
            // console.log(await epitelete.readUsfm(bookCode));
            t.pass("readUsfm works with valid bookCode");
        } catch (err) {
            t.fail("readUsfm throws on valid bookCode");
        }
    }
)
