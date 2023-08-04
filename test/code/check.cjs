const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Check";

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

const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);


test(
    `checkPERF showing no warnings (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const sequences = documents[bookCode]?.sequences;
            const mainSequenceId = Object.keys(sequences)[0];
            const mainSequence = sequences[mainSequenceId];
            const warnings = await epitelete.checkPerfSequence(mainSequence);
            t.deepEqual(warnings, []);
        } catch (err) {
            t.error(err);
        }
    }
)

test(
    `checkPERF showing CV warnings (${testGroup})`,
    async t => {
        t.plan(1);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "TIT";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const sequences = documents[bookCode]?.sequences;
            const mainSequenceId = documents[bookCode]?.main_sequence_id;
            const mainSequence = sequences[mainSequenceId];
            // Insert an out of order verse marker.
            mainSequence.blocks[2].content.push({ type: 'mark', subtype: 'verses', atts: { number: 1 } })
            const warnings = await epitelete.checkPerfSequence(mainSequence);
            t.deepEqual(warnings, [ 'Verse 1 is out of order, expected 10', 'Verse 10 is out of order, expected 2' ])
        } catch (err) {
            t.error(err);
        }
    }
)
