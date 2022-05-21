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
    `Call fetchPerf (${testGroup})`,
    async function (t) {
        t.plan(8);
        try{
            const docSetId = "DBL/eng_engWEBBE";
            const bookCode = "LUK";
            const epitelete = new Epitelete(pk, docSetId);
            const output = await epitelete.fetchPerf(bookCode);
            t.ok("docSets" in output);
            t.ok(docSetId in output.docSets);
            t.ok("documents" in output.docSets[docSetId]);
            t.ok(bookCode in output.docSets[docSetId].documents);
            const doc = output.docSets[docSetId].documents[bookCode];
            for (const k of ['headers', 'tags', 'sequences', 'mainSequence']) {
                t.ok(k in doc);
            }

            // Make HTML - move to subclass!
            const ret = {
                     docSetId,
                     mainSequenceId: output.docSets[docSetId].documents[bookCode].mainSequence,
                     headers: output.docSets[docSetId].documents[bookCode].headers,
                     sequenceHtml: {},
                 };
            Object.keys(output.docSets[docSetId].documents[bookCode].sequences)
                .forEach(seqId => {ret.sequenceHtml[seqId] = perf2html(output, seqId)});
            // console.log(JSON.stringify(ret, null, 2));
            
        } catch (err) {
            t.error(err);
            console.log(err);
        }
    },
);
