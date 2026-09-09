/* Original environments: no photograph assets. Complex scenery is cached at 640×300.
   Gameplay and story shots share the same regional palette and architecture. */
const REGION_BIOMES=Object.freeze(['valley','forest','cavern','dungeon','catacombs','approach','interior','hall']);
function paintBiome(g,kind){
  const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h),p=(c,pts)=>storyPoly(g,c,pts),line=(c,w,pts)=>storyLine(g,c,w,pts);
  const palettes={valley:['#436783','#9ac1be','#d6d6a0'],forest:['#101d32','#274a53','#7b9481'],cavern:['#101622','#243540','#46696b'],dungeon:['#101621','#32303b','#795757'],catacombs:['#0c1420','#273340','#496570'],approach:['#201d35','#713b54','#c78674']};
  const sky=palettes[kind]||palettes.valley,grad=g.createLinearGradient(0,0,0,300);
  grad.addColorStop(0,sky[0]);grad.addColorStop(.67,sky[1]);grad.addColorStop(1,sky[2]);g.fillStyle=grad;g.fillRect(0,0,640,300);
  if(kind==='valley'||kind==='forest'||kind==='approach'){
    const sun=kind==='approach'?'#d09178':kind==='forest'?'#d7dba9':'#fff1bd';
    p(sun,[[478,24],[508,24],[515,31],[515,53],[508,60],[478,60],[471,53],[471,32]]);
    if(kind!=='valley')p(sky[0],[[476,21],[495,21],[504,28],[504,48],[495,57],[476,57],[468,47],[468,29]]);
    for(let layer=0;layer<3;layer++)for(let i=0;i<6;i++){
      const x=i*145-layer*35,top=58+layer*35+(i*29)%47;
      p(kind==='approach'?['#553649','#443046','#302d3f'][layer]:['#56747e','#3b626b','#2c5056'][layer],[[x-85,255],[x-20,top+20],[x,top],[x+34,top+40],[x+57,top+33],[x+160,265]]);
      if(!layer&&kind==='valley')p('#e2e0c3',[[x-15,top+16],[x,top],[x+26,top+28],[x+8,top+19],[x,top+9]]);
    }
    if(kind==='valley'){
      for(const [x,y,w,h] of [[40,28,120,8],[140,50,78,5],[287,25,99,7]]){r('#dae8d688',x,y,w,h);r('#e8ecdf88',x+15,y-4,w*.52,4);}
      p('#748f7c',[[0,221],[70,193],[151,215],[224,192],[307,218],[368,199],[475,221],[556,195],[640,213],[640,300],[0,300]]);
      // Water descends through two ledges into the valley river.
      r('#84bec3',348,124,14,123);r('#d2efde',349,128,3,115);r('#446778',357,128,3,115);
      p('#508590',[[346,241],[369,241],[403,257],[445,265],[502,274],[428,286],[345,274],[376,261]]);
      for(let i=0;i<16;i++)r('#c6ddd277',342+(i*17)%119,245+i*2,8+i%3*5,1);
      for(let i=0;i<9;i++){const x=i*81-15,h=21+(i*13)%27;r('#4f5742',x+9,240-h,5,h);for(let j=0;j<3;j++)p(i%2?'#426751':'#577c54',[[x-7,233-j*9],[x+11,216-h+j*2],[x+29,233-j*9]]);}
    }
    if(kind==='forest'){
      for(let layer=0;layer<2;layer++)for(let i=0;i<10;i++){
        const x=i*81-layer*33,w=layer?17:9,ground=264,top=24+(i*23)%42;
        p(layer?'#172d33':'#24434a',[[x,ground],[x+5,top],[x+16,top-18],[x+w+5,ground]]);
        line(layer?'#31483e':'#345750',3,[[x+9,top+10],[x-15,top-3],[x-27,top-20]]);line('#2c4643',3,[[x+11,top+53],[x+38,top+25],[x+50,top+16]]);
        for(let n=0;n<4;n++)p(layer?'#1a3339':'#2b4950',[[x-45,top+n*12],[x+10,top-35+n*10],[x+64,top+n*12],[x+18,top+10+n*12]]);
        r('#68826c44',x+7,top+43,2,100);
      }
      for(const x of [54,209,463,581]){r('#77574a',x,237,4,22);p('#6d8c8d',[[x-9,238],[x-7,230],[x,225],[x+9,231],[x+11,238]]);r('#b9d4b6',x-4,232,2,2);r('#b9d4b6',x+4,234,3,2);}
    }
    if(kind==='approach'){
      p('#1a2332',[[0,268],[144,226],[230,239],[286,218],[425,227],[490,237],[640,216],[640,300],[0,300]]);
      // Distant ruined watchtowers and a ravine; the main castle is composited above.
      for(const x of [55,553]){r('#302a3c',x,109,32,137);r('#665060',x,112,4,130);for(let j=0;j<3;j++)r('#292637',x-2+j*14,100,9,14);r('#111b2a',x+10,140,12,21);line('#957866',1,[[x+8,189],[x+21,209],[x+15,225]]);}
      r('#1b1d2c',225,248,220,52);for(let i=0;i<15;i++){r('#695152',223+i*15,245,12,5);r('#a38a70',224+i*15,245,10,1);}
    }
  }else if(kind==='cavern'){
    for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){
      const x=i*61-layer*23,tip=42+(i*37+layer*17)%84;
      p(['#182531','#263440','#35464b'][layer],[[x-26,0],[x+37,0],[x+30,tip*.6],[x+14,tip],[x+5,tip*.55]]);
      p(['#1b2936','#293a42','#3c4e50'][layer],[[x-28,265],[x+11,161+(i*29)%70],[x+25,229],[x+39,270]]);
    }
    p('#4b7780',[[57,248],[244,241],[283,257],[237,268],[47,270],[27,259]]);
    for(let i=0;i<24;i++)r('#b3d6cf66',45+(i*37)%216,251+i%5*3,7+i%4*4,1);
    for(const x of [88,292,455,567]){
      for(let j=0;j<3;j++){const y=231-j%2*14,xx=x+j*11;p('#345e73',[[xx,y],[xx-5,y-26],[xx,y-43],[xx+7,y-23],[xx+5,y]]);p(j%2?'#75c5c9':'#ad91cc',[[xx,y-3],[xx-2,y-27],[xx,y-37],[xx+4,y-22]]);r('#d5eddf',xx,y-26,1,13);}
    }
    for(let i=0;i<13;i++)r('#739d9999',31+i*47,68+(i*29)%119,2,2);
  }else{
    // Vaulted prison / ancient catacombs: readable masonry, barred alcoves and bones.
    const cat=kind==='catacombs';
    for(let row=0;row<14;row++)for(let col=0;col<17;col++){
      const x=col*43-row%2*21,y=row*20;r(cat?'#35444c':'#3e3b46',x,y,40,18);r(cat?'#59707155':'#9c7e6855',x,y,40,1);
      if((row*7+col)%13===0)line('#171e2b',1,[[x+9,y],[x+14,y+7],[x+8,y+15]]);
    }
    for(let i=0;i<5;i++){
      const x=16+i*137;arch(g,x,56,98,207,cat?'#6b7471':'#7c6970');arch(g,x+6,65,86,198,'#101b29');
      if(cat){for(let row=0;row<4;row++){r('#43505a',x+13,112+row*33,74,4);for(let j=0;j<4;j++){r('#b2af92',x+18+j*16,96+row*33,9,11);r('#202d38',x+19+j*16,100+row*33,2,3);r('#202d38',x+23+j*16,100+row*33,2,3);}}}
      else for(let j=0;j<6;j++){r('#495863',x+15+j*12,102,4,160);r('#869092',x+15+j*12,102,1,154);}
      r('#29323e',x-8,42,8,222);r('#a99a7b',x-9,50,12,3);r('#56605e',x-11,257,15,7);
      r('#3c313a',x+96,133,8,36);r('#c99565',x+98,139,4,17);r(cat?'#8ccecb':'#f7bb77',x+97,127,6,16);r('#f5eac2',x+99,129,2,9);
    }
    if(cat){r('#1b2936',0,265,640,35);for(let i=0;i<14;i++)r('#435462',i*51,272+i%3*8,40,2);}
  }
  // Ground rim, roots, pebbles and a subtle dither at the edges finish each region.
  r(kind==='valley'?'#4e644b':'#1b2830',0,264,640,36);
  for(let i=0;i<95;i++)r(kind==='valley'?'#a7b97677':'#80948e44',(i*71)%640,265+(i*17)%35,2+i%5,1);
  for(let i=0;i<48;i++){r('#07111c33',(i*137)%640,(i*61)%280,2,2);}
}
function drawRegionalBackdrop(level){
  const kind=REGION_BIOMES[level],background=getStoryBackdrop(kind);ctx.drawImage(background,0,0,W,H);
  if(level===5)drawCastleWorldBackdrop(5);
  // A handful of ambient motes uses the existing clock; none spawn while coding.
  if(PERF.richFx&&level<6&&!mentorMotionQuery.matches){
    const t=state.gameTime,count=level===1?10:6;ctx.fillStyle=level===1?'#c5d99577':level===2?'#9fe8e866':'#e2d6b044';
    for(let i=0;i<count;i++){const x=((i*173+t*(level===0?5:1.8))%(W+20))-10,y=H*(.21+(i%5)*.085)+Math.sin(t*.8+i)*5;ctx.fillRect(Math.floor(x),Math.floor(y),2,2);}
  }
}

function drawRegionCrystal(x,y,w){
  for(let i=0;i<3;i++){const h=14+i*7;storyPoly(ctx,'#142b39',[[x+i*9,y],[x+i*9-2,y-h],[x+i*9+3,y-h-9],[x+i*9+8,y-h],[x+i*9+9,y]]);storyPoly(ctx,w.accent,[[x+i*9+1,y-2],[x+i*9+1,y-h],[x+i*9+3,y-h-6],[x+i*9+4,y-2]]);}
}
