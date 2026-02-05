import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") return false;
    throw err;
  }
}

async function copyDirContents(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const src = path.join(srcDir, entry.name);
      const dest = path.join(destDir, entry.name);
      await cp(src, dest, { recursive: true });
    })
  );
}

async function main() {
  const root = process.cwd();
  const publicDir = path.join(root, "public");
  const functionsDir = path.join(root, "functions");
  const distDir = path.join(root, "dist");

  // Cloudflare Pages output directory (often already configured as `dist` in Vite projects).
  // We generate a deployable artifact there:
  // - `public/*` -> `dist/*` (static assets + Remix client build under `dist/build`)
  // - `functions/*` -> `dist/functions/*` (Pages Functions for SSR)
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  if (!(await pathExists(publicDir))) {
    throw new Error(`Missing public directory: ${publicDir}`);
  }
  await copyDirContents(publicDir, distDir);

  if (await pathExists(functionsDir)) {
    await cp(functionsDir, path.join(distDir, "functions"), { recursive: true });
  } else {
    console.warn(
      "[prepare-pages-output] No functions/ directory found. Did `remix build` run?"
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

