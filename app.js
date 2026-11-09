const ROWS=4,COLS=10,N=ROWS*COLS,EY=1.5,TTL=12;
const $=id=>document.getElementById(id);
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const dist=s=>s.c+1+Math.abs(s.r-EY);
function mk(){const a=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const e=r%3===0;a.push({id:r*COLS+c+1,r,c,type:c===0&&e?'D':c===COLS-1&&e?'E':'N',state:'free',car:null,exp:0})}return a}
function gen(n,seed){const R=rng(seed),a=[];for(let i=0;i<n;i++){const x=R(),res=R()<.2;const arrive=Math.floor(R()*150);a.push({id:i+1,type:x<.08?'D':x<.16?'E':'N',arrive,dur:30+Math.floor(R()*70),res,noShow:res&&R()<.25,book:res?Math.max(0,arrive-8):arrive,state:'new',bk:false})}return a}
class Sim{
 constructor(strat,n,seed){this.strat=strat;this.t=0;this.spots=mk();this.cars=gen(n,seed);this.queue=[];this.logs=[];this.score=0;this.st={served:0,rel:0,maxQ:0,fill:0,peak:0,search:0,n:0}}
 log(m){this.logs.push(`[${this.t}] ${m}`)}
 pick(type){const f=this.spots.filter(s=>s.state==='free'&&s.type===type);if(!f.length)return null;
  if(this.strat==='near')return f.reduce((a,b)=>dist(b)<dist(a)?b:a);
  const occ=Array(ROWS).fill(0);this.spots.forEach(s=>{if(s.state!=='free')occ[s.r]++});
  return f.reduce((a,b)=>(occ[b.r]-occ[a.r]||dist(b)-dist(a))<0?b:a)}
 go(c,s){s.state='taken';s.car=c;c.spot=s;c.state='drive';c.t0=this.t;c.tr=Math.max(1,Math.ceil(dist(s)/2));c.parkAt=this.t+c.tr;c.leaveT=c.parkAt+c.dur;this.st.search+=this.t-c.arrive+c.tr;this.st.n++}
 done(){return this.cars.every(c=>c.state==='gone')&&!this.queue.length}
 step(){const t=++this.t,S=this.spots;
  for(const c of this.cars){
   if(c.state==='drive'&&t>=c.parkAt)c.state='park';
   if(c.state==='park'&&t>=c.leaveT){c.state='leave';c.ls=t;c.spot.state='free';c.spot.car=null;this.st.served++;this.score+=10;this.log(`🚗 №${c.id} шықты, №${c.spot.id} орны бос`)}
   else if(c.state==='leave'&&t>=c.ls+3)c.state='gone'}
  for(const s of S)if(s.state==='res'&&t>=s.exp){if(s.car)s.car.state='gone';s.state='free';s.car=null;this.st.rel++;this.log(`⏱ №${s.id} брондау мерзімі өтті — орын қайта босатылды`)}
  for(const c of this.cars)if(c.state==='new'&&c.res&&!c.bk&&t>=c.book){c.bk=true;const s=this.pick(c.type);if(s){s.state='res';s.car=c;s.exp=t+TTL;c.rs=s;this.log(`📅 №${s.id} орны брондалды`)}}
  for(const c of this.cars)if(c.state==='new'&&t>=c.arrive&&(!c.res||c.bk)){
   if(c.rs&&c.noShow)continue;
   if(c.rs)this.go(c,c.rs);else{c.state='queue';this.queue.push(c);this.log(`⏳ №${c.id} ${c.type==='N'?'':c.type==='D'?'♿ ':'⚡ '}кезекке тұрды`)}}
  this.queue=this.queue.filter(c=>{const s=this.pick(c.type);if(s){this.go(c,s);return false}return true});
  const occ=S.filter(s=>s.state==='taken').length/N*100;
  this.st.fill+=occ;this.st.peak=Math.max(this.st.peak,occ);this.st.maxQ=Math.max(this.st.maxQ,this.queue.length);
  this.score-=this.queue.length*0.2}
}
function bench(strat,n){let a=0,q=0,f=0,p=0,r=0,k=5;for(let i=0;i<k;i++){const s=new Sim(strat,n,100+i*7);while(!s.done()&&s.t<4000)s.step();a+=s.st.search/s.st.n;q+=s.st.maxQ;f+=s.st.fill/s.t;p+=s.st.peak;r+=s.st.rel}return{a:a/k,q:q/k,f:f/k,p:p/k,r:r/k}}
function compare(){const rows=[[ 'Сценарий','Стратегия','Іздеу, такт','Макс. кезек','Орт. толу %','Пик %']];let h='<tr>'+rows[0].map(x=>`<th>${x}</th>`).join('')+'</tr>';
 for(const n of[20,50,100]){const A=bench('near',n),B=bench('bal',n);
  const cell=(x,y,lowBetter,fmt)=>[x,y].map((v,i)=>{const o=i?x:y;const w=lowBetter?v<o:v>o;return `<td class="${w?'w':''}">${fmt(v)}</td>`});
  const m=[['a',1],['q',1],['f',0],['p',0]];
  [['Ең жақын',A,0],['Теңестіру',B,1]].forEach(([nm,R,i])=>{h+=`<tr><td>${i?'':n+' көлік'}</td><td>${nm}</td>`+m.map(([k,l])=>cell(A[k],B[k],l,v=>v.toFixed(1))[i]).join('')+'</tr>'})}
 $('tbl').innerHTML=h}


