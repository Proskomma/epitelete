/**
 * 
 * @param {documentPerf} perf 
 */
export const editPerf = (perf) => {
  const sequenceId = perf.main_sequence_id;
  const sequence = {
    ...perf.sequences[sequenceId],
    blocks: perf.sequences[sequenceId].blocks.slice(1)
  }
  return [sequenceId, sequence]
}