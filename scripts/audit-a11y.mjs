import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_URL = process.env.STUDIA_URL ?? 'http://localhost:5175';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9334;
const PAGE_LOAD_MS = 5000;
const UI_SETTLE_MS = 900;
const CHROME_START_ATTEMPTS = 40;
const CHROME_RETRY_MS = 250;
const CLEANUP_RETRIES = 5;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const THEMES = ['dark', 'light'];
const TABS = ['Modèle', 'Réglages', 'Projets', 'Fichiers'];

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startChrome(profileDir) {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  for (let attempt = 0; attempt < CHROME_START_ATTEMPTS; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return { chrome, url: page.webSocketDebuggerUrl };
    } catch {}
    await sleep(CHROME_RETRY_MS);
  }
  chrome.kill();
  throw new Error(`Chrome introuvable ou bloqué (${CHROME}). Indiquer son chemin avec CHROME_PATH.`);
}

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let lastId = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      lastId++;
      pending.set(lastId, resolve);
      ws.send(JSON.stringify({ id: lastId, method, params }));
    });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result;
  return { ws, send, evaluate };
}

const clickByText = (text, selector) =>
  `(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.trim().startsWith(${JSON.stringify(text)})); el?.click(); return Boolean(el); })()`;

const runAxe = `axe.run(document, { runOnly: { type: 'tag', values: ${JSON.stringify(WCAG_TAGS)} } }).then((r) =>
  r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) })))`;

async function auditState(page, label, violations) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(runAxe);
  for (const v of result.result.value ?? []) violations.push({ ...v, state: label });
}

async function audit(page) {
  const violations = [];
  await page.send('Page.enable');
  for (const theme of THEMES) {
    await page.send('Page.navigate', { url: APP_URL });
    await sleep(PAGE_LOAD_MS);
    await page.evaluate(`localStorage.setItem('studia-theme', '${theme}')`);
    await page.send('Page.reload');
    await sleep(PAGE_LOAD_MS);
    for (const tab of TABS) {
      await page.evaluate(clickByText(tab, '.ant-tabs-tab'));
      await sleep(UI_SETTLE_MS);
      await auditState(page, `thème ${theme}, onglet ${tab}`, violations);
    }
    await page.evaluate(`document.querySelector('button[aria-label="Aide"]')?.click()`);
    await sleep(UI_SETTLE_MS);
    await auditState(page, `thème ${theme}, fenêtre d'aide`, violations);
  }
  return violations;
}

const profileDir = mkdtempSync(join(tmpdir(), 'studia-a11y-'));
const { chrome, url } = await startChrome(profileDir);
let violations;
try {
  const page = await connect(url);
  violations = await audit(page);
  page.ws.close();
} finally {
  await new Promise((resolve) => {
    chrome.once('exit', resolve);
    chrome.kill();
  });
  rmSync(profileDir, { recursive: true, force: true, maxRetries: CLEANUP_RETRIES });
}

const unique = new Map();
for (const v of violations) {
  const key = `${v.id}|${v.targets.join(',')}`;
  if (!unique.has(key)) unique.set(key, { ...v, states: [v.state] });
  else unique.get(key).states.push(v.state);
}

if (!unique.size) {
  console.log(`Accessibilité : aucune violation WCAG détectée (${WCAG_TAGS.join(', ')}).`);
  process.exit(0);
}
for (const v of unique.values()) {
  console.log(`[${v.impact}] ${v.id} : ${v.help}`);
  console.log(`    éléments : ${v.targets.slice(0, 3).join(' | ')}`);
  console.log(`    états : ${v.states.join(' ; ')}`);
}
console.log(`\n${unique.size} violation(s) d'accessibilité.`);
process.exit(1);
