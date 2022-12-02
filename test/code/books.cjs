const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../../dist/index").default;

const testGroup = "Books";

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
    `localBookCodes() is defined (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({ proskomma, docSetId });
        t.plan(1);
        t.ok(typeof epitelete.localBookCodes === "function");
    }
)

test(
    `localBookCodes returns list of document keys (${testGroup})`,
    async t => {
        t.plan(2)
        try {
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });
            const bookCodes = ["LUK", "MRK", "3JN", "GEN"];
            for (const bookCode of bookCodes) {
                await epitelete.readPerf(bookCode);
            }
            const localBookCodes = epitelete.localBookCodes();
            t.ok(localBookCodes)
            t.deepEqual(localBookCodes, bookCodes);
        } catch (err) {
            t.error(err);
        }
    }
)

test(
    `bookHeaders returns USFM headers for available book codes (${testGroup})`,
    async t => {
        debugger;
        try {
            const expectedMinHeaderCount = `5`;
            const expectedBookCount = 81;
            const docSetId = "DBL/eng_engWEBBE";
            const epitelete = new Epitelete({ proskomma, docSetId });

            const bookHeaders = epitelete.bookHeaders();
            const bookCodes = Object.keys(bookHeaders);
            const bookCount = bookCodes.length;
            
            t.plan(2 + bookCount);
            t.ok(bookCodes)
            t.equal(bookCount, expectedBookCount, 'expected ' + expectedBookCount + ' books');
            for (const bookCode of bookCodes) {
                const headers = bookHeaders[bookCode];
                const headerCount = Object.keys(headers).length;
                t.ok(headerCount >= expectedMinHeaderCount, bookCode + ' expected at least ' + expectedMinHeaderCount + ' fields');
            }
        } catch (err) {
            t.error(err);
        }
    }
)
