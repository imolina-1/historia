/* Extras: ajustes (sonido, tipografía legible), compartir cromo como imagen, modo sin conexión */
(function(){
"use strict";
const get=(k,d)=>{try{const v=localStorage.getItem("hde2_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem("hde2_"+k,JSON.stringify(v))}catch(e){}};
const $=(s,r=document)=>r.querySelector(s);

/* ---------- sonidos (sintetizados, sin archivos) ---------- */
let AC=null;
const ac=()=>{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}if(AC.state==="suspended")AC.resume();return AC};
function tone(f,t0,d,type,g){const c=ac();if(!c)return;const o=c.createOscillator(),v=c.createGain(),t=c.currentTime+t0;o.type=type||"sine";o.frequency.value=f;v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g||.1,t+.012);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(c.destination);o.start(t);o.stop(t+d+.05)}
function noise(t0,d,fq,g){const c=ac();if(!c)return;const n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain(),t=c.currentTime+t0;s.buffer=b;f.type="bandpass";f.frequency.value=fq;f.Q.value=.9;v.gain.value=g||.15;s.connect(f);f.connect(v);v.connect(c.destination);s.start(t)}
const SFX={
  tear(){noise(0,.42,2600,.22);noise(.06,.3,5200,.1);tone(180,0,.18,"triangle",.06)},
  flip(){noise(0,.11,1900,.11);tone(520,.02,.08,"sine",.04)},
  chime(r){if(r===1){tone(659,0,.28,"sine",.08)}else if(r===2){tone(784,0,.3,"sine",.09);tone(988,.1,.38,"sine",.08)}else{[523,659,784,1047,1319].forEach((f,i)=>{tone(f,i*.09,.55,"triangle",.07);tone(f*2,i*.09,.4,"sine",.025)})}},
  ok(){tone(880,0,.14,"sine",.07)}
};
const sonidoOn=()=>get("sfx",false)===true;
window.hdeSfx=(n,a)=>{if(sonidoOn()&&SFX[n])try{SFX[n](a)}catch(e){}};
document.addEventListener("click",e=>{
  if(!sonidoOn())return;
  const t=e.target;
  if(t.closest&&t.closest("#pkgo"))SFX.tear();
  const fl=t.closest&&t.closest("#pkb .fl");
  if(fl&&!fl.classList.contains("on")){SFX.flip();try{const r=alRar(PK.res[+fl.dataset.i].p);setTimeout(()=>SFX.chime(r),[0,300,500,800][r])}catch(_){}}
},true);

/* ---------- compartir cromo como imagen ---------- */
const loadImg=src=>new Promise(res=>{if(!src)return res(null);const i=new Image();i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function wrap(x,t,maxW,maxL){const ws=String(t).split(" "),L=[];let l="";for(const w of ws){const s=l?l+" "+w:w;if(x.measureText(s).width>maxW&&l){L.push(l);l=w}else l=s}if(l)L.push(l);if(L.length>maxL){L.length=maxL;L[maxL-1]=L[maxL-1].replace(/\s*\S*$/,"")+"…"}return L}
async function cromoCanvas(p){
  try{await Promise.all([document.fonts.load('italic 500 70px Newsreader'),document.fonts.load('700 30px Inter'),document.fonts.load('600 30px Inter')])}catch(e){}
  const W=1000,H=1400,r=alRar(p),T=[null,{b:"#d9a653",l:"#f2dc9c",bg:"#1a130d"},{b:"#d6e0ee",l:"#ffffff",bg:"#12161b"},{b:"#f0c24f",l:"#fff0b8",bg:"#1d1608"}][r];
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  x.fillStyle=T.bg;rr(x,0,0,W,H,48);x.fill();
  const g0=x.createLinearGradient(0,0,W,H);g0.addColorStop(0,T.l);g0.addColorStop(.5,T.b);g0.addColorStop(1,T.l);
  x.strokeStyle=g0;x.lineWidth=10;rr(x,8,8,W-16,H-16,42);x.stroke();
  // retrato
  const ax=34,ay=34,aw=W-68,ah=1268;
  x.save();rr(x,ax,ay,aw,ah,30);x.clip();
  const im=await loadImg(p.img);
  if(im){const s=Math.max(aw/im.width,ah/im.height),w=im.width*s,h=im.height*s;x.drawImage(im,ax+(aw-w)/2,ay+(h>ah?0:(ah-h)/2),w,h)}
  else{const g=x.createLinearGradient(0,ay,0,ay+ah);g.addColorStop(0,"#3a2a18");g.addColorStop(1,"#120c07");x.fillStyle=g;x.fillRect(ax,ay,aw,ah);x.fillStyle=T.b;x.globalAlpha=.9;x.font='italic 500 380px Newsreader, Georgia, serif';x.textAlign="center";x.fillText((clean(p.nombre).match(/[A-ZÁÉÍÓÚÑ]/g)||["H"]).slice(0,2).join(""),W/2,ay+520);x.globalAlpha=1}
  const gr=x.createLinearGradient(0,ay+ah*.5,0,ay+ah);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(.55,"rgba(8,5,3,.82)");gr.addColorStop(1,"rgba(8,5,3,.96)");x.fillStyle=gr;x.fillRect(ax,ay+ah*.5,aw,ah*.5);
  x.restore();
  // marco interior fino
  x.strokeStyle=T.b;x.globalAlpha=.8;x.lineWidth=3;rr(x,ax+14,ay+14,aw-28,ah-28,22);x.stroke();x.globalAlpha=1;
  // número y estrellas
  x.textBaseline="alphabetic";x.textAlign="left";x.fillStyle="#fff";x.globalAlpha=.9;x.font='700 26px Inter, system-ui, sans-serif';
  x.fillText("Nº "+alPad(alN(p.id)),ax+44,ay+70);x.globalAlpha=1;
  x.textAlign="right";x.fillStyle=T.l;x.font='700 40px Inter, system-ui, sans-serif';x.fillText("★".repeat(r),ax+aw-44,ay+74);
  // nombre
  x.textAlign="center";x.fillStyle="#fff";
  let fs=92;const nom=clean(p.nombre);x.font=`italic 500 ${fs}px Newsreader, Georgia, serif`;while(x.measureText(nom).width>aw-120&&fs>46){fs-=4;x.font=`italic 500 ${fs}px Newsreader, Georgia, serif`}
  x.shadowColor="rgba(0,0,0,.6)";x.shadowBlur=14;x.fillText(nom,W/2,1006);x.shadowBlur=0;
  // fechas con filetes
  const vida=life(p)+(p.c?" (aprox.)":"");x.font='600 30px Inter, system-ui, sans-serif';x.fillStyle=T.l;
  if("letterSpacing" in x)x.letterSpacing="6px";const vw=x.measureText(vida).width;x.fillText(vida,W/2,1064);if("letterSpacing" in x)x.letterSpacing="0px";
  x.strokeStyle=T.b;x.lineWidth=2;x.beginPath();x.moveTo(W/2-vw/2-90,1054);x.lineTo(W/2-vw/2-20,1054);x.moveTo(W/2+vw/2+20,1054);x.lineTo(W/2+vw/2+90,1054);x.stroke();
  // cargo
  x.font='italic 500 40px Newsreader, Georgia, serif';x.fillStyle="#efe6d3";const L=wrap(x,p.cargo||"",aw-140,2);L.forEach((s,i)=>x.fillText(s,W/2,1128+i*48));
  // pie
  x.strokeStyle=T.b;x.globalAlpha=.5;x.lineWidth=2;x.beginPath();x.moveTo(ax+44,1216);x.lineTo(ax+aw-44,1216);x.stroke();x.globalAlpha=1;
  x.font='700 24px Inter, system-ui, sans-serif';x.fillStyle=T.l;if("letterSpacing" in x)x.letterSpacing="3px";
  x.textAlign="left";x.fillText((CATS[p.cat]?CATS[p.cat][0]:"").toUpperCase(),ax+44,1254);x.textAlign="right";x.fillText("TEMA "+p.tema,ax+aw-44,1254);
  x.textAlign="center";x.font='600 24px Inter, system-ui, sans-serif';x.fillStyle=T.b;if("letterSpacing" in x)x.letterSpacing="5px";x.fillText("HISTORIA DE ESPAÑA · PAU",W/2,1364);
  if("letterSpacing" in x)x.letterSpacing="0px";
  return cv;
}
async function compartir(id,btn){
  const p=PM[id];if(!p)return;if(btn){btn.disabled=true;btn.dataset.t=btn.textContent;btn.textContent="Preparando…"}
  try{
    const cv=await cromoCanvas(p);
    const blob=await new Promise(res=>cv.toBlob(res,"image/png"));if(!blob)throw 0;
    const f=new File([blob],"cromo-"+id+".png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:clean(p.nombre),text:clean(p.nombre)+" · Historia de España"});return}catch(e){if(e&&e.name==="AbortError")return}}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    if(typeof toast==="function")toast("Cromo guardado como imagen");
  }catch(e){if(typeof toast==="function")toast("No se ha podido crear la imagen.")}
  finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.t||"Compartir cromo"}}
}
window.hdeCompartir=compartir;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-share]");if(b){e.preventDefault();compartir(b.dataset.share,b)}});

/* ---------- ajustes ---------- */
const GEAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';
function aplicar(){document.documentElement.classList.toggle("legible",get("legible",false)===true)}
function abrirAjustes(){
  let d=$("#aj");
  if(!d){d=document.createElement("dialog");d.id="aj";d.className="ajd";d.setAttribute("aria-label","Ajustes");
    d.innerHTML='<div class="ajh"><h2>Ajustes</h2><button type="button" class="ajx" aria-label="Cerrar">✕</button></div>'+
    '<label class="ajr"><span><b>Tipografía legible</b><small>Atkinson Hyperlegible y más aire entre líneas.</small></span><input type="checkbox" role="switch" id="aj-leg"><i class="sw" aria-hidden="true"></i></label>'+
    '<label class="ajr"><span><b>Sonidos</b><small>Al abrir sobres y girar cromos.</small></span><input type="checkbox" role="switch" id="aj-sfx"><i class="sw" aria-hidden="true"></i></label>';
    document.body.appendChild(d);
    $(".ajx",d).onclick=()=>d.close();d.addEventListener("click",e=>{if(e.target===d)d.close()});
    $("#aj-leg",d).onchange=e=>{set("legible",e.target.checked);aplicar()};
    $("#aj-sfx",d).onchange=e=>{set("sfx",e.target.checked);if(e.target.checked){SFX.ok()}};
  }
  $("#aj-leg",d).checked=get("legible",false)===true;$("#aj-sfx",d).checked=sonidoOn();
  d.showModal();
}
function botonAjustes(){
  const t=$(".tools");if(!t||$("#ajb"))return;
  const b=document.createElement("button");b.className="ib";b.id="ajb";b.type="button";b.title="Ajustes";b.setAttribute("aria-label","Ajustes");b.innerHTML=GEAR;b.onclick=abrirAjustes;
  const th=$("#theme");th?t.insertBefore(b,th):t.appendChild(b);
}
aplicar();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",botonAjustes);else botonAjustes();

/* ---------- sin conexión ---------- */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
})();
