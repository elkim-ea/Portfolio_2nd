import {
  mkdirSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");

const functions = ["correction", "conversation", "levelTest"];

const rootDir = process.cwd();
const distDir = join(rootDir, "dist");
const packageDir = join(rootDir, "lambda-packages");

rmSync(packageDir, { recursive: true, force: true });
mkdirSync(packageDir, { recursive: true });

for (const functionName of functions) {
  const workDir = join(packageDir, functionName);
  const zipPath = join(packageDir, `${functionName}.zip`);

  mkdirSync(workDir, { recursive: true });

  copyFileSync(
    join(distDir, `${functionName}.js`),
    join(workDir, `${functionName}.js`),
  );

  const zip = new AdmZip();

  zip.addLocalFile(join(workDir, `${functionName}.js`));

  zip.writeZip(zipPath);

  console.log(`Created ${zipPath}`);
}

console.log("Lambda packages created in lambda-packages/");