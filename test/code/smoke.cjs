const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { UWProskomma } = require("uw-proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Smoke";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(
  path.resolve(
    path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")
  )
);

proskomma.loadSuccinctDocSet(succinctJson);

test(`Instantiate Epitelete (${testGroup})`, async function (t) {
  try {
    t.plan(4);
    t.doesNotThrow(
      () => new Epitelete({ proskomma, docSetId: "DBL/eng_engWEBBE" })
    );
    t.throws(() => new Epitelete({ proskomma }), /docSetId is required/);
    t.throws(() => new Epitelete({}), /docSetId is required/);
    t.throws(
      () => new Epitelete({ proskomma, docSetId: "eBible/fra_fraLSG" }),
      /docSetId is not present/
    );
  } catch (err) {
    t.error(err);
  }
});

test(`Instantiate Epitelete with options (${testGroup})`, async function (t) {
  try {
    t.plan(3);
    t.doesNotThrow(
      () =>
        new Epitelete({ proskomma, docSetId: "DBL/eng_engWEBBE", options: {} })
    );
    t.doesNotThrow(
      () =>
        new Epitelete({
          proskomma,
          docSetId: "DBL/eng_engWEBBE",
          options: { historySize: 10 },
        })
    );
    t.throws(() => new Epitelete({ banana: "split" }), /docSetId is required/);
  } catch (err) {
    t.error(err);
  }
});

const usfmULT = fse.readFileSync(
  path.resolve(__dirname, "..", "test_data", "TIT_dcs_uw_en_ult.usfm")
);

const docUlt = {
  selectors: { org: "dcs", lang: "en", abbr: "ult" },
  content: usfmULT.toString(),
};
proskomma.importDocument(docUlt.selectors, "usfm", docUlt.content);

const usfmUST = fse.readFileSync(
  path.resolve(__dirname, "..", "test_data", "TIT_dcs_uw_en_ust.usfm")
);

const docUst = {
  selectors: { org: "dcs", lang: "en", abbr: "ust" },
  content: usfmUST.toString(),
};
proskomma.importDocument(docUst.selectors, "usfm", docUst.content);

test(`Instantiate Epitelete multiple times using the same pk instance (${testGroup})`, async function (t) {
  t.plan(2);
  try {
    const epi1 = new Epitelete({
      proskomma,
      docSetId: "dcs/en_ult",
      options: { historySize: 10 },
    });

    const epi2 = new Epitelete({
      proskomma,
      docSetId: "dcs/en_ust",
      options: { historySize: 10 },
    });

    const perfUlt = await epi1.readPerf("TIT");
    const perfUst = await epi2.readPerf("TIT");

    t.ok(perfUlt?.sequences[perfUlt.main_sequence_id]?.blocks.length > 0);
    t.ok(perfUst?.sequences[perfUst.main_sequence_id]?.blocks.length > 0);
  } catch (err) {
    t.error(err);
  }
});
