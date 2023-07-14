import { PerfRenderFromJson, render, mergeActions } from 'proskomma-json-tools';
import xre from "xregexp";
import UUID from "pure-uuid";

const lexingRegexes = [
    [
        "printable", "wordLike", xre("([\\p{Letter}\\p{Number}\\p{Mark}\\u2060]{1,127})"),
    ],
    [
        "printable", "lineSpace", xre("([\\p{Separator}\t]{1,127})")
    ],
    [
        "printable", "punctuation", xre("([\\p{Punctuation}\\p{Math_Symbol}\\p{Currency_Symbol}\\p{Modifier_Symbol}\\p{Other_Symbol}])"),
    ],
    [
        "bad", "unknown", xre("(.)")
    ],
];
const re = xre.union(lexingRegexes.map((x) => x[2]));

const alignWrapper = function(content) {
    return {
        type: "wrapper",
        subtype: "pk:align",
        content: content,
        atts: {
            "alignGroup": new UUID(4).toString()
        }
    }
}

const specialMark = function(bookCode, chapterNum, verseNum, tokenNumber, atts) {
    if(!tokenNumber) {
        throw new Error(`The word from the aligned usfm doesn't exist in the source usfm, ${bookCode} ${chapterNum}:${verseNum}`);
    }
    return {
        type:"mark",
        subtype:"pk:alignedTo",
        atts: {
            "x-bcv": `${bookCode} ${chapterNum}:${verseNum}`,
            "tokenNumber": tokenNumber+"",
            ...atts
        }
    }
}

