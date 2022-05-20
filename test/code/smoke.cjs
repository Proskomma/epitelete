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
            t.throws(() => new Epitelete(pk, "eBible/fra_fraLSG"),"docSetId not found");
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `Hello - REPLACE ASAP (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            const config = {
                selectedSequenceId: null,
                allSequences: true,
                output: {
                    docSets: {},
                }
            };
            const query = '{docSets { id documents {id bookCode: header(id:"bookCode")} } }';
            const gqlResult = pk.gqlQuerySync(query);
            const docSetId = gqlResult.data.docSets[0].id;
            const bookCode = "LUK";
            const documentId = gqlResult.data.docSets[0].documents.filter(d => d.bookCode === bookCode)[0].id;
            const config2 = await doRender(
                pk,
                config,
                [docSetId],
                [documentId],
            );
            // console.log(config2.output.docSets[docSetId].documents[bookCode].sequences);
            t.equal(config2.validationErrors, null);
            const ret = {
                docSetId,
                documentId,
                mainSequenceId: config2.output.docSets[docSetId].documents[bookCode].mainSequence,
                headers: config2.output.docSets[docSetId].documents[bookCode].headers,
                sequenceHtml: {},
            };
            Object.keys(config2.output.docSets[docSetId].documents[bookCode].sequences)
                .forEach(seqId => {ret.sequenceHtml[seqId] = perf2html(config2.output, seqId)});
            // console.log(JSON.stringify(ret, null, 2));
            // console.log(perf2html(config2.output));
            // console.log(JSON.stringify(config2.output.docSets[docSetId].documents[bookCode]));
            // console.log(config2.validationErrors);
        } catch (err) {
            console.log(err);
        }
    },
);
