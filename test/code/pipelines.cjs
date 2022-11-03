const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Pipelines";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));

test.only(
    `read follows correct pipeline flow. (${testGroup})`,
    async t => {
        const bookCode = "TIT";
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ docSetId });
        const perf2 = await epitelete.sideloadPerf(bookCode, alignedPerf, { writePipeline: "stripAlignment", readPipeline: "mergeAlignment" });
        const perf = await epitelete.writePerf(bookCode, perf2.main_sequence_id, perf2.sequences[perf2.main_sequence_id] ,{writePipeline: "mergeAlignment" });
        t.ok(!!perf);
        t.end();
    }
)


// const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));

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

test(
    `reads perf and strips alignment (${testGroup})`,
    async t => {
        t.plan(5);
        const docSetId = "DCS/en_ult";
        const epitelete = new Epitelete({docSetId});
        
        // const tit = await epitelete.fetchPerf("TIT");
        // console.log(tit.sequences[tit.main_sequence_id].blocks[1].content)

        const aligned = await epitelete.sideloadPerf("TIT", alignedPerf);

        t.ok(docHasMarkup({ doc: aligned, type: "wrapper", subtype: "usfm:w" }), "perf has wrapper");
        t.ok(docHasMarkup({ doc: aligned, type: "start_milestone", subtype: "usfm:zaln" }), "perf has alignment");

        const unaligned = await epitelete.readPerf("TIT", { readPipeline: "stripAlignment" });

        t.notOk(docHasMarkup({ doc: unaligned, type: "wrapper", subtype: "usfm:w" }), "perf does not have wrapper");
        t.notOk(docHasMarkup({ doc: unaligned, type: "start_milestone", subtype: "usfm:zaln" }), "perf does not have alignment");

        t.ok(epitelete.history["TIT"].stack[0].pipelineData?.strippedAlignment, "Stripped alignment data saved in history");
    }
)

test(
    `sideloads perf and strips alignment (${testGroup})`,
    async t => {
        t.plan(3);
        const docSetId = "DCS/en_ult";
        const epitelete = new Epitelete({docSetId});

        const unaligned = await epitelete.sideloadPerf("TIT", alignedPerf, { readPipeline: "stripAlignment" });

        t.notOk(docHasMarkup({ doc: unaligned, type: "wrapper", subtype: "usfm:w" }), "perf does not have wrapper");
        t.notOk(docHasMarkup({ doc: unaligned, type: "start_milestone", subtype: "usfm:zaln" }), "perf does not have alignment");

        t.ok(epitelete.history["TIT"].stack[0].pipelineData?.strippedAlignment, "Stripped alignment data saved in history");
    }
)