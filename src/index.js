import {default as ProskommaJsonValidator} from "proskomma-json-validator";

const { doRender } = require('proskomma-render-perf');
const _ = require("lodash");

class Epitelete {

    constructor({ proskomma = null, docSetId, options = {} }) {
        if (!docSetId) {
            throw new Error("docSetId is required");
        }

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = proskomma?.gqlQuerySync(query) || {};

        if (proskomma && !gqlResult?.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }
        const knownOptions = new Set([
            'historySize',
        ]);
        const unknownOptions = Object.keys(options).filter(o => !knownOptions.has(o));
        if (unknownOptions.length > 0) {
            throw new Error(`Unknown options in constructor: ${unknownOptions.join(', ')}`);
        }
        this.options = {
            historySize: 3,
            ...options
        };
        this.proskomma = proskomma;
        this.docSetId = docSetId;
        this.history = {};
        this.validator = new ProskommaJsonValidator();
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    getCurrentDocument(bookCode) {
        return this.history[bookCode]?.stack[this.history[bookCode].cursor];
    }

    getDocuments() {
        return Object.keys(this.history).reduce((documents, bookCode) => {
            documents[bookCode] = this.getCurrentDocument(bookCode);
            return documents;
        }, {});
    }

    setNewDocument(bookCode, doc) {
        this.history[bookCode] = {
            stack: [_.cloneDeep(doc)], //save a copy of the given doc in memory
            cursor: 0
        }
        return doc
    }

    async fetchPerf(bookCode) {
        if (this.backend === "standalone") {
            throw "Can't call sideloadPerf in standalone mode";
        }

        if (!bookCode) {
            throw new Error("fetchPerf requires 1 argument (bookCode)");
        }

        const config = {
            selectedSequenceId: null,
            allSequences: true,
            output: {
                docSets: {},
            }
        };
        const query = `{docSet(id: "${this.docSetId}") { id document(bookCode: "${bookCode}") {id bookCode: header(id:"bookCode")} } }`;
        const { data: { docSet } } = this.proskomma.gqlQuerySync(query);
        const documentId = docSet.document?.id;

        if (!documentId) {
            throw new Error(`No document with bookCode="${bookCode}" found.`);
        }

        const config2 = await doRender(
            this.proskomma,
            config,
            [this.docSetId],
            [documentId],
        );

        if (config2.validationErrors) {
            throw new Error(`doRender validation error`);
        }

        const doc = config2.output.docSets[this.docSetId].documents[bookCode];

        return this.setNewDocument(bookCode, doc);
    }

    async readPerf(bookCode) {
        if (!this.history[bookCode] && this.backend === "proskomma") {
            await this.fetchPerf(bookCode);
        }
        if (!this.history[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }

        //Give the user a copy of the perf in memory
        return _.cloneDeep(this.getCurrentDocument(bookCode));
    }

    async writePerf(bookCode, sequenceId, perfSequence) {
        // Get copy of last doc from memory
        const doc = _.cloneDeep(this.getCurrentDocument(bookCode));
        if (!doc) {
            throw `document not found: ${bookCode}`;
        }
        // if not found throw error
        if (!doc.sequences[sequenceId]) {
            throw `PERF sequence id not found: ${bookCode}, ${sequenceId}`;
        }
        // validate new perf sequence
        const validatorResult = this.validator.validate('sequencePerf', perfSequence);
        // if not valid throw error
        if (!validatorResult.isValid) {
            throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(validatorResult.errors)}`;
        }

        // if valid
        // modify the copy to add new sequence
        doc.sequences[sequenceId] = _.cloneDeep(perfSequence);

        const history = this.history[bookCode];

        // remove any old redo's from stack
        history.stack = history.stack.slice(history.cursor);

        // add modified copy to stack
        history.stack.unshift(doc);
        history.cursor = 0;

        // limit history.stack to options.historySize
        if (history.stack.length > this.options.historySize)
            history.stack.pop();

        // return copy of modified document
        return _.cloneDeep(doc);
    }

    async checkPerfSequence(perfSequence) {
        let currentChapter = 0;
        let currentVerse = 0;
        const warnings = [];
        for (const block of perfSequence.blocks) {
            if( Array.isArray(block.content) ) {
                for (const contentBlock of block.content) {
                    if ('verses' === contentBlock.type) {
                        currentVerse++;
                        if (currentVerse.toString() !== contentBlock.number) {
                            warnings.push(`Verse ${contentBlock.number} is out of order, expected ${currentVerse}`);
                            currentVerse = Number(contentBlock.number);
                        }
                    }
                    if ('chapter' === contentBlock.type) {
                        currentChapter++;
                        if (currentChapter.toString() !== contentBlock.number) {
                            warnings.push(`Chapter ${contentBlock.number} is out of order, expected ${currentChapter}`);
                            currentChapter = Number(contentBlock.number);
                        }
                        currentVerse = 0;
                    }
                }
            }
        }
        return warnings;
    }

    localBookCodes() {
        return Object.keys(this.history);
    }

    /**
     * gets the available books for current docSet. Returns an object with book codes as keys, and values
     *   contain book header data
     * @returns {{}}
     */
    bookHeaders() {
        const documentHeaders = {};
        const query = `{ docSet(id: "${this.docSetId}") { documents { headers { key value } } } }`;
        const { data: gqlResult } = this.proskomma?.gqlQuerySync(query) || {};
        const documents = gqlResult?.docSet?.documents || this.getDocuments();
        for (const document of documents) {
            let key = null;
            const headers = {};
            for (const header of document.headers) {
                if (header.key === 'bookCode') {
                    key = header.value;
                } else {
                    headers[header.key] = header.value;
                }
            }
            if (key) {
                documentHeaders[key] = headers;
            }
        }
        return documentHeaders;
    }

    clearPerf() {
        this.history = {};
    }

    canUndo(bookCode) {
        const history = this.history[bookCode];
        if (!history) return false;
        if ((history.cursor + 1) === history.stack.length) return false;
        return true;
    }

    canRedo(bookCode) {
        const history = this.history[bookCode];
        if (!history) return false;
        if (history.cursor === 0) return false;
        return true;
    }

    undoPerf(bookCode) {
        if (this.canUndo(bookCode)) {
            const history = this.history[bookCode];
            let cursor = ++history.cursor;
            const doc = history.stack[cursor];
            return _.cloneDeep(doc);
        }
        return null;
    }

    redoPerf(bookCode){
        if (this.canRedo(bookCode)) {
            const history = this.history[bookCode];
            let cursor = --history.cursor;
            const doc = history.stack[cursor];
            return _.cloneDeep(doc);
        }
        return null;
    }

    sideloadPerf(bookCode, perfJSON) {
        if (this.backend === "proskomma") {
            throw "Can't call sideloadPerf in proskomma mode";
        }

        if (!bookCode || !perfJSON) {
            throw "sideloadPerf requires 2 arguments (bookCode, perfJSON)";
        }

        const validatorResult = this.validator.validate('documentPerf', perfJSON);
         if (!validatorResult.isValid) {
            throw `prefJSON is not valid. \n${JSON.stringify(validatorResult,null,2)}`;
        }

        return this.setNewDocument(bookCode, perfJSON);
    }
}

export default Epitelete;
