// Clasificación pública de «Historia de España PAU».
// Cloudflare Pages Function + base de datos D1 (binding: DB). Clasificación anónima: solo se guarda un
// identificador aleatorio generado en el dispositivo y cifras de progreso. Sin nombres, sin alias, sin cookies, sin IP.
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,DELETE,OPTIONS","access-control-allow-headers":"content-type,x-admin","cache-control":"no-store"};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,"content-type":"application/json;charset=utf-8"}});
const MAXP=600;
const week=(t=Date.now())=>Math.floor((Math.floor(t/864e5)+3)/7);
const int=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
let ready=false;
const TABLES=["lb2","lbA"];
async function init(DB){if(ready)return;
  for(const t of TABLES)await DB.prepare("CREATE TABLE IF NOT EXISTS "+t+" (id TEXT PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0, wkn INTEGER NOT NULL DEFAULT 0, wbase INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, cards INTEGER NOT NULL DEFAULT 0, badges INTEGER NOT NULL DEFAULT 0, mins INTEGER NOT NULL DEFAULT 0, upd INTEGER NOT NULL DEFAULT 0)").run();
  await DB.prepare("DROP TABLE IF EXISTS lb").run();
  await DB.prepare("CREATE TABLE IF NOT EXISTS pu (b TEXT NOT NULL, d INTEGER NOT NULL, k TEXT NOT NULL, v INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (b,d,k))").run();
  ready=true}
const pub=(r,adm)=>{const o={xp:r.xp,wxp:Math.max(0,r.xp-(r.wkn===week()?r.wbase:r.xp)),streak:r.streak,cards:r.cards,badges:r.badges,mins:r.mins};if(adm)o.id=r.id;return o};
async function board(DB,id,adm,T){
  const w=week();
  const run=async(sql,args=[])=>(await DB.prepare(sql).bind(...args).all()).results||[];
  const wx="CASE WHEN wkn="+w+" THEN xp-wbase ELSE 0 END";
  const P=r=>pub(r,adm);
  const all=await run("SELECT * FROM "+T+" ORDER BY xp DESC, upd ASC LIMIT 60");
  const byw=await run("SELECT * FROM "+T+" ORDER BY "+wx+" DESC, xp DESC LIMIT 60");
  const bys=await run("SELECT * FROM "+T+" ORDER BY streak DESC, xp DESC LIMIT 30");
  const byc=await run("SELECT * FROM "+T+" ORDER BY cards DESC, xp DESC LIMIT 30");
  const agg=(await run("SELECT COUNT(*) n, COALESCE(SUM(xp),0) sx, COALESCE(SUM(mins),0) sm FROM "+T+""))[0]||{n:0,sx:0,sm:0};
  let me=null;
  if(id){const r=(await run("SELECT * FROM "+T+" WHERE id=?1",[id]))[0];
    if(r){const cnt=async(col,val)=>(await run("SELECT COUNT(*) c FROM "+T+" WHERE "+col+">?1",[val]))[0].c+1;
      const mw=Math.max(0,r.xp-(r.wkn===w?r.wbase:r.xp));
      me={...pub(r),rank:await cnt("xp",r.xp),rankW:(await run("SELECT COUNT(*) c FROM "+T+" WHERE "+wx+">?1",[mw]))[0].c+1,rankS:await cnt("streak",r.streak),rankC:await cnt("cards",r.cards)}}}
  return{week:w,n:agg.n,xp:agg.sx,mins:agg.sm,xpT:all.map(P),wk:byw.map(P),streak:bys.map(P),cards:byc.map(P),me}}
/* «La clase en cifras»: contadores anónimos y agregados (sobres abiertos, preguntas, minutos…). Sin identificador de ninguna clase. */
const PK=/^(ses|pk|nw|lg|q|qo|mn|hy|t\d{1,2}[ao])$/,CAP={ses:1,pk:30,nw:90,lg:30,q:400,qo:400,mn:120,hy:2};
const day=(t=Date.now())=>Math.floor(t/864e5);
async function pulse(DB,b){
  const run=async(sql,a=[])=>(await DB.prepare(sql).bind(...a).all()).results||[];
  const d=day(),T=b==="arte"?"lbA":"lb2";
  const tot=await run("SELECT k, SUM(v) v FROM pu WHERE b=?1 GROUP BY k",[b]);
  const rec=await run("SELECT d, k, v FROM pu WHERE b=?1 AND d>?2 AND k IN ('ses','pk','q','qo','mn','nw','lg','hy')",[b,d-30]);
  const t={};tot.forEach(r=>t[r.k]=r.v);
  const days={};rec.forEach(r=>{(days[r.d-(d-29)]||(days[r.d-(d-29)]={}))[r.k]=r.v});
  const pl=(await run("SELECT COUNT(*) n, COALESCE(SUM(CASE WHEN upd>=?1 THEN 1 ELSE 0 END),0) a FROM "+T,[d*864e5]))[0]||{n:0,a:0};
  return{day:d,t,days,players:pl.n,activeToday:pl.a}}
