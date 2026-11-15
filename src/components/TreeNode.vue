<script setup>
import {computed,ref} from 'vue';
import {useAtlas} from '../stores/atlas';
import {hasMatch,isDue,safeLink} from '../lib/tree';
const props=defineProps({node:{type:Object,required:true},depth:{type:Number,default:0}});
const store=useAtlas();
const notesOpen=ref(false);
const adding=ref(false),childTitle=ref(''),addingNote=ref(false),noteText=ref('');
const searching=computed(()=>!!store.query||store.filter!=='all');
const open=computed(()=>searching.value||(store.expanded[props.node.id]??true));
const visible=computed(()=>hasMatch(props.node,store.query,store.filter,store.now));
const due=computed(()=>isDue(props.node,store.now));
function addChild(){if(childTitle.value.trim()){store.addChild(props.node,childTitle.value);store.selectedId=null;childTitle.value='';adding.value=false;}}
function addNote(){if(noteText.value.trim()){props.node.notes.push({text:noteText.value.trim(),kind:'note',links:[]});store.expanded[props.node.id]=true;store.showNotes=true;notesOpen.value=true;store.changed();noteText.value='';addingNote.value=false;}}
</script>
<template>
<li v-if="visible" class="outline-node" :class="{'outline-node--topic':depth===0}">
  <div class="outline-node__line">
    <button v-if="node.children.length || node.notes.length || node.description" class="outline-node__toggle" :aria-label="`${open?'Collapse':'Expand'} ${node.title}`" :aria-expanded="open" :disabled="searching" @click="store.toggle(node.id)">{{open?'▾':'▸'}}</button>
    <span v-else class="outline-node__leaf">•</span>
    <div class="outline-node__text">
      <strong v-if="node.status==='completed'" class="outline-node__done">✅ OK<span v-if="node.completedAt">({{new Date(node.completedAt).toLocaleDateString('en-GB',{timeZone:'UTC'}).replaceAll('/','-')}})</span></strong>
      
      <button class="outline-node__title" @click="store.selectedId=node.id">{{node.title}}</button>
      <span v-if="node.later" class="outline-node__later"> [LATER]</span>
      <button v-if="due" class="outline-node__reminder" @click="store.selectedId=node.id" title="Review is due" :aria-label="`Review due: ${node.title}`">🔔</button>
      <span v-else-if="node.reviewRequested" class="outline-node__repeat" title="Repeat this pattern"> 🔁</span>
      <template v-for="(p,i) in node.problems" :key="`${p.id}-${i}`"><a v-if="safeLink(p.url)" class="outline-node__problem" :class="{'outline-node__problem--alternative':p.role==='alternative'}" :href="safeLink(p.url)" target="_blank" rel="noopener noreferrer" :title="p.context||p.role">{{p.role==='primary'?'⭐':'↔'}} LC {{p.id}} · {{p.title}}</a><span v-else class="outline-node__problem">{{p.role==='primary'?'⭐':'↔'}} LC {{p.id}} · {{p.title}}</span></template>
    </div>
    <div class="outline-node__actions"><button class="outline-node__add" :aria-label="`Add child to ${node.title}`" :aria-expanded="adding" title="Add a child branch" @click="adding=!adding">+</button><button class="outline-node__action" :aria-label="`Add note to ${node.title}`" title="Add an inline note" @click="addingNote=!addingNote">📝</button><button class="outline-node__action" :aria-label="`Edit ${node.title}`" title="Edit and set review reminders" @click="store.selectedId=node.id">⚙</button></div>
  </div>
  <div v-if="adding || addingNote" class="outline-node__editor">
    <form v-if="adding" @submit.prevent="addChild"><input v-model="childTitle" :aria-label="`New child of ${node.title}`" placeholder="New branch…" required/><button class="button button--green">Add branch</button><button class="button" type="button" @click="adding=false">Cancel</button></form>
    <form v-if="addingNote" @submit.prevent="addNote"><textarea v-model="noteText" :aria-label="`New note for ${node.title}`" placeholder="An idea, a formula, something to remember…" required/><button class="button button--green">Add note</button><button class="button" type="button" @click="addingNote=false">Cancel</button></form>
  </div>
  <div v-if="open && store.showNotes && (node.description || node.notes.length)" class="outline-node__notes">
    <button class="outline-node__notes-toggle" :aria-expanded="notesOpen || searching" :aria-label="`Toggle notes for ${node.title}`" @click="notesOpen=!notesOpen">{{notesOpen || searching?'▾':'▸'}} 📝 <span v-if="!notesOpen && !searching" class="outline-node__preview">{{(node.description || node.notes[0]?.text || '').slice(0,100)}}{{(node.description || node.notes[0]?.text || '').length>100?'…':''}}</span><span v-else>Notes</span><span v-if="node.notes.length>1" class="outline-node__note-total"> ({{node.notes.length}})</span></button>
    <div v-if="notesOpen || searching" class="outline-node__note-body">
    <p v-if="node.description" class="outline-node__description">{{node.description}}</p>
    <div v-for="(note,i) in node.notes" :key="i" class="outline-note" :class="{'outline-note--insight':note.kind==='insight'}"><span aria-hidden="true">{{note.kind==='insight'?'💡':'📝'}}</span><div><p>{{note.text}}</p><template v-for="link in note.links" :key="link.url"><a v-if="safeLink(link.url)" :href="safeLink(link.url)" target="_blank" rel="noopener noreferrer">{{link.label}} ↗</a></template></div></div>
    </div>
  </div>
  <ul v-if="node.children.length && open" class="outline-node__children"><TreeNode v-for="child in node.children" :key="child.id" :node="child" :depth="depth+1"/></ul>
</li>
</template>
