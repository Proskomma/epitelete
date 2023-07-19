const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const { Validator } = require("proskomma-json-tools");
const Epitelete = require("../../dist/index").default;
const pipelines = require("../../src/pipelines");
const transforms = require("../../src/transforms");

const testGroup = "alignedPerf";

const originalUsfm = fse
  .readFileSync(
    path.resolve(
      path.join(__dirname, "..", "test_data", "TIT_dcs_uw_en_ult.usfm")
    )
  )
  .toString();
  

const targetPerf = JSON.parse(fse
  .readFileSync(
    path.resolve(
      path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")
    )
  )
  .toString());
const sourceGreekPerf = JSON.parse(fse
  .readFileSync(
    path.resolve(
      path.join(__dirname, "..", "test_data", "ugnt_57_TIT.json")
    )
  )
  .toString());

const getEpi = (usfm) => {
  const proskomma = new Proskomma([
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
  proskomma.importDocument(
    { lang: "eng", abbr: "ult" },
    "usfm",
    usfm
  );
  const epitelete = new Epitelete({ proskomma, docSetId: "eng_ult"});
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

test.only(`perfToRichPerf validation (${testGroup})`, async (t) => {
  t.plan(1);
  try {
    const epiteleteInstance = getEpi(originalUsfm);
    let bookCode = "TIT";

    // let perf = await epitelete.sideloadPerf(bookCode, targetPerf);
    // const pipelineH = epitelete.getPipelineHandler();

    // const richPerf = output.perf;

    // let richPerfSideLoad = await epiteleteInstance.loadPerfToRichPerf(bookCode, {perfSource: sourceGreekPerf, perfTarget: perf}, {readPipeline : "stripRichAlignPerf", writePipeline: "perfToRichPerf"});
    // const richPerf = await epiteleteInstance.readPerf(bookCode, { perfSource: sourceGreekPerf, readPipeline: "perfToRichPerf" });

    
    // console.log("strippedAlignment == ", epiteleteSideLoad.history[bookCode].stack[0].pipelineData?.strippedAlignment);
    
    // let perfDoc = await epiteleteInstance.fetchPerf(bookCode, {readPipeline : "stripAlignmentPipeline", writePipeline: "mergeAlignmentPipeline"});
    
    let richPerf = await epiteleteInstance.getRichPerf(bookCode, sourceGreekPerf);
    // console.log("richPerf ==\n", JSON.stringify(richPerf, null, 2));
    // // let richPerfDoc = await epiteleteInstance.fetchPerf(bookCode, {writePipeline: "perfToRichPerf"});

    // ***HERE I CAN DO MODIFCATIONS IN MY RICH PERF***
    // // const sequenceId = ;
    // const sequenceRichPerfDoc = richPerfDoc.sequences[richPerfDoc.main_sequence_id];

    // // // then
    // const newRichPerfDocument = await epiteleteInstance.writePerf(bookCode, richPerfDoc.main_sequence_id, sequenceRichPerfDoc, {readPipeline : "stripRichAlignPerf", writePipeline: "mergeAlignmentPipeline"});
    
    // console.log("newRichPerfDocument ==\n",newRichPerfDocument);

    // OR

    // const epiteleteSideLoad = new Epitelete("eng_ult");

    // writePipeline is useless here
    // the first time we don't have any history changes
    // let richPerfSideLoad = epiteleteSideLoad.sideloadPerf(bookCode, newRichPerfDocument, {readPipeline : "stripRichAlignPerf", writePipeline: "mergeRichAlignedPerf"});

    // OR 
    // writePipeline is for the way you want to transform your perf to be saved
    // readPipeline is for the way to want to transform your perf FROM the previously saved perf
    // let richPerfSideload = epiteleteSideLoad.sideloadPerf(bookCode, normalPerf, {writePipeline: "perfToRichPerf"});

    // aligned PERF (uW)
    // alignedPerf => RichAlignedPerf
    // RichAlignedPerf => alignedPerf => stripAlign
    // perfText only
    // TODO : stripRichAlignPerf
    // TODO : mergeRicheAlignPerf
    // TODO : 


    // source perf (greek, hebrew?)
    // target usfm (french, spanish, russian, etc.) aligned or not
    // const { perf } = await pipelineH.runPipeline("alignedUsfmToAlignedPerf", {
    //   "usfmTarget": originalUsfm,
    //   "selectorsTarget": {"lang": "eng", "abbr": "ust"},
    //   "perfSource": sourceGreekPerf,
    // });
    const validator = new Validator();
    let validation = validator.validate(
      'constraint',
      'perfDocument',
      '0.3.0',
      richPerf || {}
    );
    t.equal(validation.errors, null);
  } catch (err) {
    console.log(err);
    t.fail("alignedUsfmToAlignedPerf throws on valid perf");
  }
});

test(`roundtrip alignedUsfmToAlignedPerf validation (${testGroup})`, async (t) => {
  t.plan(3);
  try {
    const epiteleteInstance = getEpi(originalUsfm);
    const pipelineH = epiteleteInstance.getPipelineHandler();
    const { perf } = await pipelineH.runPipeline("alignedUsfmToAlignedPerf", {
      "usfmTarget": originalUsfm,
      "selectorsTarget": {"lang": "eng", "abbr": "ust"},
      "perfSource": sourceGreekPerf,
    });
    
    const { usfm, selectors } = await pipelineH.runPipeline("alignedPerfFormatToUsfm", {
      "perf": perf
    });

    t.ok(usfm);
    t.ok(usfm.length > 0);
    t.ok(usfm.split("\n")[0].length > 0);
  } catch (err) {
    console.log(err);
    t.fail("roundtrip alignedUsfmToAlignedPerf throws on valid perf");
  }
});

test(`roundtrip stripRichAlignedPerf validation (${testGroup})`, async (t) => {
  t.plan(1);
  try {
    const epiteleteInstance = getEpi(originalUsfm);
    const pipelineH = epiteleteInstance.getPipelineHandler();
    const { perf } = await pipelineH.runPipeline("alignedUsfmToAlignedPerf", {
      "usfmTarget": originalUsfm,
      "selectorsTarget": {"lang": "eng", "abbr": "ust"},
      "perfSource": sourceGreekPerf,
    });
    
    const output = await pipelineH.runPipeline("stripRichAlignedPerf", {
      "perf": perf
    });

    const validator = new Validator();
    let validation = validator.validate(
      'constraint',
      'perfDocument',
      '0.3.0',
      output.perf || {}
    );
    t.equal(validation.errors, null);
  } catch (err) {
    console.log(err);
    t.fail("roundtrip stripRichAlignedPerf throws on valid perf");
  }
});
