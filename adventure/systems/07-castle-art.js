/* Static architecture is rasterized once at scene resolution, never rebuilt per frame.
   Castle rooms intentionally have no exterior-image dependency. */
const STORY_W=640,STORY_H=300,SCENE_FLOOR=264;
const storyBackdrops=new LruCache(4);
function storyRect(g,c,x,y,w,h){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function storyPoly(g,c,points){g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function storyLine(g,c,w,points){g.strokeStyle=c;g.lineWidth=w;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function arch(g,x,y,w,h,color){storyPoly(g,color,[[x,y+h],[x,y+30],[x+w*.2,y+12],[x+w*.5,y],[x+w*.8,y+12],[x+w,y+30],[x+w,y+h]]);}
function paintCastleFacade(g,x,y,scale=1){
  g.save();g.translate(x,y);g.scale(scale,scale);const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h);
  // Massed stepped towers, flying buttresses, crown spire and an inset portcullis.
  storyPoly(g,'#141520',[[0,196],[0,82],[25,82],[25,46],[48,12],[72,47],[72,80],[107,80],[107,41],[131,41],[148,0],[166,41],[189,41],[189,80],[224,80],[224,47],[248,12],[271,47],[271,82],[296,82],[296,196]]);
  for(const tx of [28,226]){r('#303042',tx,48,42,148);r('#454052',tx+4,49,5,147);storyPoly(g,'#443547',[[tx-4,47],[tx+20,16],[tx+45,47]]);for(let i=0;i<4;i++){r('#171622',tx+11,70+i*28,20,17);r('#a13e4b',tx+18,72+i*28,5,14);}}
  r('#242434',73,92,150,104);r('#353044',109,45,79,151);r('#514453',114,49,5,147);r('#1b1d2c',127,57,45,139);
  for(let row=0;row<10;row++)for(let col=0;col<6;col++){r('#b49b8c22',78+col*24+(row%2)*5,98+row*10,20,1);}
  for(let i=0;i<7;i++){r('#65525d',76+i*22,84,12,12);r('#92766c',76+i*22,84,12,2);}
  arch(g,115,115,68,81,'#78606a');arch(g,121,123,56,73,'#100e19');for(let i=0;i<7;i++)r('#827071',125+i*7,143,2,53);
  storyPoly(g,'#c4675d',[[147,10],[151,23],[146,31],[141,24]]);
  for(const xx of [95,199]){r('#342635',xx,122,10,30);r('#cf7661',xx+3,126,3,7);}
  for(let i=0;i<3;i++){r('#54404b',94-i*8,196+i*4,108+i*16,4);}
  g.restore();
}
function paintCastleRoom(g,hall=false){
  const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h);
  const grad=g.createLinearGradient(0,0,0,300);grad.addColorStop(0,'#080c18');grad.addColorStop(.65,hall?'#2e1f30':'#20253a');grad.addColorStop(1,'#111723');g.fillStyle=grad;g.fillRect(0,0,640,300);
  // Recessed masonry, pointed vaults and carved structural columns.
  for(let row=0;row<14;row++)for(let col=0;col<17;col++)r(row%3?'#7b6c7420':'#d7bd9220',col*42-(row%2)*21,row*19,39,17);
  for(let i=0;i<5;i++){
    const x=18+i*135;
    arch(g,x-16,-48,144,285,'#3e3649');arch(g,x-11,-41,134,278,'#746171');arch(g,x-8,-35,128,272,'#201b30');arch(g,x+4,-13,104,235,'#121324');
    for(let j=0;j<3;j++)arch(g,x+20+j*23,41-j%2*12,19,108,'#45324d');
    for(let j=0;j<3;j++){r(hall?'#924762':'#507881',x+24+j*23,70-j%2*12,4,65);r('#ead3b066',x+25+j*23,80-j%2*12,1,38);}
    r('#110f1e',x-10,101,11,155);r('#7c6572',x-8,109,3,135);r('#30283c',x-4,105,8,140);
    r('#9b7a73',x-15,101,26,4);r('#675267',x-14,108,24,7);r('#b49178',x-14,109,24,1);r('#6c586a',x-16,244,28,13);r('#b3927b',x-17,257,30,4);
    // Draped banners with embroidered crests.
    if(i===1||i===3){storyPoly(g,hall?'#6a263e':'#2e5360',[[x+34,101],[x+74,101],[x+74,192],[x+54,206],[x+34,192]]);r('#c69f67',x+32,98,43,4);r('#b59a68',x+38,104,2,79);r('#b59a68',x+69,104,2,79);storyPoly(g,'#c2a070',[[x+45,127],[x+54,137],[x+64,127],[x+61,147],[x+48,147]]);}
  }
  // Perspective floor and velvet aisle pull the eye toward the throne.
  r('#282333',0,264,640,36);for(let y=268;y<300;y+=7)r('#8d718c44',0,y,640,1);
  for(let x=-240;x<1000;x+=88)storyLine(g,'#897c8b33',1,[[320+(x-320)*.3,263],[x,300]]);
  storyPoly(g,hall?'#6e263f':'#3f3652',[[391,245],[493,245],[566,300],[318,300]]);storyLine(g,'#ceac73',2,[[392,248],[327,300]]);storyLine(g,'#ceac73',2,[[491,248],[558,300]]);
  if(hall){
    for(let i=0;i<4;i++){r('#625164',421-i*13,236+i*7,128+i*26,7);r('#b39487',421-i*13,236+i*7,128+i*26,1);}
    arch(g,455,101,63,131,'#0d0d1a');storyPoly(g,'#97785c',[[459,214],[453,132],[470,146],[484,111],[499,147],[522,132],[515,214]]);
    storyPoly(g,'#33213a',[[463,208],[463,148],[475,158],[484,131],[496,158],[513,148],[510,208]]);
    r('#714057',464,199,47,17);r('#d5b783',457,217,63,4);r('#5c3d4e',455,217,8,18);r('#5c3d4e',511,217,8,18);
  }
  // Two chandeliers and sconce light, baked into the backdrop.
  for(const x of [87,365]){r('#8c7763',x,0,2,53);storyLine(g,'#bc9569',3,[[x-29,54],[x-20,66],[x+20,66],[x+30,54]]);for(let n=-2;n<=2;n++){r('#dbbc86',x+n*11,49,3,13);r('#ffe4aa',x+n*11,44,3,5);}}
  const shade=g.createLinearGradient(0,0,640,0);shade.addColorStop(0,'#03071188');shade.addColorStop(.4,'#0000');shade.addColorStop(1,'#03071133');g.fillStyle=shade;g.fillRect(0,0,640,300);
}
function paintTrailBackdrop(g,kind){
  const night=kind==='camp'||kind==='cell',grad=g.createLinearGradient(0,0,0,300);
  grad.addColorStop(0,night?'#11182e':'#19374d');grad.addColorStop(.63,night?'#315056':'#cfab8f');grad.addColorStop(1,'#152736');g.fillStyle=grad;g.fillRect(0,0,640,300);
  const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h);
  for(let layer=0;layer<3;layer++)for(let i=0;i<7;i++){
    const x=i*126-layer*37,peak=75+layer*45+(i*31)%46;
    storyPoly(g,['#365166','#304556','#20353e'][layer],[[x-110,260],[x,peak],[x+35,peak+38],[x+60,peak+29],[x+155,260]]);
    if(layer===0)storyPoly(g,'#a7a9a2',[[x-18,peak+24],[x,peak],[x+35,peak+38],[x+9,peak+27],[x,peak+15]]);
  }
  r(night?'#d3d8bd':'#ffdbad',480,31,31,31);r(night?'#315056':'#edba97',476,26,12,23);
  for(let i=0;i<35;i++)if(night)r('#aecacb99',(i*137)%640,12+(i*37)%109,i%4?1:2,1);
  for(let i=0;i<10;i++){const x=(i*113)%680-20,h=65+(i*31)%90;r('#172e32',x,260-h,8,h);for(let j=0;j<4;j++)storyPoly(g,'#1a3538',[[x-22-j*5,254-j*18],[x+3,260-h-j*4],[x+27+j*5,254-j*18]]);}
  r('#192a32',0,264,640,36);for(let i=0;i<95;i++)r(i%3?'#59726a':'#99a17c',(i*71)%640,265+(i*17)%35,2+i%5,1);
  if(kind==='cell'){
    r('#171a27',114,36,526,228);for(let row=0;row<11;row++)for(let col=0;col<13;col++){const x=118+col*43-(row%2)*20,y=40+row*20;r(row%3?'#343747':'#3d3d49',x,y,40,18);r('#65636b55',x,y,40,1);}
    arch(g,162,57,96,205,'#0e1621');r('#323c47',519,184,58,80);r('#6c6460',515,181,67,8);r('#d38657',527,208,38,22);r('#f2b375',535,213,21,14);
    r('#6b6264',531,169,35,10);r('#a8997a',539,172,28,3);
    // A discarded skeleton and a parchment; neither is an animated actor.
    r('#ada590',202,246,25,5);r('#bcb39a',196,235,10,10);r('#151c29',198,237,3,3);for(let j=0;j<4;j++)r('#b5ac97',211+j*4,241,2,11);r('#d2b987',276,237,29,18);r('#614a47',282,241,17,1);
  }
}
function getStoryBackdrop(kind){
  if(!storyBackdrops.has(kind))storyBackdrops.set(kind,createStorySurface(640,300,g=>{
    if(kind==='cavernCamp'){paintBiome(g,'cavern');}else if(kind==='keepCamp'){paintTrailBackdrop(g,'camp');paintCastleFacade(g,400,55,.68);}else if(kind==='prison'||kind==='holding')paintPrisonRoom(g,kind==='holding');else if(kind==='hall'||kind==='interior')paintCastleRoom(g,kind==='hall');else if(REGION_BIOMES.includes(kind))paintBiome(g,kind);else paintTrailBackdrop(g,kind);
  }));return storyBackdrops.get(kind);
}
// One bounded, reusable seal renderer: orbital rings, runic ticks and a hex lattice.
function drawArcaneBarrier(g,x,y,radius,time=0,breakAmount=0){
  if(breakAmount>=1)return;
  g.save();g.translate(x,y);g.globalAlpha=1-breakAmount;
  const rr=radius*(1+breakAmount*.45),color=breakAmount?'#ffe3b2':'#b6afff';
  for(let ring=0;ring<3;ring++){
    g.save();g.rotate((ring%2?-1:1)*time*.24+ring*.18);g.strokeStyle=ring===1?'#8273db':color;g.lineWidth=ring===0?3:1;
    g.beginPath();g.arc(0,0,rr*(1-ring*.13),0,Math.PI*2);g.stroke();
    for(let i=0;i<12;i++){g.rotate(Math.PI/6);g.strokeRect(rr*.79,-2,ring?4:7,4);if(ring===0)storyLine(g,'#ece0ff',1,[[rr-5,-5],[rr+4,0],[rr-5,5]]);}
    g.restore();
  }
  g.fillStyle='#8980e922';g.beginPath();g.arc(0,0,rr*.69,0,Math.PI*2);g.fill();
  for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
    const xx=col*rr*.24+(row%2)*rr*.12,yy=row*rr*.21;if(xx*xx+yy*yy>rr*rr*.34)continue;
    g.strokeStyle='#d2b9ef77';g.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3;const px=xx+Math.cos(a)*rr*.135,py=yy+Math.sin(a)*rr*.135;n?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();
  }
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3+time*.1,dx=Math.cos(a)*rr*.95,dy=Math.sin(a)*rr*.95;
    storyPoly(g,'#f3e2ff',[[dx-3,dy],[dx,dy-6],[dx+3,dy],[dx,dy+6]]);
    if(breakAmount>0)storyLine(g,'#fff3d4',2,[[dx*.5,dy*.5],[dx*.8-4,dy*.8+9],[dx*(1+breakAmount),dy*(1+breakAmount)]]);
  }
  g.restore();
}
function drawCastleWorldBackdrop(level){
  if(level===5){
    // The castle rises above an original, uninhabited mountain approach.
    const castle=getCastleExterior();ctx.drawImage(castle,W*.23,H*.13,W*.67,H*.68);return;
  }
  const image=getStoryBackdrop(level===7?'hall':'interior');ctx.drawImage(image,0,0,W,H);
  if(PERF.richFx){const light=.1+.04*Math.sin(state.gameTime*2);ctx.fillStyle=`rgba(244,163,105,${light})`;ctx.fillRect(W*.137,H*.15,3,6);ctx.fillRect(W*.57,H*.15,3,6);}
}
let castleExterior=null;
function getCastleExterior(){return castleExterior||(castleExterior=createStorySurface(304,220,g=>paintCastleFacade(g,4,5,1)));}

