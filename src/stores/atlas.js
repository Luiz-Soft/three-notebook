import {defineStore} from 'pinia';
import {ref,computed,toRaw} from 'vue';
import {flatten,validateTree,isDue,hasMatch} from '../lib/tree';
const KEY='algorithm-atlas-v1';
export const useAtlas = defineStore('atlas',()=>{
  const showNotes=ref(true);
  const data=ref(null), query=ref(''), filter=ref('all'), topicId=ref('all'), selectedId=ref(null), expanded=ref({}), error=ref(''), source=ref('Bundled taxonomy'), sharedUrl=ref(''), busy=ref(false), now=ref(Date.now()), dirty=ref(false);
  const nodes=computed(()=>data.value?flatten(data.value.topics):[]);
  const selected=computed(()=>nodes.value.find(n=>n.id===selectedId.value));
  const due=computed(()=>nodes.value.filter(n=>isDue(n,now.value)));
  const completed=computed(()=>nodes.value.filter(n=>n.status==='completed').length);
  const problemCount=computed(()=>new Set(nodes.value.flatMap(n=>n.problems.filter(p=>p.role==='primary').map(p=>p.id))).size);
  const visibleTopics=computed(()=>(data.value?.topics||[]).filter(n=>(topicId.value==='all'||n.id===topicId.value)&&hasMatch(n,query.value,filter.value,now.value)));
  function save(){try{localStorage.setItem(KEY,JSON.stringify({data:data.value,source:source.value,sharedUrl:sharedUrl.value,dirty:dirty.value}));}catch{error.value='Browser storage is full or unavailable. Export JSON to keep your changes.';}}
  function changed(){dirty.value=true;save();}
  function replace(input,label,url=''){data.value=validateTree(input);source.value=label;sharedUrl.value=url;selectedId.value=null;topicId.value='all';expanded.value={};query.value='';filter.value='all';dirty.value=false;save();}
  async function loadUrl(url){
    busy.value=true;error.value='';
    try{
      const u=new URL(url,location.href);if(!['https:','http:'].includes(u.protocol))throw Error('Use an HTTP or HTTPS JSON URL.');
      const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(15000),credentials:'omit'});if(!r.ok)throw Error(`Server returned ${r.status}.`);
      const txt=await r.text();if(txt.length>5e6)throw Error('JSON must be smaller than 5 MB.');
      replace(JSON.parse(txt),u.pathname.split('/').pop()||u.hostname,u.href);
    }catch(e){error.value=`Could not load JSON: ${e.message} A shared host must allow cross-origin requests (CORS).`;}
    finally{busy.value=false;}
  }
  async function init(){
    let cached=false;
    try{const old=JSON.parse(localStorage.getItem(KEY)||'null');if(old){data.value=validateTree(old.data);source.value=old.source;sharedUrl.value=old.sharedUrl||'';dirty.value=!!old.dirty;cached=true;}}catch{error.value='Saved data could not be read. Loading the bundled tree.';}
    if(!cached){busy.value=true;try{const r=await fetch('/taxonomy.json');if(!r.ok)throw Error('Could not load bundled taxonomy');replace(await r.json(),'Bundled taxonomy');}catch(e){error.value=e.message;}finally{busy.value=false;}}
    // Never overwrite a locally edited snapshot merely because a share link was opened.
    const url=new URLSearchParams(location.search).get('source');
    if(url && !cached)await loadUrl(url);
  }
  function toggle(id){expanded.value[id]=!(expanded.value[id]??true);}
  function expandAll(value){expanded.value=Object.fromEntries(nodes.value.map(n=>[n.id,value]));}
  function markReviewed(n){n.review.lastReviewedAt=new Date().toISOString();n.review.enabled=true;n.reviewRequested=false;changed();}
  function complete(n){n.status=n.status==='completed'?'unspecified':'completed';n.completedAt=n.status==='completed'?new Date().toISOString().slice(0,10):null;if(n.status==='completed'){n.review.enabled=true;n.review.lastReviewedAt=new Date().toISOString();}changed();}
  function addChild(parent,title){const n={id:crypto.randomUUID(),kind:'pattern',title:title.trim(),description:'',status:'unspecified',completedAt:null,later:false,reviewRequested:false,review:{enabled:false,intervalDays:14,lastReviewedAt:null},problems:[],notes:[],children:[]};if(!n.title)return;if(parent){parent.children.push(n);expanded.value[parent.id]=true;}else data.value.topics.push({...n,kind:'topic'});selectedId.value=n.id;changed();}
  function download(){const blob=new Blob([JSON.stringify(toRaw(data.value),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='taxonomy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return {showNotes,data,query,filter,topicId,selectedId,selected,expanded,error,source,sharedUrl,busy,now,dirty,nodes,due,completed,problemCount,visibleTopics,save,changed,replace,loadUrl,init,toggle,expandAll,markReviewed,complete,addChild,download};
});
