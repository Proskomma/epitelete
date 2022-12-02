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
const usfm = fse.readFileSync(path.resolve(path.join(__dirname, "..", "test", "test_data", "sam_empty_test.usfm"))).toString();
const docSetId = "eBible/fra_fraLSG";
// const succinctJson = fse.readJsonSync(path.resolve(path.join(__dirname, "..", "test", "test_data", "eng_engWEBBE_succinct.json")));
// const docSetId = "DBL/eng_engWEBBE";
pk.importDocument({ org: "eBible", lang: "fra", abbr: "fraLSG" }, "usfm", usfm);

export const generateUsfm = async () => {
  const instance = new Epitelete({proskomma: pk, docSetId});
  const bookCode = (args?.[0] || "psa").toUpperCase();
  if (!args[0])
    console.log("\u001B[33m", `No book code provided, generating USFM for ${bookCode} instead...`, "\u001B[0m")
   else 
    console.log(`Loading ${bookCode} document...`);
  
  const usfm = await instance.readUsfm(bookCode);
  console.log("Generating USFM file...");
  const dir = path.resolve(__dirname, "..", "test", "test_data", "generated_empty");
  if (! fse.pathExistsSync(dir)) 
    fse.mkdirSync(dir);
  
  const safeDocSetId = instance.docSetId.replace("/", "-");
  const fileName = `${bookCode}-${safeDocSetId}_OLDMETHOD.usfm`;
  const filePath = path.resolve(dir, fileName);
  fse.writeFileSync(filePath, usfm, {encoding: 'utf8'});
  console.log("\u001B[32m", `✔ USFM file generated for ${bookCode} at ${filePath}`, "\u001B[0m");
};

if (process?.argv?.length) generateUsfm();
