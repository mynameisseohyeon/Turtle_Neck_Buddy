import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const distDir = path.join(projectRoot, "dist");
const manifestPath = path.join(distDir, "manifest.json");
const releaseDir = path.join(projectRoot, "releases");
const archiveName = `turtle-neck-buddy-v${packageJson.version}-chrome-web-store.zip`;
const archivePath = path.join(releaseDir, archiveName);

if (!existsSync(manifestPath)) {
  throw new Error("dist/manifest.json was not found. Run `pnpm run build` before packaging.");
}

mkdirSync(releaseDir, { recursive: true });

if (existsSync(archivePath)) {
  rmSync(archivePath);
}

execFileSync("zip", ["-r", "-q", archivePath, ".", "-x", "*.DS_Store", "*.gitkeep"], {
  cwd: distDir,
  stdio: "inherit"
});

const archiveSizeKb = Math.round(statSync(archivePath).size / 1024);

console.log(`Created ${path.relative(projectRoot, archivePath)} (${archiveSizeKb} KB)`);
console.log("ZIP root is dist/, so manifest.json is placed at the archive root.");