// ================= 3D =================
let sim,run=false,spd=2,lastT=0,night=false,lastKey='',lastLog=-1;
const SZ=[-9.5,-5,5,9.5],px=s=>(s.c-4.5)*3,pz=s=>SZ[s.r],QX=-24,EXIT=34;
const PAL=[0xe63946,0xf4a261,0x2a9d8f,0xe9c46a,0x457b9d,0xf1f1f1,0x8d99ae,0xff7aa2];
const view=$('view'),scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.1,500);
const ren=new THREE.WebGLRenderer({antialias:true});ren.shadowMap.enabled=true;ren.setPixelRatio(Math.min(devicePixelRatio||1,2));view.appendChild(ren.domElement);
const amb=new THREE.AmbientLight(0xffffff,.65),sun=new THREE.DirectionalLight(0xffffff,.85);
sun.position.set(-25,45,25);sun.castShadow=true;{const c=sun.shadow.camera;c.left=-55;c.right=55;c.top=45;c.bottom=-45}sun.shadow.mapSize.set(2048,2048);scene.add(amb,sun);
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o||{}));
function box(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m}
function flat(w,d,c,x,y,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),M(c));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m}
flat(400,400,0x4f8a47,0,-.05,0);flat(36,25,0x2b3037,0,0,0);flat(130,6,0x2b3037,-20,0,0);
for(let x=-80;x<44;x+=5)flat(2.2,.2,0xf1f1f1,x,.01,0);
box(36.6,.3,.4,0x9aa3ad,0,.15,-12.6);box(36.6,.3,.4,0x9aa3ad,0,.15,12.6);
const bulbs=[];
for(const [x,z] of [[-17,-4.5],[17,-4.5],[-17,4.5],[17,4.5],[0,-4.5],[0,4.5]]){box(.25,5,.25,0x555b63,x,2.5,z);const b=new THREE.Mesh(new THREE.SphereGeometry(.45,12,12),M(0xfff2b0,{emissive:0xfff2b0,emissiveIntensity:0}));b.position.set(x,5.2,z);scene.add(b);bulbs.push(b)}
for(let i=0;i<14;i++){const x=-60+i*9,z=(i%2?1:-1)*(16+(i%3)*3);box(.5,2,.5,0x6b4a2b,x,1,z);const t=new THREE.Mesh(new THREE.ConeGeometry(2,5,8),M(0x2e7d32));t.position.set(x,4.2,z);t.castShadow=true;scene.add(t)}
box(3,3,3,0xe5e7eb,-22,1.5,-5.5);box(3.2,.3,3.2,0x2563eb,-22,3.15,-5.5);
box(.4,2,.4,0x333,-22,1,-3.2);
const arm=new THREE.Group();arm.position.set(-22,1.7,-3.2);const am=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,6.4),M(0xdc2626));am.position.z=3.2;arm.add(am);scene.add(arm);
// spots
const SO={};
mk().forEach(s=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const tex=new THREE.CanvasTexture(cv);
 const slab=new THREE.Mesh(new THREE.PlaneGeometry(2.7,4.3),M(0x1f6f43));slab.rotation.x=-Math.PI/2;slab.position.set(px(s),.02,pz(s));slab.receiveShadow=true;slab.userData.id=s.id;scene.add(slab);
 const lab=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:tex,transparent:true}));lab.rotation.x=-Math.PI/2;lab.position.set(px(s),.04,pz(s));scene.add(lab);
 const ln=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.7,4.3)),new THREE.LineBasicMaterial({color:0xffffff}));ln.rotation.x=-Math.PI/2;ln.position.set(px(s),.05,pz(s));scene.add(ln);
 SO[s.id]={slab,cv,tex,key:''}});
