// import { Proskomma } from 'proskomma-cross';
import ProskommaInterface from './ProskommaInterface';
// import { PipelineHandler } from 'proskomma-json-tools';
// import pipelines from '../pipeline-tools/pipelines';
// import transforms from '../pipeline-tools/transforms';

class Aligner {
    /**
     *
     * @param {String[]} sourceUsfm - source raw str/json, code lang and abbr
     * @param {String[]} targetUsfm - target raw str/json, code lang and abbr
     * @param {boolean} verbose
    */
    constructor({proskomma= null, sourceText=[], targetText=[], verbose=false}) {
        this.numberVersesInChapters = [];
        this.numChapters = 0;
        this.numVersesOfCurrentChapter = 0;
        this.bookCodeSrc, this.docSetIdSrc, this.bookCodeTrg, this.docSetIdTrg = "";
        this.proskommaInterface = new ProskommaInterface(proskomma);

        let resRaw = null;
        if(sourceText && sourceText[0] != null && sourceText.length === 3) {
            resRaw = this.proskommaInterface.addRawDocument(sourceText[0], sourceText[1], sourceText[2]);
            this.bookCodeSrc = resRaw[0];
            this.docSetIdSrc = resRaw[1];
            this.sourceText = sourceText[0];
            this.bookCode = this.bookCodeSrc;
        } else {
            this.sourceText = "";
        }
        if(targetText && targetText[0] != null && targetText.length === 3) {
            resRaw = this.proskommaInterface.addRawDocument(targetText[0], targetText[1], targetText[2]);
            this.bookCodeTrg = resRaw[0];
            this.docSetIdTrg = resRaw[1];
            this.targetText = targetText[0];
            if(this.bookCodeSrc !== "" && this.bookCodeTrg !== "" && this.bookCodeSrc != this.bookCodeTrg) {
                throw new Error("the book code doesn't match. Are you trying to align two different books ?");
            } else {
                let resintegrity = this.checkIntegrity(this.docSetIdSrc, this.bookCodeSrc, this.docSetIdTrg, this.bookCodeTrg);
                let isGood = resintegrity[0];
                if(!isGood) {
                    throw Error("the source book does not match the number of chapters/verses of the target book\n", "src ==", resintegrity[1], "| target ==", resintegrity[2]);
                }
                this.numberVersesInChapters = resintegrity[1];
                this.numVersesOfCurrentChapter = this.numberVersesInChapters[0].length;
                this.bookCode = this.bookCodeSrc;
            }
        } else {
            this.targetText = "";
        }
        
        this.currentChapter = 1;
        this.currentVerse = 1;
        this.currentReference = this.generateReference();
        this.idtexts = [this.docSetIdSrc, this.docSetIdTrg];
        this.currentSourceSentence = [];
        this.currentSourceSentenceStr = "";
        this.currentTargetSentence = [];
        this.currentTargetSentenceStr = "";
        this.verbose = verbose;
        this.AlignementJSON = JSON.parse("{}");
    }

    setTargetText(raw, codeLang, abbr) {
        let resRaw = this.proskommaInterface.addRawDocument(raw, codeLang, abbr);
        this.bookCodeTrg = resRaw[0];
        this.docSetIdTrg = resRaw[1];
        this.targetText = raw;
        if(this.bookCodeSrc !== "" && this.bookCodeTrg !== "" && this.bookCodeSrc != this.bookCodeTrg) {
            throw new Error("the book code doesn't match. Are you trying to align two different books ?");
        } else {
            let resintegrity = this.checkIntegrity(this.docSetIdSrc, this.bookCodeSrc, this.docSetIdTrg, this.bookCodeTrg);
            let isGood = resintegrity[0];
            if(!isGood) {
                throw Error("the source book does not match the number of chapters/verses of the target book\n", "src ==", resintegrity[1], "| target ==", resintegrity[2]);
            }
            this.numberVersesInChapters = resintegrity[1];
            this.numVersesOfCurrentChapter = this.numberVersesInChapters[0].length;
            this.bookCode = this.bookCodeSrc;
        }
    }

    /**
     * 
     * @returns {string[]}
     */
    getCurrentTargetSentence() {
        return this.currentTargetSentence;
    }

