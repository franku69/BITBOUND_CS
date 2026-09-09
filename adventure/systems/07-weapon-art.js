/* Equipment art is cached independently of attack timing: 20 fixed silhouettes.
   Material facets and grips are baked; only weapon rotation and three stroke
   trails change in combat. Changing art cannot change damage or collision. */
const weaponArt=new Map();
function weaponSprite(w){
 if(!weaponArt.has(w.id))weaponArt.set(w.id,createStorySurface(88,58,g=>{g.translate(12,29);paintWeaponForm(g,w);}));
 return weaponArt.get(w.id);
}
function drawPixelWeapon(g,w,attack=0){
 g.save();g.translate(20,27);
 const angle=w.type==='melee'?(attack>0?-1.08+(attack/.22)*1.82:-.38):-.06;
 g.rotate(angle);
 if(attack>0&&w.type==='melee'&&PERF.richFx){
  for(let n=0;n<3;n++){g.save();g.globalAlpha=.22-n*.06;g.strokeStyle=n===0?'#f5f4dc':w.color;g.lineWidth=3-n*.7;g.beginPath();g.arc(5,0,Math.min(w.reach||48,70)-n*4,-.7,-.08);g.stroke();g.restore();}
 }
 g.drawImage(weaponSprite(w),-12,-29);
 if(attack>0&&w.type==='ranged'){storyPoly(g,w.color,[[41,-2],[47,-7],[46,-2],[56,0],[46,2],[47,7],[41,2]]);}
 g.restore();
}
function paintWeaponForm(g,w){
  const attack=0;
  const c=w.color,dark=shadeHex(c,-72),light=shadeHex(c,72),metal='#d8ecff',steel='#8298aa',handle='#805536',outline='#05080d';
  const attacking=false;g.save();g.lineJoin='miter';g.lineCap='square';
  switch(w.design){
    case 'stackMace':
      pixelRect(g,-4,-2,33,5,handle,outline,1);
      for(let i=0;i<3;i++){pixelRect(g,27,-14+i*10,19,8,dark,outline,1);pixelRect(g,30,-12+i*10,13,3,c,outline,0);}
      pixelRect(g,33,-17,7,3,metal,outline,1);break;
    case 'sparkStaff':
      pixelRect(g,-5,-2,32,5,handle,outline,1);pixelRect(g,19,-5,6,10,dark,outline,1);
      g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.arc(31,0,10,-2.6,2.6);g.stroke();
      pixelRect(g,28,-5,8,10,light,outline,1);pixelRect(g,36,-2,6,4,c,outline,1);break;
    case 'gearSaw':
      pixelRect(g,-5,-4,23,8,steel,outline,1);
      g.save();g.translate(31,0);if(attacking)g.rotate(attack*30);
      for(let i=0;i<8;i++){g.rotate(Math.PI/4);pixelRect(g,9,-3,8,6,c,outline,1);}
      g.fillStyle=outline;g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();
      g.fillStyle=steel;g.beginPath();g.arc(0,0,9,0,Math.PI*2);g.fill();pixelRect(g,-3,-3,6,6,dark,outline,1);g.restore();break;
    case 'linkLance':
      pixelRect(g,-5,-2,42,4,steel,outline,1);
      for(let i=0;i<3;i++){g.strokeStyle=c;g.lineWidth=2;g.strokeRect(8+i*9,-4,7,8);}
      g.fillStyle=outline;g.beginPath();g.moveTo(36,-8);g.lineTo(57,0);g.lineTo(36,8);g.closePath();g.fill();
      g.fillStyle=light;g.beginPath();g.moveTo(39,-5);g.lineTo(53,0);g.lineTo(39,5);g.closePath();g.fill();break;
    case 'recursionPrism':
      pixelRect(g,-4,-3,21,6,handle,outline,1);
      for(let size=14;size>=5;size-=4){g.strokeStyle=size===14?outline:size===10?c:light;g.lineWidth=3;g.beginPath();g.moveTo(28-size,0);g.lineTo(28,-size);g.lineTo(28+size,0);g.lineTo(28,size);g.closePath();g.stroke();}break;
    case 'graphTrident':
      pixelRect(g,-5,-2,40,4,steel,outline,1);
      g.strokeStyle=dark;g.lineWidth=6;g.beginPath();g.moveTo(26,-12);g.lineTo(26,12);g.stroke();
      for(const yy of [-12,0,12]){pixelRect(g,26,yy-2,21,4,c,outline,1);pixelRect(g,44,yy-4,7,8,light,outline,1);}
      break;
    case 'dagger':
      pixelRect(g,-3,-3,9,6,handle,outline,1);pixelRect(g,5,-5,4,10,dark,outline,1);
      g.fillStyle=outline;g.beginPath();g.moveTo(8,-5);g.lineTo(30,0);g.lineTo(8,5);g.closePath();g.fill();g.fillStyle=metal;g.beginPath();g.moveTo(10,-3);g.lineTo(27,0);g.lineTo(10,3);g.closePath();g.fill();g.fillStyle=c;g.fillRect(12,-1,12,2);g.fillStyle=light;g.fillRect(24,-1,3,1);break;
    case 'wand':
      pixelRect(g,-3,-3,22,6,handle,outline,1);pixelRect(g,14,-5,7,10,steel,outline,1);pixelRect(g,20,-7,8,14,dark,outline,1);
      g.fillStyle=c;g.fillRect(22,-5,4,10);g.fillStyle=light;g.fillRect(23,-4,3,3);g.fillStyle='#f6fdff';g.fillRect(24,-2,2,2);if(attacking){pixelRect(g,31,-3,7,6,'#fff3a1',c,2);}break;
    case 'spear':
      pixelRect(g,-5,-2,40,4,handle,outline,1);pixelRect(g,5,-4,4,8,dark,outline,1);pixelRect(g,30,-3,7,6,steel,outline,1);
      g.fillStyle=outline;g.beginPath();g.moveTo(35,-8);g.lineTo(52,0);g.lineTo(35,8);g.closePath();g.fill();g.fillStyle=metal;g.beginPath();g.moveTo(37,-5);g.lineTo(49,0);g.lineTo(37,5);g.closePath();g.fill();g.fillStyle=c;g.beginPath();g.moveTo(40,-3);g.lineTo(48,0);g.lineTo(40,3);g.closePath();g.fill();g.fillStyle=light;g.fillRect(39,-1,6,2);break;
    case 'saber':
      pixelRect(g,-3,-3,10,6,'#54422f',outline,1);pixelRect(g,6,-6,5,12,dark,outline,1);pixelRect(g,10,-5,33,10,dark,outline,1);
      g.fillStyle=c;g.fillRect(12,-4,31,8);g.fillStyle=light;g.fillRect(14,-2,27,4);g.fillStyle='#f7ffff';g.fillRect(16,-1,25,2);g.fillStyle=outline;g.fillRect(24,-5,3,3);g.fillStyle='#e9fbff';g.fillRect(25,-4,1,1);break;
    case 'blaster':
      pixelRect(g,-4,-7,27,13,'#263541',outline,2);pixelRect(g,2,5,9,11,handle,outline,1);pixelRect(g,8,-4,17,8,dark,outline,1);
      g.fillStyle=c;g.fillRect(11,-3,12,6);g.fillStyle=light;g.fillRect(14,-1,6,2);pixelRect(g,23,-3,12,6,metal,outline,1);g.fillStyle=dark;g.fillRect(28,-2,5,4);if(attacking){pixelRect(g,37,-4,9,8,'#fff1a6',c,2);}break;
    case 'hammer':
      pixelRect(g,-4,-3,33,6,handle,outline,1);pixelRect(g,23,-7,9,14,steel,outline,1);pixelRect(g,28,-15,20,30,dark,outline,2);
      g.fillStyle=c;g.fillRect(31,-12,14,24);g.fillStyle=light;g.fillRect(34,-9,8,5);g.fillStyle=outline;g.fillRect(35,0,3,3);g.fillRect(40,0,3,3);g.fillStyle='#f5eaff';g.fillRect(36,1,1,1);g.fillRect(41,1,1,1);pixelRect(g,46,-10,5,20,metal,outline,1);break;
    case 'rifle':
      pixelRect(g,-6,-6,35,12,'#263746',outline,2);pixelRect(g,1,5,10,12,handle,outline,1);pixelRect(g,11,-10,14,5,dark,outline,1);pixelRect(g,15,-4,26,8,dark,outline,1);
      g.fillStyle=c;g.fillRect(18,-3,21,6);g.fillStyle=light;g.fillRect(20,-1,9,2);pixelRect(g,39,-3,14,6,metal,outline,1);g.fillStyle=dark;g.fillRect(47,-2,5,4);if(attacking){pixelRect(g,55,-3,9,6,'#fff1a6',c,2);}break;
    case 'appendAxe':
      pixelRect(g,-5,-2,42,5,handle,outline,1);pixelRect(g,26,-7,8,14,dark,outline,1);
      for(const sign of [-1,1]){g.save();g.scale(1,sign);storyPoly(g,outline,[[29,2],[27,10],[33,17],[47,20],[52,14],[43,13],[38,7],[38,2]]);storyPoly(g,steel,[[31,3],[30,10],[35,15],[46,17],[49,15],[41,15],[35,8],[35,3]]);storyLine(g,metal,2,[[32,12],[38,17],[46,18],[50,15]]);storyPoly(g,c,[[34,3],[37,3],[40,9],[46,12],[40,12],[36,8]]);g.restore();}break;
    case 'sliceScythe':
      pixelRect(g,-6,-2,43,4,handle,outline,1);pixelRect(g,30,-5,8,10,dark,outline,1);g.fillStyle=outline;g.beginPath();g.moveTo(34,-7);g.lineTo(54,-18);g.lineTo(49,-5);g.lineTo(38,3);g.closePath();g.fill();g.fillStyle=c;g.beginPath();g.moveTo(37,-6);g.lineTo(50,-14);g.lineTo(46,-5);g.lineTo(38,1);g.closePath();g.fill();g.fillStyle=light;g.fillRect(41,-7,7,2);break;
    case 'indexBow':
      pixelRect(g,-3,-3,20,6,handle,outline,1);g.strokeStyle=c;g.lineWidth=4;g.beginPath();g.moveTo(18,-15);g.lineTo(30,0);g.lineTo(18,15);g.stroke();g.strokeStyle='#eaf7ff';g.lineWidth=1;g.beginPath();g.moveTo(18,-14);g.lineTo(18,14);g.stroke();g.fillStyle=light;g.fillRect(17,-2,31,4);g.fillStyle='#fff';g.fillRect(45,-4,3,8);break;
    case 'extendLauncher':
      pixelRect(g,-5,-8,28,16,'#263541',outline,2);pixelRect(g,1,7,10,10,handle,outline,1);for(const yy of [-8,-1,6]){pixelRect(g,19,yy,25,5,dark,outline,1);g.fillStyle=c;g.fillRect(23,yy+1,19,3);}g.fillStyle=light;g.fillRect(8,-4,8,3);break;
    case 'sortDisc':
      pixelRect(g,-4,-3,15,6,handle,outline,1);g.fillStyle=outline;g.beginPath();g.arc(26,0,14,0,Math.PI*2);g.fill();g.fillStyle=c;g.beginPath();g.arc(26,0,11,0,Math.PI*2);g.fill();g.fillStyle=dark;g.fillRect(19,-3,14,6);g.fillStyle=light;g.fillRect(24,-9,4,18);g.fillStyle='#fffbe1';g.fillRect(24,-2,4,4);break;
    case 'edge':
      pixelRect(g,-4,-3,13,6,handle,outline,1);pixelRect(g,7,-7,5,14,dark,outline,1);g.fillStyle=outline;g.beginPath();g.moveTo(10,0);g.lineTo(39,-12);g.lineTo(35,-4);g.lineTo(51,0);g.lineTo(35,4);g.lineTo(39,12);g.closePath();g.fill();g.fillStyle=c;g.beginPath();g.moveTo(13,0);g.lineTo(36,-8);g.lineTo(32,-2);g.lineTo(47,0);g.lineTo(32,2);g.lineTo(36,8);g.closePath();g.fill();g.fillStyle='#fff3ff';g.fillRect(16,-1,27,2);g.fillStyle=light;g.fillRect(29,-5,4,2);g.fillRect(29,3,4,2);break;
    case 'blade':
    default:
      pixelRect(g,-3,-3,10,6,handle,outline,1);pixelRect(g,6,-6,5,12,dark,outline,1);g.fillStyle=outline;g.beginPath();g.moveTo(10,-6);g.lineTo(40,-4);g.lineTo(50,0);g.lineTo(40,4);g.lineTo(10,6);g.closePath();g.fill();g.fillStyle=metal;g.beginPath();g.moveTo(12,-4);g.lineTo(39,-2);g.lineTo(46,0);g.lineTo(39,2);g.lineTo(12,4);g.closePath();g.fill();g.fillStyle=c;g.fillRect(15,-2,26,4);g.fillStyle=light;g.fillRect(17,-1,23,2);break;
  }
  for(let n=0;n<4;n++){g.fillStyle=n%2?'#b89b72':'#584332';g.fillRect(-3+n*2,-2,1,4);}
  pixelRect(g,-6,-3,3,6,steel,outline,1);pixelRect(g,-6,-1,2,2,c,outline,0);
  g.fillStyle=light;g.fillRect(8,-3,2,2);g.fillStyle=metal;g.fillRect(19,-1,2,1);
  g.restore();
}
