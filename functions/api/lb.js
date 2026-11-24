// Clasificación pública de «Historia de España PAU».
// Cloudflare Pages Function + base de datos D1 (binding: DB). Solo se guardan un alias elegido por el alumno,
// su grupo y cifras de progreso. Sin nombres reales, sin cookies, sin IP.
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,DELETE,OPTIONS","access-control-allow-headers":"content-type,x-admin","cache-control":"no-store"};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,"content-type":"application/json;charset=utf-8"}});
const MAXP=600,GROUPS=["2B","2C","otro"];
const BAD_SUB="mierda joder follar cabron gilipolla imbecil idiota subnormal retrasado mongolo zorra maricon violador pedofilo negrata sudaca capullo hijoputa hitler fuck shit bitch nigger pollas".split(" ");
const BAD_TOK=new Set("puta puto putas putos cono polla pene culo teta tetas caca pedo moro guarra marica mamon mamada verga hdp ctm nazi pajero dick cunt rape fag slut whore cagar chupa pija".split(" "));
const LEET={"0":"o","1":"i","3":"e","4":"a","5":"s","7":"t","@":"a","$":"s","!":"i"};
const fold=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[013457@$!]/g,c=>LEET[c]);
function badAlias(a){const f=fold(a),n=f.replace(/[^a-z]/g,"");
  if(BAD_TOK.has(n)||f.split(/[^a-z]+/).some(t=>BAD_TOK.has(t)))return true;
  return BAD_SUB.some(w=>n.includes(w))}
const week=(t=Date.now())=>Math.floor((Math.floor(t/864e5)+3)/7);
const int=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
let ready=false;
async function init(DB){if(ready)return;
  await DB.prepare("CREATE TABLE IF NOT EXISTS lb (id TEXT PRIMARY KEY, alias TEXT NOT NULL UNIQUE COLLATE NOCASE, grp TEXT NOT NULL DEFAULT 'otro', xp INTEGER NOT NULL DEFAULT 0, wkn INTEGER NOT NULL DEFAULT 0, wbase INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, cards INTEGER NOT NULL DEFAULT 0, badges INTEGER NOT NULL DEFAULT 0, mins INTEGER NOT NULL DEFAULT 0, upd INTEGER NOT NULL DEFAULT 0)").run();
  ready=true}
const pub=r=>({alias:r.alias,grp:r.grp,xp:r.xp,wxp:Math.max(0,r.xp-(r.wkn===week()?r.wbase:r.xp)),streak:r.streak,cards:r.cards,badges:r.badges,mins:r.mins});
async function board(DB,grp,id){
  const w=week(),W=grp&&GROUPS.includes(grp)?" WHERE grp=?1":"",A=grp&&GROUPS.includes(grp)?[grp]:[];
  const run=async(sql,args=[])=>(await DB.prepare(sql).bind(...args).all()).results||[];
  const wx="CASE WHEN wkn="+w+" THEN xp-wbase ELSE 0 END";
  const all=await run("SELECT * FROM lb"+W+" ORDER BY xp DESC, upd ASC LIMIT 60",A);
  const byw=await run("SELECT * FROM lb"+W+" ORDER BY "+wx+" DESC, xp DESC LIMIT 60",A);
  const bys=await run("SELECT * FROM lb"+W+" ORDER BY streak DESC, xp DESC LIMIT 30",A);
  const byc=await run("SELECT * FROM lb"+W+" ORDER BY cards DESC, xp DESC LIMIT 30",A);
  const agg=(await run("SELECT COUNT(*) n, COALESCE(SUM(xp),0) sx, COALESCE(SUM(mins),0) sm FROM lb"+W,A))[0]||{n:0,sx:0,sm:0};
  let me=null;
  if(id){const r=(await run("SELECT * FROM lb WHERE id=?1",[id]))[0];
    if(r){const cnt=async(col,val)=>(await run("SELECT COUNT(*) c FROM lb"+(W?W+" AND":" WHERE")+" "+col+">"+(W?"?2":"?1"),W?[grp,val]:[val]))[0].c+1;
      const mw=Math.max(0,r.xp-(r.wkn===w?r.wbase:r.xp));
      me={...pub(r),rank:await cnt("xp",r.xp),rankW:(await run("SELECT COUNT(*) c FROM lb"+(W?W+" AND":" WHERE")+" "+wx+">"+(W?"?2":"?1"),W?[grp,mw]:[mw]))[0].c+1,rankS:await cnt("streak",r.streak),rankC:await cnt("cards",r.cards)}}}
  return{week:w,n:agg.n,xp:agg.sx,mins:agg.sm,xpT:all.map(pub),wk:byw.map(pub),streak:bys.map(pub),cards:byc.map(pub),me}}
