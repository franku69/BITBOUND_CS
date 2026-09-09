/* Detailed stoneborn portrait. A 32-frame LRU is cleared when appearance changes.
   Art is 64×96; the 24×44 collision box and immediate input remain unchanged. */
const avatarFrames=new LruCache(32);let avatarAppearanceKey='';
function avatarFrame(a,rf,pose){
  const key=[a.skin,a.hair,a.eyes,a.outfit,a.accent,a.hairStyle,a.outfitStyle].join('|');
  if(key!==avatarAppearanceKey){avatarFrames.clear();avatarAppearanceKey=key;}
  const motion=pose?.motion||pose?.gesture|| (pose?.arm>1?'wave':pose?.arm<-.5?'reach':rf?'walk'+rf:'idle');
  const mood=pose?.mood|| (pose?.blink?'blink':pose?.smile?'smile':'calm');
  const safeMotion=['idle','wave','reach','kneel','hurt','brace','punch','sit','walk0','walk1','walk2','walk3'].includes(motion)?motion:'idle';
  const safeMood=['calm','smile','blink','sad','shock','angry'].includes(mood)?mood:'calm';
  const id=safeMotion+':'+safeMood;
  if(!avatarFrames.has(id))avatarFrames.set(id,createStorySurface(64,96,g=>paintStoneborn(g,a,safeMotion,safeMood)));
  return avatarFrames.get(id);
}
function paintStoneborn(g,a,motion,mood,part=null){
  if(!part)return paintRigActor(g,{kind:'hero',appearance:a,x:32,foot:94,scale:1,face:1,
    motion:motion.startsWith('walk')?'walk':motion,phase:motion.startsWith('walk')?(Number(motion.at(-1))||0)/4:.5,
    mood,armed:false,precise:true});
  const ink='#121d29',cloth=a.outfit,edge=a.accent;
  const r=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const p=(c,points)=>{g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
  const l=(c,w,points)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};

  g.save();
  if(part==='body'){
  p(ink,[[20,28],[39,28],[48,35],[48,58],[42,67],[21,66],[13,55],[13,36]]);
  p(cloth,[[22,31],[38,31],[44,37],[44,57],[39,63],[22,62],[17,53],[17,37]]);
  p(shadeHex(cloth,22),[[20,34],[28,33],[29,58],[21,58],[17,50]]);p(shadeHex(cloth,-25),[[35,34],[42,35],[43,55],[37,61],[34,52]]);
  if(a.outfitStyle==='armor'){
    p('#687b8d',[[21,35],[31,39],[41,35],[42,50],[32,57],[22,51]]);p('#9aafba',[[23,37],[31,42],[31,53],[24,49]]);
    p(cloth,[[32,41],[40,38],[39,48],[32,54]]);r(edge,29,42,5,10);r(shadeHex(edge,45),30,43,2,6);
    r('#475a6d',19,55,24,6);r('#9bb0b5',20,55,22,1);
  }else if(a.outfitStyle==='hoodie'){
    p(shadeHex(cloth,-35),[[19,32],[25,28],[37,28],[43,34],[37,43],[27,43]]);l(edge,1,[[23,33],[30,38],[37,33]]);r('#a6b5bc',26,39,1,10);r('#a6b5bc',35,39,1,10);r(shadeHex(cloth,-20),24,50,14,8);r(shadeHex(cloth,30),25,50,12,1);
  }else if(a.outfitStyle==='scout'){
    l('#b1a081',3,[[19,31],[39,61]]);r('#b1a081',23,42,7,9);r('#dbbc84',24,43,5,2);r('#252e3b',34,47,7,11);r('#a6a79c',35,48,5,1);
  }else if(a.outfitStyle==='tech'){
    for(let i=0;i<3;i++){l(edge,1,[[22,38+i*6],[29,38+i*6],[33,42+i*6],[40,42+i*6]]);}r('#7c96a2',19,56,24,4);
  }else{r(edge,21,34,20,4);p(shadeHex(cloth,30),[[24,42],[35,42],[39,55],[25,56]]);}
  // Utility belt, buckle, satchel and tiny stoneborn emblem.
  r('#293239',19,61,25,5);r('#ad8c61',28,61,7,5);r('#e6c88e',29,62,5,1);r('#684b3b',15,57,7,13);r('#b3976b',16,59,5,2);
  p(edge,[[22,29],[29,30],[34,29],[43,30],[40,34],[25,36],[17,33],[12,42],[9,42],[10,30]]);r(shadeHex(edge,33),17,30,20,2);
  }

  if(part==='head')paintCharacterHead(g,{kind:'hero',appearance:a,mood,motion});
  g.restore();
}
function drawAvatarSprite(g,x,y,scale=1,appearance=state.appearance,dir=1,rf=0,attack=0,pose=null){
  const motion=pose?.motion==='dash'?'dash':attack>0?'attack':pose?.motion||(rf?'walk':'idle');
  const phase=motion==='dash'?(pose?.phase||0):attack>0?clamp(1-attack/.22,0,1):(pose?.phase??rf/4);
  drawRigActor(g,{kind:'hero',appearance,x:x+12*scale,foot:y+44*scale,scale:scale*.5,face:dir,motion,phase,mood:pose?.blink?'blink':pose?.smile?'smile':pose?.mood||'calm',armed:!pose?.unarmed});
}
