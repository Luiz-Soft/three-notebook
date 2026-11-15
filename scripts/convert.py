"""Reproducible conversion of the supplied DOCX paragraph export to tree JSON."""
import json,re,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
rows=json.load(open(root/'scripts/source-paragraphs.json'))
def clean(s):
 s=re.sub(r'[│]\s*',' ',s)
 return re.sub(r'\s+',' ',s).strip()
def note(p):
 return {'text':clean(p['text']),'kind':'insight' if any(x in p['text'] for x in ['LEARNED','MEMORIZE','Intuition']) else 'note','links':p['links']}
def node(text,id,kind='pattern'):
 raw=clean(text); parts=re.split(r'(?=[★↔]\s*LC\s*\d+)',raw);label=parts[0];problems=[];notes=[]
 for part in parts[1:]:
  m=re.match(r'([★↔])\s*LC\s*(\d+)\s*(?:·\s*)?(.*)',part)
  tail=m[3]; title=re.split(r' → | — ',tail)[0].strip()
  extra=tail[len(title):].strip()
  problems.append({'id':int(m[2]),'title':title if title and not title.startswith('main home:') else '', 'role':'primary' if m[1]=='★' else 'alternative','context':extra})
 date=re.search(r'OK\((\d{2})-(\d{2})-(\d{4})\)',label)
 status='completed' if re.search(r'\bOK\b',label) else 'unspecified'
 completed=f'{date[3]}-{date[2]}-{date[1]}' if date else None
 later='[LATER' in label;repeat='🔁' in label
 label=re.sub(r'OK(?:\([^)]*\))?\s*','',label);label=re.sub(r'\[LATER[^\]]*\]','',label)
 label=re.sub(r'🔁\s*(?:REPEAT(?: IN ENG & ESP)?:\s*)?','',label).replace('○','').strip()
 if ' Note:' in label: label,txt=label.split(' Note:',1);notes.append({'text':txt.strip(),'kind':'note','links':[]})
 label=re.sub(r'^\d+\.\s*','',label)
 return dict(id=id,kind=kind,title=label,description='',status=status,completedAt=completed,later=later,reviewRequested=repeat,reviewInstruction='Repeat in English and Spanish' if 'IN ENG & ESP' in raw else '',review={'intervalDays':14,'lastReviewedAt':None,'enabled':repeat or bool(completed)},complementary='○' in raw,problems=problems,notes=notes,children=[],sourceText=raw)
topics=[];stack={};current=None;last=None
for i,p in enumerate(rows):
 t=p['text']
 if i<17 or i>=399:continue
 if re.match(r'^\d+\. ',t):
  current=node(t,f'topic-{len(topics)+1}','topic');topics.append(current);stack={0:current};last=current;continue
 m=re.search(r'[├└]──\s*',t)
 if m:
  depth=m.start()//4+1;n=node(t[m.end():],f'node-{i:03d}')
  assert depth-1 in stack,(i,t,depth)
  stack[depth-1]['children'].append(n);stack[depth]=n
  stack={k:v for k,v in stack.items() if k<=depth};last=n
 else:
  # Unindented section prose belongs to the topic; indented notes to the preceding branch.
  target=last if t.startswith(('│',' ')) else current
  target['notes'].append(note(p))
def walk(nodes):
 for n in nodes:
  yield n;yield from walk(n['children'])
nodes=list(walk(topics));catalog={p['id']:p['title'] for n in nodes for p in n['problems'] if p['role']=='primary'}
for n in nodes:
 for p in n['problems']:
  if not p['title'] or p['title'].startswith(('main home:', '—')):
   if p['title']:p['context']=p['title']+' '+p['context']
   p['title']=catalog.get(p['id'],f"Problem {p['id']}")
  p['url']=f"https://leetcode.com/problems/{re.sub(r'[^a-z0-9 -]','',p['title'].lower()).replace(' ','-')}/"
  # Numeric URL avoids guessed slugs; resolves to the exact problem via LeetCode's problemset search.
  p['url']=f"https://leetcode.com/problemset/?search={p['id']}"
primary=[p['id'] for n in nodes for p in n['problems'] if p['role']=='primary'];assert len(primary)==150 and len(set(primary))==150
out={'schemaVersion':1,'id':'luiz-algorithm-taxonomy','title':'Algorithm Atlas','subtitle':'A study map for patterns, practice, and recall.','defaultReviewDays':14,'legend':[p['text'] for p in rows[3:11]],'overview':[p['text'] for p in rows[11:17]],'sourceNotes':[p['text'] for p in rows[400:]],'topics':topics}
json.dump(out,open(root/'public/taxonomy.json','w'),ensure_ascii=False,indent=2)
print(len(topics),'topics;',len(nodes),'nodes;',len(primary),'primary problems;',sum(len(n['notes']) for n in nodes),'notes')
