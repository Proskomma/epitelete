import { Proskomma } from 'proskomma';
import Axios from 'axios';

class ProskommaInterface {

    constructor(proskommaInstance = null, verbose=false) {
        let proskomma = proskommaInstance != null ? proskommaInstance : new Proskomma();
        const query = `{ id }`;
        const content = proskomma.gqlQuerySync(query) || {};
        
        if (!content || !content.data.id) {
            throw new Error("Failed to instantiate Proskomma");
        }

        this.proskomma = proskomma;
        this.usfms = {};
        this.verbose = verbose;
        this.bookCodes = [];
    }

    getInstance() {
        return this.proskomma;
    }

    getUsfms() {
        return this.usfms;
    }

    getIdsUsfms() {
        return Object.keys(this.usfms);
    }

    getUsfm(docSetId) {
        return this.usfms[docSetId];
    }

    testFirstUsfm() {
        let arrayIds = this.getIds();
        let getSpecificId = this.queryPk(`{ documents(ids:"${arrayIds[0]}") { docSetId } }`);
        // let getSpecificId = await this.queryPk(`{ documents { id docSetId headers { key value } } }`);
        // let getSpecificId = await this.queryPk(`{ documents { docSetId } }`);
        let myKeyUsfm = getSpecificId.data.documents[0].docSetId;
        let theUsfm = this.usfms[myKeyUsfm];
        console.log(theUsfm);
    }

    getIds() {
        let listIds = this.queryPkSync("{ documents { id } }");
        let arrayIds = [];
        listIds.data.documents.forEach(element => {
            arrayIds.push(element.id);
        });
        return arrayIds;
    }

    getId() {
        let listIds = this.queryPkSync("{ document { id } }");
        return [listIds.data.document.id];
    }


    getSourceText() {
        let arrayIds = this.getIds();
        const resQuery = this.queryPk(`{ documents(ids:"${arrayIds[0]}") { mainSequence { blocks { text } } } }`);
        return resQuery.data.documents[0].mainSequence.blocks[0].text;
    }

    getTargetText() {
        let arrayIds = this.getIds();
        const resQuery = this.queryPk(`{ documents(ids:"${arrayIds[1]}") { mainSequence { blocks { text } } } }`);
        return resQuery.data.documents[0].mainSequence.blocks[0].text;
    }

    /**
     * Add a document to the Proskomma instance
     * @param {string} rpath the relative path to the document
     * @param {string} codeLang the code of the language ["eng", "fra", "grk"]
     */
    async addDocument(rpath, codeLang="fra", abbr="ust", contentType="usfm") {
        let content = fse.readFileSync(path.resolve(__dirname, rpath)).toString();
        const mutation = `mutation { addDocument(` +
            `selectors: [{key: "lang", value: "${codeLang}"}, {key: "abbr", value: "${abbr}"}], ` +
            `contentType: "${contentType}"", ` +
            `content: """${content}""") }`;
        const docSetId = codeLang + "_" + abbr;
        let res = await this.queryPk(mutation);
        // does the mutation worked ?
        if(res.data.addDocument) {
            this.usfms[docSetId] = content;
        }
    }

    /**
     * 
     * @param {string} fullText full text in string format
     * @param {string} codeLang [usfm, perf, sofria]
     * @param {string} abbr [ust, ugnt, etc.]
     * @param {string} contentType [usfm, perf, sofria]
     * @returns [bookCode, docSetId]
     */
    addRawDocument(fullText, codeLang="fra", abbr="ust", contentType="usfm") {
        const docSetId = codeLang + "_" + abbr;
        // let res = await this.queryPk(mutation);
        let result = this.proskomma.importDocument(
            {
                lang: codeLang,
                abbr: abbr
            },
            contentType,
            fullText
        );
        this.usfms[docSetId] = fullText;
        let bookCode = fullText.match(/\\id ([A-Z0-9]{3}) /)?.[1];
        this.bookCodes.push[bookCode];
        // does the mutation worked ?
        // if(result) {
        //     this.usfms[docSetId] = this.queryPk("{documents {usfm}}")
        //         .then(res =>
        //             res.data.documents.at(-1).usfm
        //         );
        // }
        return [bookCode, docSetId];
    }

    async getFullText(id) {
        const resQuery = await this.queryPk(`{ documents(ids:"${id}") { mainSequence { blocks { text } } } }`);
        return resQuery.data.documents[0].mainSequence.blocks[0].text;
    }

