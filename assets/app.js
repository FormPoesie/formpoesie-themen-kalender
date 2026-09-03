"use strict";

const CATS = {
  "Medizin & Körper":"#8b5e3c","Bauen & Architektur":"#4a5c58","Natur & Umwelt":"#6e8a63",
  "Raumfahrt & Mobilität":"#5c6b78","Material & Werkstoffe":"#a97849","Kultur & Erbe":"#7e6480",
  "Mode & Objekt":"#a96f66","Ernährung & Landwirtschaft":"#78894d","Humanitär & Krise":"#8b4b3b",
  "Fertigung & Industrie":"#5d707b","Aufklärung / Marke":"#1a1a18",
  "Forschung & Verfahren":"#75647c","Energie & Infrastruktur":"#8a7137"
};
const MONTHS=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DOW=["Mo","Di","Mi","Do","Fr","Sa","So"];
const RELATION_LABELS={original:"Ereignis",update:"Story-Update"};
const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const safeUrl=value=>{try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)?url.href:""}catch{return""}};
const prettyDate=value=>value?new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`)):"nicht belegt";
const dateNumber=value=>Date.parse(`${value}T00:00:00Z`);
const color=category=>CATS[category]||"#5d707b";

let archive;
let entries=[];
let visible=[];
let currentMonth=new Date();
let lastFocused=null;

async function init(){
  try{
    const response=await fetch("data.json",{cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    archive=await response.json();
    entries=[...archive.eintraege].sort((a,b)=>a.ereignisDatum.localeCompare(b.ereignisDatum)||a.id.localeCompare(b.id));
    visible=[...entries];
    const latest=entries.at(-1)?.ereignisDatum;
    currentMonth=latest?new Date(`${latest.slice(0,7)}-01T00:00:00Z`):new Date();
    fillCategories();bindControls();renderAll();
  }catch(error){
    $("#counts").innerHTML="";
    $("#grid").innerHTML="";
    console.error("data.json konnte nicht geladen werden",error);
  }
}

function fillCategories(){
  const categories=[...new Set(entries.map(entry=>entry.kategorie))].sort((a,b)=>a.localeCompare(b,"de"));
  $("#category").insertAdjacentHTML("beforeend",categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(""));
}

function bindControls(){
  $("#prev").addEventListener("click",()=>shiftMonth(-1));
  $("#next").addEventListener("click",()=>shiftMonth(1));
  $("#search").addEventListener("input",applyFilters);
  $("#category").addEventListener("change",applyFilters);
  $("#reset").addEventListener("click",()=>{$("#search").value="";$("#category").value="";applyFilters();$("#search").focus()});
  $("#veil").addEventListener("click",event=>{if(event.target===$("#veil"))closePanel()});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&$("#veil").classList.contains("on"))closePanel();
    if(event.key==="Tab"&&$("#veil").classList.contains("on"))trapFocus(event);
  });
}

function shiftMonth(delta){currentMonth.setUTCMonth(currentMonth.getUTCMonth()+delta);renderCalendar()}

function applyFilters(){
  const query=$("#search").value.trim().toLocaleLowerCase("de");
  const category=$("#category").value;
  visible=entries.filter(entry=>{
    const haystack=[entry.thema,entry.organisation,entry.ort,entry.zusammenfassung,entry.storyTitel].join(" ").toLocaleLowerCase("de");
    return (!query||haystack.includes(query))&&(!category||entry.kategorie===category);
  });
  $("#reset").hidden=!query&&!category;
  $("#filter-status").textContent=query||category?`${visible.length} von ${entries.length} Einträgen sichtbar`:"";
  renderStats();renderCalendar();renderLegend();
}

function renderAll(){renderStats();renderCalendar();renderLegend();renderFooter()}

function renderStats(){
  const categories=new Set(visible.map(entry=>entry.kategorie));
  const imageCount=visible.filter(entry=>entry.bild?.url).length;
  const highTrust=visible.filter(entry=>entry.vertrauensniveau==="Hoch").length;
  $("#counts").innerHTML=[
    [visible.length,"Ereignisse"],[categories.size,"Kategorien"],[imageCount,"Ereignisbilder"],[highTrust,"hoch belegt"]
  ].map(([number,label])=>`<li><b>${number}</b><span>${label}</span></li>`).join("");
}

function renderCalendar(){
  const year=currentMonth.getUTCFullYear(),month=currentMonth.getUTCMonth();
  $("#mon").textContent=`${MONTHS[month]} ${year}`;
  let offset=new Date(Date.UTC(year,month,1)).getUTCDay();offset=offset===0?6:offset-1;
  const daysInMonth=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const previousDays=new Date(Date.UTC(year,month,0)).getUTCDate();
  const cells=[];
  for(let index=0;index<offset;index++)cells.push({day:previousDays-offset+index+1,pad:true});
  for(let day=1;day<=daysInMonth;day++)cells.push({day,date:`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,pad:false});
  while(cells.length%7)cells.push({day:"",pad:true});
  const head=DOW.map(day=>`<div class="dow" role="columnheader">${day}</div>`).join("");
  const body=cells.map(cell=>{
    if(cell.pad)return `<div class="cell pad" aria-hidden="true"><span class="num">${cell.day}</span></div>`;
    const dayEntries=visible.filter(entry=>entry.ereignisDatum===cell.date);
    const content=dayEntries.slice(0,2).map(entry=>`<span class="chip ${entry.beziehung}" style="--cat:${color(entry.kategorie)}"><span class="chip-cat">${escapeHtml(entry.kategorie)}</span><span class="chip-title">${escapeHtml(entry.thema)}</span></span>`).join("");
    const label=dayEntries.length?`${prettyDate(cell.date)}, ${dayEntries.length} ${dayEntries.length===1?"Eintrag":"Einträge"}`:prettyDate(cell.date);
    return `<button class="cell${dayEntries.length?" has-events":""}" type="button" data-day="${cell.date}" aria-label="${label}"><span class="day-top"><span class="num">${cell.day}</span>${dayEntries.length?`<span class="day-count">${dayEntries.length}</span>`:""}</span>${content}${dayEntries.length>2?`<span class="more">+${dayEntries.length-2} weitere</span>`:""}</button>`;
  }).join("");
  $("#grid").innerHTML=head+body;
  $("#grid").querySelectorAll("button.cell").forEach(button=>button.addEventListener("click",()=>openDay(button.dataset.day,button)));
}

