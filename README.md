# Algorithm Atlas

An expandable algorithm study map built from the supplied **algorithm-taxonomy-styled (1).docx**. Vue 3 Composition API, Pinia, Vite, and SCSS with BEM naming. The text-first revision uses inline notes and per-branch add controls. Entirely client-side: no API, database, account, or server secret.

## Run locally

Use Node 22 LTS or another version supported by the package's engines field.

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## Deploy to Vercel

1. Extract this ZIP and upload the **contents of `algorithm-atlas/`** to your Git repository. `package.json` must be at the repository root (or set Vercel's Root Directory to this folder).
2. Import the repository into Vercel.
3. Use the Vite framework preset, build command `npm run build`, and output directory `dist`. These are also in `vercel.json`.
4. Deploy. No environment variables are needed.

Do not upload `node_modules`. The lockfile is included. This package contains source, not a Git repository. No site has been published on your behalf.

## Phone + computer: one shared JSON

The application fetches `public/taxonomy.json` at runtime. After deployment the file is available at `/taxonomy.json` on your app's origin.

**Simplest workflow**

1. Open the deployed app on either device.
2. Choose **JSON & sharing**, paste the deployed app's full `/taxonomy.json` URL, and select **Load shared JSON**.
3. Copy the viewer link and open it on your other device. The link has the form `https://YOUR_APP/?source=ENCODED_JSON_URL`.
4. Make changes on one device. Use **Export JSON** to download the entire current tree, including progress, dates, notes, and reminder settings.
5. Replace `public/taxonomy.json` in your repository with the exported file and redeploy. On the other device, choose **JSON & sharing → Load shared JSON** again.

Alternatively, host the raw JSON on a server that allows browser CORS requests, or import the same JSON file directly on each device. A cloud-drive sharing page is usually HTML, not a raw JSON response, and may not allow CORS. Use a direct raw JSON endpoint.

### What sharing does and does not do

- Shared URL loading is **read-only**. It does not PUT changes back to the host.
- Local edits are saved to this browser's `localStorage` and included in JSON exports. They do not automatically sync to another device.
- Existing saved work takes precedence when reopening the app, including after redeployment. Reload the shared file explicitly to get changes.
- A new `?source=` URL prompts an existing viewer to load it; it never silently overwrites a saved local tree.
- Loading or importing replaces the whole snapshot; if local edits exist, the app asks before replacement. There is no concurrent editing or automatic merge. Export first and use one device at a time for edits.
- Clearing browser storage removes local changes. Export backups regularly.
- A publicly hosted JSON is readable by anyone with access to that host. Do not put private credentials in it.
- This is a static app with local persistence, not an offline-installed PWA. Initial loading requires the site to be reachable.

## Explore and edit

The interface is a compact monospace text outline, following the source notes. All branches start expanded. Notes start folded into short yellow highlighted previews; click a note preview to expand its full text independently of the branch. Use **Show notes** to hide all note previews while scanning. No note text is removed from the JSON.

Editing controls appear when hovering over a row or focusing it with the keyboard. They remain visible on touchscreens. Problem references and original bold OK dates remain beside their patterns; due reviews use a small bell emoji.

- **+** beside any branch opens an inline child-name text box.
- **📝** opens an inline note text box.
- **⚙** or the pattern title opens editing and review settings.
- **▾ / ▸** beside a pattern folds or unfolds its branch. The separate 📝 disclosure folds or unfolds notes.
- Searching automatically opens matching note text so matches remain readable.
- Emoji markers preserve ✅ OK(date), ⭐ problem assignments, 🔁 repeat, and 🔔 due reviews.

- Collapse/expand branches individually or all at once.
- Search pattern titles, problem numbers/names, descriptions, and notes; ancestors remain visible.
- Filter learned branches, due reviews, primary Top 150 assignments, and later items.
- Read notes and saved links directly in the tree; select a node for reminder controls and additional editing.
- Edit titles and descriptions; add topics, child branches, notes, and problem references.
- Use JSON editing for arbitrary restructuring, removal, note edits, or moving branches. IDs must stay unique and stable.
- Problem references stay beside pattern names. Multiple problems can belong to one pattern. Alternatives remain separate from primary assignments.
- LeetCode links use the numeric problem search, avoiding guessed slugs. The original LC 30 solution URL is preserved exactly.

## Review reminders

Each node has its own `review` object. It governs the node and the problems attached to that node, not its descendants. If you want separate intervals for two questions, put them in separate child nodes.

- Default interval: 14 days. Change it to 1–3650 days in the detail panel.
- Due time = last review timestamp + interval; if never reviewed, use the recorded completion date.
- An undated original REPEAT marker starts due immediately. Original dated repeat markers retain their Repeat badge before the scheduled review becomes due.
- Marking a branch learned starts its timer. **I've reviewed this** restarts it without inferring solved status for any question or child.
- A bell badge and queue count appear once due. Dates recalculate every 30 seconds and on application initialization.
- Reminders are **in-app**, not email, browser push, or background operating-system notifications.
- Existing completion dates are interpreted at UTC midnight for deterministic cross-device scheduling. New reviews use ISO timestamps. Review due dates display in the viewer's local timezone.

## JSON structure

`public/taxonomy.json` is the only source of tree content. There is no tree hardcoded in Vue components. The recursive renderer supports arbitrary topics and branches. `public/taxonomy.schema.json` documents the format; runtime validation is in `src/lib/tree.js`.

A minimal valid file:

```json
{
  "schemaVersion": 1,
  "id": "my-study-map",
  "title": "My Study Map",
  "topics": [
    {
      "id": "prefix-sum",
      "title": "Prefix Sum",
      "children": [
        {
          "id": "prefix-exact-sum",
          "title": "Exact target sum",
          "status": "unspecified",
          "completedAt": null,
          "later": false,
          "reviewRequested": false,
          "review": {
            "enabled": false,
            "intervalDays": 14,
            "lastReviewedAt": null
          },
          "notes": [{"kind": "insight", "text": "Two prefixes with difference K define a subarray.", "links": []}],
          "problems": [{"id": 560, "title": "Subarray Sum Equals K", "role": "alternative", "context": "Additional practice outside this list", "url": "https://leetcode.com/problemset/?search=560"}],
          "children": []
        }
      ]
    }
  ]
}
```

Node fields:

| Field | Meaning |
| --- | --- |
| `id`, `title` | Required stable unique string ID and display name |
| `kind` | Optional `topic` / `pattern` descriptive metadata |
| `description` | Optional free text shown in details |
| `children` | Recursive node array; defaults to `[]` |
| `problems` | Zero or more `{id, title, role, context?, url?}` references |
| `notes` | Zero or more `{text, kind?, links?: [{label, url}]}` entries |
| `status` | `completed` or `unspecified`; unspecified does not imply unlearned |
| `completedAt` | ISO date or timestamp, or null for undated OK |
| `later`, `reviewRequested` | Original postponement / repeat flags |
| `reviewInstruction` | Special instructions, such as repeat in English and Spanish |
| `review` | Enabled boolean, intervalDays number, lastReviewedAt ISO timestamp or null |
| `complementary` | Original ○ marker |
| `sourceText` | Cleaned original source paragraph for traceability |

Unknown metadata is preserved on import/export. Titles and notes render as text, not arbitrary HTML. Only HTTP(S) links are clickable. The importer limits files to 5 MB, 10,000 nodes, and 30 levels; invalid snapshots do not replace current data.

## Conversion fidelity

The supplied document produced **21 topic roots, 348 total topic/pattern nodes, 150 distinct primary problem assignments, 47 explicit completed nodes, and 35 note entries**. Alternative references are additional appearances, not additional primary problems.

`source-paragraphs.json` preserves every source paragraph with text, run formatting, and hyperlinks. The converter repairs wrapped tree connector artifacts, uses indentation for parent/child relationships, separates problem assignments and their context, extracts explicit status/date/repeat/later markers, and attaches indented notes to their branch. Parent OK markers never propagate to descendants. Introductory overview, legend, and closing source notes are retained as document-level metadata.

To reproduce the bundled JSON from the extracted source:

```bash
python3 scripts/convert.py
```

This overwrites `public/taxonomy.json` with the original converted tree, so do not run it over edited data without a backup. Python is only for optional source conversion; the application and Vercel build do not require it.

## Source layout

```text
public/taxonomy.json          Editable study map, loaded at runtime
public/taxonomy.schema.json   JSON data contract
src/App.vue                  Layout, search, sharing/import/export UI
src/components/TreeNode.vue   Recursive collapsible tree
src/components/DetailPanel.vue  Notes, editing, reminders
src/stores/atlas.js           Pinia state and browser persistence
src/lib/tree.js              Validation, search, review date calculations
src/styles.scss              Responsive SCSS, BEM classes
scripts/convert.py           Reproducible document-to-JSON conversion
scripts/source-paragraphs.json  Source text, formatting, and links
tests/tree.test.js           Conversion and data behavior checks
```

## Verification

- Production build passes.
- Ten automated tests cover conversion counts, status scope, saved links, reference titles, date boundaries, ancestor search, invalid imports, extension metadata, JSON round trips, and safe URL rendering.
- Earlier revisions were checked in a desktop browser for expansion, search, note detail, interval updates, marking reviewed, shared-URL reload, and inline add controls.
- This compact revision passes the production build; its live browser preview could not be verified because preview/browser access failed.
- Responsive styles are included; a real mobile-device/browser run was not performed.

Fonts are system fonts; icons use lucide-vue-next. No external font, analytics, or image service is required.
