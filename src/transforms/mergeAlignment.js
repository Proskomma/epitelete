import { ProskommaRenderFromJson, transforms, mergeActions } from 'proskomma-json-tools';
import xre from "xregexp";

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

const endMilestone = {
    "type": "end_milestone",
    "subType": "usfm:zaln"
}

const localMergeAlignmentActions = {
    startDocument: [
        {
            description: "setup",
            test: () => true,
            action: ({ workspace }) => {
                workspace.chapter = null;
                workspace.verses = null;
                workspace.currentOccurrences = {};
                return true;
            }
        },
    ],
    text: [
        {
            description: "add-to-text",
            test: () => true,
            action: (
                { config, context, workspace, output }
            ) => {
                try {
                    const text = context.sequences[0].element.text;
                    const words = xre.match(text, re, "all");
                    const { chapter, verses } = workspace;
                    if (!verses)
                        return true;

                    const { totalOccurrences, strippedAlignment } = config;

                    const alignments = {
                        opened: null
                    };
                    
                    const addWrappers = ({ subtype, content = [], atts = {} }) => {
                        return {
                          type: "wrapper",
                          subtype,
                          content,
                          atts
                        }
                    }

                    for (const word of words) {
                        
                        const isWord = xre.match(word, lexingRegexes[0][2], "all");
                        if (!isWord.length) {
                            workspace.outputContentStack[0].push(word);
                            continue;
                        }

                        workspace.currentOccurrences[word] ??= 0;
                        workspace.currentOccurrences[word]++;

                        const strippedKey = (position) => [
                            position, word, workspace.currentOccurrences[word], totalOccurrences[chapter][verses][word],
                        ].join("--");

                        const markup = strippedAlignment[chapter][verses];
                        let skipStartMilestone = false;

                        const after = markup[strippedKey("after")];
                        const before = markup[strippedKey("before")];

                        if (after?.length && !alignments.opened) {
                            after.map( ({ startMilestone }) => workspace.outputContentStack[0].push(startMilestone));
                            skipStartMilestone = true;
                        }

                        //TODO: Count number of opened alignments, to close them when there is a modified/new word in the current iteration.
                        before?.forEach(({ payload }) =>{
                            if (payload.type !== "start_milestone") {
                                workspace.outputContentStack[0].push(payload)
                            }
                            if (payload.type === "start_milestone" && !skipStartMilestone) {
                                workspace.outputContentStack[0].push(payload);
                                alignments.opened = true;
                            }
                        })

                        //TODO: Decrease number of opened alignments as they are being pushed
                        after?.forEach(({ payload }) => {
                            alignments.opened = false;
                            workspace.outputContentStack[0].push(payload)
                        });

                        //TODO: Add as many endMilestones as there are opened in alignments.opened, and set the later to 0.
                        if (!before?.length) {
                            console.log(`pushing unaligned word: ${word}`);
                            if (alignments.opened) {
                                workspace.outputContentStack[0].push(endMilestone);
                                alignments.opened = false;
                            }
                            workspace.outputContentStack[0].push(addWrappers({ subtype:"usfm:w", content:[word] }));
                        }

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
                { config, context, workspace, output }
            ) => {
                const element = context.sequences[0].element;
                workspace.chapter = element.atts["number"];
                workspace.verses = 0;
                return true;
            }
        }, {
            description: "mark-verses",
            test: ({ context }) => context.sequences[0].element.subType === "verses",
            action: (
                { config, context, workspace, output }
            ) => {
                const element = context.sequences[0].element;
                workspace.verses = element.atts["number"];
                workspace.currentOccurrences = {};
                return true;
            }
        },
    ]
};

const mergeAlignmentCode = function ({ perf, verseWords: totalOccurrences, strippedAlignment }) {
    const cl = new ProskommaRenderFromJson({
        srcJson: perf,
        actions: mergeActions(
            [localMergeAlignmentActions, transforms.identityActions]
        )
    });
    const output = {};
    cl.renderDocument({
        docId: "",
        config: {
            totalOccurrences,
            strippedAlignment
        },
        output
    });
    return { perf: output.perf }; // identityActions currently put PERF directly in output
}

const mergeAlignment = {
    name: "mergeAlignment",
    type: "Transform",
    description: "PERF=>PERF adds report to verses",
    inputs: [
        {
            name: "perf",
            type: "json",
            source: ""
        }, {
            name: "strippedAlignment",
            type: "json",
            source: ""
        }, {
            name: "verseWords",
            type: "json",
            source: ""
        },
    ],
    outputs: [
        {
            name: "perf",
            type: "json"
        },
    ],
    code: mergeAlignmentCode
};
export default mergeAlignment;