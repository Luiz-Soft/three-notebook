<script setup>
import {ref,watch} from 'vue';
import {X,Check,Bell,Plus,ExternalLink,Star,ArrowLeftRight} from 'lucide-vue-next';
import {useAtlas} from '../stores/atlas';
import {dueAt,safeLink} from '../lib/tree';
const store=useAtlas();const childTitle=ref(''), noteText=ref(''), problemId=ref(''),problemTitle=ref(''), problemRole=ref('primary');
watch(()=>store.selectedId,()=>{childTitle.value='';noteText.value='';problemId.value='';problemTitle.value='';});
function addNote(){if(noteText.value.trim()){store.selected.notes.push({text:noteText.value.trim(),kind:'note',links:[]});noteText.value='';store.changed();}}
function addProblem(){const id=Number(problemId.value);if(Number.isInteger(id)&&id>0&&problemTitle.value.trim()){store.selected.problems.push({id,title:problemTitle.value.trim(),role:problemRole.value,url:`https://leetcode.com/problemset/?search=${id}`,context:''});store.changed();problemId.value='';problemTitle.value='';}}
function schedule(e){const days=Number(e.target.value);if(Number.isFinite(days)&&days>=1&&days<=3650){store.selected.review.intervalDays=days;store.changed();}}
function enable(){const n=store.selected;if(n.review.enabled&&!n.review.lastReviewedAt&&!n.completedAt&&!n.reviewRequested)n.review.lastReviewedAt=new Date().toISOString();store.changed();}
function dateLabel(n){const date=dueAt(n);return date===0?'Ready to review':date===null?'Not scheduled':new Date(date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});}
</script>
<template>
<aside v-if="store.selected" class="detail" aria-label="Branch details">
  <div class="detail__top"><span class="eyebrow">PATTERN NOTES</span><button class="icon-button" aria-label="Close details" @click="store.selectedId=null"><X :size="20"/></button></div>
  <h2 class="detail__title">{{store.selected.title}}</h2>
  <label class="field">Edit title<input :value="store.selected.title" @change="e=>{if(e.target.value.trim()){store.selected.title=e.target.value.trim();store.changed();}}"/></label>
  <label class="field">Description<textarea v-model="store.selected.description" @change="store.changed()" placeholder="When should you reach for this pattern?"/></label>
  <button class="button" :class="{'button--green':store.selected.status==='completed'}" @click="store.complete(store.selected)"><Check :size="16"/>{{store.selected.status==='completed'?'Learned · click to undo':'Mark this branch learned'}}</button>
  <p class="detail__hint">Applies to this branch only, not its children or problems.</p>
  <label class="detail__checkbox"><input type="checkbox" v-model="store.selected.later" @change="store.changed()"/> Save for later</label>
  <section class="review-card"><h3><Bell :size="16"/> Keep it fresh</h3><label class="detail__checkbox"><input type="checkbox" v-model="store.selected.review.enabled" @change="enable"/> Enable review reminders</label><label class="field field--inline">Every <input type="number" min="1" max="3650" :value="store.selected.review.intervalDays" @input="schedule"/> days</label><p>Next review: <strong>{{dateLabel(store.selected)}}</strong></p><p v-if="store.selected.reviewInstruction">{{store.selected.reviewInstruction}}</p><button class="button button--green" @click="store.markReviewed(store.selected)"><Check :size="15"/> I've reviewed this</button><p class="detail__hint">The bell appears when due. Reminders update while the app is open and when you return.</p></section>
  <section v-if="store.selected.problems.length" class="detail__section"><h3>Practice problems</h3><div v-for="(p,i) in store.selected.problems" :key="`${p.id}-${i}`" class="problem"><span class="problem__type"><Star v-if="p.role==='primary'" :size="13"/><ArrowLeftRight v-else :size="13"/>{{p.role==='primary'?'Top 150 · primary':'Alternative approach'}}</span><a v-if="safeLink(p.url)" :href="safeLink(p.url)" target="_blank" rel="noopener noreferrer">{{p.id}} · {{p.title}} <ExternalLink :size="13"/></a><span v-else>{{p.id}} · {{p.title}}</span><p v-if="p.context">{{p.context}}</p></div></section>
  <section class="detail__section"><h3>Notes & insights <span>{{store.selected.notes.length}}</span></h3><div v-for="(note,i) in store.selected.notes" :key="i" class="note" :class="{'note--insight':note.kind==='insight'}"><span class="eyebrow">{{note.kind==='insight'?'REMEMBER THIS':'NOTE'}}</span><p>{{note.text}}</p><template v-for="link in note.links" :key="link.url"><a v-if="safeLink(link.url)" :href="safeLink(link.url)" target="_blank" rel="noopener noreferrer">{{link.label}} ↗</a></template></div><form @submit.prevent="addNote"><label class="field">Add a note<textarea v-model="noteText" placeholder="Your intuition, edge cases, or a useful reminder…" required/></label><button class="button" type="submit"><Plus :size="15"/> Add note</button></form></section>
  <details class="detail__section"><summary>Add a practice problem</summary><form @submit.prevent="addProblem"><label class="field">LeetCode number<input v-model="problemId" type="number" min="1" step="1" required/></label><label class="field">Problem title<input v-model="problemTitle" required/></label><label class="field">Assignment<select v-model="problemRole"><option value="primary">Primary</option><option value="alternative">Alternative</option></select></label><button class="button">Add problem</button></form></details>
  <form class="detail__section" @submit.prevent="store.addChild(store.selected,childTitle);childTitle='' "><label class="field">Grow this branch<input v-model="childTitle" placeholder="New subpattern name" required/></label><button class="button"><Plus :size="15"/> Add child branch</button></form>
</aside>
</template>