const COL={N:0x1f6f43,D:0x1d4f91,E:0x5b3fa5,taken:0x8b2a2a,res:0xb89b1a};
function updSpot(s){const o=SO[s.id],left=s.state==='res'?Math.max(0,s.exp-sim.t):'',k=s.state+left;if(o.key===k)return;o.key=k;
 o.slab.material.color.setHex(s.state==='taken'?COL.taken:s.state==='res'?COL.res:COL[s.type]);
 const x=o.cv.getContext('2d');x.clearRect(0,0,128,128);x.fillStyle='#fff';x.font='bold 64px sans-serif';x.textAlign='center';x.textBaseline='middle';x.save();x.translate(64,64);x.rotate(-Math.PI/2);
 const t=s.state==='taken'?'':s.state==='res'?'⏱'+left:s.type==='D'?'♿':s.type==='E'?'⚡':s.id;if(String(t).length>2)x.font='bold 44px sans-serif';x.fillText(t,0,0);x.restore();o.tex.needsUpdate=true}
// cars
const glass=M(0x1b2a3a,{roughness:.2,metalness:.3}),tire=M(0x111111),lm=M(0xfff2b0,{emissive:0xfff2b0,emissiveIntensity:1});
function makeCar(c){const g=new THREE.Group(),col=c.type==='D'?0x2563eb:c.type==='E'?0x16a34a:PAL[c.id%PAL.length];
 let m=new THREE.Mesh(new THREE.BoxGeometry(4,.8,1.8),M(col,{roughness:.35,metalness:.3}));m.position.y=.65;m.castShadow=true;g.add(m);
 m=new THREE.Mesh(new THREE.BoxGeometry(2.1,.7,1.6),glass);m.position.set(-.3,1.35,0);m.castShadow=true;g.add(m);
 for(const [a,b] of [[1.2,.9],[1.2,-.9],[-1.2,.9],[-1.2,-.9]]){m=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.3,12),tire);m.rotation.x=Math.PI/2;m.position.set(a,.38,b);g.add(m)}
 for(const z of [.6,-.6]){m=new THREE.Mesh(new THREE.BoxGeometry(.1,.2,.4),lm);m.position.set(2,.7,z);g.add(m)}
 return g}
const CO={};
function along(p,q){let L=[],T=0;for(let i=0;i<p.length-1;i++){const l=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]);L.push(l);T+=l}let d=q*T;
 for(let i=0;i<L.length;i++){if(d<=L[i]||i===L.length-1){const f=L[i]?Math.min(1,d/L[i]):1,a=p[i],b=p[i+1];return{x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,h:Math.atan2(-(b[1]-a[1]),b[0]-a[0])}}d-=L[i]}}
function frame(fr){const tf=sim.t+fr;let open=false;sim.spots.forEach(updSpot);const seen={};
 for(const c of sim.cars){const st=c.state;if(st!=='queue'&&st!=='drive'&&st!=='park'&&st!=='leave')continue;seen[c.id]=1;let r,q=false;
  if(st==='queue'){q=true;r={x:QX-2-sim.queue.indexOf(c)*5.2,z:0,h:0}}
  else{const s=c.spot,X=px(s),Z=pz(s);
   if(st==='drive'){const p=Math.min(1,(tf-c.t0)/c.tr);r=along([[QX,0],[X,0],[X,Z]],p);if(r.x<-16)open=true}
   else if(st==='park')r={x:X,z:Z,h:Z<0?Math.PI/2:-Math.PI/2};
   else r=along([[X,Z],[X,0],[EXIT,0]],Math.min(1,(tf-c.ls)/3))}
  let g=CO[c.id];if(!g){g=CO[c.id]=makeCar(c);scene.add(g);g.rot=r.h;g.position.set(q?-62:r.x,0,r.z)}
  if(q){g.position.x+=(r.x-g.position.x)*.12;g.position.z=0;if(g.position.x<-30)open=false}else g.position.set(r.x,0,r.z);
  let d=r.h-g.rot;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;g.rot+=d*.25;g.rotation.y=g.rot}
 for(const id in CO)if(!seen[id]){scene.remove(CO[id]);delete CO[id]}
 arm.rotation.x+=((open?-1.35:0)-arm.rotation.x)*.2}
function ui(){const S=sim.spots,st=sim.st,occ=S.filter(s=>s.state==='taken').length;
 const items=[['Такт',sim.t],['Толу',Math.round(occ/N*100)+'%'],['Кезек',sim.queue.length],['Макс. кезек',st.maxQ],['Қызмет көрсетілді',st.served],['Брондау босатылды',st.rel],['Орт. іздеу',(st.n?st.search/st.n:0).toFixed(1)],['Ұпай',Math.round(sim.score)]];
 const h=items.map(([a,b])=>`<div class="st"><b>${b}</b><span>${a}</span></div>`).join('');if(h!==lastKey){lastKey=h;$('stats').innerHTML=h}
 if(sim.logs.length!==lastLog){lastLog=sim.logs.length;$('qv').textContent=sim.queue.length?'Кезекте: '+sim.queue.map(c=>'№'+c.id+(c.type==='N'?'':c.type==='D'?'♿':'⚡')).join(', '):'Кезек бос'+(sim.done()?' · Симуляция аяқталды ✅':'');$('log').innerHTML=sim.logs.slice(-40).reverse().join('<br>')}}
