const test = require('tape');
const path = require('path');
const fse = require('fs-extra');
const {UWProskomma} = require('uw-proskomma');
const {doRender} = require('proskomma-render-perf');
const perf2html = require('../../src/perf2html').default;
const Epitelete = require('../../src/index').default;

const testGroup = 'Smoke';

const pk = new UWProskomma();
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, '..', 'test_data', 'fra_lsg_succinct.json')));
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, '..', 'test_data', 'eng_engWEBBE_succinct.json')));
pk.loadSuccinctDocSet(succinctJson);

const epitelete = new Epitelete(pk, "DBL/eng_engWEBBE");

test(
    `Instantiate Epitelete (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.doesNotThrow(() => new Epitelete(pk, "DBL/eng_engWEBBE"));
            t.throws(() => new Epitelete(pk), "2 arguments");
            t.throws(() => new Epitelete(pk, "eBible/fra_fraLSG"),"docSetId is not present");
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `Run fetchPerf (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.doesNotThrow(() => epitelete.fetchPerf("LUK"));
            t.throws(() => epitelete.fetchPerf(), "1 argument");
            t.throws(() => epitelete.fetchPerf("DNE"), "No document");

            // const ret = {
            //     docSetId,
            //     documentId,
            //     mainSequenceId: config2.output.docSets[docSetId].documents[bookCode].mainSequence,
            //     headers: config2.output.docSets[docSetId].documents[bookCode].headers,
            //     sequenceHtml: {},
            // };
            // Object.keys(config2.output.docSets[docSetId].documents[bookCode].sequences)
            //     .forEach(seqId => {ret.sequenceHtml[seqId] = perf2html(config2.output, seqId)});
            // // console.log(JSON.stringify(ret, null, 2));
            // // console.log(perf2html(config2.output));
            // // console.log(JSON.stringify(config2.output.docSets[docSetId].documents[bookCode]));
            // // console.log(config2.validationErrors);
        } catch (err) {
            console.log(err);
        }
    },
);