export async function onRequest({request,env}){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  const DB=env.DB;if(!DB)return J({ok:false,error:"La base de datos no está configurada."},503);
  try{await init(DB)}catch(e){return J({ok:false,error:"Base de datos no disponible."},503)}
  const url=new URL(request.url);
  if(request.method==="GET"){
    const id=url.searchParams.get("id")||"",grp=url.searchParams.get("g")||"";
    return J({ok:true,...await board(DB,grp,/^[a-z0-9-]{16,48}$/.test(id)?id:"",)})}
  if(request.method==="POST"){
    let b;try{b=await request.json()}catch(e){return J({ok:false,error:"Petición no válida."},400)}
    const id=String(b.id||""),now=Date.now();
    if(!/^[a-z0-9-]{16,48}$/.test(id))return J({ok:false,error:"Identificador no válido."},400);
    const alias=String(b.alias||"").normalize("NFC").replace(/\s+/g," ").trim();
    if(alias.length<3||alias.length>16||!/^[\p{L}\p{N} ._-]+$/u.test(alias))return J({ok:false,error:"El alias debe tener de 3 a 16 caracteres: letras, números, espacios, punto, guion."},400);
    if(badAlias(alias))return J({ok:false,error:"Ese alias no está permitido. Elige otro."},400);
    const grp=GROUPS.includes(b.grp)?b.grp:"otro";
    const xpIn=int(b.xp,200000),streak=int(b.streak,2000),cards=int(b.cards,400),badges=int(b.badges,100),mins=int(b.mins,200000);
    const row=(await DB.prepare("SELECT * FROM lb WHERE id=?1").bind(id).all()).results[0];
    const clash=(await DB.prepare("SELECT id FROM lb WHERE alias=?1").bind(alias).all()).results[0];
    if(clash&&clash.id!==id)return J({ok:false,error:"Ese alias ya está en uso. Elige otro."},409);
    if(!row){
      const n=(await DB.prepare("SELECT COUNT(*) c FROM lb").all()).results[0].c;
      if(n>=MAXP*2)return J({ok:false,error:"La clasificación está completa."},429);
      const xp=Math.min(xpIn,8000);
      await DB.prepare("INSERT INTO lb (id,alias,grp,xp,wkn,wbase,streak,cards,badges,mins,upd) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)").bind(id,alias,grp,xp,week(),xp,streak,cards,badges,mins,now).run();
    }else{
      if(now-row.upd<15000&&alias===row.alias&&grp===row.grp)return J({ok:true,throttled:true,...await board(DB,"",id)});
      const hrs=Math.min(48,(now-row.upd)/36e5),allowed=row.xp+300+Math.floor(150*hrs);
      const xp=xpIn>=row.xp?Math.min(xpIn,allowed):xpIn;
      const w=week(),wbase=row.wkn===w?row.wbase:row.xp;
      await DB.prepare("UPDATE lb SET alias=?2,grp=?3,xp=?4,wkn=?5,wbase=?6,streak=?7,cards=?8,badges=?9,mins=?10,upd=?11 WHERE id=?1").bind(id,alias,grp,xp,w,Math.min(wbase,xp),streak,cards,badges,mins,now).run()}
    return J({ok:true,...await board(DB,"",id)})}
  if(request.method==="DELETE"){
    const adm=request.headers.get("x-admin")||"",al=url.searchParams.get("alias")||"";
    if(al){if(!env.ADMIN_TOKEN||adm!==env.ADMIN_TOKEN)return J({ok:false,error:"No autorizado."},401);
      await DB.prepare("DELETE FROM lb WHERE alias=?1").bind(al).run();return J({ok:true})}
    const id=url.searchParams.get("id")||"";
    if(!/^[a-z0-9-]{16,48}$/.test(id))return J({ok:false,error:"Identificador no válido."},400);
    await DB.prepare("DELETE FROM lb WHERE id=?1").bind(id).run();return J({ok:true})}
  return J({ok:false,error:"Método no permitido."},405)}
