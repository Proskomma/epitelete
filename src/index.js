import {default as ProskommaJsonValidator} from "proskomma-json-validator";

const { doRender } = require('proskomma-render-perf');
const _ = require("lodash");


class Epitelete {

    constructor({ pk = null, docSetId }) {
        if (!docSetId) {
            throw new Error("docSetId is required");
        }

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = pk?.gqlQuerySync(query) || {};

        if (pk && !gqlResult?.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        this.pk = pk;
        this.docSetId = docSetId;
        this.documents = {};
        this.undo = {};
        this.undoCurrentPointer = {};
        this.validator = new ProskommaJsonValidator();
        this.MAX_UNDO = 3;
        this.backend = pk ? 'proskomma' : 'standalone';
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
        const { data: { docSet } } = this.pk.gqlQuerySync(query);
        const documentId = docSet.document?.id;

        if (!documentId) {
            throw new Error(`No document with bookCode="${bookCode}" found.`);
        }

        const config2 = await doRender(
            this.pk,
            config,
            [this.docSetId],
            [documentId],
        );

        if (config2.validationErrors) {
            throw new Error(`doRender validation error`);
        }

        const doc = config2.output.docSets[this.docSetId].documents[bookCode];
        this.documents[bookCode] = doc;

        return doc;
    }

    async readPerf(bookCode) {
        if (!this.documents[bookCode] && this.backend === "proskomma") {
            await this.fetchPerf(bookCode);
        }
        if (!this.documents[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }

        const doc = this.documents[bookCode];
        this.undo[bookCode] = [_.cloneDeep(doc)];
        this.undoCurrentPointer[bookCode] = 0;

        return doc;
    }

    async writePerf(bookCode, sequenceId, perfSequence) {
        // find sequenceId in existing this.documents
        const currentDoc = this.documents[bookCode];
        if (!currentDoc) {
            throw `document not found: ${bookCode}`;
        }
        const sequences = currentDoc?.sequences;
        const previousPerfSequence = sequences?.[sequenceId];
        // if not found throw error
        if (!previousPerfSequence) {
            throw `PERF sequence not found: ${bookCode}, ${sequenceId}`;
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
        const newDocument = currentDoc;
        newDocument.sequences = newSequences;
        const newDocuments = {...this.documents};

        // update this.documents with modified document
        newDocuments[bookCode] = newDocument;
        this.documents = newDocuments;
        let undoCurrentPointer = ++this.undoCurrentPointer[bookCode]
        
        // limit undo stack to MAX_UNDO  
        this.undo[bookCode][undoCurrentPointer] = _.cloneDeep(newDocument);
        while(this.undo[bookCode].length > this.MAX_UNDO){
            this.undo[bookCode].shift();
            undoCurrentPointer--
        }
        this.undoCurrentPointer[bookCode] = undoCurrentPointer;
        
        // remove any old redo's 
        this.undo[bookCode] = this.undo[bookCode].slice(0, undoCurrentPointer+1)

        // return modified document
        return newDocument;
    }

    localBookCodes() {
        return Object.keys(this.documents);
    }

    /**
     * gets the available books for current docSet. Returns an object with book codes as keys, and values
     *   contain book header data
     * @returns {{}}
     */
    bookHeaders() {
        const documentHeaders = {};
        const query = `{ docSet(id: "${this.docSetId}") { documents { headers { key value } } } }`;
        const { data: gqlResult } = this.pk?.gqlQuerySync(query) || {};
        const documents = gqlResult?.docSet?.documents || this.documents;
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
        this.documents = {};
        this.undo = {};
        this.undoCurrentPointer = {};
    }

    canUndo(bookCode){
        if(this.documents[bookCode]){
            if(this.undoCurrentPointer[bookCode] > 0){
                return true
            };
        }
        return false
    }

    canRedo(bookCode){
        if(this.documents[bookCode]){
            const undoLength = this.undo[bookCode].length
            if(this.undoCurrentPointer[bookCode]+1 < undoLength){
                return true
            };
        }
        return false
    }

    undoPerf(bookCode){
        if(this.canUndo(bookCode)){
            let undoCurrentPointer = --this.undoCurrentPointer[bookCode];
            const doc = this.undo[bookCode][undoCurrentPointer];
            return _.cloneDeep(doc)
        }
        return null;
    }

    redoPerf(bookCode){
        if(this.canRedo(bookCode)){
            let undoCurrentPointer = ++this.undoCurrentPointer[bookCode];
            const doc = this.undo[bookCode][undoCurrentPointer];
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

        this.documents[bookCode] = perfJSON;

        return perfJSON;
    }
}

export default Epitelete;
