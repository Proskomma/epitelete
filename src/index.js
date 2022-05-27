import {default as ProskommaJsonValidator} from "proskomma-json-validator";

const { doRender } = require('proskomma-render-perf');
const _ = require("lodash");


class Epitelete {

    constructor({ proskomma = null, docSetId }) {
        if (!docSetId) {
            throw new Error("docSetId is required");
        }

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = proskomma?.gqlQuerySync(query) || {};

        if (proskomma && !gqlResult?.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        this.proskomma = proskomma;
        this.docSetId = docSetId;
        this.history = {
            stack: {},
            cursor: {}
        };
        this.validator = new ProskommaJsonValidator();
        this.STACK_LIMIT = 3;
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    getCurrentDocument(bookCode) {
        const cursor = this.history.cursor[bookCode];
        return (cursor !== undefined) && this.history.stack[bookCode][cursor];
    }

    getDocuments() {
        return Object.keys(this.history.stack).reduce((documents, bookCode) => {
            documents[bookCode] = this.getCurrentDocument(bookCode);
            return documents;
        }, {});
    }

    setNewDocument(bookCode, doc) {
        this.history.stack[bookCode] = [_.cloneDeep(doc)];
        this.history.cursor[bookCode] = 0;
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
        this.setNewDocument(bookCode, doc);

        return doc;
    }

    async readPerf(bookCode) {
        if (!this.history.stack[bookCode] && this.backend === "proskomma") {
            await this.fetchPerf(bookCode);
        }
        if (!this.history.stack[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }

        return this.getCurrentDocument(bookCode);
    }

    async writePerf(bookCode, sequenceId, perfSequence) {
        // find sequenceId in existing documents
        const currentDoc = this.getCurrentDocument(bookCode);
        if (!currentDoc) {
            throw `document not found: ${bookCode}`;
        }
        // if not found throw error
        if (!currentDoc?.sequences[sequenceId]) {
            throw `PERF sequence id not found: ${bookCode}, ${sequenceId}`;
        }
        // validate new perf sequence
        const validatorResult = this.validator.validate('sequencePerf', perfSequence);
        // if not valid throw error
        if (!validatorResult.isValid) {
            throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(validatorResult.errors)}`;
        }

        // if valid
        // create modified document
        const newSequences = {...currentDoc.sequences};
        newSequences[sequenceId] = perfSequence;
        const newDocument = _.cloneDeep(currentDoc);
        newDocument.sequences = newSequences;

        // update documents with modified document
        let cursor = ++this.history.cursor[bookCode]
        this.history.stack[bookCode].push(newDocument);

        // limit history.stack to STACK_LIMIT   
        this.history.stack[bookCode][cursor] = _.cloneDeep(newDocument);
        while(this.history.stack[bookCode].length > this.STACK_LIMIT ){
            this.history.stack[bookCode].pop();
            cursor--
        }
        this.history.cursor[bookCode] = cursor;
        // remove any old redo's 
        this.history.stack[bookCode] = this.history.stack[bookCode].slice(0, cursor+1)

        // return modified document
        return newDocument;
    }

    async checkPerfSequence(perfSequence) {
        let currentChapter = 0;
        let currentVerse = 0;
        for (const block of perfSequence.blocks) {
            if( Array.isArray(block.content) ) {
                for (const contentBlock of block.content) {
                    const warnings = contentBlock.warnings || [];
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
                    if ( warnings.length > 0 ) {
                        contentBlock.warnings = warnings;
                    }
                }
            }
        }
        return perfSequence;
    }

    localBookCodes() {
        return Object.keys(this.history.stack);
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
        this.history.stack = {};
        this.history.cursor = {};
    }

    canUndo(bookCode){
        if(this.history.cursor[bookCode]){
            if(this.history.cursor[bookCode] > 0){
                return true
            };
        }
        return false
    }

    canRedo(bookCode){
        if(this.history.stack[bookCode]){
            const historyLenght = this.history.stack[bookCode].length
            if(this.history.cursor[bookCode]+1 < historyLenght){
                return true
            };
        }
        return false
    }

    undoPerf(bookCode){
        if (this.canUndo(bookCode)) {
            let cursor = --this.history.cursor[bookCode];
            const doc = this.history.stack[bookCode][cursor];
            return _.cloneDeep(doc)
        }
        return null;
    }

    redoPerf(bookCode){
        if(this.canRedo(bookCode)){
            let cursor = ++this.history.cursor[bookCode];
            const doc = this.history.stack[bookCode][cursor];
            return _.cloneDeep(doc)
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

        this.setNewDocument(bookCode, perfJSON);

        return perfJSON;
    }
}

export default Epitelete;
