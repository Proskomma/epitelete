const test = require("tape");
const path = require("path");
const fse = require("fs-extra");
const {UWProskomma} = require("uw-proskomma");
const Epitelete = require("../../src/index").default;
const _ = require("lodash");

const testGroup = "Check";

const proskomma = new UWProskomma();

const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test_data", "eng_engWEBBE_succinct.json")));
proskomma.loadSuccinctDocSet(succinctJson);


test(
    `test checkPERF shows no warnings (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});
        const bookCode = "LUK";
        await epitelete.readPerf(bookCode);
        const documents = epitelete.getDocuments();
        const sequences = documents[bookCode]?.sequences;
        const mainSequenceId = Object.keys(sequences)[0];
        const mainSequence = sequences[mainSequenceId];
        const originalSequence = _.cloneDeep(mainSequence);
        await epitelete.checkPerfSequence(mainSequence);
        t.deepEqual(mainSequence, originalSequence)
        t.end()
    }
)

test(
    `test checkPERF shows some warnings (${testGroup})`,
    async t => {
        const docSetId = "DBL/eng_engWEBBE";
        const epitelete = new Epitelete({proskomma, docSetId});

        const sequence = {
                type: 'main',
                nBlocks: 3,
                firstBlockScope: 'p',
                previewText: 'Since...',
                selected: true,
                blocks: [
                    {
                        type: 'block',
                        subType: 'p',
                        content: ['', '', {type: 'chapter', number: '1'}, '', {
                            type: 'verses',
                            number: '1'
                        }, 'Since many have undertaken to set in order a narrative concerning those matters which have been fulfilled amongst us, ', {
                            type: 'verses',
                            number: '3'
                        }, 'even as those who from the beginning were eyewitnesses and servants of the word delivered them to us, ', {
                            type: 'verses',
                            number: '3'
                        },
                        ]
                    }
                ]
            }
        ;
        await epitelete.checkPerfSequence(sequence);
        t.deepEqual(sequence.blocks[0], {
                    type: 'block',
                    subType: 'p',
                    content: ['', '', {type: 'chapter', number: '1'}, '', {
                        type: 'verses',
                        number: '1'
                    }, 'Since many have undertaken to set in order a narrative concerning those matters which have been fulfilled amongst us, ', {
                        type: 'verses',
                        number: '3',
                        warnings: ['Verse 3 is out of order, expected 2']
                    }, 'even as those who from the beginning were eyewitnesses and servants of the word delivered them to us, ', {
                        type: 'verses',
                        number: '3',
                        warnings: ['Verse 3 is out of order, expected 4']
                    }
                ]
            }
        );
        t.end();
    }
)