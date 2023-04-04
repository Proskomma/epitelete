import { editPerf } from "../../utils/editPerf";

const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Save";

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

test(
    `Save current Perf (${testGroup})`,
    async t => {
        t.plan(7);
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCode = "TIT";
            const perf1 = await epitelete.readPerf(bookCode);
            t.notOk(epitelete.canSavePerf(bookCode), "should not be able to save after first load")
            await epitelete.writePerf(bookCode, ...editPerf(perf1));
            epitelete.savePerf(bookCode);
            t.notOk(epitelete.canSavePerf(bookCode), "should not be able to save right after last save")
            t.ok(epitelete.canUndo(bookCode));
            await epitelete.undoPerf(bookCode);
            t.ok(epitelete.canSavePerf(bookCode), "should be able to save right after undo")
            epitelete.savePerf(bookCode);
            t.ok(epitelete.canRedo(bookCode));
            const perf2 = await epitelete.redoPerf(bookCode);
            t.ok(epitelete.canSavePerf(bookCode), "should be able to save right after redo")
            epitelete.savePerf(bookCode);
            await epitelete.writePerf(bookCode, ...editPerf(perf2));
            t.ok(epitelete.canSavePerf(bookCode), "should be able to save right after write")
        } catch (err) {
            t.error(err);
            console.log(err);
        }
    }
)