    /**
     * Fetch the document via a http address and add it to the Proskomma instance
     * @param {string} addr the http address where to find the document
     */
    async addDocumentHttp(addr, codeLang="fra", abbr="ust", contentType="usfm") {
        try {
            this.verbose && console.log(`Fetching HTTP content for Source lsg_tit.usfm`);
            const response = await Axios.get(addr);
            if (response.status !== 200) {
                console.error(`Status code ${response.status} when fetching content by HTTP(S) for Source : ${addr}`);
            } else {
                await this.addRawDocument(response.data, codeLang, abbr, contentType);
            }
        } catch (err) {
            throw new Error(`Exception when fetching content by HTTP(S) for Source lsg_tit.usfm: \n${err}`);
        }
    }

    async getTokensInfosFromCV(cint, vint) {
        let arrayIds = this.getIds();
        const query =
        `{ docSet (id: "${arrayIds[0]}") { document(bookCode:"${this.bookCodes[0]}") {` +
        `    mainSequence {` +
        `      blocks(withScriptureCV:"${cint}:${vint}") {` +
        `         text(withScriptureCV:"${cint}:${vint}", normalizeSpace:true),` +
        `         tokens(withScriptureCV:"${cint}:${vint}", withSubTypes:"wordLike")` +
        `          { scopes subType payload(normalizeSpace:true) }` +
        `          wordLikes: tokens(withSubTypes:"wordLike", withScriptureCV:"${cint}:${vint}",)` +
        `          { scopes(startsWith:["attribute/spanWithAtts/w/x-morph"]) }` +
        `        }` +
        `      }` +
        `    }` +
        `  }` +
        `}`;

        const { data } = await this.queryPk(query);
        const block = data.docSet.document.mainSequence.blocks[0];
        if(block == null) {
            return new Error(`The pair Chapter:Verse == ${cint}:${vint} was not found`);
        }
        const res = block.token;
        const wordLikes = block.wordLikes;
        const resLen = res.length;
        let tokens = new Array(resLen).fill(0);
        let currentScopes = null;
        for (let i = 0; i < resLen; i++) {
            currentScopes = res[i].scopes;
            tokens[i] = {
                chapter: cint,
                verse: vint,
                wordPos: i + 1,
                strong: currentScopes[4].split("/").at(-1),
                lemma: currentScopes[4].split("/").at(-1),
                morph: [],
                word: res[i].payload,
                occurence: 0,
                occurences: 0,
                occurenceLemma: 0,
                occurencesLemma: 0,
                tgoccurence: 0,
                tgoccurences: 0,
                targetLinkValue: "",
                segment: 0,
                targetword: "",
                normalized: "",
                expression: "",
            };
            for (let k = 0; k < wordLikes[i].scopes.length; k++) {
                tokens[i]["morph"].push(wordLikes[i].scopes[k].split("/").at(-1));
            }
        }
        return tokens;
    }

    async getVerseFromCV(id, bookcode, cint, vint) {
        const query =
        `{ docSet (id: "${id}") { document(bookCode:"${bookcode}") {` +
        "    mainSequence {" +
        `      blocks(withScriptureCV:"${cint}:${vint}") {` +
        `         text(withScriptureCV:"${cint}:${vint}", normalizeSpace:true)` +
        "        }" +
        "      }" +
        "    }" +
        "  }" +
        "}";

        const { data } = await this.queryPk(query);
        const block = data.docSet.document.mainSequence.blocks[0];
        if(block == null) {
            throw new Error(`ProskommaInterface : the pair Chapter:Verse == ${cint}:${vint} was not found`);
        }
        return block.text;
    }

    async queryPk(query) {
        const result = await this.proskomma.gqlQuery(query);
        return result;
    }

    queryPkSync(query) {
        const result = this.proskomma.gqlQuerySync(query);
        return result;
    }

    testQueryPk(query) {
        const result = this.proskomma.gqlQuerySync(query);
        console.log(JSON.stringify(result.data.documents[0].mainBlocksText[0], null, 2));
    }

    getBookCode() {
        const res = this.queryPkSync("{ documents { bookCode: header(id:\"bookCode\") } }");
        return res.data.documents[0].bookCode;
    }

    // async saveFile(file, rpath="./output.json") {
    //     try {
    //         if(typeof file === "string") {
    //             let thepath = rpath;
    //             await fse.outputFile(path.resolve(thepath), file);
    //         } else {
    //             await fse.outputJson(path.resolve(rpath), file);
    //         }
    //     } catch (err) {
    //         throw new Error("Failed to save the file", err)
    //     }
    // }
}


/**
 * Proskomma instance
 * @typedef Proskomma
 * @see {@link https://github.com/abelpz/proskomma-testing-environment/tree/main/libs/pk-core}
 */

export default ProskommaInterface;