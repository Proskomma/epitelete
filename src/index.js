import { Validator } from 'proskomma-json-tools';
import pipelines from './pipelines';
import transformActions from './transforms';
import { PipelineHandler } from 'pipeline-handler';
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
    constructor({ proskomma = null, docSetId, options = {}, ...args }) {
        const validateParams = (knownParams, params, errorMessage) => {
            const _knownParams = new Set(knownParams);
            const unknownParams = Object.keys(params).filter(p => !_knownParams.has(p));
            if (unknownParams.length > 0) {
                throw new Error(`${errorMessage}. Expected one of: [${[..._knownParams].join(', ')}], But got: [${unknownParams.join(', ')}]`);
            } 
        }
        validateParams(["historySize"], options, "Unexpected option in constructor");
        validateParams(["proskomma", "docSetId", "options"], args, "Unexpected arg in constructor");

        if (!docSetId) {
            throw new Error("docSetId is required");
        }

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = proskomma?.gqlQuerySync(query) || {};

        if (proskomma && !gqlResult?.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        const { hs, ...opt } = options;
        const historySize = hs ? hs + 1 : 11//add one to passed history size so it matches undos allowed.

        this.options = {
            historySize,
            ...opt
        };

        this.proskomma = proskomma;
        this.pipelineHandler = new PipelineHandler({pipelines: pipelines ?? null, transforms: transformActions ?? null, proskomma});
        this.docSetId = docSetId;
        /** @type history */
        this.history = {};
        this.validator = new Validator();
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    /**
     * Adds a new PipelineHandler instance to current Epitelete pipelineHandler prop.
     * @private
    */
    instanciatePipelineHandler() {
        this.pipelineHandler = new PipelineHandler({pipelines: pipelines ?? null, transforms: transformActions ?? null, proskomma:this.proskomma});
    }

    /**
     * Gets book data from history in current cursor position.
     * @param {string} bookCode
     * @private
    */
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

    setBookHistory(bookCode) {
        this.history[bookCode] ??= {
            stack: [],
            cursor: 0
        }
        return this.history[bookCode];
    }
    getBookHistory(bookCode) {
        const history = this.history[bookCode] ?? this.setBookHistory(bookCode);
        return history;
    }

    /**
     * Clears docs history
     * @return {void} void
     */
    clearPerf() {
        this.history = {};
    }


    /**
     * Adds new document to history (replaces any doc with same bookCode already in history)
     * @param {string} bookCode
     * @param {perfDocument} doc
     * @return {perfDocument} same passed PERF document
     * @private
     */
    addDocument({ bookCode, perfDocument }) {
        const { stack, cursor } = this.getBookHistory(bookCode);
        stack[cursor] ??= {};
        stack[cursor].perfDocument = _.cloneDeep(perfDocument);
        return perfDocument
    }

    /**
     * Sets pipeline data for book in current history position
     * @return {void} void
     */
    setPipelineData(bookCode, data) {
        const { stack, cursor } = this.getBookHistory(bookCode);
        stack[cursor] ??= {};
        const currentData = stack[cursor].pipelineData;
        if (data) stack[cursor].pipelineData = { ...currentData, ...data };
    }

    /**
     * Gets pipeline data for book in current history position
     * @param {string} bookCode
     */
    getPipelineData(bookCode) {
        const bookData = this.getBookData(bookCode);
        return bookData?.pipelineData;
    }

    /**
     * Exposes Epitelete's internal pipelineHandler instance.
     * @return {PipelineHandler} pipelineHandler instance
     */
    getPipelineHandler() {
        return this.pipelineHandler;
    }

    /**
     * Traverses given PERF document through declared pipeline.
     * @param {string} bookCode - The history bookCode in which to store pipelineData
     * @param {string} pipelineName - The name of the pipeline to be traversed
     * @param {perfDocument} perfDocument - PERF document to run through the pipeline
     * @return {Promise<perfDocument>} - Transformed PERF document
     * @private
     */
    async runPipeline({ bookCode, pipelineName, perfDocument }) {
        if (!pipelineName) return { perf: perfDocument };
        const storedData = this.getPipelineData(bookCode);
        const [_inputs] = this.pipelineHandler.pipelines[pipelineName];
        const { inputs } = _inputs;
        const data = storedData ? Object.keys(storedData).reduce((data, inputKey) => {
            if (inputKey in inputs) data[inputKey] = storedData[inputKey];
            return data;
        }, {}) : undefined;
        const pipelineArgs = { perf: perfDocument, ...data };
        const { perf, ...pipelineData } = await this.pipelineHandler.runPipeline(pipelineName, pipelineArgs);
        return { perf, pipelineData };
    }

    /**
     * Adds given PERF document to history and returns the PERF passed through the specified pipeline.
     * @async
     * @param {string} bookCode
     * @param {perfDocument} perfDocument - PERF document
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @return {Promise<perfDocument>} fetched PERF document
     * @private
     */
    async loadPerf(bookCode, perfDocument, options) {
        const { writePipeline, readPipeline } = options;
        const {perf:writePerf, pipelineData: writePipelineData} = await this.runPipeline({ bookCode, pipelineName: writePipeline, perfDocument });
        this.setPipelineData(bookCode, writePipelineData);
        const savedPerf = this.addDocument({
            bookCode,
            perfDocument: writePerf
        });
        const {perf:readPerf, pipelineData: readPipelineData} = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument: savedPerf });
        this.setPipelineData(bookCode, readPipelineData);
        return  readPerf
    }

    /**
     * Loads given perf into memory
     * @param {string} bookCode
     * @param {perfDocument} perfDocument - PERF document
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @return {Promise<perfDocument>} same sideloaded PERF document
     */
    async sideloadPerf(bookCode, perfDocument, options = {}) {
        if (this.backend === "proskomma") {
            throw "Can't call sideloadPerf in proskomma mode";
        }

        if (!bookCode || !perfDocument) {
            throw "sideloadPerf requires 2 arguments (bookCode, perfDocument)";
        }

        const validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', perfDocument);
        if (!validatorResult.isValid) {
            throw `perfJSON is not valid. \n${JSON.stringify(validatorResult,null,2)}`;
        }
        return await this.loadPerf(bookCode, perfDocument, options);
    }

    /**
     * Fetches document from proskomma instance
     * @async
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @return {Promise<perfDocument>} fetched PERF document
     */
    async fetchPerf(bookCode, options = {}) {
        if (this.backend === "standalone") {
            throw "Can't call fetchPerf in standalone mode";
        }
        if (!bookCode) {
            throw new Error("fetchPerf requires 1 argument (bookCode)");
        }
         if (bookCode.length > 3 || !/^[A-Z0-9]{3}$/.test(bookCode)) {
            throw new Error(`Invalid bookCode: "${bookCode}". Only three characters (uppercase letters [A-Z] or numbers [0-9]) allowed.`);
        }
        const query = `{docSet(id: "${this.docSetId}") { document(bookCode: "${bookCode}") { perf } } }`;
        const { data } = this.proskomma.gqlQuerySync(query);
        const queryResult = data.docSet.document.perf;

        if (!queryResult) {
            throw new Error(`No document with bookCode="${bookCode}" found.`);
        }
        const perfDocument = JSON.parse(queryResult);
        return await this.loadPerf(bookCode, perfDocument, options);
    }

    /**
     * Gets document from memory or fetches it if proskomma is set
     * @async
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through after read.
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
        const { perf, pipelineData } = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument });
        this.setPipelineData(bookCode, pipelineData);
        return perf;
    }

    /**
     * Merges a sequence with the document and saves the new modified document.
     * @param {string} bookCode
     * @param {number} sequenceId - id of modified sequence
     * @param {perfSequence} perfSequence - modified sequence
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
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
        const validatorResult = this.validator.validate('constraint','perfSequence','0.3.0',perfSequence);

        if (!validatorResult.isValid) {
            throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(validatorResult)}`;
        }

        perfDocument.sequences[sequenceId] = _.cloneDeep(perfSequence);

        const { writePipeline } = options;
        const { perf:newPerfDoc, pipelineData } = await this.runPipeline({ bookCode, pipelineName: writePipeline, perfDocument });

        const history = this.history[bookCode];
        history.stack = history.stack.slice(history.cursor);
        history.stack.unshift({ perfDocument: newPerfDoc });
        history.cursor = 0;
        this.setPipelineData(bookCode, pipelineData);

        if (history.stack.length > this.options.historySize)
            history.stack.pop();

        return await this.readPerf(bookCode, options);
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
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through after read from memory.
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
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through after read from memory.
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
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through before usfm conversion.
     * @return {Promise<string>} converted usfm
     */
    async readUsfm(bookCode, options) {
        const perf = await this.readPerf(bookCode, options);
        if(this.pipelineHandler === null) this.instanciatePipelineHandler();
        const output = await this.pipelineHandler.runPipeline("perf2usfmPipeline", { perf: perf });
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
        if(this.pipelineHandler === null) this.instanciatePipelineHandler();
        data.perf = this.getDocument(bookCode);
        return await this.pipelineHandler.runPipeline(reportName, data);
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
 * A content element, ie some form of (possibly nested) markup
 * @typedef {object} contentElementPerf Element
 * @property {"mark"|"wrapper"|"start_milestone"|"end_milestone"|"graft"} type The type of element
 * @property {string} [subtype] The subtype of the element, which is context-dependent
 * @property {object} [atts] An object containing USFM attributes or subtype-specific additional information (such as the number of a verse or chapter). The value may be a boolean, a string or an array of strings
 * @property {string} [target] The id of the sequence containing graft content
 * @property {perfSequence} [sequence] The sequence containing graft content
 * @property {string} [preview_text] An optional field to provide some kind of printable label for a graft
 * @property {boolean} [new] If present and true, is interpreted as a request for the server to create a new graft
 * @property {contentElementPerf} [content] Nested content within the content element
 * @property {contentElementPerf} [meta_content] Non-Scripture content related to the content element, such as checking data or related resources
 */

/**
 * A block, which represents either a paragraph of text or a graft
 * @typedef {object} blockOrGraftPerf
 * @property {"paragraph"|"graft"} type The type of block
 * @property {string} [subtype] A type-specific subtype
 * @property {string} [target] The id of the sequence containing graft content
 * @property {perfSequence} [sequence] The sequence containing graft content
 * @property {string} [preview_text] An optional field to provide some kind of printable label for a graft
 * @property {boolean} [new] If present and true, is interpreted as a request for the server to create a new graft
 * @property {object} [atts] An object containing USFM attributes or subtype-specific additional information (such as the number of a verse or chapter). The value may be a boolean, a string or an array of strings
 * @property {Array<string|contentElementPerf>} [content] The content of the block
 */

/**
 * A sequence contains a 'flow' of one or more blocks
 * @typedef {object} perfSequence
 * @property {string} type The type of sequence
 * @property {string} [preview_text] An optional field to provide some kind of printable label
 * @property {blockOrGraftPerf[]} [blocks] The blocks that, together, represent the 'flow' of the sequence
 */

/**
 * A document, typically corresponding to a single USFM or USX book
 * @typedef {object} perfDocument
 * @property {object} schema
 * @property {"flat"|"nested"} schema.structure The basic 'shape' of the content
 * @property {string} schema.structure_version the semantic version of the structure schema
 * @property {array} schema.constraints
 * @property {object} metadata Metadata describing the document and the translation it belongs to
 * @property {object} [metadata.translation] Metadata concerning the translation to which the document belongs
 * @property {array} [metadata.translation.tags] Tags attached to the translation
 * @property {object} [metadata.translation.properties] Key/value properties attached to the translation
 * @property {object} [metadata.translation.selectors] Proskomma selectors for the translation that, together, provide a primary key in the translation store
 * @property {object} [metadata.document] Metadata concerning the document itself
 * @property {array} [metadata.document.tags] Tags attached to the document
 * @property {object} [metadata.document.properties] Key/value properties attached to the document
 * @property {string} [metadata.document.chapters]
 * @property {Object<string,perfSequence>} [sequences]
 * @property {perfSequence} [sequence]
 * @property {string} [main_sequence_id]
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

/**
 * PipelineHandlers instance
 * @typedef {import('pipeline-handler')} PipelineHandler
 * @see {@link https://github.com/DanielC-N/pipelineHandler}
 */
