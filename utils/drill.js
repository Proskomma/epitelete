const { spawn } = require("node:child_process");
const path = require("path");

try {
  const [, , customTarget] = process.argv;
  const DEFAULT_TARGET = "*";
  const target = customTarget || DEFAULT_TARGET;
  const targetPath = path.resolve(__dirname, "..", "test", "code", `${target}.cjs`);
  const command = spawn(
    "tape",
    [
      `-r @babel/register`,
      targetPath,
    ],
    { shell: true }
  );
  console.log(
    "\x1b[32m",
    `✏️ ~ Executing command: ${command.spawnargs.at(-1)}...`,
    "\x1b[0m"
  );
  console.log(
    "\x1b[32m",
    `⚙️ ~ Running tests on: "${target}"...`,
    "\x1b[0m"
  );
  command.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
  command.stdout.on("data", (output) => {
    console.log(output.toString());
  });
  command.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
} catch (error) {
  console.error(error);
}