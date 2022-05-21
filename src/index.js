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
        return config2.output;
    }
}

export default Epitelete;
