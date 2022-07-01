import { default as ProskommaJsonValidator } from "proskomma-json-validator";
import {Validator} from 'proskomma-json-tools';
const { doRender } = require('proskomma-render-perf');
const _ = require("lodash");

/**
 * PERF Middleware for Editors in the Proskomma Ecosystem
 * @class
 */
class Epitelete {
    /**
     * @param {Object} args - constructor args
     * @param {Proskomma} [args.proskomma] - a proskomma instance
     * @param {number} args.docSetId - a docSetId
     * @param {object} [args.options={}] - setting params
     * @param {number} [args.options.historySize=10] - size of history buffer
     * @return {Epitelete} Epitelete instance
     */
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

        const { hs, ...opt } = options;
        const historySize = hs ? hs + 1 : 11//add one to passed history size so it matches undos allowed.
        
        this.options = {
            historySize,
            ...opt
        };

        this.proskomma = proskomma;
        this.docSetId = docSetId;
        this.history = {};
        this.validator = new Validator();
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    /**
     * Gets a copy of a document from history
     * @private
     * @param {string} bookCode
     * @return {perfDocument} matching PERF document
     */
    getDocument(bookCode) {
        const history = this.history[bookCode];
        return _.cloneDeep(history?.stack[history.cursor]);
    }

    /**
     * Gets documents copies from history
     * @private
     * @return {Object<bookCode,perfDocument>} Object with book code as key and PERF document as value
     */
    getDocuments() {
        return Object.keys(this.history).reduce((documents, bookCode) => {
            documents[bookCode] = this.getDocument(bookCode);
            return documents;
        }, {});
    }

    /**
     * Adds new document to history (replaces any doc with same bookCode already in history)
     * @param {string} bookCode
     * @param {perfDocument} doc
     * @return {perfDocument} same passed PERF document
     * @private
     */
    addDocument(bookCode, doc) {
        this.history[bookCode] = {
            stack: [_.cloneDeep(doc)], //save a copy of the given doc in memory
            cursor: 0
        }
        return doc
    }