function drawCastleSconce(x,y){ctx.fillStyle='#514257';ctx.fillRect(x+9,y-50,15,50);ctx.fillStyle='#c19c71';ctx.fillRect(x+7,y-49,19,3);ctx.fillRect(x+13,y-41,7,16);ctx.fillStyle='#efb884';ctx.fillRect(x+14,y-48,5,10);ctx.fillStyle='#fff0bd';ctx.fillRect(x+15,y-46,2,5);}

// A complete enclosed room: no sky, mountains or ambiguous outside floor.
// Foreground bars are painted after actors by the scene renderer.
function paintPrisonRoom(g,holding=false){
  const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h);
  r('#0a121c',0,0,640,300);
  for(let row=0;row<14;row++)for(let col=0;col<18;col++){
    const x=col*42-row%2*21,y=row*19;
    r(row%3?'#26313a':'#2e3840',x,y,40,17);r('#465059',x+1,y+1,38,1);r('#141f28',x,y+15,40,2);
  }
  // Narrow corridor on the left; recessed cell on the right.
  r('#131f2b',12,40,162,224);arch(g,24,45,127,219,'#07121d');
  r('#778087',177,39,30,225);r('#293a47',181,45,19,219);r('#a1a4a0',177,39,30,5);
  r('#101b25',215,57,407,207);
  for(let row=0;row<10;row++)for(let col=0;col<10;col++){const x=219+col*42-row%2*20,y=62+row*19;r('#29353e',Math.max(215,x),y,Math.min(40,622-Math.max(215,x)),17);r('#45545a',Math.max(215,x),y,Math.min(40,622-Math.max(215,x)),1);}
  r('#151f28',0,264,640,36);for(let y=270;y<300;y+=10)r('#3d4e57',0,y,640,1);
  for(let x=-50;x<720;x+=71)storyLine(g,'#30414b',1,[[x,264],[x-38,300]]);
  // High barred ventilation opening. Its light lands inside the cell.
  r('#111b26',407,83,74,47);r('#68818a',412,87,64,35);
  for(let i=0;i<5;i++)r('#182b39',415+i*13,85,4,43);
  storyPoly(g,'#9bb9ba0b',[[412,130],[476,130],[587,264],[335,264]]);
  r('#738079',226,261,384,3);r('#353f45',217,260,398,4);
  // Bed, old bones and a small disused smithing hearth, all inside the bars.
  r('#26323a',552,240,59,23);r('#605c55',550,236,62,7);r('#8a8168',551,233,52,5);r('#a59c7b',556,231,15,3);
  for(let n=0;n<7;n++)r('#8d866b',554+n*7,239,4,1);
  if(!holding){
    r('#b9b094',298,249,27,4);r('#c4bba3',292,238,11,11);r('#17222a',294,240,3,3);r('#17222a',300,240,2,3);
    for(let i=0;i<4;i++)r('#b3aa90',308+i*4,245,2,10);
    storyLine(g,'#a9a08b',3,[[320,251],[333,258],[344,257]]);
    r('#32414a',484,224,42,39);r('#867a68',480,219,51,7);r('#2c2525',494,237,23,20);r('#b97747',499,245,13,10);r('#edb875',502,248,6,7);
    r('#7b7a70',492,211,30,7);r('#a0a293',488,208,39,5);
    r('#3a505f',527,249,22,15);r('#8cb2b4',529,250,18,3);
  }
  // Torch is in the corridor, visibly separate from the prisoner.
  r('#665441',61,113,5,43);r('#e4a76a',58,108,12,17);r('#ffe0a2',61,110,5,12);
  const shade=g.createLinearGradient(0,0,640,0);shade.addColorStop(0,'#00000044');shade.addColorStop(.45,'#0000');shade.addColorStop(1,'#00000033');g.fillStyle=shade;g.fillRect(0,0,640,300);
}
