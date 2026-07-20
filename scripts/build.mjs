#!/usr/bin/env node
// Générateur statique du Guide Suprême du Survivant.
// Usage: node scripts/build.mjs [--watch]

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync, watch } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'docs');
const DATA_DIR = join(ROOT, 'data');
const PARTIALS_DIR = join(SRC, 'partials');
const SYNCED_DIRS = ['css', 'js', 'data', 'assets'];

const INCLUDE_RE = /<!--\s*@include:(\S+?)\s*-->/g;
const PAGE_META_RE = /<!--\s*@page\s+([^-]*?)\s*-->/;
const ATTR_RE = /(\w+)="([^"]*)"/g;
const VAR_RE = /\{\{(\w+)\}\}/g;
const DATA_MARKER_RE = /<!--\s*@data\s*-->/;

// fetch()/import() sur file:// sont bloqués par Chrome (CORS sur les schémas locaux) :
// les JSON de data/ sont donc injectés en <script type="application/json"> plutôt que fetchés au runtime.
function buildDataScripts() {
  if (!existsSync(DATA_DIR)) return '';
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((file) => {
      const name = file.replace(/\.json$/, '');
      const raw = readFileSync(join(DATA_DIR, file), 'utf8');
      try {
        JSON.parse(raw);
      } catch (err) {
        console.error(`[build] Erreur: JSON invalide dans data/${file} (${err.message})`);
        process.exit(1);
      }
      return `<script type="application/json" id="data-${name}">${raw.trim()}</script>`;
    })
    .join('\n');
}

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function parsePageMeta(html) {
  const match = html.match(PAGE_META_RE);
  const vars = { title: '', depth: './' };
  if (!match) return vars;
  let attrMatch;
  ATTR_RE.lastIndex = 0;
  while ((attrMatch = ATTR_RE.exec(match[1])) !== null) {
    vars[attrMatch[1]] = attrMatch[2];
  }
  return vars;
}

function resolveIncludes(html, vars, pageFile) {
  return html.replace(INCLUDE_RE, (_, name) => {
    const partialPath = join(PARTIALS_DIR, `${name}.html`);
    if (!existsSync(partialPath)) {
      console.error(`[build] Erreur: partial manquant "${name}" référencé depuis ${relative(ROOT, pageFile)} (attendu: ${relative(ROOT, partialPath)})`);
      process.exit(1);
    }
    const partial = readFileSync(partialPath, 'utf8');
    return applyVars(partial, vars);
  });
}

function applyVars(html, vars) {
  return html.replace(VAR_RE, (_, name) => (name in vars ? vars[name] : ''));
}

function buildPages() {
  const pageFiles = listFilesRecursive(SRC).filter(
    // dirname() plutôt que startsWith(PARTIALS_DIR + '/') : le séparateur en dur
    // ne matche pas les chemins Windows (backslash), ce qui laissait les partials fuiter dans docs/.
    (f) => extname(f) === '.html' && dirname(f) !== PARTIALS_DIR
  );
  const dataScripts = buildDataScripts();
  for (const pageFile of pageFiles) {
    const raw = readFileSync(pageFile, 'utf8');
    const vars = parsePageMeta(raw);
    let html = resolveIncludes(raw, vars, pageFile);
    html = applyVars(html, vars);
    // Retire le commentaire @page, purement instructif pour le build.
    html = html.replace(PAGE_META_RE, '');
    html = html.replace(DATA_MARKER_RE, dataScripts);

    const relPath = relative(SRC, pageFile);
    const outPath = join(OUT, relPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf8');
    console.log(`[build] ${relative(ROOT, pageFile)} -> ${relative(ROOT, outPath)}`);
  }
}

function copyRecursive(src, dest) {
  const st = statSync(src);
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, readFileSync(src));
  }
}

function syncAssets() {
  for (const dirName of SYNCED_DIRS) {
    const src = join(ROOT, dirName);
    if (!existsSync(src)) continue;
    const dest = join(OUT, dirName);
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    copyRecursive(src, dest);
    console.log(`[build] sync ${dirName}/ -> docs/${dirName}/`);
  }
}

function writeNoJekyll() {
  writeFileSync(join(OUT, '.nojekyll'), '');
}

function cleanOutput() {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
}

function build() {
  const start = Date.now();
  cleanOutput();
  buildPages();
  syncAssets();
  writeNoJekyll();
  console.log(`[build] terminé en ${Date.now() - start}ms`);
}

function watchMode() {
  build();
  console.log('[build] mode --watch actif, en attente de modifications...');
  const watched = [SRC, ...SYNCED_DIRS.map((d) => join(ROOT, d))].filter(existsSync);
  let pending = false;
  const trigger = () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      try {
        build();
      } catch (err) {
        console.error('[build] erreur:', err.message);
      }
    }, 100);
  };
  for (const dir of watched) {
    watch(dir, { recursive: true }, trigger);
  }
}

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watchMode();
} else {
  build();
}
