const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { UWProskomma } = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "alignedUsfm";

const originalUsfm = fse
  .readFileSync(
    path.resolve(
      path.join(__dirname, "..", "test_data", "fr_lsg_tit_book.usfm")
    )
  )
  .toString();

const getEpi = (usfm) => {
  const proskomma = new UWProskomma();
  proskomma.importDocument(
    { org: "test", lang: "fra", abbr: "web" },
    "usfm",
    usfm
  );
  const epitelete = new Epitelete({ proskomma, docSetId: "test/fra_web" });
  return epitelete;
};

const getPerfData = (perf) => {
  const { sequences, main_sequence_id, ...metadata } = perf;
  const _sequences = Object.keys(perf.sequences).map((key) => {
    return JSON.stringify(sequences[key], (key, value) =>
      key === "target" ? undefined : value
    );
  });
  return { sequences: _sequences, metadata };
};

test(`readUsfm converts aligned PERF to USFM with no data loss (${testGroup})`, async (t) => {
  t.plan(2);
  try {
    const bookCode = "TIT";
    const originalEpi = getEpi(originalUsfm);
    const newUsfm = await originalEpi.readUsfm(bookCode);
    t.ok(newUsfm, "Epitelete converts PERF to USFM.");
    const newEpi = getEpi(newUsfm);
    const originalPerf = await originalEpi.readPerf(bookCode);
    const newPerf = await newEpi.readPerf(bookCode);
    t.same(
      getPerfData(originalPerf),
      getPerfData(newPerf),
      "No USFM data loss."
    );
  } catch (err) {
    console.log(err);
    t.fail("readUsfm throws on valid bookCode");
  }
});

const alignedPerf = fse.readJsonSync(
  path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json"))
);

test(`reads usfm with special aligned perf (${testGroup})`, async (t) => {
  t.plan(1);
  try {
    const bookCode = "TIT";
    const epi = new Epitelete({ docSetId: "dcs/en_ult" });
    await epi.sideloadPerf(bookCode,alignedPerf);
    await epi.readUsfm(bookCode);
    t.pass("reads usfm for start milestones with no atts");
  } catch (err) {
    console.log(err);
    t.fail("readUsfm should not throw an error");
  }
});