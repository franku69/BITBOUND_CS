function shadeHex(hex,amt=-35){
  const n=parseInt(hex.replace('#',''),16),r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);
  return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
}
function pixelRect(g,x,y,w,h,color,outline='#05080d',border=2){
  if(border>0){g.fillStyle=outline;g.fillRect(x-border,y-border,w+border*2,h+border*2);}
  g.fillStyle=color;g.fillRect(x,y,w,h);
}
function drawMiniWeapon(g,w,cx,cy){g.save();g.translate(cx,cy);g.scale(.46,.46);g.translate(-20,-27);drawPixelWeapon(g,w,0);g.restore();}
const creatureSprites=window.BitboundCreatureSprites.create(document);
function drawPetSprite(g,id,x,y,scale=1,dir=1,phase=0){
  const reduced=mentorMotionQuery.matches;
  const frame=window.BitboundCreatureSprites.frameAt(phase,reduced,pet.cheer>0);
  creatureSprites.draw(g,id,x,y,34*scale,34*scale,frame,dir);
}
function renderPetPreviews(){
  for(const id of PET_IDS){const canvas=$('petPreview-'+id);if(!canvas)continue;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,canvas.width,canvas.height);drawPetSprite(g,id,7,3,1.65,1,0);}
}
function initPetPicker(){
  for(const option of UI.petOptions)option.onclick=()=>selectPet(option.dataset.pet);
  renderPetPreviews();selectPet(PETS[state.petId]?state.petId:DEFAULT_PET_ID);
}
function renderCharacterPreview(){
  const c=UI.characterPreview;if(!c)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);
  const grad=g.createLinearGradient(0,0,0,c.height);grad.addColorStop(0,'#1d3751');grad.addColorStop(1,'#07101a');g.fillStyle=grad;g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#203044';for(let x=0;x<c.width;x+=20)g.fillRect(x,190+(x%40?3:0),20,30);
  drawAvatarSprite(g,42,24,4,state.appearance,1,0,0);
}
function buildSwatches(container,palette,key){
  if(!container)return;container.innerHTML='';palette.forEach(color=>{const b=document.createElement('button');b.type='button';b.className='swatch';b.style.background=color;b.title=color;b.setAttribute('aria-label',`${key} ${color}`);b.onclick=()=>{state.appearance[key]=color;syncCharacterCreator();};container.appendChild(b);});
}
function syncCharacterCreator(){
  if(UI.hairStyle)UI.hairStyle.value=state.appearance.hairStyle;if(UI.outfitStyle)UI.outfitStyle.value=state.appearance.outfitStyle;
  const sets=[['skin',UI.skinSwatches],['hair',UI.hairSwatches],['eyes',UI.eyeSwatches],['outfit',UI.outfitSwatches],['accent',UI.accentSwatches]];
  for(const [key,box] of sets)if(box)[...box.children].forEach(b=>b.classList.toggle('selected',(b.style.backgroundColor||'').replace(/\s/g,'')===hexToRgbCss(state.appearance[key]).replace(/\s/g,'')));
  renderCharacterPreview();
}
function hexToRgbCss(hex){const n=parseInt(hex.replace('#',''),16);return `rgb(${n>>16}, ${(n>>8)&255}, ${n&255})`;}
function initCharacterCreator(){
  buildSwatches(UI.skinSwatches,APPEARANCE_PALETTES.skin,'skin');buildSwatches(UI.hairSwatches,APPEARANCE_PALETTES.hair,'hair');buildSwatches(UI.eyeSwatches,APPEARANCE_PALETTES.eyes,'eyes');buildSwatches(UI.outfitSwatches,APPEARANCE_PALETTES.outfit,'outfit');buildSwatches(UI.accentSwatches,APPEARANCE_PALETTES.accent,'accent');
  if(UI.hairStyle)UI.hairStyle.onchange=()=>{state.appearance.hairStyle=UI.hairStyle.value;syncCharacterCreator();};
  if(UI.outfitStyle)UI.outfitStyle.onchange=()=>{state.appearance.outfitStyle=UI.outfitStyle.value;syncCharacterCreator();};
  if(UI.randomizeCharacter)UI.randomizeCharacter.onclick=()=>{const pick=a=>a[Math.floor(Math.random()*a.length)];state.appearance={skin:pick(APPEARANCE_PALETTES.skin),hair:pick(APPEARANCE_PALETTES.hair),eyes:pick(APPEARANCE_PALETTES.eyes),outfit:pick(APPEARANCE_PALETTES.outfit),accent:pick(APPEARANCE_PALETTES.accent),hairStyle:pick(['short','spiky','long','messy','mohawk','ponytail']),outfitStyle:pick(['armor','hoodie','scout','tech','casual'])};syncCharacterCreator();};
  syncCharacterCreator();
}
