const nnbsp = "&#8239;";

const bgHtml = bg => `    <div class="graft ${bg.subType}${bg.subType === "heading" ? " " + bg.firstBlockScope: ''}" data-graftType="${bg.subType}" data-target="${bg.target}" data-nBlocks="${bg.nBlocks}" data-previewText="${previewText(bg)}"></div>`;

const blockHtml = b => `    <div class="block ${b.subType}">${b.content.map(bc => blockItemHtml(bc)).join('')}</div>`;

const blockItemHtml = bi => (typeof bi === 'string') ? bi : blockItemObjectHtml(bi);

const blockItemObjectHtml = bi => bi.type === 'graft' ? inlineGraftHtml(bi) : cvObjectHtml(bi);

const inlineGraftHtml = ig => `<span class="graft ${ig.subType}" data-graftType="${ig.subType}" data-target="${ig.target}" data-nBlocks="${ig.nBlocks}" data-previewText="${previewText(ig)}"></span>${nnbsp}`;

const cvObjectHtml = bi => `<span class="${bi.type}">${bi.number}</span>`;

const previewText = g => g.subType in previewTextFormats ? previewTextFormats[g.subType](g) : g.previewText;

const previewTextFormats = {
    // xref: () => "†",
    // footnote: () => "*",
    title: g => `TITLE: ${g.previewText}${g.nBlocks > 1 ? ` (${g.nBlocks} paras)`: ''}`,
    introduction: g => `INTRODUCTION: ${g.previewText.split(' ').slice(0, 25).join(' ')} [...] (${g.nBlocks} para${g.nBlocks > 0 ? 's' : ''})`,
};


const perf2html = (perf, sequenceId) => {
    const docSetOb = Object.values(perf.docSets)[0];
    const documentOb = Object.values(docSetOb.documents)[0];
    const sequenceOb = Object.entries(documentOb.sequences).filter(s => s[0] === sequenceId)[0][1];
    return `<div id="sequence" data-sequenceId="${sequenceId}" data-sequenceType="${sequenceOb.type}" class="${sequenceOb.type} ${sequenceOb.type}_sequence">
  <div id="content">
${sequenceOb.blocks.map(b => b.type === 'graft' ? bgHtml(b) : blockHtml(b)).join('\n')}
  </div>
</div>`
}

export default perf2html;
