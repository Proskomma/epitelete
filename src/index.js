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

    localBookCodes() {
        return Object.keys(this.documents);
    }

    availableBookCodes() {
        const bookCodes = [];
        const docSets = this.pk?.docSets || {};
        const docSetKeys = Object.keys(docSets);
        for (const docSetKey of docSetKeys) {
            const docSet = docSets[docSetKey];
            const documents = docSet?.processor?.documents || {};
            const documentKeys = Object.keys(documents);
            for (const documentKey of documentKeys) {
                const firstDocument = documents[documentKey];
                const bookCode = firstDocument?.headers?.bookCode;
                if (bookCode) {
                    bookCodes.push(bookCode);
                }
            }
        }
        return bookCodes;
    }

    clearPerf() {
        this.documents = {};
    }
}

export default Epitelete;