const isAdm=(request,env)=>!!env.ADMIN_TOKEN&&request.headers.get("x-admin")===env.ADMIN_TOKEN;
const okId=id=>/^[a-z0-9-]{16,48}$/.test(id);
export async function onRequest({request,env}){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  const DB=env.DB;if(!DB)return J({ok:false,error:"La base de datos no está configurada."},503);
  try{await init(DB)}catch(e){return J({ok:false,error:"Base de datos no disponible."},503)}
  const url=new URL(request.url),T=url.searchParams.get("b")==="arte"?"lbA":"lb2",PB=url.searchParams.get("b")==="arte"?"arte":"es";
  if(url.searchParams.get("pulse")==="1"){
    if(request.method==="GET"){const o=await pulse(DB,PB);return new Response(JSON.stringify({ok:true,...o}),{status:200,headers:{...CORS,"cache-control":"public, max-age=45","content-type":"application/json;charset=utf-8"}})}
    if(request.method==="POST"){let b;try{b=await request.json()}catch(e){return J({ok:false,error:"Petición no válida."},400)}
      const dd=b&&b.d&&typeof b.d==="object"?b.d:{},d=day(),st=[];
      for(const k of Object.keys(dd).slice(0,60)){if(!PK.test(k))continue;const cap=CAP[k]||(/^t\d+[ao]$/.test(k)?200:0),v=int(dd[k],cap);if(v>0)st.push(DB.prepare("INSERT INTO pu (b,d,k,v) VALUES (?1,?2,?3,?4) ON CONFLICT(b,d,k) DO UPDATE SET v=v+excluded.v").bind(PB,d,k,v))}
      if(st.length)await DB.batch(st);return J({ok:true,n:st.length})}
    if(request.method==="DELETE"){if(!isAdm(request,env))return J({ok:false,error:"No autorizado."},401);await DB.prepare("DELETE FROM pu WHERE b=?1").bind(PB).run();return J({ok:true})}}
  if(request.method==="GET"){
    const id=url.searchParams.get("id")||"";
    return J({ok:true,...await board(DB,okId(id)?id:"",isAdm(request,env),T)})}
  if(request.method==="POST"){
    let b;try{b=await request.json()}catch(e){return J({ok:false,error:"Petición no válida."},400)}
    const id=String(b.id||""),now=Date.now();
    if(!okId(id))return J({ok:false,error:"Identificador no válido."},400);
    const xpIn=int(b.xp,200000),streak=int(b.streak,2000),cards=int(b.cards,400),badges=int(b.badges,100),mins=int(b.mins,200000);
    const row=(await DB.prepare("SELECT * FROM "+T+" WHERE id=?1").bind(id).all()).results[0];
    if(!row){
      const n=(await DB.prepare("SELECT COUNT(*) c FROM "+T+"").all()).results[0].c;
      if(n>=MAXP*2)return J({ok:false,error:"La clasificación está completa."},429);
      const xp=Math.min(xpIn,8000);
      await DB.prepare("INSERT INTO "+T+" (id,xp,wkn,wbase,streak,cards,badges,mins,upd) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)").bind(id,xp,week(),xp,streak,cards,badges,mins,now).run();
    }else{
      if(now-row.upd<15000)return J({ok:true,throttled:true,...await board(DB,id,false,T)});
      const hrs=Math.min(48,(now-row.upd)/36e5),allowed=row.xp+300+Math.floor(150*hrs);
      const xp=xpIn>=row.xp?Math.min(xpIn,allowed):xpIn;
      const w=week(),wbase=row.wkn===w?row.wbase:row.xp;
      await DB.prepare("UPDATE "+T+" SET xp=?2,wkn=?3,wbase=?4,streak=?5,cards=?6,badges=?7,mins=?8,upd=?9 WHERE id=?1").bind(id,xp,w,Math.min(wbase,xp),streak,cards,badges,mins,now).run()}
    return J({ok:true,...await board(DB,id,false,T)})}
  if(request.method==="DELETE"){
    if(url.searchParams.get("all")==="1"){if(!isAdm(request,env))return J({ok:false,error:"No autorizado."},401);
      await DB.prepare("DELETE FROM "+T+"").run();return J({ok:true})}
    const id=url.searchParams.get("id")||"";
    if(!okId(id))return J({ok:false,error:"Identificador no válido."},400);
    await DB.prepare("DELETE FROM "+T+" WHERE id=?1").bind(id).run();return J({ok:true})}
  return J({ok:false,error:"Método no permitido."},405)}
