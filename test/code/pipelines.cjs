const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;
const {Validator} = require("proskomma-json-tools");

const testGroup = "Pipelines";

const blockHasMarkup = ({ block, type, subtype }) => block.content?.some((element) => {
    return element.type === type && element.subtype === subtype
})
const sequenceHasMarkup = ({ sequence, type, subtype }) => {
    const blocks = sequence.blocks;
    return blocks.some((block) => blockHasMarkup({ block, type, subtype }));
};

const docHasMarkup = ({ doc, type, subtype }) => {
    if (!doc || !doc.sequences) {
        return false;
    }
    const mainSequence = doc.sequences[doc.main_sequence_id];
    return sequenceHasMarkup({ sequence: mainSequence, type, subtype })
}

const proskomma = new Proskomma([
    {
        name: "org",
        type: "string",
        regex: "^[^\\s]+$"
    },
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
        let perf;
        try {
            perf = await epitelete.sideloadPerf(bookCode, alignedPerf, {
                writePipeline: "stripAlignmentPipeline",
                readPipeline: "mergeAlignmentPipeline"
            });
        } catch (err) {
            t.fail(`sideloadPerf() threw an error: ${err}`);
        }
        t.ok(!!perf);
        const validator = new Validator();
        let validation = validator.validate(
            'constraint',
            'perfDocument',
            '0.3.0',
            perf || {}
        );
        t.equal(validation.errors, []);
        t.ok(docHasMarkup({ doc: perf, type: "wrapper", subtype: "usfm:w" }), "perf has wrapper");
        t.ok(docHasMarkup({ doc: perf, type: "start_milestone", subtype: "usfm:zaln" }), "perf has alignment");
        let perf2;
        try {
            perf2 = await epitelete.writePerf(bookCode, perf.main_sequence_id, perf.sequences[perf.main_sequence_id], {
                writePipeline: "stripAlignmentPipeline",
                readPipeline: "mergeAlignmentPipeline"
            });
        } catch (err) {
            t.fail(`writePerf() threw an error: ${err}`);
        }
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
        const readPipeline = "stripAlignmentPipeline"
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
