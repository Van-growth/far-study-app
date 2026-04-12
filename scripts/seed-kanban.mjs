#!/usr/bin/env node
/*
 * scripts/seed-kanban.mjs
 * ──────────────────────────────────────────────────────────────
 * Seeds a GitHub ProjectV2 kanban with draft cards from a JSON manifest.
 * Reusable daily — edit `scripts/kanban-cards.json` and rerun.
 *
 * Requirements: Node 18+ (native fetch + top-level await).
 *
 * Env:
 *   GITHUB_TOKEN    PAT with `project` scope (classic) or
 *                   fine-grained "Projects: Read and write"
 *                   GITHUB_PAT is also accepted.
 *   PROJECT_OWNER   GitHub user OR org that owns the project
 *                   (e.g. "Van-growth" for a user project)
 *   PROJECT_NUMBER  Numeric project id from the URL
 *                   (https://github.com/users/X/projects/3 → 3)
 *   CARD_DATE       Optional. Defaults to the JSON manifest's
 *                   "date" field, else today (YYYY-MM-DD local).
 *
 * Flags:
 *   --cards <path>  Path to the cards manifest.
 *                   Default: scripts/kanban-cards.json
 *   --dry-run       Print what would be created without touching
 *                   GitHub. Useful to verify status-option names.
 *
 * JSON manifest schema:
 *   {
 *     "date": "2026-04-12",              // optional
 *     "cards": [
 *       {
 *         "title":  "rolling buffer...",
 *         "label":  "feat",              // feat | fix | refactor | ...
 *         "status": "Done"               // must match a Status option
 *       },
 *       ...
 *     ]
 *   }
 *
 * Behaviour:
 * - Resolves the project under the user FIRST, then the org.
 * - Looks up the "Status" single-select field. Fails fast if missing.
 * - Matches status option names case-insensitively, ignoring emoji/
 *   punctuation (so "✅ Done" in the UI still matches "Done" in JSON).
 * - Idempotent: skips any card whose final title already exists on
 *   the board (draft or issue). Re-run safely.
 * - Title written to the board: "[label] title"
 * - Body written to the board:  "Date: YYYY-MM-DD\nLabel: <label>"
 *
 * Usage:
 *   # Install nothing — uses native fetch.
 *   cd far-study-app
 *   set GITHUB_TOKEN=ghp_xxx
 *   set PROJECT_OWNER=Van-growth
 *   set PROJECT_NUMBER=3
 *   node scripts/seed-kanban.mjs
 *
 *   # Dry run first:
 *   node scripts/seed-kanban.mjs --dry-run
 *
 *   # Custom manifest:
 *   node scripts/seed-kanban.mjs --cards path/to/other.json
 * ──────────────────────────────────────────────────────────────
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const cardsArgIdx = args.indexOf('--cards');
const cardsPath =
  cardsArgIdx >= 0 && args[cardsArgIdx + 1]
    ? path.resolve(args[cardsArgIdx + 1])
    : path.join(__dirname, 'kanban-cards.json');

// ── Env ───────────────────────────────────────────────────────
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const OWNER = process.env.PROJECT_OWNER;
const NUMBER = parseInt(process.env.PROJECT_NUMBER || '', 10);

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

if (!TOKEN) die('GITHUB_TOKEN (or GITHUB_PAT) env var required.');
if (!OWNER) die('PROJECT_OWNER env var required.');
if (!NUMBER || Number.isNaN(NUMBER)) die('PROJECT_NUMBER env var required and must be numeric.');

if (!fs.existsSync(cardsPath)) die(`Cards manifest not found: ${cardsPath}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
} catch (e) {
  die(`Failed to parse ${cardsPath}: ${e.message}`);
}
if (!Array.isArray(manifest.cards)) die('Manifest "cards" must be an array.');
const date = manifest.date || process.env.CARD_DATE || todayStr();

// ── GraphQL helper ────────────────────────────────────────────
// `allowPartialErrors` lets callers tolerate partial failures — useful when
// querying user/org in parallel where one of them might legitimately 404.
async function gql(query, variables = {}, { allowPartialErrors = false } = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'far-study-app-seed-kanban/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    die(`Non-JSON response from GitHub (HTTP ${res.status}):\n${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    die(`HTTP ${res.status} from GitHub: ${JSON.stringify(json, null, 2)}`);
  }
  if (json.errors && !allowPartialErrors) {
    die(`GraphQL errors:\n${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// ── 1. Resolve project + Status field ────────────────────────
// We try the user namespace first, then the organization namespace.
// Querying both in a single operation causes a hard GraphQL error when
// one of them doesn't exist (e.g. no org with that login), so they're
// split into sequential calls with allowPartialErrors so a 404 on one
// side doesn't kill the run.
console.log(`→ Resolving project ${OWNER}#${NUMBER}...`);

const projectFragment = `
  id
  title
  fields(first: 50) {
    nodes {
      __typename
      ... on ProjectV2SingleSelectField {
        id
        name
        options { id name }
      }
    }
  }
  items(first: 100) {
    nodes {
      id
      content {
        __typename
        ... on DraftIssue { title }
        ... on Issue { title }
        ... on PullRequest { title }
      }
    }
  }
`;

const userQuery = `
query($owner: String!, $number: Int!) {
  user(login: $owner) {
    projectV2(number: $number) { ${projectFragment} }
  }
}`;
const orgQuery = `
query($owner: String!, $number: Int!) {
  organization(login: $owner) {
    projectV2(number: $number) { ${projectFragment} }
  }
}`;

let project = null;
// Try user namespace first.
try {
  const userData = await gql(userQuery, { owner: OWNER, number: NUMBER }, { allowPartialErrors: true });
  project = userData?.user?.projectV2 ?? null;
} catch {/* fall through to org */}
// If not found under user, try organization.
if (!project) {
  try {
    const orgData = await gql(orgQuery, { owner: OWNER, number: NUMBER }, { allowPartialErrors: true });
    project = orgData?.organization?.projectV2 ?? null;
  } catch {/* neither — die below */}
}
if (!project) {
  die(
    `Project #${NUMBER} not found under "${OWNER}" (tried user and org). ` +
      `Double-check PROJECT_OWNER and PROJECT_NUMBER.`,
  );
}
console.log(`✓ Project: "${project.title}" (${project.id})`);

