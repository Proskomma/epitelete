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
    `readPerf() is defined (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
        t.ok(typeof epitelete.readPerf === "function");
    }
)

test(
    `readPerf should not read wrong bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "LU";
            await epitelete.readPerf(bookCode);
            t.fail("readPerf with bad bookCode should throw but didn't");
        } catch (err) {
            t.pass("readPerf throws on bad bookCode");
        }
    }
)

test(
    `readPerf returns same as fetchPerf (${testGroup})`,
    async t => {
        t.plan(3)
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "LUK";
            const readOutput = await epitelete.readPerf(bookCode);
            t.ok(readOutput);
            const fetchedOutput = await epitelete.fetchPerf(bookCode);
            t.ok(fetchedOutput);
            t.deepEqual(readOutput,fetchedOutput);
        } catch (err) {
            t.error(err);
        }
    }
)

const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));

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