    /**
     * 
     * @returns {string}
     */
    getCurrentTargetSentenceStr() {
        return this.currentTargetSentenceStr;
    }

    /**
     * 
     * @returns {string[]}
     */
    getCurrentSourceSentence() {
        return this.currentSourceSentence;
    }

    /**
     * 
     * @returns {string}
     */
    getCurrentSourceSentenceStr() {
        return this.currentSourceSentenceStr;
    }

    getBookCode() {
        return this.bookCode ? this.bookCode : this.bookCodeSrc;
    }

    getCurrentChapter() {
        return this.currentChapter;
    }

    getCurrentVerse() {
        return this.currentVerse;
    }

    getCurrentReference() {
        return this.currentReference;
    }

    getNumberOfChapters() {
        return this.numberVersesInChapters.length;
    }

    getNumberOfVersesInCurrentChapter() {
        return this.numberVersesInChapters[this.currentChapter-1];
    }

    getNumberVersesInChapters() {
        return this.numberVersesInChapters;
    }

    setNumberVersesInChapters() {
        this.numberVersesInChapters = this.countVersesInChapters()[1];
    }

    setCurrentChapter(chapterInt) {
        this.currentChapter = chapterInt;
        this.generateReference();
    }

    setCurrentVerse(verseInt) {
        this.currentVerse = verseInt;
        this.generateReference();
    }

    /**
     * get the source text from proskomma instance in usfm (default) or perf
     * @param {string} type "usfm" or "perf" or "sofria"
     * @returns {string}
     */
    async getSourceText(type="usfm") {
        let query = `{ docSet (id: "${this.idtexts[0]}") { document(bookCode:"${this.bookCode}") { ${type} }}}`;
        let { data } = await this.proskommaInterface.queryPk(query);
        return data.docSet.document[`${type}`];
    }

    async getUniqueLemmas() {
        let res = await this.proskommaInterface.getUniqueLemmas();
        return res;
    }

    /**
     * get the source text from proskomma instance in usfm (default) or perf
     * @param {string} type "usfm" or "perf"
     * @returns {string}
     */
    async getTargetText(type="usfm") {
        let query = `{ docSet (id: "${this.idtexts[1]}") { document(bookCode:"${this.bookCode}") { ${type} }}}`;
        let { data } = await this.proskommaInterface.queryPk(query);
        return data.docSet.document[`${type}`];
    }

    resetAlignment() {
        this.AlignementJSON[this.currentReference]["alignments"] = [];
    }

    fullResetAlignment() {
        this.AlignementJSON = JSON.parse("{}");
    }

    checkIntegrity(docSetIdSrc, bookCodeSrc, docSetIdTrg,bookCodeTrg) {
        let nbSrc = this.countVersesInChapters(docSetIdSrc, bookCodeSrc);
        let nbTrg = this.countVersesInChapters(docSetIdTrg, bookCodeTrg);

        if(nbSrc.length != nbTrg.length) {
            return false;
        } else {
            this.numChapters = nbSrc.length;
        }
        return [JSON.stringify(nbSrc.slice()) === JSON.stringify(nbTrg.slice()), nbSrc, nbTrg];
    }

