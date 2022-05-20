class Epitelete {

    constructor(pk, docSetId) {
        if (!docSetId || !pk) {
            throw new Error("Epitelete constructor requires 2 arguments (pk, docSetId)");
        }

        const query = `{ docSets(ids: "${docSetId}") { id } }`;
        const gqlResult = pk.gqlQuerySync(query);

        if (!gqlResult.data.docSets.length) {
            throw new Error("Provided docSetId is not present in the Proskomma instance.");
        }

        this.pk = pk;
        this.docSetId = docSetId;
    }
}

export default Epitelete;
