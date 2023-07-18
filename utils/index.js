export function extractSequence(perf, id = null) {
  const sequenceId = id ?? perf.main_sequence_id;
  const sequence = perf.sequences[sequenceId]
  return [sequenceId, sequence]
}