    /**
     * change the source chapter/verse to align
     * @param {int} cint chapter
     * @param {int} vint verse
     */
    async setChapterVerse(cint, vint) {
        if(cint == null || cint == 0) {
            throw new Error("alignmentAPI : chapter index is null or undefined (cint, vint) == (" + cint + ", " + vint + ")");
        }
        if(vint == null || vint == 0) {
            throw new Error("alignmentAPI : verse index is null or undefined (cint, vint) == (" + cint + ", " + vint + ")");
        }
        let odlChapRef = this.currentChapter;
        let odlVerseRef = this.currentVerse;
        let oldReference = this.currentReference;
        try {
            this.setCurrentChapter(cint);
            this.setCurrentVerse(vint);
            let getVerseCV = await this.proskommaInterface.getVerseFromCV(this.docSetIdSrc, this.bookCode, cint, vint);
            this.setCurrentSourceSentence(getVerseCV);
            getVerseCV = await this.proskommaInterface.getVerseFromCV(this.docSetIdTrg, this.bookCode, cint, vint);
            this.setCurrentTargetSentence(getVerseCV);
            this.generateReference();
        } catch (err) {
            this.setCurrentChapter(odlChapRef);
            this.setCurrentVerse(odlVerseRef);
            throw err;
        }

        // if there is not alignements for the old verse, we delete the entry
        if(this.AlignementJSON[oldReference] && this.AlignementJSON[oldReference]["alignments"].length == 0) {
            delete this.AlignementJSON[oldReference];
        }
    }

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     * @param {string} sentenceStr if 'sentence' is an object, please provide the input sentence str
     */
    setCurrentSourceSentence(sentence, sentenceStr="") {
        this.generateReference();
        if(typeof sentence === "object" && sentence[0] != null && typeof sentence[0] === "string") {
            if(sentenceStr == "") {
                throw new Error("Please provide the string of the source sentence (2nd argument : 'sentenceStr')");
            }
            this.currentSourceSentence = sentence;
            this.currentSourceSentenceStr = sentenceStr;
        } else if (typeof sentence === "string") {
            this.currentSourceSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentSourceSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
        } else {
            this.AlignementJSON[this.currentReference]["sourceText"] = this.currentSourceSentenceStr;
        }
    }

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     * @param {string} sentenceStr if 'sentence' is an object, please provide the input sentence str
     */
    setCurrentTargetSentence(sentence, sentenceStr="") {
        this.generateReference();
        if(typeof sentence === "object" && sentence[0] != null && typeof sentence[0] === "string") {
            if(sentenceStr == "") {
                throw new Error("Please provide the string of the target sentence (2nd argument : 'sentenceStr')");
            }
            this.currentTargetSentence = sentence;
            this.currentTargetSentenceStr = sentenceStr;
        } else if (typeof sentence === "string") {
            this.currentTargetSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentTargetSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
        } else {
            this.AlignementJSON[this.currentReference]["targetText"] = this.currentTargetSentenceStr;
        }
    }

    /**
     * Get a well formated JSON word alignment informations
     * @returns {JSON}
     */
    getAlignmentJSON() {
        return this.AlignementJSON;
    }

