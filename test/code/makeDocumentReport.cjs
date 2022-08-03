const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;

const testGroup = "Reports";

const proskomma = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "fra_lsg_succinct.json")));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);

test(
    `makeDocumentReport() is defined (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        t.ok(typeof epitelete.makeDocumentReport === "function");
    }
)

test(
    `makeDocumentReport() throws on bad bookCode (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        try {
            await epitelete.makeDocumentReport(
                "banana",
                "wordSearch",
                {
                    perf: {},
                    searchString: "foo"
                }
            );
            t.fail("Should have thrown");
        } catch (err) {
            if (err.toString().includes('banana')) {
                t.ok(err, "Expected error");
            } else {
                t.fail(`Unexpected error ${err}`)
            }
        }
    }
)

test(
    `makeDocumentReport() throws on bad reportName (${testGroup})`,
    async t => {
        t.plan(1);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        try {
            await epitelete.makeDocumentReport(
                "LUK",
                "banana",
                {
                    perf: {},
                    searchString: "foo"
                }
            );
            t.fail("Should have thrown");
        } catch (err) {
            if (err.toString().includes('banana')) {
                t.ok(err, "Expected error");
            } else {
                t.fail(`Unexpected error ${err}`)
            }
        }
    }
)


test(
    `makeDocumentReport() throws when inputs do not match spec (${testGroup})`,
    async t => {
        t.plan(3);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        try {
            await epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    extra: "baa",
                    perf: {},
                    searchString: "foo"
                }
            );
            t.fail("Should have thrown");
        } catch (err) {
            if (err.toString().includes('3 provided')) {
                t.ok(err, "Expected error");
            } else {
                t.fail(`Unexpected error ${err}`)
            }
        }
        try {
            await epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    perf: {},
                    "baa": "foo",
                    "ignoreCase": "text",
                    "asRegex": "text",
                    "logic": "text",
                    "asPartial": "text"
                }
            );
            t.fail("Should have thrown");
        } catch (err) {
            if (err.toString().includes('searchString not provided')) {
                t.ok(err, "Expected error");
            } else {
                t.fail(`Unexpected error ${err}`)
            }
        }
        try {
            await epitelete.makeDocumentReport(
                "LUK",
                "wordSearch",
                {
                    perf: "perf",
                    "searchString": {},
                    "ignoreCase": "text",
                    "asRegex": "text",
                    "logic": "text",
                    "asPartial": "text"
                }
            );
            t.fail("Should have thrown");
        } catch (err) {
            if (err.toString().includes('searchString must be text')) {
                t.ok(err, "Expected error");
            } else {
                t.fail(`Unexpected error ${err}`)
            }
        }
    }
)


test(
    `makeDocumentReport() returns output with valid args (${testGroup})`,
    async t => {
        t.plan(4);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("LUK");
        const output = await epitelete.makeDocumentReport(
            "LUK",
            "wordSearch",
            {
                perf: {},
                searchString: "Zacharias",
                "ignoreCase": "1",
                "asRegex": "0",
                "logic": "A",
                "asPartial": "0"
            }
        ).then(output => {
            t.ok('matches' in output);
            t.ok('searchTerms' in output.matches);
            t.equal(output.matches.matches[0].chapter, '1');
            t.equal(output.matches.matches[0].verses, '5');
        });
        // console.log(output.matches.matches);
    }
);

test(
    `makeDocumentsReport() (${testGroup})`,
    async t => {
        t.plan(5);
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        await epitelete.fetchPerf("MAT");
        await epitelete.fetchPerf("MRK");
        await epitelete.fetchPerf("LUK");
        await epitelete.fetchPerf("JHN");
        const output = await epitelete.makeDocumentsReport(
            "wordSearch",
            {
                perf: {},
                searchString: "Zacharias",
                "ignoreCase": "1",
                "asRegex": "0",
                "logic": "A",
                "asPartial": "0"
            }
        ).then(output => {
            t.ok('LUK' in output);
            t.ok('matches' in output.LUK);
            t.ok('searchTerms' in output.LUK.matches);
            t.equal(output.LUK.matches.matches[0].chapter, '1');
            t.equal(output.LUK.matches.matches[0].verses, '5');
        });
        // console.log(output.matches.matches);
    }
)
const alignedPerf = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "TIT_dcs_eng-alignment_perf_v0.2.1.json")));

test(
    `strips alignment (${testGroup})`,
    async t => {
        t.plan(4);
        const docSetId = "DCS/en_ult";
        const epitelete = new Epitelete({docSetId});
        const perfDoc = epitelete.sideloadPerf("TIT",alignedPerf);

        // const tit = await epitelete.fetchPerf("TIT");
        // console.log(tit.sequences[tit.main_sequence_id].blocks[1].content)
        
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

        t.ok(docHasMarkup({ doc: perfDoc, type: "wrapper", subtype: "usfm:w" }), "perf has wrapper");
        t.ok(docHasMarkup({doc: perfDoc, type: "start_milestone", subtype: "usfm:zaln"}), "perf has alignment");

        const output = await epitelete.makeDocumentReport(
            "TIT",
            "stripAlignment",
            {
                perf: {},
            }
        ).then(output => {
            t.notOk(docHasMarkup({ doc: output.perf, type: "wrapper", subtype: "usfm:w" }), "perf does not have wrapper");
            t.notOk(docHasMarkup({doc: output.perf, type: "start_milestone", subtype: "usfm:zaln"}), "perf does not have alignment");
        });
    }
)