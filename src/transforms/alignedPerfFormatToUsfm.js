import {PerfRenderFromJson} from 'proskomma-json-tools';

const oneifyTag = t => {
    if (['toc', 'toca', 'mt', 'imt', 's', 'ms', 'mte', 'sd'].includes(t)) {
        return t + '1';
    }
    return t;
}

const buildMilestone = (atts, type) => {
    let str=`\\${type}-s |`;
    for (let [key, value] of Object.entries(atts)) {
        if(key === "x-bcv" || key === "tokenNumber") continue;
        if(key === "x-morph" && typeof value !== "string") {
            str = str + oneifyTag(key) + "=\"" + value.join(',') + "\" ";
        } else {
            str = str + oneifyTag(key) + "=\"" + value + "\" ";
        }
    };
    return str + "\\*";
}

const buildEndWrapper = (atts, type, isnested = false) => {
    let str="|";
    for (let [key, value] of Object.entries(atts)) {
        str = str + oneifyTag(key) + "=\"" + value + "\" ";
    };
    str = str + "\\";

    // if it's nested, we simply add a "+" sign before the type
    if(isnested) {
        str = str + "+";
    }
    return str + type + "*";
}

const localAlignedPerfFormatToUsfm = {
    startDocument: [
        {
            description: "Set up environment",
            test: () => true,
            action: ({context, workspace, output}) => {
                workspace.usfmBits = [''];
                workspace.nestedWrapper = 0;
                workspace.sourceWordsUsfmBits = [];
                workspace.targetWordsUsfmBits = [];
                workspace.inAlignWrap = false;
                workspace.inTargetWordAlignWrap = false;
                output.selectors = context.document.metadata.translation.selectors
                for (
                    let [key, value] of
                    Object.entries(context.document.metadata.document)
                        .filter(kv => !['tags', 'properties', 'bookCode', 'cl'].includes(kv[0]))
                    ) {
                    workspace.usfmBits.push(`\\${oneifyTag(key)} ${value}\n`);
                };
            }
        },
    ],
    blockGraft: [
        {
            description: "Follow block grafts",
            test: ({context}) => ['title', 'heading', 'introduction'].includes(context.sequences[0].block.subType),
            action: (environment) => {
                let contextSequence = environment.context.sequences[0];
                let chapterValue = environment.config.report[contextSequence.block.blockN.toString()];
                const target = contextSequence.block.target;
                if(chapterValue && contextSequence.type === "main") {
                    environment.workspace.usfmBits.push(`\n\\c ${chapterValue}\n`);
                }
                if (target) {
                    environment.context.renderer.renderSequenceId(environment, target);
                }
            }
        }
    ],
    inlineGraft: [
        {
            description: "Follow inline grafts",
            test: () => true,
            action: (environment) => {
                const target = environment.context.sequences[0].element.target;
                if (target) {
                    environment.context.renderer.renderSequenceId(environment, target);
                }
            }
        }
    ],
    startParagraph: [
        {
            description: "Output footnote paragraph tag (footnote)",
            test: ({context}) => (context.sequences[0].block.subType === "usfm:f" && context.sequences[0].type === "footnote")
            || (context.sequences[0].block.subType === "usfm:x" && context.sequences[0].type === "xref"),
            action: ({context, workspace, config}) => {
                workspace.nestedWrapper = 0;
                let contextSequence = context.sequences[0];
                workspace.usfmBits.push(`\\${oneifyTag(contextSequence.block.subType.split(':')[1])} `);
            }
        },
        {
            description: "Output footnote note_caller tag (footnote)",
            test: ({context}) => context.sequences[0].block.subType === "usfm:f" || context.sequences[0].block.subType === "usfm:x",
            action: ({context, workspace, config}) => {
                workspace.nestedWrapper = 0;
            }
        },
        {
            description: "Output paragraph tag (main)",
            test: () => true,
            action: ({context, workspace, config}) => {
                workspace.nestedWrapper = 0;
                let contextSequence = context.sequences[0];
                let chapterValue = config.report[contextSequence.block.blockN.toString()];
                if(chapterValue && contextSequence.type === "main") {
                    workspace.usfmBits.push(`\n\\c ${chapterValue}\n`);
                }
                workspace.usfmBits.push(`\n\\${oneifyTag(contextSequence.block.subType.split(':')[1])}\n`);
            }
        }
    ],
    endParagraph: [
        {
            description: "Output footnote paragraph tag (footnote)",
            test: ({context}) => (context.sequences[0].block.subType === "usfm:f" && context.sequences[0].type === "footnote")
            || (context.sequences[0].block.subType === "usfm:x" && context.sequences[0].type === "xref"),
            action: ({context, workspace, config}) => {
                let contextSequence = context.sequences[0];
                workspace.usfmBits.push(`\\${oneifyTag(contextSequence.block.subType.split(':')[1])}*`);
            }
        },
        {
            description: "Output footnote note_caller tag (footnote)",
            test: ({context}) => context.sequences[0].block.subType === "usfm:f" || context.sequences[0].block.subType === "usfm:x",
            action: ({context, workspace, config}) => {
            }
        },
        {
            description: "Output nl",
            test: () => true,
            action: ({workspace}) => {
                workspace.usfmBits.push(`\n`);
            }
        }
    ],
    mark: [
        {
            description: "Output chapter or verses",
            test: ({ context, workspace }) => workspace.inAlignWrap && context.sequences[0].element.subType === "pk:alignedTo",
            action: ({context, workspace}) => {
                const element = context.sequences[0].element;
                workspace.sourceWordsUsfmBits.push(
                    buildMilestone(
                        element.atts,
                        "zaln"
                    )
                );
            }
        },
        {
            description: "Output chapter or verses",
            test: ({ context }) => context.sequences[0].element.subType !== "pk:alignedTo",
            action: ({ context, workspace }) => {
                const element = context.sequences[0].element;
                if (element.subType === 'verses') {
                    workspace.usfmBits.push(`\n\\v ${element.atts['number']}\n`);
                }
            }
        },
    ],
    endSequence: [
        {
            description: "Output \\cl",
            test: ({context}) => context.document.metadata.document.cl && context.sequences[0].type === "title",
            action: ({context, workspace}) => {
                workspace.usfmBits.push(`\n\\cl ${context.document.metadata.document.cl}\n`);
            }
        },
    ],
    text: [
        {
            description: "Output text",
            test: () => true,
            action: ({context, workspace}) => {
                if(workspace.inAlignWrap && workspace.inTargetWordAlignWrap) {
                    workspace.targetWordsUsfmBits.push(`\\w ${context.sequences[0].element.text}`);
                } else {
                    workspace.usfmBits.push(context.sequences[0].element.text);
                }
            }
        },
    ],
    startWrapper: [
        {
            description: "store the information that we're in a pk:align wrapper",
            test: ({ workspace, context }) => !workspace.inAlignWrap && context.sequences[0].element.subType === "pk:align",
            action: ({ workspace }) => {
                workspace.inAlignWrap = true;
                workspace.sourceWordsUsfmBits = [];
                workspace.targetWordsUsfmBits = [];
                return true;
            }
        },
        {
            description: "Output start tag",
            test: ({ context }) => context.sequences[0].element.subType !== "pk:align",
            action: ({workspace, context}) => {
                if(!workspace.inTargetWordAlignWrap && workspace.inAlignWrap && context.sequences[0].element.subType === "usfm:w") {
                    workspace.inTargetWordAlignWrap = true;
                    return true;
                }
                let contextSequence = context.sequences[0];
                // handle nested wrappers : https://ubsicap.github.io/usfm/characters/nesting.html
                let tag = oneifyTag(contextSequence.element.subType.split(':')[1])
                if(workspace.nestedWrapper > 0) {
                    workspace.usfmBits.push(`\\+${tag} `);
                } else {
                    workspace.usfmBits.push(`\\${tag} `);
                }
                workspace.nestedWrapper += 1;
            }
        },
    ],
    endWrapper: [
        {
            description: "process the words wrappers to push them in the usfm",
            test: ({ context, workspace }) => workspace.inAlignWrap && workspace.inTargetWordAlignWrap && context.sequences[0].element.subType === "usfm:w",
            action: ({ workspace, context }) => {
                workspace.inTargetWordAlignWrap = false;
                workspace.targetWordsUsfmBits.push(
                    buildEndWrapper(
                        context.sequences[0].element.atts,
                        oneifyTag(context.sequences[0].element.subType.split(':')[1])
                    )
                );
            }
        },
        {
            description: "push all the milestones and wrapper stuff",
            test: ({ workspace, context }) => workspace.inAlignWrap && context.sequences[0].element.subType === "pk:align",
            action: ({ workspace }) => {
                // flush all the new milestones in the output
                workspace.usfmBits.push(...workspace.sourceWordsUsfmBits);
                
                // flush all the wrappers in the output
                workspace.usfmBits.push(...workspace.targetWordsUsfmBits);
                
                // we close all the opened milestones
                for (let i = 0; i < workspace.sourceWordsUsfmBits.length; i++)
                    workspace.usfmBits.push("\\zaln-e\\*");
                
                // finally cleaning the workspace
                workspace.sourceWordsUsfmBits = [];
                workspace.targetWordsUsfmBits = [];
                workspace.inAlignWrap = false;
            }
        },
        {
            description: "Output end tag",
            test: ({ context }) => !['fr', 'fq','fqa','fk','fl','fw','fp', 'ft', 'xo', 'xk', 'xq', 'xt', 'xta']
                                    .includes(context.sequences[0].element.subType.split(':')[1]),
            action: ({workspace, context}) => {
                workspace.nestedWrapper -= 1;
                let contextSequence = context.sequences[0];
                let subType = contextSequence.element.subType.split(':')[1];
                let isNested = workspace.nestedWrapper > 0;
                if(subType === "w") {
                    let newEndW = buildEndWrapper(contextSequence.element.atts, oneifyTag(subType), isNested);
                    workspace.usfmBits.push(newEndW);
                } else {
                    // handle nested wrappers : https://ubsicap.github.io/usfm/characters/nesting.html
                    if(isNested) {
                        workspace.usfmBits.push(`\\+${oneifyTag(contextSequence.element.subType.split(':')[1])}*`);
                    } else {
                        workspace.usfmBits.push(`\\${oneifyTag(contextSequence.element.subType.split(':')[1])}*`);
                    }
                }
            }
        },
        {
            description: "Do NOT output end tag",
            test: () => true,
            action: ({workspace}) => {
                workspace.nestedWrapper -= 1;
            }
        }
    ],
    endDocument: [
        {
            description: "Build output",
            test: () => true,
            action: ({workspace, output}) => {
                output.usfm = workspace.usfmBits.join('').replace(/(\s*)\n(\s*)/gm, "\n");
            }
        },
    ]
};

const alignedPerfFormatToUsfmCode = function ({perf, report}) {
    const cl = new PerfRenderFromJson({srcJson: perf, actions: localAlignedPerfFormatToUsfm});
    const output = {};
    cl.renderDocument({docId: "", config: { report }, output});
    return {usfm: output.usfm, selectors: output.selectors};
}

const alignedPerfFormatToUsfm = {
    name: "alignedPerfFormatToUsfm",
    type: "Transform",
    description: "PERF=>USFM",
    inputs: [
        {
            name: "perf",
            type: "json",
            source: ""
        },
        {
            name: "report",
            type: "json",
            source: ""
        },
    ],
    outputs: [
        {
            name: "usfm",
            type: "text",
        },
        {
            name: "selectors",
            type: "json"
        }
    ],
    code: alignedPerfFormatToUsfmCode
}
export default alignedPerfFormatToUsfm;