function renderLegend(){
  const categories=[...new Set(visible.map(entry=>entry.kategorie))].sort((a,b)=>a.localeCompare(b,"de"));
  $("#legend").innerHTML=categories.map(category=>`<span><i style="background:${color(category)}"></i>${escapeHtml(category)}</span>`).join("");
}

function renderFooter(){
  const first=entries.at(0)?.ereignisDatum,last=entries.at(-1)?.ereignisDatum;
  $("#foot").textContent=`Datenstand ${prettyDate(archive.meta.aktualisiertAm)} · ${entries.length} Einträge vom ${prettyDate(first)} bis ${prettyDate(last)} · Ereignisdatum steuert den Kalender`;
}

function sourcesHtml(entry){
  const main=safeUrl(entry.quelleUrl)?`<a class="src" href="${safeUrl(entry.quelleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.quelleName||"Primärquelle")} ↗</a>`:'<span class="src">Kein Direktlink belegt</span>';
  const extra=(entry.zusaetzlicheQuellen||[]).map(source=>safeUrl(source.url)?`<a class="src" href="${safeUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name||"Zusätzliche Quelle")} ↗</a>`:"").join("");
  return main+extra;
}

function imageHtml(entry){
  if(!entry.bild?.url)return "";
  const src=entry.bild.url.startsWith("assets/images/")?entry.bild.url:safeUrl(entry.bild.url);
  if(!src)return "";
  const source=safeUrl(entry.bild.quelleUrl||entry.quelleUrl);
  const credit=escapeHtml(entry.bild.credit||entry.quelleName||"Bildquelle");
  const caption=source?`<a href="${source}" target="_blank" rel="noopener noreferrer">${credit} ↗</a>`:credit;
  return `<figure class="event-figure"><img class="event-image" src="${escapeHtml(src)}" alt="${escapeHtml(entry.bild.alt||entry.thema)}" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>`;
}

