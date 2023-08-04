import { Validator, PipelineHandler } from 'proskomma-json-tools';
import pipelines from './pipelines';
import transformActions from './transforms';
import fnr from '@findr/perf'
import deepCopy from 'rfdc/default';
import { findNewGraft, generateId, getPathValue, validateParams } from './utils';

const ACTIONS = {
    WRITE_PERF: 'writePerf',
    READ_PERF: 'readPerf',
    LOAD_PERF: 'loadPerf',
    UNDO_PERF: 'undoPerf',
    REDO_PERF: 'redoPerf',
}
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
     * @param {object} [args.options.pipelines] - custom pipelines to add to epitelete's internal pipeline handler.
     * @param {object} [args.options.transforms] - custom transform actions to add to epitelete's internal pipeline handler.
     * @return {Epitelete} Epitelete instance
     */
    constructor({ proskomma = null, docSetId, options = {}, ...args }) {
        validateParams(["proskomma", "docSetId", "options"], args, "Unexpected arg in constructor");
        validateParams(["historySize","pipelines","transforms"], options, "Unexpected option in constructor");

        if (!docSetId) {
            throw new Error("docSetId is required");
        }

        this._observers = [];

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = proskomma?.gqlQuerySync(query) || {};

        if (proskomma && !gqlResult?.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        const { hs, ...opt } = options;
        const historySize = hs ? hs + 1 : 11 //add one to passed history size so it matches undos allowed.

        this.options = {
            historySize,
            ...opt
        };

        this.proskomma = proskomma;
        this.pipelineHandler = new PipelineHandler({
            pipelines: pipelines || options.pipelines
            ? { ...pipelines, ...options.pipelines, ...fnr.pipelines } : null,
            transforms: transformActions || options.transforms
            ? { ...transformActions, ...options.transforms, ...fnr.transforms } : null,
            proskomma: proskomma,
        });
        this.docSetId = docSetId;

        /** @type saved: the latest perf saved*/
        this.saved = {};
        /** @type history */
        this.history = {};
        this.validator = new Validator();
        this.backend = proskomma ? 'proskomma' : 'standalone';
    }

    unobserve(observer) {
        this._observers = this._observers.filter(o => o !== observer);
    }

    observe(observer) {
        this._observers.push(observer);
        return () => this.unobserve(observer);
    }

    notifyObservers(...args) {
        this._observers.forEach(observer => {
            observer(...args);
        });
    }

    /**
     * Adds a new PipelineHandler instance to current Epitelete pipelineHandler prop.
     * @param {Object} args - method args
     * @param {Object} [args.pipelines] - custom pipelines to add to epitelete's internal pipeline handler.
     * @param {Object} [args.transforms] - custom transform actions to add to epitelete's internal pipeline handler.
     * @private
    */
    instanciatePipelineHandler({pipelines: _pipelines, transforms}) {
        new PipelineHandler({
            pipelines: pipelines || _pipelines
                ? { ...pipelines, ..._pipelines } : null,
            transforms: transformActions || transforms
                ? { ...transformActions, ...transforms } : null
        });
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
     * @param {boolean} [clone=true] true if document should be cloned
     * @return {perfDocument} matching PERF document
     */
    getDocument(bookCode, clone = true) {
        const bookData = this.getBookData(bookCode);
        const perfDocument = bookData?.perfDocument;
        if (!perfDocument) return;
        return clone ? deepCopy(perfDocument) : {...perfDocument}
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
     * Stores the reference to the current perfDocument in history.
     * @param {string} bookCode 
     */
    savePerf(bookCode) {
        this.saved[bookCode] = this.getBookData(bookCode);
    }

    /**
     * Checks if the current perfDocument in history matches the stored one.
     * @param {string} bookCode 
     * @returns 
     */
    canSavePerf(bookCode) {
        return this.saved[bookCode] !== this.getBookData(bookCode);
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
     * @param {boolean} [clone=true] true if document should be cloned
     * @return {perfDocument} same passed PERF document
     * @private
     */

    addDocument({ bookCode, perfDocument, clone = true }) {
        const { stack, cursor } = this.getBookHistory(bookCode);
        stack[cursor] ??= {};
        stack[cursor].perfDocument = clone ? deepCopy(perfDocument) : perfDocument;
        return perfDocument;
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
    async runPipeline({ bookCode, pipelineName, perfDocument, multiplePerfs = false }) {
        if (!pipelineName) return { perf: perfDocument };
        const storedData = this.getPipelineData(bookCode);
        const [_inputs] = this.pipelineHandler.pipelines[pipelineName];
        const { inputs } = _inputs;
        const data = storedData ? Object.keys(storedData).reduce((data, inputKey) => {
            if (inputKey in inputs) data[inputKey] = storedData[inputKey];
            return data;
        }, {}) : undefined;
        let pipelineArgs = null;
        if(multiplePerfs) {
            const { perfSource, perfTarget } = perfDocument;
            pipelineArgs = { perfSource: perfSource, perfTarget: perfTarget, ...data };
        } else {
            pipelineArgs = { perf: perfDocument, ...data };
        }
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
     * @param {boolean} [options.cloning = true] - turns safe mode
     *
     * @return {Promise<perfDocument>} fetched PERF document
     * @private
     */
    async loadPerf(bookCode, perfDocument, options) {
        const shouldClone = options.cloning ?? true;
        const { writePipeline, readPipeline, perfSource } = options;
        const {perf:writePerf, pipelineData: writePipelineData} = await this.runPipeline({ bookCode, pipelineName: writePipeline, perfDocument });
        let validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', writePerf);
        if (!validatorResult.isValid) {
            throw new Error(`writePerf is schema invalid: ${JSON.stringify(validatorResult.errors)}`);
        }
        this.setPipelineData(bookCode, writePipelineData);
        const savedPerf = this.addDocument({
            bookCode,
            perfDocument: writePerf,
            clone: shouldClone
        });
        validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', savedPerf);
        if (!validatorResult.isValid) {
            throw new Error(`savedPerf is schema invalid: ${JSON.stringify(validatorResult.errors)}`);
        }
        // console.log(JSON.stringify(writePerf, " ", 4));
        const {perf:readPerf, pipelineData: readPipelineData} = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument: savedPerf });
        validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', readPerf);
        if (!validatorResult.isValid) {
            const detailError = validatorResult.errors.map(error => {
                const value = getPathValue({object: readPerf, path: error.instancePath});
                return {...error, value: JSON.stringify(value,null,2)}
            })
            throw new Error(`readPerf is schema invalid: ${JSON.stringify(detailError)}`);
        }
        this.setPipelineData(bookCode, readPipelineData);
        this.savePerf(bookCode);
        this.notifyObservers({ action: ACTIONS.LOAD_PERF, data: readPerf });
        return readPerf;
    }

    async loadPerfToRichPerf(bookCode, perfDocuments, options) {
        const shouldClone = options.cloning ?? true;
        // const { sourcePerf, targetPerf } = perfDocuments;
        const { writePipeline, readPipeline } = options;
        const {perf:writePerf, pipelineData: writePipelineData} = await this.runPipeline({ bookCode, pipelineName: writePipeline, perfDocument:perfDocuments  });
        let validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', writePerf);
        if (!validatorResult.isValid) {
            throw new Error(`writePerf is schema invalid: ${JSON.stringify(validatorResult.errors)}`);
        }
        this.setPipelineData(bookCode, writePipelineData);
        const savedPerf = this.addDocument({
            bookCode,
            perfDocument: writePerf,
            clone: shouldClone
        });
        validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', savedPerf);
        if (!validatorResult.isValid) {
            throw new Error(`savedPerf is schema invalid: ${JSON.stringify(validatorResult.errors)}`);
        }
        // console.log(JSON.stringify(writePerf, " ", 4));
        const {perf:readPerf, pipelineData: readPipelineData} = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument: savedPerf });
        validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', readPerf);
        if (!validatorResult.isValid) {
            const detailError = validatorResult.errors.map(error => {
                const value = getPathValue({object: readPerf, path: error.instancePath});
                return {...error, value: JSON.stringify(value,null,2)}
            })
            throw new Error(`readPerf is schema invalid: ${JSON.stringify(detailError)}`);
        }
        this.setPipelineData(bookCode, readPipelineData);
        this.savePerf(bookCode);
        return readPerf;
    }

    /**
     * Loads given perf into memory
     * @param {string} bookCode
     * @param {perfDocument} perfDocument - PERF document
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<perfDocument>} same sideloaded PERF document
     */
    async sideloadPerf(bookCode, perfDocument, options = {}) {
        validateParams(["writePipeline", "readPipeline", "cloning"], options, "Unexpected option in sideloadPerf");

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
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<perfDocument>} fetched PERF document
     */
    async fetchPerf(bookCode, options = {}) {
        validateParams(["writePipeline","readPipeline","cloning", "perfSource"], options, "Unexpected option in fetchPerf");

        if (this.backend === "standalone") {
            throw "Can't call fetchPerf in standalone mode";
        }
        if (!bookCode) {
            throw new Error("fetchPerf requires argument (bookCode)");
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
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<perfDocument>} found or fetched PERF document
     */
    async readPerf(bookCode, options = {}) {
        validateParams(["readPipeline","cloning", "perfSource"], options, "Unexpected option in readPerf");
        const shouldClone = options.cloning ?? true;

        if (!this.history[bookCode] && this.backend === "proskomma") {
            if(options.perfSource) {
                return this.fetchRichPerf(bookCode, options)
            }
            return this.fetchPerf(bookCode, options);
        }
        if (!this.history[bookCode] && this.backend === "standalone") {
            throw `No document with bookCode="${bookCode}" found in memory. Use sideloadPerf() to load the document.`;
        }
        let perfDocument = null;
        const { readPipeline } = options;
        if(options.perfSource) {
            perfDocument = { perfTarget:this.getDocument(bookCode, shouldClone), perfSource:options.perfSource };
            const { perf, pipelineData } = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument, multiplePerfs: true });
            this.setPipelineData(bookCode, pipelineData);
            return perf;
        } else {
            perfDocument = this.getDocument(bookCode, shouldClone);
            const { perf, pipelineData } = await this.runPipeline({ bookCode, pipelineName: readPipeline, perfDocument });
            this.setPipelineData(bookCode, pipelineData);
            return perf;
        }
    }

    // TODO
    async sideLoadRichPerf(bookCode, richPerfDocument, options = {}) {
        validateParams(["writePipeline", "readPipeline", "cloning"], options, "Unexpected option in sideloadPerf");

        if (this.backend === "proskomma") {
            throw "Can't call sideloadPerf in proskomma mode";
        }

        if (!bookCode || !richPerfDocument) {
            throw "sideloadPerf requires 2 arguments (bookCode, richPerfDocument)";
        }

        const validatorResult = this.validator.validate('constraint','perfDocument','0.3.0', richPerfDocument);
        if (!validatorResult.isValid) {
            throw `perfJSON is not valid. \n${JSON.stringify(validatorResult,null,2)}`;
        }
        return await this.loadPerf(bookCode, richPerfDocument, options);
    }
    
    /**
     * Fetch a richPerf document.
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @returns 
     */
    async fetchRichPerf(bookCode, options = {}) {
        // TODO : change to name perfSource for a more generic one
        validateParams(["writePipeline","readPipeline","cloning","perfSource"], options, "Unexpected option in fetchRichPerf");

        if (this.backend === "standalone") {
            throw "Can't call fetchPerf in standalone mode";
        }
        if (!bookCode) {
            throw new Error("fetchPerf requires argument (bookCode)");
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

        const richPerfDocument = this.runPipeline("TIT", "perfToRichPerf", perfDocument);
        return await this.load(bookCode, richPerfDocument, options);
    }
 

    async getRichPerf(bookCode, sourcePerf) {
        let perfDoc = await this.readPerf(bookCode);
        const output = await this.pipelineHandler.runPipeline("perfToRichPerf", {
            "perfTarget": perfDoc,
            "perfSource": sourcePerf
        });

        return output.perf;
    }

    /**
     * Merges a sequence with the document and saves the new modified document.
     * @param {string} bookCode
     * @param {number} sequenceId - id of modified sequence
     * @param {perfSequence} perfSequence - modified sequence
     * @param {object} [options]
     * @param {string} [options.writePipeline] - name of pipeline to be run through before saving to memory.
     * @param {string} [options.readPipeline] - name of pipeline to be run through after saving to memory.
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<perfDocument>} modified PERF document
     */
    async writePerf(bookCode, sequenceId, perfSequence, options = {}) {
        validateParams(["writePipeline","readPipeline","cloning","insertSequences"], options, "Unexpected option in writePerf");
        const { writePipeline, cloning, insertSequences, ...readOptions } = options;
        const shouldClone = cloning ?? true;

        const perfDocument = this.getDocument(bookCode, false);

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

        const newSequences = {};
        if (insertSequences) {
            findNewGraft(perfSequence, (graft) => {
                const sequenceId = generateId();
                newSequences[sequenceId] = {
                    type: graft.subtype,
                    blocks: []
                };
                graft.target = sequenceId;
                delete (graft.new);
            });
        }

        const { sequences: originalSequences, ...perf } = perfDocument;
        const sequences = {
            ...originalSequences,
            [sequenceId]: (shouldClone ? deepCopy(perfSequence) : perfSequence)
        }
        perf["sequences"] = sequences;

        const { perf: newPerfDoc, pipelineData } = await this.runPipeline({ bookCode, pipelineName: writePipeline, perfDocument: perf });
        newPerfDoc.sequences = {...originalSequences,...newSequences, [sequenceId]: newPerfDoc.sequences[sequenceId]};

        const history = this.history[bookCode];
        history.stack = history.stack.slice(history.cursor);
        history.stack.unshift({ perfDocument: newPerfDoc });
        history.cursor = 0;
        this.setPipelineData(bookCode, pipelineData);

        if (history.stack.length > this.options.historySize)
            history.stack.pop();
        const returnedPerf = await this.readPerf(bookCode, readOptions);
        this.notifyObservers({ action: ACTIONS.WRITE_PERF, data: returnedPerf });
        return returnedPerf
    }

    /**
     * Gets previous document from history
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through after read from memory.
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<?perfDocument>} PERF document or null if can not undo
     */
    async undoPerf(bookCode, options) {
        if (this.canUndo(bookCode)) {
            const history = this.history[bookCode];
            ++history.cursor;
            const perf = await this.readPerf(bookCode, options);
            this.notifyObservers({ action: ACTIONS.UNDO_PERF, data: perf });
            return perf
        }
        return null;
    }

    /**
     * Gets next document from history
     * @param {string} bookCode
     * @param {object} [options]
     * @param {string} [options.readPipeline] - name of pipeline to be run through after read from memory.
     * @param {boolean} [options.cloning = true] - turns safe mode
     * @return {Promise<?perfDocument>} PERF document or null if can not redo
     */
    async redoPerf(bookCode, options){
        if (this.canRedo(bookCode)) {
            const history = this.history[bookCode];
            --history.cursor;
            const perf = await this.readPerf(bookCode, options);
            this.notifyObservers({ action: ACTIONS.REDO_PERF, data: perf });
            return perf
        }
        return null;
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

    getMainSequence(bookCode) {
        let documents = this.getDocuments();
        let sequences = documents[bookCode]?.sequences;
        let mainSequenceId = Object.keys(sequences)[0];
        return sequences[mainSequenceId];
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
        const output = await this.pipelineHandler.runPipeline("perfToUsfmPipeline", { perf: perf });
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
 * @typedef {Object<string, perfDocument>} saved
 */

/**
 * Proskomma instance
 * @typedef Proskomma
 * @see {@link https://github.com/mvahowe/proskomma-js}
 */

/**
 * PipelineHandlers instance
 * @typedef {typeof import('proskomma-json-tools').PipelineHandler} PipelineHandler
 * @see {@link https://github.com/DanielC-N/pipelineHandler}
 */
