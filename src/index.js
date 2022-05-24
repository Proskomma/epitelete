const { doRender } = require('proskomma-render-perf');

class Epitelete {

    constructor(pk, docSetId) {
        if (!docSetId || !pk) {
            throw new Error("Epitelete constructor requires 2 arguments (pk, docSetId)");
        }

        const query = `{ docSet(id: "${docSetId}") { id } }`;
        const { data: gqlResult } = pk.gqlQuerySync(query);

        if (!gqlResult.docSet) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        this.pk = pk;
        this.docSetId = docSetId;
        this.documents = {}
    }

    async fetchPerf(bookCode) {

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

        const output = config2.output;
        //const doc = output.docSets[this.docSetId].documents[bookCode];

        this.documents[bookCode] = output; //doc;

        return output; //doc;
    }

    async readPerf(bookCode) {
        const doc = this.documents[bookCode] || await this.fetchPerf(bookCode);
        return doc;
    }

    async perfWrite(bookCode, sequenceId, perfSequence) {
        console.log('someone needs to write this!');
        return null;
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
        const bookCodes = {};
        const query = `{ docSet(id: "${this.docSetId}") { documents { headers { key value } } } }`;
        const { data: gqlResult } = this.pk.gqlQuerySync(query);
        const documents = gqlResult?.docSet?.documents || [];
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
                bookCodes[key] = headers;
            }
        }
       return bookCodes;
    }

    clearPerf() {
        this.documents = {};
    }
}

export default Epitelete;
