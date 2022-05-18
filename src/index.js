class Epitelete {

    constructor(pk, docSetId) {
        if (!docSetId) {
            throw new Error("Epitelete constructor requires 2 arguments (pk, docSetId)");
        }
    }

}

export default Epitelete;
