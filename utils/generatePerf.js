const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
const Epitelete = require("../src/index").default;

const args = process.argv.slice(5);

const pk = new Proskomma([
  {
      name: "org",
      type: "string",
      regex: "^[^\\s]+$"
  },
  {
      name: "lang",
      type: "string",
      regex: "^[^\\s]+$"
  },
  {
      name: "abbr",
      type: "string",
      regex: "^[A-za-z0-9_-]+$"
  }
]);

console.log("Loading source to proskomma...");
const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test", "test_data", "fra_lsg_succinct.json")));
const docSetId = "eBible/fra_fraLSG";
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test", "test_data", "eng_engWEBBE_succinct.json")));
// const docSetId = "DBL/eng_engWEBBE";
pk.loadSuccinctDocSet(succinctJson);

export const generatePerf = async () => {
  const instance = new Epitelete({proskomma: pk, docSetId});
  const bookCode = (args?.[0] || "psa").toUpperCase();
  if (! args[0]) 
    console.log("\u001B[33m", `No book code provided, generating perf for ${bookCode} instead...`, "\u001B[0m")
   else 
    console.log(`Loading ${bookCode} document...`);
  
  const perf = await instance.readPerf(bookCode);
  console.log("Generating json file...");
  const dir = path.resolve(__dirname, "..", "test", "test_data", "generated");
  if (! fse.pathExistsSync(dir)) 
    fse.mkdirSync(dir);
  
  const safeDocSetId = instance.docSetId.replace("/", "-");
  const fileName = `${bookCode}-${safeDocSetId}-perf_v${perf.schema.structure_version}.json`;
  const filePath = path.resolve(dir, fileName);
  fse.writeJsonSync(filePath, perf, {spaces: 2});
  console.log("\u001B[32m", `✔ JSON file generated for ${bookCode} at ${filePath}`, "\u001B[0m");
};

if (process?.argv?.length) generatePerf();
