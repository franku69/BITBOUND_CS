/* Dawn Company art: bounded, lazy sprite atlas shared by cinematics and gameplay.
   64 × 96 source pixels, 16 poses, two equipment tiers, four characters: ≤ 3 MiB. */
const DAWN_COMPANY=Object.freeze([
  {name:'Aster',role:'Paladin',color:'#f1cf79',hair:'#d9b46b',skin:'#d89e72'},
  {name:'Mira',role:'Mage',color:'#c39df2',hair:'#3d285b',skin:'#b67c64'},
  {name:'Rook',role:'Berserker',color:'#f1a076',hair:'#573727',skin:'#bc835c'},
  {name:'Fern',role:'Healer',color:'#a6e0b3',hair:'#a44e3c',skin:'#efbd96'}
]);
const PARTY_POSES=Object.freeze(['idle','talk','grin','shock','angry','sad','cast','cheer','walk0','walk1','walk2','walk3','kneel','sit','reach','guard']);
const partyAtlas=new Map();
function createStorySurface(width,height,paint){
  const image=document.createElement('canvas');image.width=width;image.height=height;
  const g=image.getContext('2d');g.imageSmoothingEnabled=false;paint(g);return image;
}
function partySprite(index,pose='idle',elite=false){
  index=clamp(index|0,0,3);if(!PARTY_POSES.includes(pose))pose='idle';
  const key=`${index}:${elite?1:0}:${pose}`;
  if(!partyAtlas.has(key))partyAtlas.set(key,createStorySurface(64,96,g=>paintAlly(g,index,pose,elite)));
  return partyAtlas.get(key);
}
function paintAlly(g,index,pose='idle',elite=false,part=null){
  if(!part)return paintRigActor(g,{kind:'ally',index,elite,x:32,foot:94,scale:1,face:1,
    motion:pose.startsWith('walk')?'walk':pose==='talk'?'speak':RIG_ACTIONS.includes(pose)?pose:'idle',
    phase:pose.startsWith('walk')?(Number(pose.at(-1))||0)/4:.5,mood:pose,armed:false,precise:true,
    expression:{speaking:pose==='talk',syllable:2,blink:pose==='sleep'}});
  const a=DAWN_COMPANY[index],ink='#101623',skin=a.skin,light=shadeHex(skin,27),shadow=shadeHex(skin,-34),c=a.color;
  const r=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const p=(color,points)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
  const line=(color,width,points)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
  const armor=elite?'#8a779f':index===0?'#718b9e':index===1?'#56416e':index===2?'#4c505b':'#728c7b';

  g.save();
  if(part==='body'){
  p(ink,[[20,27],[42,27],[49,37],[46,63],[40,71],[20,69],[15,62],[14,37]]);
  p(armor,[[22,30],[40,30],[46,38],[42,62],[38,67],[22,65],[18,59],[18,38]]);
  p(shadeHex(armor,25),[[22,32],[31,35],[32,49],[23,51],[19,41]]);
  p(shadeHex(armor,-25),[[33,36],[41,32],[44,42],[40,60],[33,61]]);
  // Role-specific torsos: plate cuirass, layered robe, fur and scars, healer apron.
  if(index===0){
    p('#c2d3d3',[[20,33],[30,36],[42,32],[42,47],[31,53],[21,47]]);
    p('#7c96a5',[[31,38],[40,35],[39,45],[31,50]]);line('#f5de9c',2,[[20,32],[30,36],[42,32]]);
    p(c,[[29,38],[33,38],[33,43],[37,43],[37,46],[33,46],[33,50],[29,50],[29,46],[25,46],[25,43],[29,43]]);
    for(let y=54;y<=64;y+=4){r('#344955',20,y,23,3);r('#92a6b1',21,y,21,1);}
  }else if(index===1){
    p('#70518a',[[22,40],[32,45],[40,39],[47,79],[36,83],[30,79],[19,82],[16,76]]);
    line('#ceab72',2,[[22,41],[29,49],[24,79]]);line('#ceab72',2,[[40,40],[33,48],[37,79]]);
    r('#30273f',28,36,7,10);p('#d9d0ff',[[31,35],[35,40],[31,44],[28,40]]);
    for(let i=0;i<3;i++)r('#a887bf',20+i*8,70+i%2*4,2,5);
  }else if(index===2){
    p('#a0a497',[[17,28],[23,25],[30,30],[37,26],[45,28],[47,39],[40,37],[35,42],[30,38],[23,41],[16,37]]);
    for(let x=18;x<44;x+=5)p('#d2ccb3',[[x,29],[x+5,28],[x+2,36],[x,33]]);
    p(shadow,[[23,41],[39,41],[41,55],[22,56]]);r(skin,24,42,14,10);r(light,25,42,6,4);
    line('#e3bf99',1,[[33,43],[30,49],[34,53]]);r('#31313c',18,55,26,6);r('#bba077',29,55,7,6);
    p('#4f4246',[[20,62],[42,62],[46,74],[36,76],[31,70],[25,75],[17,74]]);
  }else{
    p('#d4dbba',[[22,33],[39,33],[41,45],[43,72],[38,80],[22,79],[18,72],[22,48]]);
    p('#a2b29b',[[33,40],[38,39],[40,72],[34,77],[31,63]]);
    line('#ebd69b',2,[[22,34],[30,41],[39,34]]);r('#395f52',25,50,13,11);r('#edf0ce',30,52,3,7);r('#edf0ce',28,54,7,3);
    line('#395f52',3,[[19,34],[27,56],[39,68]]);r('#8b6444',36,64,8,10);r('#cfa877',37,65,6,2);
    r('#689e92',19,62,5,8);r('#c2fcda',20,62,3,4);
  }
  }

  if(part==='head')paintCharacterHead(g,{kind:'ally',index,elite,mood:pose,motion:pose});

  if(elite&&part==='body'){
    for(const x of [13,43]){p('#d5b26b',[[x-3,30],[x+1,23],[x+5,28],[x+8,26],[x+9,36],[x,36]]);r('#fff0b8',x,30,6,2);}
    line('#e1bb76',2,[[22,64],[32,67],[41,63]]);r('#ab6fde',29,62,5,5);
    r('#392f42',5,65,12,10);r('#e3bc79',6,66,10,2);r('#edcf96',10,69,3,3);
    for(let i=0;i<3;i++){r('#b7985e',42+i*3,69+i%2*2,3,6);r('#f5dba0',42+i*3,69+i%2*2,2,2);}
  }
  g.restore();
}
