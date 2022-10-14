const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Read aligned doc";

const proskomma = new UWProskomma();
const usfmInput = fse.readFileSync(path.resolve(path.join(__dirname, "..", "test_data", "fr_lsg_tit_book.usfm"))).toString();
proskomma.importDocument({'org': 'test', 'lang': 'fra', 'abbr': "web"}, "usfm", usfmInput);

test(
    `readUsfm should read valid bookCode (${testGroup})`,
    async t => {
        t.plan(3);
        try {
            const epitelete = new Epitelete({ proskomma, docSetId:"test/fra_web" });
            const bookCode = "TIT";
            const usfm = await epitelete.readUsfm(bookCode);
            t.ok(usfm);
            t.ok(usfm.length > 0);
            t.pass("readUsfm works with valid bookCode");
        } catch (err) {
            console.log(err);
            t.fail("readUsfm throws on valid bookCode");
        }
    }
)
