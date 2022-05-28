const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;
const _ = require("lodash");

const testGroup = "Check";

const proskomma = new UWProskomma();

const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);


test(
    `checkPERF showing no warnings (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const sequences = documents[bookCode]?.sequences;
            const mainSequenceId = Object.keys(sequences)[0];
            const mainSequence = sequences[mainSequenceId];
            const warnings = await epitelete.checkPerfSequence(mainSequence);
            t.deepEqual(warnings, [])
        } catch (err) {
            t.error(err);
        }
        t.end()
    }
)

test(
    `checkPERF showing CV warnings (${testGroup})`,
    async t => {
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({proskomma, docSetId});
            const bookCode = "LUK";
            await epitelete.readPerf(bookCode);
            const documents = epitelete.getDocuments();
            const sequences = documents[bookCode]?.sequences;
            const mainSequenceId = Object.keys(sequences)[0];
            const mainSequence = sequences[mainSequenceId];
            // console.log("Luke:",JSON.stringify(mainSequence, null, 4));
            // Insert an out of order verse marker.
            mainSequence.blocks[3].content.push({
                type: 'verses',
                number: 2,
            })
            const warnings = await epitelete.checkPerfSequence(mainSequence);
            t.deepEqual(warnings, [ 'Verse 2 is out of order, expected 11', 'Verse 11 is out of order, expected 3' ])
        } catch (err) {
            t.error(err);
        }
    }
)