    /**
     * Fetches document from proskomma instance
     * @async
     * @param {string} bookCode
     * @return {Promise<perfDocument>} fetched PERF document
     */
    async fetchPerf(bookCode) {
        if (this.backend === "standalone") {
            throw "Can't call sideloadPerf in standalone mode";
        }

        if (!bookCode) {
            throw new Error("fetchPerf requires 1 argument (bookCode)");
        }

        const config = {
            jsonType: ["perf", "0.2.0"],
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

        const doc = config2.documents[documentId];

        return this.addDocument(bookCode, doc);
    }

    /**
     * Gets document from memory or fetches it if proskomma is set
     * @async
     * @param {string} bookCode
     * @return {Promise<perfDocument>} found or fetched PERF document
     */
    async readPerf(bookCode) {
        if (!this.history[bookCode] && this.backend === "proskomma") {
            return this.fetchPerf(bookCode);
        }
        if (!this.history[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }

        return this.getDocument(bookCode);
    }

    /**
     * Merges a sequence with the document and saves the new modified document.
     * @param {string} bookCode
     * @param {number} sequenceId - id of modified sequence
     * @param {perfSequence} perfSequence - modified sequence
     * @return {perfDocument} modified PERF document
     */
    writePerf(bookCode, sequenceId, perfSequence) {
        // Get copy of last doc from memory
        const doc = this.getDocument(bookCode);
        if (!doc) {
            throw `document not found: ${bookCode}`;
        }
        // if not found throw error
        if (!doc.sequences[sequenceId]) {
            throw `PERF sequence id not found: ${bookCode}, ${sequenceId}`;
        }
        // validate new perf sequence
        const validatorResult = this.validator.validate('constraint','perfSequence','0.2.0',perfSequence);
        // if not valid throw error
        if (!validatorResult.isValid) {
            throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(validatorResult)}`;
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

    /**
     * ?Checks Perf Sequence
     * @param {perfSequence} perfSequence
     * @return {string[]} array of warnings
     */
    checkPerfSequence(perfSequence) {
        let currentChapter = 0;
        let currentVerse = 0;
        const warnings = perfSequence?.blocks.reduce((warnings, { content: blockContent }) => {
            if( Array.isArray(blockContent) ) {
                for (const contentBlock of blockContent) {
                    if (contentBlock.type === 'mark' && contentBlock.sub_type === 'verses') {
                        currentVerse++;
                        if (currentVerse.toString() !== contentBlock.atts.number) {
                            warnings.push(`Verse ${contentBlock.atts.number} is out of order, expected ${currentVerse}`);
                            currentVerse = Number(contentBlock.atts.number);
                        }
                    }
                    if (contentBlock.type === 'mark' && contentBlock.sub_type === 'chapter') {
                        currentChapter++;
                        if (currentChapter.toString() !== contentBlock.atts.number) {
                            warnings.push(`Chapter ${contentBlock.atts.number} is out of order, expected ${currentChapter}`);
                            currentChapter = Number(contentBlock.atts.number);
                        }
                        currentVerse = 0;
                    }
                }
            }
            return warnings;
        }, []);
        return warnings;
    }

    /**
     * Get array of book codes from history
     * @return {string[]} array of bookCodes
     */
    localBookCodes() {
        return Object.keys(this.history);
    }

    /**
     * Gets the available books for current docSet.
     * @return {{}} an object with book codes as keys, and values
     * contain book header data
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

    /**
     * Clears docs history
     * @return {void} void
     */
    clearPerf() {
        this.history = {};
    }

    /**
     * Checks if able to undo from specific book history
     * @param {string} bookCode
     * @return {boolean}
     */
    canUndo(bookCode) {
        const history = this.history[bookCode];
        if (!history) return false;
        if ((history.cursor + 1) === history.stack.length) return false;
        return true;
    }

    /**
     * Checks if able to redo from specific book history
     * @param {string} bookCode
     * @return {boolean}
     */
    canRedo(bookCode) {
        const history = this.history[bookCode];
        if (!history) return false;
        if (history.cursor === 0) return false;
        return true;
    }

    /**
     * Gets previous document from history
     * @param {string} bookCode
     * @return {?perfDocument} PERF document or null if can not undo
     */
    undoPerf(bookCode) {
        if (this.canUndo(bookCode)) {
            const history = this.history[bookCode];
            let cursor = ++history.cursor;
            const doc = history.stack[cursor];
            return _.cloneDeep(doc);
        }
        return null;
    }

    /**
     * Gets next document from history
     * @param {string} bookCode
     * @return {?perfDocument} PERF document or null if can not redo
     */
    redoPerf(bookCode){
        if (this.canRedo(bookCode)) {
            const history = this.history[bookCode];
            let cursor = --history.cursor;
            const doc = history.stack[cursor];
            return _.cloneDeep(doc);
        }
        return null;
    }

    /**
     * Loads given perf into memory
     * @param {string} bookCode
     * @param {perfDocument} perfDocument - PERF document
     * @return {perfDocument} same sideloaded PERF document
     */
    sideloadPerf(bookCode, perfDocument) {
        if (this.backend === "proskomma") {
            throw "Can't call sideloadPerf in proskomma mode";
        }

        if (!bookCode || !perfDocument) {
            throw "sideloadPerf requires 2 arguments (bookCode, perfDocument)";
        }

        const validatorResult = this.validator.validate('constraint','perfDocument','0.2.0', perfDocument);
         if (!validatorResult.isValid) {
            throw `prefJSON is not valid. \n${JSON.stringify(validatorResult,null,2)}`;
        }

        return this.addDocument(bookCode, perfDocument);
    }
}

export default Epitelete;

/**
 * @typedef {object} contentElementPerf
 * @property {string} type
 * @property {string} [number]
 * @property {"verses"|"xref"|"footnote"|"noteCaller"} [subType]
 * @property {string} [target]
 * @property {number} [nBlocks]
 * @property {string} [previewText]
 */

/**
 * @typedef {object} blockOrGraftPerf
 * @property {"block"|"graft"} type
 * @property {string} subType
 * @property {string} [target]
 * @property {number} [nBlocks]
 * @property {string} [previewText]
 * @property {string} [firstBlockScope]
 * @property {Array<string|contentElementPerf>} [content]
 */

/**
 * @typedef {object} perfSequence
 * @property {"main"|"introduction"|"introTitle"|"IntroEndTitle"|"title"|"endTitle"|"heading"|"remark"|"sidebar"|"table"|"tree"|"kv"|"footnote"|"noteCaller"|"xref"|"pubNumber"|"altNumber"|"esbCat"|"fig"|"temp"} type
 * @property {number} [nBlocks]
 * @property {string} [firstBlockScope]
 * @property {string} [previewText]
 * @property {boolean} selected
 * @property {blockOrGraftPerf[]} [blocks]
 */

/**
 * @typedef {object} perfDocument
 * @property {object} headers
 * @property {array} tags
 * @property {Object<string,perfSequence>} sequences
 * @property {string} mainSequence
 */

/**
 * Proskomma instance
 * @typedef Proskomma
 * @see {@link https://github.com/mvahowe/proskomma-js}
 */