const localPerfToAlignedPerfFormat = {
    startDocument: [
        {
            description: "setup",
            test: () => true,
            action: ({ workspace, context }) => {
                workspace.chapter = null;
                workspace.verses = null;
                workspace.tokenInt = 0;
                workspace.currentOccurrences = {};
                return true;
            }
        },
    ],
    startSequence: [
        {
            description: "add informations from source usfm and target usfm",
            test: ({ context }) => context.sequences[0].type === 'main',
            action: ({ context, workspace, output }) => {
                output.perf.sequences[context.sequences[0].id] = {
                    type: context.sequences[0].type,
                    blocks: []
                }
                workspace.outputSequence = output.perf.sequences[context.sequences[0].id];
                if (context.sequences[0].type === 'main') {
                    output.perf.main_sequence_id = context.sequences[0].id;
                }
            }
        },
    ],
    text: [
        {
            description: "add-to-text",
            test: () => true,
            action: ({ config, context, workspace }) => {
                try {
                    const text = context.sequences[0].element.text;
                    const words = xre.match(text, re, "all");
                    const { chapter, verses } = workspace;
                    if (!verses)
                        return true;

                    const { totalOccurrences, strippedMarkup, greekReport } = config;

                    
                    const alignments = {
                        opened: 0,
                        contentToPush: [],
                        targetWordsToPushAfter: [],
                        greekWords: {}
                    };

                    for(let greekW of greekReport[parseInt(chapter)][parseInt(verses)]) {
                        if(greekW) alignments.greekWords[greekW["word"] + "--" + greekW["occurence"] + "--" + greekW["occurences"]] = greekW;
                    }

                    for (const word of words) {
                        const isWord = xre.match(word, lexingRegexes[0][2], "all");
                        if (!isWord.length) {
                            let objectBefore = workspace.outputContentStack[0].at(-1);
                            // if word === " " and if there's already a space before, we don't add it
                            if(typeof objectBefore === "string" && objectBefore.slice(-1) === " " && word.trim() === "") {
                                continue;
                            }
                            // if there's a string before, we append the new string
                            if(typeof objectBefore === "string") {
                                let newWord = workspace.outputContentStack[0].pop() + word;
                                workspace.outputContentStack[0].push(newWord);
                            } else {
                                workspace.outputContentStack[0].push(word);
                            }
                            continue;
                        }

                        workspace.currentOccurrences[word] ??= 0;
                        workspace.currentOccurrences[word]++;

                        const strippedKey = (position) => [
                            position, word, workspace.currentOccurrences[word], totalOccurrences[chapter][verses][word],
                        ].join("--");

                        const markup = strippedMarkup[chapter][verses];
                        let skipStartMilestone = false;

                        const after = markup[strippedKey("after")];
                        const before = markup[strippedKey("before")];

                        if (after?.length && !alignments.opened) {
                            after.map( ({ startMilestone }) => {
                                let gw = alignments.greekWords[startMilestone.atts["x-content"] + "--" + startMilestone.atts["x-occurrence"] + "--" + startMilestone.atts["x-occurrences"]];
                                if(gw) {
                                    alignments.contentToPush.push(specialMark(context.document.metadata.document.bookCode, chapter, verses, gw["wordPos"], startMilestone.atts));
                                    delete alignments.greekWords[startMilestone.atts["x-content"] + "--" + startMilestone.atts["x-occurrence"] + "--" + startMilestone.atts["x-occurrences"]];
                                }
                                // else {
                                //     alignments.contentToPush.push(specialMark(context.document.metadata.document.bookCode, chapter, verses, null, startMilestone.atts));
                                // }
                                workspace.tokenInt++;
                                return 0;
                            });
                            skipStartMilestone = true;
                        }
                        
                        before?.forEach(({ payload }) => {
                            if (payload.type !== "start_milestone") {
                                alignments.targetWordsToPushAfter.push(payload);
                            }
                            if (payload.type === "start_milestone" && !skipStartMilestone) {
                                let gwPayload = alignments.greekWords[payload.atts["x-content"] + "--" + payload.atts["x-occurrence"] + "--" + payload.atts["x-occurrences"]];
                                if(gwPayload) {
                                    alignments.contentToPush.push(specialMark(context.document.metadata.document.bookCode, chapter, verses, gwPayload["wordPos"], payload.atts));
                                    delete alignments.greekWords[payload.atts["x-content"] + "--" + payload.atts["x-occurrence"] + "--" + payload.atts["x-occurrences"]];
                                }
                                // else {
                                //     alignments.contentToPush.push(specialMark(context.document.metadata.document.bookCode, chapter, verses, null, payload.atts));
                                // }
                                alignments.opened += 1;
                                workspace.tokenInt += 1;
                            }
                        });

                        after?.forEach(({ payload }) => {
                            // if there is two 'end_milestone' one after another
                            // that means we shall skip the second one (it adds no additionnal informations for the content)
                            // algorithmically a single 'end_milestone' closes all 'start_milestones' before
                            if (payload.type === "end_milestone" && alignments.contentToPush.length > 0 && alignments.targetWordsToPushAfter.length > 0) {
                                alignments.opened = 0;
                                alignments.contentToPush.push(...alignments.targetWordsToPushAfter);
                                workspace.outputContentStack[0].push(alignWrapper(alignments.contentToPush));
                                alignments.contentToPush = [];
                                alignments.targetWordsToPushAfter = [];
                            }
                        });
                        
                        if (!before?.length) {
                            // if there's already a string before, we append the new word to the string
                            if(typeof workspace.outputContentStack[0].at(-1) === "string") {
                                let newWord = workspace.outputContentStack[0].pop() + word;
                                workspace.outputContentStack[0].push(newWord);
                            } else { // otherwise we simply add the word to the stack
                                workspace.outputContentStack[0].push(word);
                            }
                        }
                    }
                    if(alignments.greekWords.length > 0) {
                        console.log("there's still greek words unaligned to push !!");
                        console.log("alignments.greekWords ==",alignments.greekWords)
                    }
                    return false;
                } catch (err) {
                    console.error(err);
                    throw err;
                }
            }
        },
    ],
    mark: [
        {
            description: "mark-chapters",
            test: ({ context }) => context.sequences[0].element.subType === "chapter",
            action: (
                { context, workspace }
            ) => {
                const element = context.sequences[0].element;
                workspace.chapter = element.atts["number"];
                workspace.verses = 0;
                return true;
            }
        },
        {
            description: "mark-verses",
            test: ({ context }) => context.sequences[0].element.subType === "verses",
            action: (
                { context, workspace }
            ) => {
                const element = context.sequences[0].element;
                workspace.verses = element.atts["number"];
                workspace.tokenInt = 1;
                workspace.currentOccurrences = {
                    something: "something"
                };
                return true;
            }
        },
    ]
};

const perfToAlignedPerfFormatCode = function ({ perf, verseWords: totalOccurrences, stripped: strippedMarkup, greekReport }) {
    const cl = new PerfRenderFromJson({
        srcJson: perf,
        actions: mergeActions(
            [localPerfToAlignedPerfFormat, render.perfToPerf.renderActions.identityActions]
        )
    });
    const output = {};
    cl.renderDocument({
        docId: "",
        config: {
            totalOccurrences,
            strippedMarkup,
            greekReport
        },
        output
    });
    return { perf: output.perf }; // identityActions currently put PERF directly in output
}

const perfToAlignedPerfFormat = {
    name: "perfToAlignedPerfFormat",
    type: "Transform",
    description: "PERF=>PERF adds report to verses",
    inputs: [
        {
            name: "perf",
            type: "json",
            source: ""
        },
        {
            name: "stripped",
            type: "json",
            source: ""
        },
        {
            name: "verseWords",
            type: "json",
            source: ""
        },
        {
            name: "greekReport",
            type: "json",
            source: ""
        }
    ],
    outputs: [
        {
            name: "perf",
            type: "json"
        },
    ],
    code: perfToAlignedPerfFormatCode
};
export default perfToAlignedPerfFormat;


