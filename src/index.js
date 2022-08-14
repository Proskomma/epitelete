import {Validator, ProskommaRenderFromJson, toUsfmActions} from 'proskomma-json-tools';
import reports from './pipelines/reports';
import filters from './pipelines/filters';
import evaluateSteps from "./evaluateSteps";
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
        /** @type history */
        this.history = {};
        this.validator = new Validator();
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    getBookData(bookCode) {
        const history = this.history[bookCode];
        return history?.stack[history.cursor];
    }

    /**
     * Gets a copy of a document from history
     * @private
     * @param {string} bookCode
     * @return {perfDocument} matching PERF document
     */
    getDocument(bookCode) {
        const bookData = this.getBookData(bookCode);
        return _.cloneDeep(bookData?.perfDocument);
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
    addDocument({ bookCode, perfDocument, pipelineData }) {
        this.history[bookCode] = {
            stack: [{perfDocument:_.cloneDeep(perfDocument), pipelineData}], //save a copy of the given doc in memory
            cursor: 0
        }
        return perfDocument
    }

    /**
     * Clears docs history
     * @return {void} void
     */
    clearPerf() {
        this.history = {};
    }

    /**
     * Gets pipeline by given name
     * @param {string} pipelineName - the pipeline name
     * @param {object} data input data
     * @return {pipeline} pipeline transforms
     * @private
     */
    getPipeline(pipelines, pipelineName, data) {
        if (!pipelines[pipelineName]) {
            throw new Error(`Unknown report name '${pipelineName}'`);
        }
        const pipeline = pipelines[pipelineName];
        const inputSpecs = pipeline[0].inputs;
        if (Object.keys(inputSpecs).length !== Object.keys(data).length) {
            throw new Error(`${Object.keys(inputSpecs).length} input(s) expected by report ${pipelineName} but ${Object.keys(data).length} provided (${Object.keys(data).join(', ')})`);
        }
        for (const [inputSpecName, inputSpecType] of Object.entries(inputSpecs)) {
            if (!data[inputSpecName]) {
                throw new Error(`Input ${inputSpecName} not provided as input to ${pipelineName}`);
            }
            if ((typeof data[inputSpecName] === 'string') !== (inputSpecType === 'text')) {
                throw new Error(`Input ${inputSpecName} must be ${inputSpecType} but ${typeof data[inputSpecName] === 'string' ? "text": "json"} was provided`);
            }
        }
        return pipeline;
    }

    setPipelineData(bookCode, data) {
        const bookData = this.getBookData(bookCode);
        bookData.pipelineData = data;
    }

    getPipelineData(bookCode) {
        const bookData = this.getBookData(bookCode);
        return bookData?.pipelineData;
    }

    async readPipeline({ pipelineName, perfDocument }) {
        if (!pipelineName) return { perfDocument };
        const inputValues = { perf: perfDocument };
        const specSteps = this.getPipeline(filters, pipelineName, inputValues);
        const { perf, ...pipelineData } = await evaluateSteps({ specSteps, inputValues });
        return { perfDocument: perf, pipelineData }
    }

    async writePipeline({ bookCode, pipelineName, perfDocument }) {
        if (!pipelineName) return perfDocument;
        const pipelineData = this.getPipelineData(bookCode);
        const inputValues = { perf: perfDocument, ...pipelineData };
        const specSteps = this.getPipeline(filters, pipelineName, inputValues);
        const { perf } = await evaluateSteps({ specSteps, inputValues });
        return perf;
    }

    /**
     * Loads given perf into memory
     * @param {string} bookCode
     * @param {perfDocument} perfDocument - PERF document
     * @return {Promise<perfDocument>} same sideloaded PERF document
     */
    async sideloadPerf(bookCode, perfDocument, options = {}) {
        if (this.backend === "proskomma") {
            throw "Can't call sideloadPerf in proskomma mode";
        }

        if (!bookCode || !perfDocument) {
            throw "sideloadPerf requires 2 arguments (bookCode, perfDocument)";
        }

        const validatorResult = this.validator.validate('constraint','perfDocument','0.2.1', perfDocument);
         if (!validatorResult.isValid) {
            throw `perfJSON is not valid. \n${JSON.stringify(validatorResult,null,2)}`;
        }

        const { readPipeline } = options;
        return this.addDocument({
            bookCode,
            ...await this.readPipeline({bookCode,pipelineName: readPipeline, perfDocument}) 
        });
    }

    /**
     * Fetches document from proskomma instance
     * @async
     * @param {string} bookCode
     * @return {Promise<perfDocument>} fetched PERF document
     */
    async fetchPerf(bookCode, options = {}) {
        if (this.backend === "standalone") {
            throw "Can't call fetchPerf in standalone mode";
        }
        if (!bookCode) {
            throw new Error("fetchPerf requires 1 argument (bookCode)");
        }
        const query = `{docSet(id: "${this.docSetId}") { document(bookCode: "${bookCode}") { perf } } }`;
        const { data } = this.proskomma.gqlQuerySync(query);
        const queryResult = data.docSet.document.perf;

        if (!queryResult) {
            throw new Error(`No document with bookCode="${bookCode}" found.`);
        }
        const perfDocument = JSON.parse(queryResult);
        const { readPipeline } = options;
        return this.addDocument({
            bookCode,
            ...await this.readPipeline({bookCode,pipelineName: readPipeline, perfDocument}) 
        });
    }

    /**
     * Gets document from memory or fetches it if proskomma is set
     * @async
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.readPipeline] - pipeline name
     * @return {Promise<perfDocument>} found or fetched PERF document
     */
    async readPerf(bookCode, options = {}) {
        if (!this.history[bookCode] && this.backend === "proskomma") {
            return this.fetchPerf(bookCode, options);
        }
        if (!this.history[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }
        const perfDocument = this.getDocument(bookCode);
        const { readPipeline } = options;
        const { perfDocument: perf, pipelineData } = await this.readPipeline({ bookCode, pipelineName: readPipeline, perfDocument });
        this.setPipelineData(bookCode, pipelineData);
        return perf;
    }

    /**
     * Merges a sequence with the document and saves the new modified document.
     * @param {string} bookCode
     * @param {number} sequenceId - id of modified sequence
     * @param {perfSequence} perfSequence - modified sequence
     * @return {Promise<perfDocument>} modified PERF document
     */
    async writePerf(bookCode, sequenceId, perfSequence, options = {}) {
        const perfDocument = this.getDocument(bookCode);

        if (!perfDocument) {
            throw `document not found: ${bookCode}`;
        }

        if (!perfDocument.sequences[sequenceId]) {
            throw `PERF sequence id not found: ${bookCode}, ${sequenceId}`;
        }
        const validatorResult = this.validator.validate('constraint','perfSequence','0.2.1',perfSequence);

        if (!validatorResult.isValid) {
            throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(validatorResult)}`;
        }

        perfDocument.sequences[sequenceId] = _.cloneDeep(perfSequence);

        const { writePipeline } = options;
        const newPerfDoc = await this.writePipeline({ bookCode, pipelineName: writePipeline, perfDocument });

        const history = this.history[bookCode];
        history.stack = history.stack.slice(history.cursor);
        history.stack.unshift({ perfDocument: newPerfDoc });
        history.cursor = 0;

        if (history.stack.length > this.options.historySize)
            history.stack.pop();

        return _.cloneDeep(newPerfDoc);
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
                    if (contentBlock.type === 'mark' && contentBlock.subtype === 'verses') {
                        currentVerse++;
                        if (currentVerse.toString() !== contentBlock.atts.number) {
                            warnings.push(`Verse ${contentBlock.atts.number} is out of order, expected ${currentVerse}`);
                            currentVerse = Number(contentBlock.atts.number);
                        }
                    }
                    if (contentBlock.type === 'mark' && contentBlock.subtype === 'chapter') {
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
     * @return {Promise<?perfDocument>} PERF document or null if can not undo
     */
    async undoPerf(bookCode, options) {
        if (this.canUndo(bookCode)) {
            const history = this.history[bookCode];
            ++history.cursor;
            return await this.readPerf(bookCode, options);
        }
        return null;
    }

    /**
     * Gets next document from history
     * @param {string} bookCode
     * @return {Promise<?perfDocument>} PERF document or null if can not redo
     */
    async redoPerf(bookCode, options){
        if (this.canRedo(bookCode)) {
            const history = this.history[bookCode];
            --history.cursor;
            return await this.readPerf(bookCode, options);
        }
        return null;
    }

    /**
     * Gets document from memory and converts it to usfm
     * @async
     * @param {string} bookCode
     * @return {Promise<string>} converted usfm
     */
    async readUsfm(bookCode) {
        const perf = await this.readPerf(bookCode);
        const renderer = new ProskommaRenderFromJson({srcJson: perf, actions: toUsfmActions});
        const output = {};
        renderer.renderDocument({docId: "", config: {}, output});
        return output.usfm;
    }

    /**
     * Generates and returns a report via a transform pipeline
     * @async
     * @param {string} bookCode
     * @param {string} reportName
     * @param {object} data
     * @return {Promise<array>} A report
     */
    async makeDocumentReport(bookCode, reportName, data) {
        if (!this.localBookCodes().includes(bookCode)) {
            throw new Error(`bookCode '${bookCode}' is not available locally`);
        }
        data.perf = this.getDocument(bookCode);
        const pipeline = this.getPipeline(reports, reportName, data);
        return await evaluateSteps({specSteps: pipeline, inputValues: data});
    }

    /**
     * Generates and returns a report for each document via a transform pipeline
     * @async
     * @param {string} reportName
     * @param {object} data
     * @return {Promise<object>} reports for each documents with bookCode as the key
     */
    async makeDocumentsReport(reportName, data) {
        const bookCodes = this.localBookCodes();
        const ret = {};
        for (const bookCode of bookCodes) {
            const bookReport = await this.makeDocumentReport(bookCode, reportName, data);
            ret[bookReport.matches.bookCode] = bookReport;
        }
        return ret;
    }
}

export default Epitelete;

/**
 * @typedef {object} contentElementPerf
 * @property {string} type
 * @property {string} [number]
 * @property {"verses"|"xref"|"footnote"|"noteCaller"} [subtype]
 * @property {string} [target]
 * @property {number} [nBlocks]
 * @property {string} [previewText]
 */

/**
 * @typedef {object} blockOrGraftPerf
 * @property {"block"|"graft"} type
 * @property {string} subtype
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
 * @typedef {string} bookCode
 */

/**
 * @typedef {Object} bookHistory
 * @property {number} bookHistory.cursor
 * @property {Object[]} bookHistory.stack
 * @property {perfDocument} bookHistory.stack[].perfDocument
 * @property {Object<string,any>} bookHistory.stack[].pipelineData
 */

/**
 * @typedef {Object<string, bookHistory>} history
 */

/**
 * Proskomma instance
 * @typedef Proskomma
 * @see {@link https://github.com/mvahowe/proskomma-js}
 */
