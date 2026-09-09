/* Original 48px creature atlas. Eight pet poses and six enemy poses are built
   lazily once per species (< 800 KiB total); gameplay is never stored in sprites. */
(()=>{'use strict';
const SIZE=48,PET_IDS=['index_fox','append_slime','slice_owl','sort_bot'],MOB_IDS=['slime','bat','bug','frog','moth','crab','crawler','wisp','mimic'];
function paint(g,id,frame){
 const ink='#101a27',cream='#e9f6de',gold='#e7bc70';
 const r=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 const p=(c,pts)=>{g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const l=(c,w,pts)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const step=[0,2,0,-2,0,0,3,-3][frame%8],blink=frame===5,skill=frame>=6,warn=frame===4;
 const eye=(x,y,wide=5,color='#9ceeff')=>{if(blink){r(ink,x,y+3,wide,1);return;}r(cream,x,y,wide,6);r(color,x+2,y+1,wide-2,4);r(ink,x+wide-2,y+1,2,4);r('#fff',x+wide-2,y+1,1,1);};
 const legs=(xs,y,color)=>{xs.forEach((x,i)=>{const off=i%2?step:-step;p(ink,[[x,y],[x+7,y],[x+6,y+8+off],[x+9,y+10],[x-2,y+10],[x-2,y+7+off]]);r(color,x,y+2,5,5);r(cream,x-1,y+8,7,1);});};
 if(id==='index_fox'){
   p(ink,[[17,34],[8,38],[0,32],[1,18-step],[5,16-step],[11,28],[17,28]]);
   p('#357da1',[[16,33],[8,35],[3,30],[3,21-step],[7,24],[11,31]]);p('#d6f2e9',[[2,19-step],[5,18-step],[9,27],[5,27],[3,24]]);
   legs([17,31],35,'#3d667c');p(ink,[[14,26],[34,25],[41,33],[39,40],[15,40],[12,34]]);p('#5497b3',[[17,28],[33,27],[38,32],[36,37],[17,38]]);p('#d8ebe0',[[25,28],[33,28],[35,35],[28,38],[23,35]]);
   p(ink,[[15,18],[13,4],[19,1],[26,11],[32,11],[40,1],[43,5],[42,24],[47,27],[43,33],[23,32],[17,27]]);
   p('#62bdd9',[[17,8],[19,5],[25,15],[34,15],[40,5],[40,22],[37,26],[44,28],[40,30],[23,29],[19,23]]);
   p('#344f74',[[17,8],[19,6],[23,15],[19,14]]);p('#a2d8e4',[[37,14],[40,7],[40,17]]);
   p('#a1e2e5',[[20,18],[25,15],[32,17],[34,21],[22,22]]);eye(32,20,6,'#607896');
   p(cream,[[29,27],[43,26],[44,29],[38,32],[31,31],[26,28]]);r(ink,43,26,4,3);r('#c5dee4',23,25,2,2);
   p('#8f4654',[[17,30],[30,32],[32,35],[20,35],[16,41],[13,39]]);r('#ecc790',20,32,8,1);
   r('#715b41',18,35,7,7);r('#b79664',19,36,5,2);
   if(skill){l(gold,1,[[34,4],[36,0],[38,4]]);r('#ffedb4',43,14,3,3);}
 }else if(id==='append_slime'||id==='slime'){
   const friendly=id==='append_slime',dark=friendly?'#277c6e':'#764862',mid=friendly?'#52c897':'#b57483',light=friendly?'#99ebaf':'#e7a8a1',s=skill?-3:step;
   p(ink,[[4,41],[1,35],[6,23+s],[12,14+s],[29,11+s],[40,19+s],[47,36],[42,43],[12,46]]);
   p(dark,[[5,38],[7,24+s],[14,17+s],[29,14+s],[38,22+s],[44,36],[39,41],[13,43]]);
   p(mid,[[9,34],[11,23+s],[18,17+s],[29,16+s],[36,23+s],[39,35],[32,40],[15,39]]);
   p(light,[[12,23+s],[18,18+s],[25,17+s],[22,22+s],[15,27+s]]);r('#ddffe3',15,20+s,5,2);
   for(let n=0;n<4;n++)r(light,7+n*9,37+n%2*3,3,2);
   eye(17,27+s,5,friendly?'#4b9a7d':'#842735');eye(30,26+s,5,friendly?'#4b9a7d':'#842735');l(ink,1,[[24,35+s],[27,37+s],[31,35+s]]);
   if(friendly){l('#668050',2,[[23,15+s],[25,6+s]]);p('#a4da83',[[24,9+s],[18,7+s],[16,2+s],[23,3+s],[26,7+s],[30,1+s],[35,3+s],[33,8+s]]);r('#e3f5bd',20,4+s,3,1);if(skill){r(cream,23,19,3,10);r(cream,20,22,9,3);}}
   else{p('#ddd3b7',[[14,13+s],[19,6+s],[25,11+s],[31,5+s],[34,13+s]]);l('#49343f',1,[[18,26+s],[23,28+s]]);}
 }else if(id==='slice_owl'||id==='bat'||id==='moth'){
   const owl=id==='slice_owl',bat=id==='bat',wing=owl?'#937cb9':bat?'#7a547d':'#c78969',shade=owl?'#604d83':bat?'#3b344e':'#705474';
   const flap=skill?12:step*3;
   p(ink,[[23,21],[12,9-flap],[3,6],[0,15+flap],[5,31],[17,36],[23,29],[31,37],[43,29],[48,14+flap],[44,6],[34,9-flap],[27,21]]);
   p(wing,[[21,25],[12,13-flap],[4,10],[3,16+flap],[9,29],[17,31]]);p(wing,[[28,25],[36,13-flap],[44,10],[45,16+flap],[39,29],[31,31]]);
   for(let j=0;j<3;j++){l(shade,2,[[22,27],[8+j*4,16+j*5]]);l(shade,2,[[27,27],[40-j*4,16+j*5]]);}
   p(ink,[[14,14],[16,3],[22,9],[27,8],[34,3],[36,17],[34,37],[26,44],[17,39]]);p(shade,[[17,14],[17,8],[23,12],[28,12],[33,8],[33,34],[26,40],[19,36]]);
   if(owl){p('#d6c7df',[[16,20],[20,16],[25,19],[30,16],[34,20],[32,30],[25,36],[18,30]]);eye(18,21,5,'#bf963f');eye(28,21,5,'#bf963f');p(gold,[[23,28],[29,28],[26,33]]);for(let j=0;j<3;j++)p('#a68abf',[[19+j*5,34],[23+j*5,34],[21+j*5,38]]);legs([17,28],35,gold);if(skill)l('#cceaff',2,[[2,38],[14,41],[26,42],[43,37]]);}
   else if(bat){r('#bc8094',21,12,8,6);eye(18,23,5,'#e0806e');eye(29,23,5,'#e0806e');p('#faf0cd',[[21,32],[24,32],[23,36]]);p('#faf0cd',[[28,32],[31,32],[29,36]]);}
   else{for(const x of [7,34]){r('#edc989',x,20,7,8);r('#70416a',x+2,22,3,4);}r('#f3d49c',23,13,5,27);l(ink,2,[[23,14],[18,8],[17,3]]);l(ink,2,[[27,14],[32,8],[34,4]]);eye(22,18,4,'#d48956');}
 }else if(id==='sort_bot'){
   legs([11,29],35,'#727e85');p(ink,[[7,12],[38,12],[42,17],[41,38],[34,42],[10,40],[5,31]]);r('#987440',9,16,28,22);r('#d9b85f',11,15,24,19);r('#ffe09b',12,16,21,2);
   r(ink,12,20,24,14);r('#29444c',14,22,20,10);r('#65bba9',15,23,18,1);
   if(blink){r('#baf5d6',17,27,5,1);r('#baf5d6',27,27,5,1);}else{r('#bcf4d7',17,26,4,5);r('#bcf4d7',28,26,4,5);r('#f7fff3',17,26,1,2);}
   r('#313b45',22,5,3,8);r(ink,19,2,9,5);r(skill?'#fff0a2':'#81c9b8',21,3,5,3);
   for(let side=0;side<2;side++){const x=side?39:2,y=skill?(side?17:25):24+(side?step:-step);r(ink,x,y,7,13);r('#c9a45c',x+1,y+1,5,8);r('#a8b5b1',x,y+10,6,3);r('#d0e1cc',x+1,y+10,2,2);}
   r('#504638',15,36,18,4);for(let n=0;n<4;n++)r(skill?'#92ead5':'#9c9e77',17+n*4,37,2,2);r('#edf0c1',10,16,2,2);r('#edf0c1',35,16,2,2);
   if(skill)for(let n=0;n<3;n++)l('#ffe4a8',1,[[5+n*16,4],[7+n*16,8],[4+n*16,10]]);
 }else if(id==='frog'){
   legs([3,31],33,'#64876b');p(ink,[[5,37],[7,22],[13,14],[34,13],[42,25],[44,37],[38,43],[11,43]]);p('#668566',[[9,34],[11,23],[18,17],[31,17],[38,25],[39,37],[14,40]]);p('#b9cb8a',[[17,28],[33,28],[36,37],[16,38]]);
   for(const x of [10,29]){r(ink,x,8+step,11,15);r('#bdd091',x+2,10+step,7,10);eye(x+3,12+step,5,'#bda251');}l(ink,2,[[15,30],[25,33],[37,29]]);for(let n=0;n<4;n++)r('#a9b57b',12+n*7,22+n%2*3,3,2);if(warn)l('#bc7682',3,[[30,33],[42,33],[47,29]]);
 }else if(id==='bug'||id==='crab'||id==='crawler'){
   const crab=id==='crab',bug=id==='bug',shell=crab?'#728c80':bug?'#976b87':'#977557',hi=crab?'#a9c0a0':bug?'#d39eaa':'#d0af7d';
   for(let n=0;n<4;n++){const x=5+n*11;l(ink,4,[[x+4,29],[x,36+(n%2?step:-step)],[x+3,44]]);l('#a7ac9b',1,[[x+3,31],[x+1,37],[x+3,42]]);}
   p(ink,[[4,32],[5,20],[13,11],[33,10],[44,21],[46,33],[33,39],[13,38]]);p(shell,[[7,30],[9,20],[16,14],[31,13],[40,22],[42,31],[32,35],[15,35]]);
   if(crab){p(hi,[[12,25],[17,14],[30,13],[36,23],[30,31],[17,31]]);for(const x of [1,37]){p(ink,[[x,19-step],[x+4,11-step],[x+9,15-step],[x+10,27],[x+4,33]]);p('#ba9b7a',[[x+2,19-step],[x+4,15-step],[x+6,22],[x+8,16-step],[x+8,26],[x+4,29]]);}eye(18,30,4,'#907456');eye(29,29,4,'#907456');}
   else if(bug){p(hi,[[10,20],[19,13],[24,15],[23,32],[13,30]]);p('#714b6a',[[27,15],[33,15],[39,23],[34,32],[27,33]]);l(ink,2,[[25,14],[25,34]]);eye(30,28,5,'#e7c876');p('#f0d7b2',[[37,32],[44,28],[42,36]]);r('#edc48f',38,26,4,3);}
   else{for(let n=0;n<4;n++){r(ink,8+n*8,16+n%2*2,3,18);r(hi,11+n*8,18+n%2*2,4,5);}eye(35,24,5,'#df875e');l(ink,2,[[39,21],[39,13],[46,10]]);r('#c1c7a6',44,8,3,3);}
 }else if(id==='wisp'){
   p(ink,[[24,0],[35,12],[42,25],[37,36],[43,45],[30,42],[22,48],[12,43],[5,46],[10,33],[5,22],[15,9]]);p('#655686',[[24,4],[32,15],[38,26],[32,36],[35,42],[24,39],[18,44],[13,38],[14,30],[9,23],[18,12]]);p('#ada5c4',[[23,13],[32,20],[34,29],[27,36],[17,33],[14,24]]);eye(16,25+step,5,'#71bbae');eye(28,25+step,5,'#71bbae');r('#eee6d3',23,33,3,4);for(let n=0;n<3;n++)r('#b5d8c7',4+n*19,12+(n*11+frame*5)%28,2,3);
 }else if(id==='mimic'){
   const jaw=warn?10:step+3;r(ink,3,22-jaw,43,23+jaw);r('#977153',5,24-jaw,39,17+jaw);r('#e2bb72',6,26-jaw,37,4);r('#2a202d',5,32-jaw,39,8+jaw);
   for(let n=0;n<6;n++){p(cream,[[7+n*6,32-jaw],[12+n*6,32-jaw],[9+n*6,38-jaw]]);p(cream,[[8+n*6,40],[13+n*6,40],[10+n*6,35]]);}
   r('#dab471',7,22-jaw,3,10);r('#dab471',38,22-jaw,3,10);r('#f0d49c',22,27-jaw,7,6);r('#302936',24,29-jaw,3,4);r('#ef967d',12,27-jaw,5,2);r('#ef967d',33,27-jaw,5,2);legs([8,31],36,'#4b434b');
 }
 if(warn&&MOB_IDS.includes(id)){r('#f6ca86',22,2,3,7);r('#f6ca86',22,11,3,2);}
}
function frameAt(t,reduced=false,cheering=false){if(reduced)return 0;if(cheering)return 6+Math.floor(t*8)%2;return t%6>5.8?5:Math.floor(t*8)%4;}
function create(document){const cache=new Map();function frames(id){if(!PET_IDS.includes(id)&&!MOB_IDS.includes(id))return null;if(!cache.has(id))cache.set(id,Object.freeze(Array.from({length:PET_IDS.includes(id)?8:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=SIZE;paint(c.getContext('2d'),id,i);return c;})));return cache.get(id);}
function draw(g,id,x,y,w=SIZE,h=SIZE,frame=0,dir=1){const a=frames(id);if(!a)return false;g.save();g.imageSmoothingEnabled=false;g.translate(Math.round(x)+(dir<0?w:0),Math.round(y));g.scale(dir<0?-1:1,1);g.drawImage(a[Math.max(0,frame|0)%a.length],0,0,w,h);g.restore();return true;}
return Object.freeze({draw,frames,get bytes(){let n=0;for(const a of cache.values())n+=a.length*SIZE*SIZE*4;return n;}});}
window.BitboundCreatureSprites=Object.freeze({SIZE,PET_IDS,MOB_IDS,paint,frameAt,create});})();