// camera
const CV={th:Math.PI/2,ph:.95,R:52};
function setCam(){cam.position.set(CV.R*Math.sin(CV.ph)*Math.cos(CV.th)-4,CV.R*Math.cos(CV.ph),CV.R*Math.sin(CV.ph)*Math.sin(CV.th));cam.lookAt(-4,0,0)}
const P=new Map();let down=null;const cvs=ren.domElement;
cvs.addEventListener('pointerdown',e=>{cvs.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);down=[e.clientX,e.clientY,Date.now()]});
cvs.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const o=P.get(e.pointerId);
 if(P.size===1){CV.th-=(e.clientX-o[0])*.007;CV.ph=Math.max(.05,Math.min(1.45,CV.ph-(e.clientY-o[1])*.006))}
 else{const k=[...P.keys()],a=P.get(k[0]),b=P.get(k[1]),d0=Math.hypot(a[0]-b[0],a[1]-b[1]);P.set(e.pointerId,[e.clientX,e.clientY]);const a2=P.get(k[0]),b2=P.get(k[1]),d1=Math.hypot(a2[0]-b2[0],a2[1]-b2[1]);CV.R=Math.max(15,Math.min(100,CV.R*d0/(d1||d0)))}
 P.set(e.pointerId,[e.clientX,e.clientY])});
cvs.addEventListener('pointerup',e=>{P.delete(e.pointerId);if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6&&Date.now()-down[2]<400)pick(e);down=null});
cvs.addEventListener('wheel',e=>{e.preventDefault();CV.R=Math.max(15,Math.min(100,CV.R*(1+e.deltaY*.001)))},{passive:false});
const ray=new THREE.Raycaster();
function pick(e){const r=cvs.getBoundingClientRect();ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-((e.clientY-r.top)/r.height)*2+1},cam);
 const h=ray.intersectObjects(Object.values(SO).map(o=>o.slab))[0];if(!h)return;const s=sim.spots[h.object.userData.id-1];
 if(s.state==='free'){s.state='res';s.exp=sim.t+15;s.car=null;sim.log(`📅 №${s.id} орны қолмен брондалды (15 такт)`)}}
function rs(){const w=view.clientWidth,h=view.clientHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',rs);
function setNight(n){night=n;scene.background=new THREE.Color(n?0x0b1226:0x9ec9ff);amb.intensity=n?.25:.65;sun.intensity=n?.15:.85;bulbs.forEach(b=>b.material.emissiveIntensity=n?2:0);$('night').textContent=n?'☀ Күн':'🌙 Түн'}
function reset(){sim=new Sim($('strat').value,+$('scn').value,42);for(const id in CO){scene.remove(CO[id]);delete CO[id]}for(const id in SO)SO[id].key='';run=false;lastT=performance.now();lastKey='';lastLog=-1}
function loop(now){if(run&&!sim.done()){const ms=600/spd;if(now-lastT>=ms){const k=Math.min(3,Math.floor((now-lastT)/ms));for(let i=0;i<k;i++)sim.step();lastT=now}}else lastT=now;
 frame(run?Math.min(1,(now-lastT)/(600/spd)):0);ui();setCam();ren.render(scene,cam);requestAnimationFrame(loop)}
$('run').onclick=()=>{run=true;lastT=performance.now()};$('pause').onclick=()=>run=false;$('reset').onclick=reset;
$('strat').onchange=reset;$('scn').onchange=reset;$('spd').onchange=e=>spd=+e.target.value;
function add(t){sim.cars.push({id:sim.cars.length+1,type:t,arrive:sim.t,dur:30+Math.floor(Math.random()*40),res:false,noShow:false,book:sim.t,state:'new',bk:false});if(!run)sim.step()}
$('addN').onclick=()=>add('N');$('addD').onclick=()=>add('D');$('addE').onclick=()=>add('E');
$('test').onclick=()=>{const s=sim.pick('N');if(!s)return sim.log('Бос орын жоқ');s.state='res';s.exp=sim.t+5;s.car=null;sim.log(`🧪 Тест: №${s.id} орны 5 тактке брондалды, көлік келмейді`);run=true;lastT=performance.now()};
$('cmp').onclick=compare;
$('cTop').onclick=()=>{CV.th=Math.PI/2;CV.ph=.06;CV.R=58};$('cIso').onclick=()=>{CV.th=Math.PI/2;CV.ph=.95;CV.R=52};$('cGate').onclick=()=>{CV.th=Math.PI+.25;CV.ph=1.2;CV.R=30};
$('night').onclick=()=>setNight(!night);
setNight(false);reset();rs();compare();requestAnimationFrame(loop);
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
