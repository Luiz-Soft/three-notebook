export function flatten(nodes) { return nodes.flatMap(n => [n, ...flatten(n.children)]); }
export function dueAt(node, fallback = 14) {
  if (!node.review.enabled) return null;
  const base = node.review.lastReviewedAt || node.completedAt;
  if (!base) return node.reviewRequested ? 0 : null;
  return new Date(base).getTime() + (node.review.intervalDays ?? fallback) * 86400000;
}
export function isDue(node, now = Date.now(), fallback = 14) { const due = dueAt(node, fallback); return due !== null && due <= now; }
export function safeLink(value) { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export function validateTree(input) {
  const data = structuredClone(input); const ids = new Set(); let count = 0;
  if (data.schemaVersion !== 1 || typeof data.id !== 'string' || !data.id || typeof data.title !== 'string' || !Array.isArray(data.topics)) throw Error('Expected schemaVersion 1, id, title, and a topics array.');
  const validDate = d => d == null || (typeof d === 'string' && Number.isFinite(Date.parse(d)));
  function visit(nodes, depth) {
    if (depth > 30) throw Error('Maximum nesting is 30 levels.');
    for (const n of nodes) {
      if (++count > 10000) throw Error('Maximum 10,000 nodes.');
      if (!n || typeof n.id !== 'string' || !n.id || ids.has(n.id)) throw Error('Every node needs a unique nonempty string id.');
      ids.add(n.id);
      if (typeof n.title !== 'string' || !n.title.trim()) throw Error(`Node ${n.id} needs a title.`);
      n.children ??= []; n.problems ??= []; n.notes ??= []; n.status ??= 'unspecified'; n.review ??= {enabled:false, intervalDays:14,lastReviewedAt:null};
      if (!Array.isArray(n.children) || !Array.isArray(n.problems) || !Array.isArray(n.notes)) throw Error(`Invalid arrays on ${n.id}.`);
      if (!['completed','unspecified'].includes(n.status) || !validDate(n.completedAt) || !validDate(n.review.lastReviewedAt)) throw Error(`Invalid status or date on ${n.id}.`);
      if (typeof n.review.enabled !== 'boolean' || !Number.isFinite(n.review.intervalDays) || n.review.intervalDays < 1 || n.review.intervalDays > 3650) throw Error(`Review interval must be 1–3650 days on ${n.id}.`);
      for (const p of n.problems) if (!Number.isInteger(p.id) || typeof p.title !== 'string' || !['primary','alternative'].includes(p.role)) throw Error(`Invalid problem on ${n.id}.`);
      for (const note of n.notes) {
        if (typeof note.text !== 'string') throw Error(`Invalid note on ${n.id}.`);
        note.links ??= [];
        if (!Array.isArray(note.links) || note.links.some(l => typeof l.url !== 'string' || typeof l.label !== 'string')) throw Error(`Invalid note links on ${n.id}.`);
      }
      visit(n.children, depth+1);
    }
  }
  visit(data.topics,0); return data;
}
export function matches(node, query, mode, now) {
  const text = [node.title,node.description,...node.notes.map(n=>n.text),...node.problems.map(p=>`${p.id} ${p.title} ${p.context||''}`)].join(' ').toLowerCase();
  return (!query || text.includes(query.toLowerCase())) && (mode==='all' || (mode==='due' && isDue(node,now)) || (mode==='completed' && node.status==='completed') || (mode==='primary' && node.problems.some(p=>p.role==='primary')) || (mode==='later' && node.later));
}
export function hasMatch(node,q,mode,now) { return matches(node,q,mode,now) || node.children.some(c=>hasMatch(c,q,mode,now)); }
