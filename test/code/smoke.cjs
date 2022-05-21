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
        try{
            t.plan(1);
            t.ok(await epitelete.fetchPerf("LUK"));
        } catch (err) {
            console.log(err);
        }
    },
);
