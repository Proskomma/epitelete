import reports from "./reports";
import filters from "./filters";
import perf2x from "./perf2x";

const wordSearch = reports.wordSearch;
const stripAlignment = filters.stripAlignment;
const mergeAlignment = filters.mergeAlignment;
const perf2usfmPipeline = perf2x.perf2usfmPipeline;

export default {
    wordSearch,
    stripAlignment,
    mergeAlignment,
    perf2usfmPipeline
}