const statusField = project.fields.nodes.find(
  (f) => f && f.__typename === 'ProjectV2SingleSelectField' && f.name === 'Status',
);
if (!statusField) {
  die(
    'Project has no "Status" single-select field. ' +
      'Add one in the GitHub Projects UI first (it is the default for new boards).',
  );
}
console.log(`✓ Status field options: ${statusField.options.map((o) => o.name).join(', ')}`);

function resolveOption(name) {
  const target = normalize(name);
  return statusField.options.find((o) => normalize(o.name) === target) || null;
}

const existingTitles = new Set(
  project.items.nodes.map((n) => n.content?.title).filter((t) => typeof t === 'string'),
);
console.log(`✓ Existing items on board: ${existingTitles.size}`);
console.log(`✓ Date for new cards: ${date}`);
console.log(`✓ Manifest: ${cardsPath} (${manifest.cards.length} cards)`);
if (dryRun) console.log('ⓘ DRY RUN — no mutations will be sent.\n');
else console.log('');

// ── 2. Validate all cards before touching GitHub ─────────────
const plan = [];
for (const [i, card] of manifest.cards.entries()) {
  if (!card || typeof card.title !== 'string' || !card.title.trim()) {
    die(`Card #${i} is missing "title".`);
  }
  const label = (card.label || 'feat').trim();
  const title = `[${label}] ${card.title.trim()}`;
  const body = `Date: ${date}\nLabel: ${label}\n\n_Generated by scripts/seed-kanban.mjs_`;

  const statusOption = resolveOption(card.status || '');
  if (!statusOption) {
    die(
      `Card #${i} has unknown status "${card.status}". ` +
        `Available: ${statusField.options.map((o) => o.name).join(', ')}`,
    );
  }
  plan.push({
    index: i,
    title,
    body,
    optionId: statusOption.id,
    optionName: statusOption.name,
    skipExisting: existingTitles.has(title),
  });
}

// ── 3. Execute ────────────────────────────────────────────────
const addDraft = `
mutation($projectId: ID!, $title: String!, $body: String!) {
  addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
    projectItem { id }
  }
}`;

const setStatus = `
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId,
    itemId: $itemId,
    fieldId: $fieldId,
    value: { singleSelectOptionId: $optionId }
  }) {
    projectV2Item { id }
  }
}`;

let created = 0;
let skipped = 0;
let failed = 0;

for (const p of plan) {
  if (p.skipExisting) {
    console.log(`· skip (exists): ${p.title}`);
    skipped++;
    continue;
  }
  if (dryRun) {
    console.log(`+ dry   [${p.optionName}] ${p.title}`);
    created++;
    continue;
  }
  try {
    const addRes = await gql(addDraft, {
      projectId: project.id,
      title: p.title,
      body: p.body,
    });
    const itemId = addRes.addProjectV2DraftIssue.projectItem.id;
    await gql(setStatus, {
      projectId: project.id,
      itemId,
      fieldId: statusField.id,
      optionId: p.optionId,
    });
    console.log(`+ added [${p.optionName}] ${p.title}`);
    created++;
    // Gentle pacing to avoid secondary rate limits.
    await new Promise((r) => setTimeout(r, 150));
  } catch (e) {
    console.error(`✗ failed ${p.title} — ${e.message}`);
    failed++;
  }
}

console.log(
  `\n${dryRun ? '[DRY RUN] ' : ''}Summary: ${created} created, ${skipped} skipped, ${failed} failed`,
);
if (failed > 0) process.exit(2);