function openDay(day,trigger){
  lastFocused=trigger||document.activeElement;
  const dayEntries=visible.filter(entry=>entry.ereignisDatum===day);
  $("#panel").innerHTML=`<button class="close" id="close" type="button" aria-label="Detailansicht schließen">✕</button><h3 id="panel-title">${prettyDate(day)}</h3><p class="cnt">${dayEntries.length===0?"Kein Eintrag":dayEntries.length===1?"1 Eintrag":`${dayEntries.length} Einträge`}</p>`+
    (dayEntries.length?dayEntries.map(entry=>entryHtml(entry)).join(""):'<p class="empty">An diesem Tag ist kein Ereignis verzeichnet.</p>');
  $("#veil").classList.add("on");$("#veil").setAttribute("aria-hidden","false");document.body.classList.add("modal-open");
  $("#close").addEventListener("click",closePanel);$("#close").focus();
}

function entryHtml(entry){
  const scores=entry.bewertungen||{};
  return `<article class="entry">
    <h4>${escapeHtml(entry.thema)}</h4>
    <div class="meta"><span class="tag" style="background:${color(entry.kategorie)}">${escapeHtml(entry.kategorie)}</span><span class="relation ${entry.beziehung}">${RELATION_LABELS[entry.beziehung]}</span>${entry.organisation?`<span>${escapeHtml(entry.organisation)}</span>`:""}${entry.ort?`<span>${escapeHtml(entry.ort)}</span>`:""}</div>
    ${imageHtml(entry)}
    <dl class="date-grid"><div><dt>Ereignis</dt><dd>${prettyDate(entry.ereignisDatum)}</dd></div><div><dt>Quelle veröffentlicht</dt><dd>${prettyDate(entry.veroeffentlichungsDatum)}</dd></div><div><dt>Erfasst</dt><dd>${prettyDate(entry.erfasstAm)}</dd></div></dl>
    <p class="zsm">${escapeHtml(entry.zusammenfassung)}</p>
    ${entry.wasIstNeu?`<p class="detail"><strong>Neu:</strong> ${escapeHtml(entry.wasIstNeu)}</p>`:""}
    ${entry.relevanz?`<p class="detail"><strong>Relevanz:</strong> ${escapeHtml(entry.relevanz)}</p>`:""}
    ${entry.endnutzerRelevanz?`<p class="detail"><strong>Für Endnutzer:</strong> ${escapeHtml(entry.endnutzerRelevanz)}</p>`:""}
    <div>${sourcesHtml(entry)}</div>
    ${entry.flag?`<p class="note">${escapeHtml(entry.flag)}</p>`:""}
    <p class="score">Status: ${escapeHtml(entry.status)} · Neuheit: ${escapeHtml(entry.neuheitsstatus)} · Vertrauen: ${escapeHtml(entry.vertrauensniveau)} · Neuheit ${scores.neuheitsgrad}/10 · Relevanz ${scores.relevanz}/10 · Wow ${scores.wowFaktor}/10 · Quellen ${scores.quellenqualitaet}/10</p>
  </article>`;
}

function closePanel(){
  $("#veil").classList.remove("on");$("#veil").setAttribute("aria-hidden","true");document.body.classList.remove("modal-open");
  if(lastFocused&&document.contains(lastFocused))lastFocused.focus();
}

function trapFocus(event){
  const focusable=[...$("#panel").querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
  if(!focusable.length)return;
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

init();
