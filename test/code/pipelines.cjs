const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Pipelines";

const blockHasMarkup = ({ block, type, subtype }) => block.content?.some((element) => {
    return element.type === type && element.subtype === subtype
})
const sequenceHasMarkup = ({ sequence, type, subtype }) => {
    const blocks = sequence.blocks;
    return blocks.some((block) => blockHasMarkup({ block, type, subtype }));
};

const docHasMarkup = ({ doc, type, subtype }) => {
    const mainSequence = doc.sequences[doc.main_sequence_id];
    return sequenceHasMarkup({ sequence: mainSequence, type, subtype })
}

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));


test(
    `read follows correct pipeline flow. (${testGroup})`,
    async t => {
        const bookCode = "TIT";
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ docSetId });
      const perf = await epitelete.sideloadPerf(bookCode, alignedPerf, { writePipeline: "stripAlignment", readPipeline: "mergeAlignment" });
      t.ok(!!perf);
      t.ok(docHasMarkup({ doc: perf, type: "wrapper", subtype: "usfm:w" }), "perf has wrapper");
        t.ok(docHasMarkup({ doc: perf, type: "start_milestone", subtype: "usfm:zaln" }), "perf has alignment");
        const perf2 = await epitelete.writePerf(bookCode, perf.main_sequence_id, perf.sequences[perf.main_sequence_id] ,{writePipeline: "stripAlignment", readPipeline: "mergeAlignment" });
      t.ok(!!perf2);
      t.ok(docHasMarkup({ doc: perf2, type: "wrapper", subtype: "usfm:w" }), "perf has wrapper");
        t.ok(docHasMarkup({ doc: perf2, type: "start_milestone", subtype: "usfm:zaln" }), "perf has alignment");
        t.end();
    }
)

test(
    `runs pipelines with extra pipeline data. (${testGroup})`,
    async t => {
        t.plan(5)
        const bookCode = "TIT";
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ docSetId });
        const readPipeline = "stripAlignment"
        await epitelete.sideloadPerf(bookCode, alignedPerf);
    
        const pipelineInputs = epitelete.pipelineHandler?.pipelines[readPipeline]?.[0]?.inputs;
        t.ok(!!pipelineInputs, `epitelete contains ${readPipeline} pipeline`);
        const expectedDataLength = Object.keys(pipelineInputs).length;
        t.notOk(epitelete.getPipelineData(bookCode), "no pipeline data stored before running readPipeline");

        await epitelete.readPerf(bookCode, { readPipeline });
        const pipelineData = epitelete.getPipelineData(bookCode);
        t.ok(!!pipelineData, "Pipeline data stored after running readPipeline");
        const dataLenght = Object.keys(pipelineData).length + 1; // + 1  represents perf.

        t.ok(dataLenght > expectedDataLength, "dataLenght in memory is greater than expected dataLenght");

        await epitelete.readPerf(bookCode, { readPipeline })
            .then(() => t.pass(`Doesn't throw after receiving more data than expected. received: "${dataLenght}", expected: "${expectedDataLength}"`))
            .catch(() => t.fail(`Throws after receiving more data than expected. received: "${dataLenght}", expected: "${expectedDataLength}"`))
    }
)