    /**
     * Align two words and add the information to the final JSON
     * @param {int} sourceIndex the index of the SOURCE language to align
     * @param {int} targetIndex the index of the TARGET language to align
     */
    addAlignment(sourceIndex, targetIndex) {
        let sWord = this.currentSourceSentence[sourceIndex];
        if(!sWord) {
            throw new Error(`sourceIndex == ${sourceIndex} is not valid : please select a correct range : 1:${this.currentSourceSentence.length} (or maybe you don't have any source sentence...)`);
        }
        let tWord = this.currentTargetSentence[targetIndex];
        if(!tWord) {
            throw new Error(`targetIndex == ${targetIndex} is not valid : please select a correct range : 1:${this.currentTargetSentence.length} (or maybe you don't have any target sentence...)`);
        }
        this.generateReference();
        if(!this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]) {
            this.AlignementJSON[this.currentReference]["alignments"][sourceIndex] = this.generateTemplateAlign(
                sWord,
                tWord,
                sourceIndex,
                targetIndex,
            );
        } else {
            this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]["targetWords"].push(tWord);
            this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]["targetIndexes"].push(targetIndex);
        }
    }

    /**
     * 
     * @param {int} sourceIndex the index of the SOURCE language to UNalign
     * @param {int} targetIndex the index of the TARGET language to UNalign
     * @returns nothing
     */
    removeAlignment(sourceIndex, targetIndex) {
        this.generateReference();
        let sWord = this.currentSourceSentence[sourceIndex];
        let tWord = this.currentTargetSentence[targetIndex];

        if(!this.AlignementJSON[this.currentReference]) return; // if the reference does not exist, get out
        // if the prop 'alignments' does not exist we create it for safety and we get out
        if(!this.AlignementJSON[this.currentReference]["alignments"]) {
            this.AlignementJSON[this.currentReference]["alignments"] = [];
            return;
        }
        let theWordToRemove = this.AlignementJSON[this.currentReference]["alignments"][sourceIndex];
        if(!theWordToRemove) return;
        // removing the word from 'targetWords'
        let index = theWordToRemove["targetWords"].indexOf(tWord);
        if (index !== -1) {
            this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]["targetWords"].splice(index, 1);
            
            // if the array of the current alignement is empty, we completely
            // remove the entry "sourceIndex"
            if(this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]["targetWords"][0] == null) {
                delete this.AlignementJSON[this.currentReference]["alignments"][sourceIndex];

                // if all alignements have been deleted, we delete the whole entry
                if(Object.keys(this.AlignementJSON[this.currentReference]["alignments"]).length == 0) {
                    delete this.AlignementJSON[this.currentReference];
                }
                return;
            }
            
            this.AlignementJSON[this.currentReference]["alignments"][sourceIndex]["targetIndexes"].splice(index, 1);
        }
    }

    // async generateAlignedUsfm(vvv=false) {
    //     const pipeline = new PipelineHandler({
    //         pipelines: pipelines,
    //         transforms: transforms,
    //         proskomma: this.proskommaInterface.getInstance(),
    //         verbose: vvv
    //     });
    //     let srcPerf = JSON.parse(await this.getSourceText("perf"));
    //     let trgPerf = JSON.parse(await this.getTargetText("perf"));
    //     let output = await pipeline.runPipeline("mergeFromAlignReportPipeline", {
    //         sourcePerf: srcPerf,
    //         targetPerf: trgPerf,
    //         alignReport: this.getAlignmentJSON(),
    //     });
    //     return output;
    // }

    async mergeAlignmentAndPerf() {
        if(!this.perfMode) {
            throw new Error("alignmentAPI is not in perf mode, please instanciate thsi class with an aligned Perf");
        }


    }

    generateReference() {
        let cc = this.currentChapter.toString();
        let cv = this.currentVerse.toString();
        if(this.currentChapter > 0 && this.currentChapter < 10) {
            cc = "00"+cc;
        } else if (this.currentChapter >= 10 && this.currentChapter < 100) {
            cc = "0"+cc;
        } else {
            cc = ""+cc;
        }

        if(this.currentVerse > 0 && this.currentVerse < 10) {
            cv = "00"+cv;
        } else if (this.currentVerse >= 10 && this.currentVerse < 100) {
            cv = "0"+cv;
        } else {
            cv = ""+cv;
        }

        this.currentReference = cc+cv;
    }

    countVersesInChapters(docSetId="", bookCode="") {
        if(!docSetId[0]) {
            docSetId = this.idtexts[0];
        }
        if(!bookCode[0]) {
            bookCode = this.bookCode;
        }
        
        const verseQuery =
        `{ docSet (id: "${docSetId}") { document(bookCode:"${bookCode}") {` +
        `    cvIndexes { verseNumbers { number } } } } }`;
        const { data } = this.proskommaInterface.queryPkSync(verseQuery);

        let cvI = data.docSet.document.cvIndexes;
        let numVerses = [];
        for (let i = 0; i < cvI.length; i++) {
            numVerses.push(cvI[i].verseNumbers.length);
        }

        return numVerses;
    }

    /**
     * 
     * @param {string} reference string in format chapterVerse. Ex : '001001' (chapter 1, verse 1)
     * @param {string} sourceWord the source word of the alignment
     * @param {string} targetWord the target word of the alignment
     * @param {int} sourceIndex
     * @param {int} targetIndex
     */
    generateTemplateJson() {
        this.generateReference();
        this.AlignementJSON[this.currentReference] = {
            "sourceText": this.currentSourceSentenceStr,
            "targetText": this.currentTargetSentenceStr,
            "alignments": []
        }
    }

    /**
     * 
     * @param {string} sourceWord 
     * @param {string} targetWord 
     * @param {int} sourceIndex 
     * @param {int} targetIndex 
     * @returns 
     */
    generateTemplateAlign(sourceWord, targetWord, sourceIndex, targetIndex) {
        return {
            "sourceWord": sourceWord,
            "targetWords": [targetWord],
            "sourceIndex": sourceIndex,
            "targetIndexes": [targetIndex]
        }
    }
}

module.exports = { Aligner };