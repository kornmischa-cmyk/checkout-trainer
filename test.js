const path=require('path');const CO=require('./src/logic.js');const fs=require('fs');
const R=CO.parseRoutes(fs.readFileSync(path.join(__dirname,'src','routes.txt'),'utf8'));
const assert=require('assert');
// jede Standardroute muss sich selbst bestehen
let n=0;for(const s in R){assert(CO.evaluate(+s,R[s]).ok,s);n++;}
// Bull zählt 50, S25 zählt 25
assert.equal(CO.dartValue({m:'D',n:25}),50);assert.equal(CO.dartValue({m:'S',n:25}),25);
// Fehlerfälle
assert(!CO.evaluate(40,[{m:'S',n:20},{m:'S',n:20}]).ok);       // letzter Dart kein Double
assert(!CO.evaluate(40,[{m:'D',n:19}]).ok);                    // falsche Summe
assert(!CO.evaluate(40,[]).ok);
assert(CO.evaluate(40,[{m:'S',n:20},{m:'S',n:10},{m:'D',n:5}]).ok); // 20+10+10 = 40, anderer Weg
assert(CO.evaluate(41,[{m:'S',n:25},{m:'S',n:16}]).ok===false);
assert(CO.evaluate(41,[{m:'S',n:25},{m:'D',n:8}]).ok);        // 25+16
assert(!CO.evaluate(2,[{m:'S',n:1},{m:'S',n:1}]).ok);
// Boxen
assert.equal(CO.nextBox(0,true,false),2);assert.equal(CO.nextBox(0,true,true),1);
assert.equal(CO.nextBox(5,true,false),5);assert.equal(CO.nextBox(4,false,false),1);
// Auswahl: nie direkt wiederholen, gewichtet
const pool=CO.pool(R,41,60);assert.equal(pool.length,20);
let prev=null,cnt={};const boxes={};pool.forEach((s,i)=>boxes[s]=i<10?1:5);
for(let i=0;i<20000;i++){const p=CO.pick(pool,boxes,prev,Math.random);assert(p!==prev);prev=p;cnt[p]=(cnt[p]||0)+1;}
const low=pool.slice(0,10).reduce((a,s)=>a+cnt[s],0),high=pool.slice(10).reduce((a,s)=>a+cnt[s],0);
console.log('Routen',n,'ok | Box1:Box5 Häufigkeit ≈',(low/high).toFixed(1),'(Soll ≈ 8)');
assert(low/high>5&&low/high<11);
console.log('alle Tests bestanden');
