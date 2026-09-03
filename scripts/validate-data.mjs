import {access,readFile} from "node:fs/promises";

const fileUrl=new URL("../data.json",import.meta.url);
const data=JSON.parse(await readFile(fileUrl,"utf8"));
const allowedRelations=new Set(["original","update"]);
const datePattern=/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const requiredStrings=["id","storyId","storyTitel","beziehung","thema","kategorie","organisation","ort","ereignisDatum","veroeffentlichungsDatum","erfasstAm","quelleUrl","quelleName","status","neuheitsstatus","vertrauensniveau","zusammenfassung","wasIstNeu","relevanz","endnutzerRelevanz","flag"];
const errors=[];
const ids=new Set();
const stories=new Map();

if(!data?.meta||!Array.isArray(data?.eintraege))errors.push("Wurzel muss meta und eintraege[] enthalten.");

for(const [index,entry] of (data.eintraege||[]).entries()){
  const at=`eintraege[${index}] (${entry?.id||"ohne id"})`;
  for(const field of requiredStrings)if(typeof entry?.[field]!=="string")errors.push(`${at}: ${field} muss eine Zeichenkette sein.`);
  for(const field of ["ereignisDatum","veroeffentlichungsDatum","erfasstAm"]){
    if(!datePattern.test(entry?.[field]||"")||Number.isNaN(Date.parse(`${entry[field]}T00:00:00Z`)))errors.push(`${at}: ${field} ist kein gültiges ISO-Datum.`);
  }
  if(ids.has(entry.id))errors.push(`${at}: id ist nicht eindeutig.`); else ids.add(entry.id);
  if(!allowedRelations.has(entry.beziehung))errors.push(`${at}: beziehung muss original oder update sein.`);
  if(entry.quelleUrl){try{const url=new URL(entry.quelleUrl);if(!["http:","https:"].includes(url.protocol))throw new Error()}catch{errors.push(`${at}: quelleUrl ist ungültig.`)}}
  if(!Array.isArray(entry.zusaetzlicheQuellen))errors.push(`${at}: zusaetzlicheQuellen muss ein Array sein.`);
  if(entry.bild){
    if(typeof entry.bild!=="object"||Array.isArray(entry.bild))errors.push(`${at}: bild muss ein Objekt sein.`);
    else{
      for(const field of ["url","alt","credit","quelleUrl"])if(typeof entry.bild[field]!=="string"||!entry.bild[field])errors.push(`${at}: bild.${field} muss eine nichtleere Zeichenkette sein.`);
      if(!entry.bild.url?.startsWith("assets/images/"))errors.push(`${at}: bild.url muss auf assets/images/ zeigen.`);
      else try{await access(new URL(`../${entry.bild.url}`,import.meta.url))}catch{errors.push(`${at}: Bilddatei ${entry.bild.url} fehlt.`)}
      try{const url=new URL(entry.bild.quelleUrl);if(!["http:","https:"].includes(url.protocol))throw new Error()}catch{errors.push(`${at}: bild.quelleUrl ist ungültig.`)}
    }
  }
  const values=Object.values(entry.bewertungen||{});
  if(values.length!==4||values.some(value=>!Number.isInteger(value)||value<0||value>10))errors.push(`${at}: bewertungen müssen vier Ganzzahlen von 0 bis 10 enthalten.`);
  if(!stories.has(entry.storyId))stories.set(entry.storyId,[]);stories.get(entry.storyId).push(entry);
}

for(const [storyId,items] of stories){
  const originals=items.filter(item=>item.beziehung==="original");
  if(originals.length!==1)errors.push(`${storyId}: genau ein Eintrag muss als original markiert sein (gefunden: ${originals.length}).`);
  if(items.some(item=>item.beziehung!=="original")&&items.length<2)errors.push(`${storyId}: Update ohne verknüpften Ursprungseintrag.`);
  const labels=new Set(items.map(item=>item.storyTitel));
  if(labels.size!==1)errors.push(`${storyId}: storyTitel ist innerhalb der Story nicht einheitlich.`);
}

if(errors.length){console.error(`Datenprüfung fehlgeschlagen (${errors.length}):\n- ${errors.join("\n- ")}`);process.exit(1)}
const updateCount=data.eintraege.filter(entry=>entry.beziehung==="update").length;
const imageCount=data.eintraege.filter(entry=>entry.bild?.url).length;
console.log(`Daten gültig: ${data.eintraege.length} Ereignisse, ${stories.size} Storys, ${imageCount} Bilder, ${updateCount} Updates.`);
