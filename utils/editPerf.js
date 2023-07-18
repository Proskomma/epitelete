import { extractSequence } from "./index"

/**
 * 
 * @param {documentPerf} perf 
 */
export const editPerf = (perf) => {
  const [sequenceId, _sequence] = extractSequence(perf);
  const sequence = {
    ..._sequence,
    blocks: _sequence.blocks.slice(1)
  }
  return [sequenceId, sequence]
}