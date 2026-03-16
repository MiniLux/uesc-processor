import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

// ============================================================
// UESC-PROCESSOR v5
// ============================================================

const PALETTES = {
  "Original":null,"1-Bit":[[0,0,0],[255,255,255]],
  "Marathon Green":[[0,0,0],[0,30,0],[0,60,5],[0,100,15],[0,160,30],[0,220,50],[0,255,65]],
  "Marathon Yellow":[[0,0,10],[15,10,0],[50,38,0],[100,75,0],[170,130,0],[220,175,0],[255,210,30]],
  "UESC Cyan":[[0,0,0],[0,15,25],[0,45,65],[0,90,120],[0,150,190],[0,210,240],[50,240,255]],
  "Durandal Red":[[0,0,0],[30,0,0],[70,5,5],[130,15,10],[200,30,20],[255,60,40],[255,120,100]],
  "Tycho Purple":[[0,0,0],[15,0,25],[40,10,60],[80,30,120],[130,60,190],[175,100,240],[200,150,255]],
  "Amber CRT":[[0,0,0],[30,15,0],[80,50,0],[150,100,0],[220,160,0],[255,200,30],[255,230,120]],
  "Leela Pink":[[0,0,0],[25,0,15],[60,5,35],[120,20,70],[190,40,110],[255,64,129],[255,140,180]],
  "CGA":[[0,0,0],[0,170,170],[170,0,170],[170,170,170]],
  "Gameboy":[[15,56,15],[48,98,48],[139,172,15],[155,188,15]],
  "PICO-8":[[0,0,0],[29,43,83],[126,37,83],[0,135,81],[171,82,54],[95,87,79],[194,195,199],[255,241,232],[255,0,77],[255,163,0],[255,236,39],[0,228,54],[41,173,255],[131,118,156],[255,119,168],[255,204,170]],
  "Grayscale 4":[[0,0,0],[85,85,85],[170,170,170],[255,255,255]],
  "Grayscale 8":[[0,0,0],[36,36,36],[73,73,73],[109,109,109],[146,146,146],[182,182,182],[219,219,219],[255,255,255]],
  "Neon":[[0,0,0],[255,0,77],[255,163,0],[0,228,54],[41,173,255],[255,0,255]],
  "Sepia":[[30,20,10],[80,55,30],[140,100,60],[190,150,100],[230,200,160],[255,240,220]],
};

const DITHER_ALGOS = {
  "None":{g:"Off"},
  "Floyd-Steinberg":{g:"Error Diffusion"},"Atkinson":{g:"Error Diffusion"},"Sierra":{g:"Error Diffusion"},"Sierra Lite":{g:"Error Diffusion"},"Stucki":{g:"Error Diffusion"},"Burkes":{g:"Error Diffusion"},"Jarvis-Judice-Ninke":{g:"Error Diffusion"},
  "Bayer 2x2":{g:"Ordered"},"Bayer 4x4":{g:"Ordered"},"Bayer 8x8":{g:"Ordered"},
  "Halftone":{g:"Pattern"},"Cross-Hatch":{g:"Pattern"},"Diagonal":{g:"Pattern"},"H-Lines":{g:"Pattern"},"V-Lines":{g:"Pattern"},"Bi-Thread":{g:"Pattern"},"Herringbone":{g:"Pattern"},
  "FM":{g:"Modulation"},"AM":{g:"Modulation"},"Wave":{g:"Modulation"},"Contour":{g:"Modulation"},
  "Random":{g:"Noise"},"Blue Noise":{g:"Noise"},"Stipple":{g:"Noise"},"Grain":{g:"Noise"},
  "Spiral":{g:"Special"},"Concentric":{g:"Special"},"Voronoi":{g:"Special"},
  "Plus":{g:"Shape"},"Numbers":{g:"Shape"},
  "Threshold":{g:"Basic"},
};

const DP0 = {gamma:1,bias:0,invert:false,errStr:1,serpentine:false,spread:1,htAngle:0,dotGain:0,dotSize:1,lineWeight:1,frequency:1,depth:1,direction:0,rotation:0,cellSize:8,arms:5,edgeSpread:1,scale:1,brightness:0,contrast:0,colorMode:"rgb",posterize:6,solarizeT:128,duoH:"#000000",duoL:"#00ff41",sharpen:0,blur:0,dpi:1,plusSize:6,plusGap:16,plusThickness:2,numBlockW:5,numBlockH:6,numFontSize:10,numGap:20};

const MARATHON_PRESETS = {
  "Marathon Green":{palette:"Marathon Green",dither:"Bayer 4x4",dp:{...DP0,spread:0.8},gfx:{scanlines:{on:true,gap:2,opacity:0.4,speed:0},glitch:{on:true,intensity:0.15,blockSize:8,speed:0.5},rgbShift:{on:true,amount:3,angle:0},noise:{on:true,amount:0.08,speed:0.3},pixelate:{on:false,size:1},vignette:{on:true,strength:0.5},crt:{on:false,curvature:0.2},blockGlitch:{on:false,count:10,maxSize:50},chromatic:{on:false,amount:3},jitter:{on:false,amount:3},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
  "Traxus Yellow":{palette:"Marathon Yellow",dither:"Bayer 4x4",dp:{...DP0,spread:0.9},gfx:{scanlines:{on:true,gap:3,opacity:0.5,speed:0.2},glitch:{on:true,intensity:0.3,blockSize:12,speed:0.8},rgbShift:{on:false,amount:0,angle:0},noise:{on:true,amount:0.12,speed:0.5},pixelate:{on:true,size:2},vignette:{on:false,strength:0},crt:{on:false,curvature:0.2},blockGlitch:{on:true,count:15,maxSize:60},chromatic:{on:false,amount:3},jitter:{on:false,amount:3},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
  "UESC Terminal":{palette:"UESC Cyan",dither:"Bayer 4x4",dp:{...DP0,spread:0.6},gfx:{scanlines:{on:true,gap:1,opacity:0.25,speed:0.1},glitch:{on:false,intensity:0.1,blockSize:4,speed:0.3},rgbShift:{on:false,amount:1,angle:0},noise:{on:true,amount:0.04,speed:0.2},pixelate:{on:false,size:1},vignette:{on:true,strength:0.3},crt:{on:true,curvature:0.15},blockGlitch:{on:false,count:5,maxSize:30},chromatic:{on:false,amount:2},jitter:{on:false,amount:2},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
  "Durandal Rage":{palette:"Durandal Red",dither:"Atkinson",dp:{...DP0,gamma:1.2,bias:5,errStr:1.2,serpentine:true,brightness:10,contrast:15},gfx:{scanlines:{on:true,gap:2,opacity:0.4,speed:0.3},glitch:{on:true,intensity:0.4,blockSize:10,speed:0.9},rgbShift:{on:true,amount:8,angle:30},noise:{on:true,amount:0.18,speed:0.7},pixelate:{on:false,size:1},vignette:{on:true,strength:0.7},crt:{on:true,curvature:0.25},blockGlitch:{on:true,count:18,maxSize:70},chromatic:{on:true,amount:5},jitter:{on:true,amount:4},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
  "Tycho Static":{palette:"Tycho Purple",dither:"Floyd-Steinberg",dp:{...DP0,gamma:0.9,errStr:0.8,serpentine:true,brightness:-5,contrast:10},gfx:{scanlines:{on:true,gap:1,opacity:0.15,speed:0},glitch:{on:false,intensity:0.1,blockSize:6,speed:0.3},rgbShift:{on:true,amount:2,angle:90},noise:{on:true,amount:0.05,speed:0.15},pixelate:{on:false,size:1},vignette:{on:true,strength:0.4},crt:{on:false,curvature:0.1},blockGlitch:{on:false,count:5,maxSize:30},chromatic:{on:true,amount:3},jitter:{on:false,amount:2},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
  "Leela Neon":{palette:"Leela Pink",dither:"Halftone",dp:{...DP0,gamma:1.1,htAngle:45,dotGain:10,dotSize:1.2,brightness:5,contrast:5},gfx:{scanlines:{on:true,gap:2,opacity:0.3,speed:0.1},glitch:{on:true,intensity:0.2,blockSize:8,speed:0.6},rgbShift:{on:true,amount:4,angle:60},noise:{on:true,amount:0.08,speed:0.4},pixelate:{on:false,size:1},vignette:{on:true,strength:0.5},crt:{on:false,curvature:0.15},blockGlitch:{on:false,count:8,maxSize:40},chromatic:{on:true,amount:4},jitter:{on:false,amount:2},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5}}},
};

const GFX0 = {scanlines:{on:false,gap:2,opacity:0.3,speed:0},glitch:{on:false,intensity:0.15,blockSize:8,speed:0.5},rgbShift:{on:false,amount:3,angle:0,speed:0.5},noise:{on:false,amount:0.06,speed:0.3},pixelate:{on:false,size:2},vignette:{on:false,strength:0.4},crt:{on:false,curvature:0.2},blockGlitch:{on:false,count:10,maxSize:50,speed:0.5},chromatic:{on:false,amount:3,speed:0.5},jitter:{on:false,amount:3,speed:1},colorCycle:{on:false,speed:1},solarize:{on:false,threshold:128,speed:0.5},offset:{on:false,speedX:0.5,speedY:0,amount:50,direction:0}};
const GLITCH_PRESETS = {
  off:{name:"OFF",...GFX0},
  marathon:{name:"MARATHON",...GFX0,scanlines:{on:true,gap:2,opacity:0.35,speed:0},glitch:{on:true,intensity:0.12,blockSize:8,speed:0.4},rgbShift:{on:true,amount:3,angle:0},noise:{on:true,amount:0.06,speed:0.3},vignette:{on:true,strength:0.45}},
  traxus:{name:"TRAXUS",...GFX0,scanlines:{on:true,gap:3,opacity:0.5,speed:0.2},glitch:{on:true,intensity:0.3,blockSize:12,speed:0.8},rgbShift:{on:true,amount:6,angle:45},noise:{on:true,amount:0.14,speed:0.5},pixelate:{on:true,size:2},vignette:{on:true,strength:0.6},crt:{on:true,curvature:0.3},blockGlitch:{on:true,count:12,maxSize:50},chromatic:{on:true,amount:4},jitter:{on:true,amount:3}},
  terminal:{name:"TERMINAL",...GFX0,scanlines:{on:true,gap:1,opacity:0.2,speed:0.1},noise:{on:true,amount:0.03,speed:0.2},vignette:{on:true,strength:0.3},crt:{on:true,curvature:0.15}},
  corrupt:{name:"CORRUPT",...GFX0,scanlines:{on:true,gap:4,opacity:0.6,speed:0.7},glitch:{on:true,intensity:0.5,blockSize:18,speed:1},rgbShift:{on:true,amount:10,angle:90},noise:{on:true,amount:0.22,speed:0.9},pixelate:{on:true,size:3},vignette:{on:true,strength:0.8},crt:{on:true,curvature:0.4},blockGlitch:{on:true,count:25,maxSize:90},chromatic:{on:true,amount:7},jitter:{on:true,amount:5},solarize:{on:true,threshold:100,speed:0.8}},
  subtle:{name:"SUBTLE",...GFX0,scanlines:{on:true,gap:1,opacity:0.12,speed:0},rgbShift:{on:true,amount:1,angle:0},noise:{on:true,amount:0.02,speed:0.1},vignette:{on:true,strength:0.2}},
};

// --- BAYER ---
function makeBayer(n){if(n===2)return[[0,2],[3,1]];const h=n/2,s=makeBayer(h),m=Array.from({length:n},()=>new Array(n));for(let y=0;y<n;y++)for(let x=0;x<n;x++){const q=(y<h?0:1)*2+(x<h?0:1);m[y][x]=4*s[y%h][x%h]+[0,2,3,1][q];}return m;}
const B2=makeBayer(2),B4=makeBayer(4),B8=makeBayer(8);

function closestColor(r,g,b,pal){let best=pal[0],dist=Infinity;for(const c of pal){const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(d<dist){dist=d;best=c;}}return best;}
const ERR_K={"Floyd-Steinberg":[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]],"Atkinson":[[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]],"Sierra":[[1,0,5/32],[2,0,3/32],[-2,1,2/32],[-1,1,4/32],[0,1,5/32],[1,1,4/32],[2,1,3/32],[-1,2,2/32],[0,2,3/32],[1,2,2/32]],"Sierra Lite":[[1,0,2/4],[-1,1,1/4],[0,1,1/4]],"Stucki":[[1,0,8/42],[2,0,4/42],[-2,1,2/42],[-1,1,4/42],[0,1,8/42],[1,1,4/42],[2,1,2/42],[-2,2,1/42],[-1,2,2/42],[0,2,4/42],[1,2,2/42],[2,2,1/42]],"Burkes":[[1,0,8/32],[2,0,4/32],[-2,1,2/32],[-1,1,4/32],[0,1,8/32],[1,1,4/32],[2,1,2/32]],"Jarvis-Judice-Ninke":[[1,0,7/48],[2,0,5/48],[-2,1,3/48],[-1,1,5/48],[0,1,7/48],[1,1,5/48],[2,1,3/48],[-2,2,1/48],[-1,2,3/48],[0,2,5/48],[1,2,3/48],[2,2,1/48]]};

function voronoiCells(w,h,cs){const cols=Math.ceil(w/cs),rows=Math.ceil(h/cs),cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push({x:(c+0.5)*cs+(Math.sin(r*13.7+c*7.3)*0.4)*cs,y:(r+0.5)*cs+(Math.cos(r*9.1+c*11.9)*0.4)*cs});return cells;}

// --- PRE-PROCESS: blur & sharpen on source data ---
function preProcess(data,w,h,blur,sharpen){
  if(blur<=0&&sharpen<=0)return data;
  const out=new Uint8ClampedArray(data);
  // Box blur pass
  if(blur>0){const r=Math.round(blur);const tmp=new Uint8ClampedArray(data);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sr=0,sg=0,sb=0,cnt=0;
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h){const j=(ny*w+nx)*4;sr+=tmp[j];sg+=tmp[j+1];sb+=tmp[j+2];cnt++;}}
      const i=(y*w+x)*4;out[i]=sr/cnt;out[i+1]=sg/cnt;out[i+2]=sb/cnt;}
    if(sharpen<=0)return out;
  }
  // Sharpen via unsharp mask
  if(sharpen>0){const src=blur>0?new Uint8ClampedArray(out):data;const res=new Uint8ClampedArray(src);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;
      for(let c=0;c<3;c++){const v=src[i+c];const avg=(src[((y-1)*w+x)*4+c]+src[((y+1)*w+x)*4+c]+src[(y*w+x-1)*4+c]+src[(y*w+x+1)*4+c])/4;
        res[i+c]=Math.max(0,Math.min(255,v+sharpen*(v-avg)));}}
    return res;}
  return out;
}

function ditherImage(srcData,w,h,algo,palette,p,offsetX,offsetY){
  const raw=preProcess(srcData,w,h,p.blur||0,p.sharpen||0);
  const data=new Uint8ClampedArray(raw);if(algo==="None")return data;
  const pal=palette||[[0,0,0],[255,255,255]];
  const{gamma=1,bias=0,invert=false,errStr=1,serpentine=false,spread=1,htAngle=0,dotGain=0,dotSize=1,lineWeight=1,frequency=1,depth=1,direction=0,rotation=0,cellSize=8,arms=5,edgeSpread=1,brightness=0,contrast=0,colorMode="rgb",posterize=6,solarizeT=128,duoH="#000000",duoL="#00ff41",dpi=1}=p;
  const errs=new Float32Array(w*h*3);
  const dpiS=Math.max(0.25,dpi);
  const rotRad=rotation*Math.PI/180,cosR=Math.cos(rotRad),sinR=Math.sin(rotRad);
  const contF=((contrast+100)/100)**2;
  const ox=offsetX||0, oy=offsetY||0;
  const duoHR=parseInt((duoH||"#000000").slice(1,3),16),duoHG=parseInt((duoH||"#000000").slice(3,5),16),duoHB=parseInt((duoH||"#000000").slice(5,7),16);
  const duoLR=parseInt((duoL||"#00ff41").slice(1,3),16),duoLG=parseInt((duoL||"#00ff41").slice(3,5),16),duoLB=parseInt((duoL||"#00ff41").slice(5,7),16);
  let vCells=null;if(algo==="Voronoi")vCells=voronoiCells(w,h,cellSize*dpiS);

  for(let y=0;y<h;y++){
    const rev=serpentine&&y%2===1;const x0=rev?w-1:0,x1=rev?-1:w,dx=rev?-1:1;
    for(let x=x0;x!==x1;x+=dx){
      const i=(y*w+x)*4,ei=(y*w+x)*3;
      const px=x+ox, py=y+oy; // pattern-shifted coords
      // For error diffusion & threshold: offset the SOURCE read position (wrap around)
      const hasOffset=(ox!==0||oy!==0);
      const sx=hasOffset?((x+Math.round(ox))%w+w)%w:x;
      const sy=hasOffset?((y+Math.round(oy))%h+h)%h:y;
      const si=(sy*w+sx)*4;
      let r=255*Math.pow(data[hasOffset?si:i]/255,1/gamma)+errs[ei]+bias;
      let g=255*Math.pow(data[hasOffset?si+1:i+1]/255,1/gamma)+errs[ei+1]+bias;
      let b=255*Math.pow(data[hasOffset?si+2:i+2]/255,1/gamma)+errs[ei+2]+bias;
      r=(r+brightness-128)*contF+128;g=(g+brightness-128)*contF+128;b=(b+brightness-128)*contF+128;
      if(invert){r=255-r;g=255-g;b=255-b;}
      // Color modes
      if(colorMode==="grayscale"){const l=r*0.299+g*0.587+b*0.114;r=g=b=l;}
      else if(colorMode==="sepia"){const l=r*0.299+g*0.587+b*0.114;r=l+40;g=l+20;b=l-20;}
      else if(colorMode==="posterize"){const lv=Math.max(2,posterize);r=Math.round(r/255*(lv-1))/(lv-1)*255;g=Math.round(g/255*(lv-1))/(lv-1)*255;b=Math.round(b/255*(lv-1))/(lv-1)*255;}
      else if(colorMode==="solarize"){if(r>solarizeT)r=255-r;if(g>solarizeT)g=255-g;if(b>solarizeT)b=255-b;}
      else if(colorMode==="duotone"){const l=(r*0.299+g*0.587+b*0.114)/255;r=duoHR+(duoLR-duoHR)*l;g=duoHG+(duoLG-duoHG)*l;b=duoHB+(duoLB-duoHB)*l;}
      r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
      const br=(r*0.299+g*0.587+b*0.114)/255;

      if(algo.startsWith("Bayer")){const sz=algo==="Bayer 2x2"?2:algo==="Bayer 4x4"?4:8;const mt=sz===2?B2:sz===4?B4:B8;const th=((mt[((py%sz)+sz)%sz][((px%sz)+sz)%sz]+0.5)/(sz*sz)-0.5)*255*spread;const c=closestColor(r+th,g+th,b+th,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Halftone"){const a=htAngle*Math.PI/180,cs=Math.max(2,Math.round(4*dotSize*dpiS));const rx2=px*Math.cos(a)-py*Math.sin(a),ry2=px*Math.sin(a)+py*Math.cos(a);const cx=(rx2%cs+cs)%cs-cs/2,cy=(ry2%cs+cs)%cs-cs/2;const d=Math.sqrt(cx*cx+cy*cy)/(cs*0.7);const c=(br+dotGain/100)>d?pal[pal.length-1]:pal[0];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Cross-Hatch"){const sz=Math.max(2,Math.round(6*lineWeight*dpiS));const xr=px*cosR-py*sinR,yr=px*sinR+py*cosR;const h1=((Math.round(xr)+Math.round(yr))%sz+sz)%sz<1,h2=((Math.round(xr)-Math.round(yr))%sz+sz)%sz<1,h3=(Math.round(xr)%sz+sz)%sz<1,h4=(Math.round(yr)%sz+sz)%sz<1;const on=br<0.2?h1||h2||h3||h4:br<0.4?h1||h2||h3:br<0.6?h1||h2:br<0.8?h1:false;const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Diagonal"){const sz=Math.max(2,Math.round(5*lineWeight*dpiS));const xr=px*cosR-py*sinR;const on=((Math.round(xr+py)%sz)+sz)%sz<Math.round(sz*(1-br));const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="H-Lines"||algo==="V-Lines"){const sz=Math.max(2,Math.round(4*lineWeight*dpiS));const coord=algo==="H-Lines"?py:px;const on=(coord%sz)<Math.round(sz*(1-br));const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Bi-Thread"){const sz=Math.max(3,Math.round(6*lineWeight*dpiS));const xr=px*cosR-py*sinR,yr=px*sinR+py*cosR;const t1=((Math.round(xr)%sz)+sz)%sz,t2=((Math.round(yr)%sz)+sz)%sz;const on=br<0.5?(t1<Math.round(sz*(1-br)*0.6)||t2<Math.round(sz*(1-br)*0.6)):(t1<1&&br<0.8);const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Herringbone"){const sz=Math.max(3,Math.round(8*lineWeight*dpiS));const xr=px*cosR-py*sinR,yr=px*sinR+py*cosR;const block=Math.floor(yr/sz)%2===0;const coord=block?(Math.round(xr+yr)%sz+sz)%sz:(Math.round(xr-yr)%sz+sz)%sz;const on=coord<Math.round(sz*(1-br));const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="FM"){const dir=direction===0?py:direction===1?px:(px+py)*0.707;const freq=frequency*(1+(1-br)*3)/dpiS;const wave=Math.sin(dir*freq*0.3)*0.5+0.5;const on=wave<(1-br)*depth;const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="AM"){const dir=direction===0?py:direction===1?px:(px+py)*0.707;const wave=Math.sin(dir*frequency*0.5/dpiS);const on=Math.abs(wave)<(1-br)*depth;const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Wave"){const dir=direction===0?py:direction===1?px:(px+py)*0.707;const perp=direction===0?px:direction===1?py:(px-py)*0.707;const wave=Math.sin(dir*frequency*0.4/dpiS+perp*0.01);const on=Math.abs(wave)*lineWeight*4<(1-br)*lineWeight*3*depth;const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Contour"){const levels=Math.max(2,Math.round(frequency*8));const q=Math.floor(br*levels)/levels;const on=Math.abs(br-q-0.5/levels)<(0.02*depth*lineWeight);const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Random"){const c=closestColor(r+(Math.random()-0.5)*255*spread,g+(Math.random()-0.5)*255*spread,b+(Math.random()-0.5)*255*spread,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Blue Noise"){const n=(Math.sin(px*12.9898+py*78.233)*43758.5453%1+Math.cos(px*4.898+py*7.23)*23421.631%1)/2;const th=(n-0.5)*255*spread;const c=closestColor(r+th,g+th,b+th,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Stipple"){const cs2=cellSize*dpiS;const cx2=Math.floor(px/cs2)*cs2+cs2/2,cy2=Math.floor(py/cs2)*cs2+cs2/2;const d=Math.sqrt((px-cx2)**2+(py-cy2)**2)/(cs2*0.7);const on=d<(1-br)*spread;const c=on?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Grain"){const n1=Math.sin(px*127.1+py*311.7)*43758.5453%1;const n2=Math.sin(px*269.5+py*183.3)*28001.8384%1;const c=closestColor(r+(n1*0.6+n2*0.4-0.5)*255*spread,g+(n1*0.6+n2*0.4-0.5)*255*spread,b+(n1*0.6+n2*0.4-0.5)*255*spread,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Spiral"){const ddx=px-w/2,ddy=py-h/2;const c=Math.sin(Math.atan2(ddy,ddx)*arms+Math.sqrt(ddx*ddx+ddy*ddy)*frequency*0.05/dpiS)<(1-br)*2-1?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Concentric"){const c=Math.sin(Math.sqrt((px-w/2)**2+(py-h/2)**2)*frequency*0.15/dpiS)<(1-br)*2-1?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      if(algo==="Voronoi"){let d1=Infinity,d2=Infinity;for(const cell of vCells){const d=Math.sqrt((px-cell.x)**2+(py-cell.y)**2);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}const c=(d2-d1)<edgeSpread*lineWeight*2*(1.2-br)?pal[0]:pal[pal.length-1];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}

      // --- Plus pattern ---
      if(algo==="Plus"){
        const sz=Math.max(2,Math.round((p.plusSize||6)*dpiS));
        const gap=Math.max(sz+1,Math.round((p.plusGap||16)*dpiS));
        const thk=Math.max(1,Math.round((p.plusThickness||2)*dpiS));
        const halfT=Math.floor(thk/2);
        const cx2=((px%gap)+gap)%gap-Math.floor(gap/2);
        const cy2=((py%gap)+gap)%gap-Math.floor(gap/2);
        const inH=Math.abs(cy2)<=halfT&&Math.abs(cx2)<=sz;
        const inV=Math.abs(cx2)<=halfT&&Math.abs(cy2)<=sz;
        const inPlus=inH||inV;
        // Brightness controls whether plus is shown
        const show=br<0.7;
        const on=inPlus&&show;
        // Also modulate: very dark areas get bigger plus via additional check
        const c=on?pal[pal.length-1]:pal[0];
        data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;
      }

      // --- Numbers pattern ---
      if(algo==="Numbers"){
        const fSz=Math.max(5,Math.round((p.numFontSize||10)*dpiS));
        const bw=p.numBlockW||5; // digits per row in block
        const bh=p.numBlockH||6; // rows per block
        const blockGap=Math.max(fSz,Math.round((p.numGap||20)*dpiS));
        const charW=Math.ceil(fSz*0.65);
        const charH=fSz;
        const blockPxW=bw*charW+blockGap;
        const blockPxH=bh*charH+blockGap;
        // Which block are we in?
        const bx2=((px%blockPxW)+blockPxW)%blockPxW;
        const by2=((py%blockPxH)+blockPxH)%blockPxH;
        // Are we in the text area (not gap)?
        const inTextX=bx2<bw*charW;
        const inTextY=by2<bh*charH;
        if(!inTextX||!inTextY){
          const c=pal[0];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;
        }
        // Which char cell?
        const cx3=Math.floor(bx2/charW);
        const cy3=Math.floor(by2/charH);
        // Local pixel within char cell
        const lx=bx2-cx3*charW;
        const ly=by2-cy3*charH;
        // Block index for seeded random
        const blkIdxX=Math.floor(px/blockPxW);
        const blkIdxY=Math.floor(py/blockPxH);
        // Seeded random digit
        const seed=Math.abs(Math.sin(blkIdxX*127.1+blkIdxY*311.7+cx3*73.7+cy3*37.9)*43758.5453);
        const digit=Math.floor((seed%1)*10);
        // 3x5 bitmap font for digits 0-9
        const GLYPHS=[0x7B6F,0x26C9,0x73E7,0x73CF,0x5BC9,0x79CF,0x79EF,0x7249,0x7BEF,0x7BC9];
        // Each glyph is 4 wide x 5 tall stored in 20 bits (top-left first, row by row)
        const GLYPHS4x5=[
          [0xF,0x9,0x9,0x9,0xF],// 0
          [0x2,0x6,0x2,0x2,0x7],// 1
          [0xF,0x1,0xF,0x8,0xF],// 2
          [0xF,0x1,0xF,0x1,0xF],// 3
          [0x9,0x9,0xF,0x1,0x1],// 4
          [0xF,0x8,0xF,0x1,0xF],// 5
          [0xF,0x8,0xF,0x9,0xF],// 6
          [0xF,0x1,0x2,0x4,0x4],// 7
          [0xF,0x9,0xF,0x9,0xF],// 8
          [0xF,0x9,0xF,0x1,0xF],// 9
        ];
        // Scale glyph to cell
        const gx=Math.floor(lx/charW*4);
        const gy=Math.floor(ly/charH*5);
        const glyph=GLYPHS4x5[digit]||GLYPHS4x5[0];
        const bit=(gy<5&&gx<4)?((glyph[gy]>>(3-gx))&1):0;
        // Show block based on brightness (darker = show numbers)
        const blockBr=br;
        const show2=blockBr<0.65;
        const on2=bit&&show2;
        const c=on2?pal[pal.length-1]:pal[0];
        data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;
      }

      if(algo==="Threshold"){const c=closestColor(r,g,b,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];continue;}
      const c=closestColor(r,g,b,pal);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];
      const er=(r-c[0])*errStr,eg=(g-c[1])*errStr,eb=(b-c[2])*errStr;
      const kern=ERR_K[algo];if(kern)for(const[ox,oy,wt]of kern){const nx=x+ox*dx,ny=y+oy;if(nx>=0&&nx<w&&ny<h){const ni=(ny*w+nx)*3;errs[ni]+=er*wt;errs[ni+1]+=eg*wt;errs[ni+2]+=eb*wt;}}
    }
  }
  return data;
}

// --- GLITCH ENGINE ---
function applyGlitch(ctx,canvas,src,fx,t){
  const w=canvas.width,h=canvas.height;ctx.drawImage(src,0,0,w,h);
  if(fx.crt?.on&&fx.crt.curvature>0){const k=fx.crt.curvature*0.5,id=ctx.getImageData(0,0,w,h),od=ctx.createImageData(w,h),cx=w/2,cy=h/2;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const nx2=(x-cx)/cx,ny2=(y-cy)/cy,r2=nx2*nx2+ny2*ny2,d2=1+r2*k,sx=Math.round(nx2*d2*cx+cx),sy=Math.round(ny2*d2*cy+cy),di=(y*w+x)*4;if(sx>=0&&sx<w&&sy>=0&&sy<h){const si=(sy*w+sx)*4;od.data[di]=id.data[si];od.data[di+1]=id.data[si+1];od.data[di+2]=id.data[si+2];od.data[di+3]=id.data[si+3];}else od.data[di+3]=255;}ctx.putImageData(od,0,0);}
  if(fx.pixelate?.on&&(fx.pixelate.size??1)>1){const s=fx.pixelate.size,tc=document.createElement("canvas");tc.width=Math.ceil(w/s);tc.height=Math.ceil(h/s);const tx=tc.getContext("2d");tx.imageSmoothingEnabled=false;tx.drawImage(canvas,0,0,tc.width,tc.height);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);ctx.drawImage(tc,0,0,w,h);ctx.imageSmoothingEnabled=true;}
  if(fx.rgbShift?.on&&(fx.rgbShift.amount??0)>0){const a=fx.rgbShift.amount,spd=fx.rgbShift.speed??0,angBase=(fx.rgbShift.angle||0),ang=(angBase+t*spd*120)*Math.PI/180,ddx=Math.cos(ang)*a,ddy=Math.sin(ang)*a,id=ctx.getImageData(0,0,w,h),od=new ImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,rx=Math.round(x-ddx),ry=Math.round(y-ddy),bx=Math.round(x+ddx),by=Math.round(y+ddy);od.data[i]=(rx>=0&&rx<w&&ry>=0&&ry<h)?id.data[(ry*w+rx)*4]:id.data[i];od.data[i+1]=id.data[i+1];od.data[i+2]=(bx>=0&&bx<w&&by>=0&&by<h)?id.data[(by*w+bx)*4+2]:id.data[i+2];od.data[i+3]=255;}ctx.putImageData(od,0,0);}
  if(fx.chromatic?.on&&(fx.chromatic.amount??0)>0){const baseAmt=fx.chromatic.amount,spd=fx.chromatic.speed??0,amt=baseAmt*(1+Math.sin(t*spd*4)*0.5*Math.min(spd,1)),id=ctx.getImageData(0,0,w,h),od=new ImageData(w,h),cx2=w/2,cy2=h/2;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,ddx=(x-cx2)/cx2,ddy=(y-cy2)/cy2,dist=Math.sqrt(ddx*ddx+ddy*ddy),sh=Math.round(dist*amt),rx=Math.min(w-1,Math.max(0,x-sh)),bx=Math.min(w-1,Math.max(0,x+sh));od.data[i]=id.data[(y*w+rx)*4];od.data[i+1]=id.data[i+1];od.data[i+2]=id.data[(y*w+bx)*4+2];od.data[i+3]=255;}ctx.putImageData(od,0,0);}
  if(fx.glitch?.on&&(fx.glitch.intensity??0)>0){const int=fx.glitch.intensity,bh=fx.glitch.blockSize??8,spd=fx.glitch.speed??0.5;const gt=t*spd;for(let y=0;y<h;y+=bh){const rnd=Math.abs(Math.sin(gt*2.1+y*0.37)*Math.cos(gt*1.3+y*0.13));if(rnd>1-int){const shift=Math.round((Math.sin(gt*1.7+y*0.73)-0.5)*int*w*0.3),bht=Math.min(bh,h-y);if(bht>0)try{const bd=ctx.getImageData(0,y,w,bht);ctx.clearRect(0,y,w,bht);ctx.putImageData(bd,shift,y);}catch(e){}}}}
  if(fx.blockGlitch?.on&&(fx.blockGlitch.count??0)>0){const count=fx.blockGlitch.count,maxSz=fx.blockGlitch.maxSize??50,spd=fx.blockGlitch.speed??0.5,bt=t*spd;for(let i=0;i<count;i++){const s1=Math.abs(Math.sin(bt*2.7+i*73.1+0.5)*43758.5453)%1,s2=Math.abs(Math.cos(bt*3.1+i*91.7+0.3)*28001.8384)%1,s3=Math.abs(Math.sin(bt*1.3+i*47.3+0.7)*17943.2846)%1,s4=Math.abs(Math.cos(bt*4.1+i*31.9+0.1)*36712.9182)%1;const bx=Math.floor(s1*w*0.8),by=Math.floor(s2*h*0.8),bw=Math.max(8,Math.floor(s3*maxSz)),bh2=Math.max(4,Math.floor(s4*maxSz*0.4)),sw2=Math.min(bw,w-bx-1),sh2=Math.min(bh2,h-by-1);if(sw2>1&&sh2>1)try{const bl=ctx.getImageData(bx,by,sw2,sh2);ctx.putImageData(bl,bx+Math.round((Math.sin(bt*5+i*13)*0.5+0.5)*60-30),by+Math.round((Math.cos(bt*3+i*17)*0.5+0.5)*20-10));}catch(e){}}}
  if(fx.jitter?.on&&(fx.jitter.amount??0)>0){const amt=fx.jitter.amount,spd=fx.jitter.speed??1,jt=t*spd,id=ctx.getImageData(0,0,w,h),od=ctx.createImageData(w,h);for(let y=0;y<h;y++){const n=Math.sin(y*0.7+jt*15)*Math.cos(y*0.3+jt*8),j=Math.round(n*amt*(0.4+0.6*Math.abs(Math.sin(y*0.05+jt*3))));for(let x=0;x<w;x++){const sx=Math.max(0,Math.min(w-1,x+j)),si=(y*w+sx)*4,di=(y*w+x)*4;od.data[di]=id.data[si];od.data[di+1]=id.data[si+1];od.data[di+2]=id.data[si+2];od.data[di+3]=id.data[si+3];}}ctx.putImageData(od,0,0);}
  // Color Cycle — palette rotation applied in pipeline, not here
  // Solarize — animated threshold sweep applied in pipeline, not here
  if(fx.scanlines?.on){const gap=fx.scanlines.gap??2,op=fx.scanlines.opacity??0.3,off=Math.floor(t*(fx.scanlines.speed??0)*50)%(gap+1);ctx.fillStyle=`rgba(0,0,0,${op})`;for(let y=off;y<h;y+=gap+1)ctx.fillRect(0,y,w,1);}
  if(fx.noise?.on&&(fx.noise.amount??0)>0){const id=ctx.getImageData(0,0,w,h),amt=fx.noise.amount,tt=Math.floor(t*(fx.noise.speed??0.3)*30);for(let i=0;i<id.data.length;i+=4){const n=((Math.sin((i+tt)*12.9898+78.233)*43758.5453)%1)*amt*255;id.data[i]=Math.max(0,Math.min(255,id.data[i]+n));id.data[i+1]=Math.max(0,Math.min(255,id.data[i+1]+n));id.data[i+2]=Math.max(0,Math.min(255,id.data[i+2]+n));}ctx.putImageData(id,0,0);}
  if(fx.vignette?.on&&(fx.vignette.strength??0)>0){const gr=ctx.createRadialGradient(w/2,h/2,w*0.2,w/2,h/2,w*0.75);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,`rgba(0,0,0,${fx.vignette.strength})`);ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);}
}

// --- ASCII ---
const CHARSETS={off:null,standard:" .:-=+*#%@",blocks:" \u2591\u2592\u2593\u2588",minimal:" .:*#",detailed:" .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",binary:"01",braille:"\u2800\u2801\u2803\u2807\u280F\u281F\u283F\u287F\u28FF",dots:" \u00B7\u2022\u25CF\u2B24"};
function renderAscii(srcCanvas,outCanvas,charset,cols){if(!charset)return;const sw=srcCanvas.width,sh=srcCanvas.height,rows=Math.round(cols*(sh/sw)*0.5);const tmp=document.createElement("canvas");tmp.width=cols;tmp.height=rows;tmp.getContext("2d").drawImage(srcCanvas,0,0,cols,rows);const id=tmp.getContext("2d").getImageData(0,0,cols,rows),cw=7,ch=12;outCanvas.width=cols*cw;outCanvas.height=rows*ch;const ctx=outCanvas.getContext("2d");ctx.fillStyle="#0a0a0a";ctx.fillRect(0,0,outCanvas.width,outCanvas.height);ctx.font=`${ch-1}px 'Courier New',monospace`;ctx.textBaseline="top";ctx.fillStyle="#d0d0d0";for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*4,br=(0.299*id.data[i]+0.587*id.data[i+1]+0.114*id.data[i+2])*(id.data[i+3]/255),ci=Math.floor((br/255)*(charset.length-1));ctx.fillText(charset[Math.max(0,Math.min(charset.length-1,ci))],x*cw,y*ch);}}

// --- 3D PARSERS ---
function parseOBJ(text){
  const verts=[],norms=[],faces=[];
  for(const line of text.split("\n")){
    const p=line.trim().split(/\s+/);
    if(p[0]==="v")verts.push([+p[1],+p[2],+p[3]]);
    else if(p[0]==="vn")norms.push([+p[1],+p[2],+p[3]]);
    else if(p[0]==="f"){
      const ids=p.slice(1).map(s=>{const pp=s.split("/");return{v:parseInt(pp[0])-1,n:pp[2]?parseInt(pp[2])-1:-1};});
      for(let i=1;i<ids.length-1;i++)faces.push([ids[0],ids[i],ids[i+1]]);
    }
  }
  const pos=new Float32Array(faces.length*9);
  const norm=new Float32Array(faces.length*9);
  let idx=0;
  for(const f of faces){
    for(const fi of f){
      const v=verts[fi.v]||[0,0,0];pos[idx]=v[0];pos[idx+1]=v[1];pos[idx+2]=v[2];
      if(fi.n>=0&&norms[fi.n]){const n=norms[fi.n];norm[idx]=n[0];norm[idx+1]=n[1];norm[idx+2]=n[2];}
      idx+=3;
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  if(norms.length>0)geo.setAttribute("normal",new THREE.BufferAttribute(norm,3));
  else geo.computeVertexNormals();
  return geo;
}

function parseSTL(buffer){
  const dv=new DataView(buffer);
  const numTri=dv.getUint32(80,true);
  const pos=new Float32Array(numTri*9);
  const norm=new Float32Array(numTri*9);
  let offset=84;
  for(let t=0;t<numTri;t++){
    const nx=dv.getFloat32(offset,true),ny=dv.getFloat32(offset+4,true),nz=dv.getFloat32(offset+8,true);
    offset+=12;
    for(let v=0;v<3;v++){
      const i=t*9+v*3;
      pos[i]=dv.getFloat32(offset,true);pos[i+1]=dv.getFloat32(offset+4,true);pos[i+2]=dv.getFloat32(offset+8,true);
      norm[i]=nx;norm[i+1]=ny;norm[i+2]=nz;
      offset+=12;
    }
    offset+=2;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  geo.setAttribute("normal",new THREE.BufferAttribute(norm,3));
  return geo;
}

function parseGLB(buffer){
  const dv=new DataView(buffer);
  const jsonLen=dv.getUint32(12,true);
  const jsonStr=new TextDecoder().decode(new Uint8Array(buffer,20,jsonLen));
  const json=JSON.parse(jsonStr);
  const binStart=20+jsonLen+8;
  const bin=buffer.slice(binStart);

  const accessors=json.accessors||[];
  const bufferViews=json.bufferViews||[];
  const meshes=json.meshes||[];

  function getAccessorData(accIdx,Cls){
    const acc=accessors[accIdx];const bv=bufferViews[acc.bufferView||0];
    const offset=(bv.byteOffset||0)+(acc.byteOffset||0);
    const count=acc.count;const compSize={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[acc.type]||1;
    return new Cls(bin,offset,count*compSize);
  }

  const group=new THREE.Group();
  for(const mesh of meshes){
    for(const prim of mesh.primitives||[]){
      const geo=new THREE.BufferGeometry();
      if(prim.attributes?.POSITION!==undefined){
        geo.setAttribute("position",new THREE.BufferAttribute(getAccessorData(prim.attributes.POSITION,Float32Array),3));
      }
      if(prim.attributes?.NORMAL!==undefined){
        geo.setAttribute("normal",new THREE.BufferAttribute(getAccessorData(prim.attributes.NORMAL,Float32Array),3));
      }
      if(prim.indices!==undefined){
        const acc=accessors[prim.indices];
        const Cls=acc.componentType===5123?Uint16Array:Uint32Array;
        geo.setIndex(new THREE.BufferAttribute(getAccessorData(prim.indices,Cls),1));
      }
      if(!geo.attributes.normal)geo.computeVertexNormals();
      const mat=new THREE.MeshStandardMaterial({color:0xbbbbbb,roughness:0.6,metalness:0.2});
      group.add(new THREE.Mesh(geo,mat));
    }
  }
  return group;
}

function setup3DScene(objectOrGeo){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x111111);

  let obj;
  if(objectOrGeo.isBufferGeometry){
    const mat=new THREE.MeshStandardMaterial({color:0xbbbbbb,roughness:0.6,metalness:0.2});
    obj=new THREE.Mesh(objectOrGeo,mat);
  }else{
    obj=objectOrGeo;
  }

  const box=new THREE.Box3().setFromObject(obj);
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3()).length();
  obj.position.sub(center);
  obj.scale.multiplyScalar(2/size);
  scene.add(obj);

  scene.add(new THREE.AmbientLight(0x555555));
  const dl=new THREE.DirectionalLight(0xffffff,1);dl.position.set(3,4,5);scene.add(dl);
  const dl2=new THREE.DirectionalLight(0x444466,0.5);dl2.position.set(-3,-2,-3);scene.add(dl2);

  const camera=new THREE.PerspectiveCamera(45,4/3,0.01,100);
  camera.position.set(0,1,3.5);camera.lookAt(0,0,0);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);
  renderer.setSize(4,4); // placeholder, resized on first frame

  return{scene,camera,renderer};
}

// --- UI ---
const LBL={fontSize:10,opacity:0.4,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"inherit"};
function Rng({label,value,onChange,min,max,step=1,suffix=""}){const pct=((value-min)/(max-min))*100;return(<div style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={LBL}>{label}</span><span style={{fontSize:10,fontFamily:"'Courier New',monospace",color:"#ccc"}}>{typeof value==="number"?value.toFixed(step<1?2:0):value}{suffix}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{width:"100%",height:2,appearance:"none",background:`linear-gradient(to right,#888 ${pct}%,#222 ${pct}%)`,borderRadius:1,cursor:"pointer",outline:"none",accentColor:"#aaa"}}/></div>);}
function Tog({label,value,onChange}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5,cursor:"pointer",userSelect:"none"}} onClick={()=>onChange(!value)}><span style={LBL}>{label}</span><div style={{width:26,height:13,borderRadius:7,background:value?"#bbb":"#222",position:"relative",transition:"all 0.15s",border:`1px solid ${value?"#999":"#333"}`}}><div style={{width:9,height:9,borderRadius:5,background:value?"#111":"#555",position:"absolute",top:1,left:value?14:2,transition:"all 0.15s"}}/></div></div>);}
function Sel({label,value,onChange,opts}){return(<div style={{marginBottom:7}}><div style={{...LBL,marginBottom:2}}>{label}</div><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"3px 5px",background:"#0a0a0a",border:"1px solid #2a2a2a",color:"#ccc",fontFamily:"'Courier New',monospace",fontSize:10,borderRadius:2,cursor:"pointer",outline:"none"}}>{opts.map(o=><option key={o.v} value={o.v} style={{background:"#0a0a0a"}}>{o.l}</option>)}</select></div>);}
function Sec({title,children,defaultOpen=true}){const[open,setOpen]=useState(defaultOpen);return(<div style={{borderBottom:"1px solid #1a1a1a",paddingBottom:4}}><div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"8px 0 4px",userSelect:"none"}}><span style={{fontSize:8,color:"#666",transition:"transform 0.15s",transform:open?"rotate(90deg)":"rotate(0)"}}>{"\u25B6"}</span><span style={{fontSize:9,fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.15em",color:"#888"}}>{title}</span></div>{open&&<div style={{paddingLeft:2,paddingTop:2}}>{children}</div>}</div>);}

// --- COLOR PICKER SWATCH ---
function ColorSwatch({color,onChange,onRemove}){
  return(<div style={{position:"relative",display:"inline-block"}}>
    <label style={{display:"block",width:22,height:22,borderRadius:2,border:"1px solid #333",cursor:"pointer",background:color,position:"relative"}}>
      <input type="color" value={color} onChange={e=>onChange(e.target.value)} style={{opacity:0,position:"absolute",width:"100%",height:"100%",cursor:"pointer"}}/>
    </label>
    {onRemove&&<button onClick={onRemove} style={{position:"absolute",top:-6,right:-6,width:14,height:14,borderRadius:7,background:"#444",color:"#ccc",border:"none",fontSize:9,cursor:"pointer",lineHeight:"12px",textAlign:"center",padding:0}}>x</button>}
  </div>);
}

// --- MAIN ---
export default function UESCProcessor(){
  const[imageEl,setImageEl]=useState(null);const[mediaType,setMediaType]=useState(null);const[videoEl,setVideoEl]=useState(null);const[videoPlaying,setVideoPlaying]=useState(false);
  const[animate,setAnimate]=useState(true);const[showPanel,setShowPanel]=useState(true);const[err,setErr]=useState(null);const[recording,setRecording]=useState(false);
  const[palette,setPalette]=useState("Original");
  const[customColors,setCustomColors]=useState(["#000000","#00ff41"]);
  const[ditherAlgo,setDitherAlgo]=useState("None");
  const[dp,setDp]=useState({...DP0});
  const[asciiMode,setAsciiMode]=useState("off");const[asciiCols,setAsciiCols]=useState(100);const[asciiInvert,setAsciiInvert]=useState(false);
  const[glitchPreset,setGlitchPreset]=useState("off");
  const[gfx,setGfx]=useState(structuredClone(GLITCH_PRESETS.off));
  const[zoom,setZoom]=useState(1);const[pan,setPan]=useState({x:0,y:0});
  const isPanning=useRef(false);const panStart=useRef({x:0,y:0});
  // 3D
  const threeRef=useRef(null); // {scene,camera,renderer}
  const orbitRef=useRef({theta:0.3,phi:1.2,dist:3.5}); // spherical orbit
  const isOrbiting=useRef(false);const orbitStart=useRef({x:0,y:0,theta:0,phi:0});
  const viewportRef=useRef(null);
  const[cam3d,setCam3d]=useState({fov:45,dist:3.5,height:0.5,turntable:false,turnSpeed:0.5});
  const srcRef=useRef(null);const ditherRef=useRef(null);const dispRef=useRef(null);const asciiRef=useRef(null);
  const fileRef=useRef(null);const animRef=useRef(null);const vidRef=useRef(null);const t0Ref=useRef(0);
  const recorderRef=useRef(null);const chunksRef=useRef([]);

  const pRef=useRef({palette,customColors,ditherAlgo,dp,asciiMode,asciiCols,asciiInvert,gfx,cam3d});
  pRef.current={palette,customColors,ditherAlgo,dp,asciiMode,asciiCols,asciiInvert,gfx,cam3d};

  const loadFile=useCallback((e)=>{const file=e.target?.files?.[0]||e.dataTransfer?.files?.[0];if(!file)return;setErr(null);setImageEl(null);setVideoEl(null);setVideoPlaying(false);setZoom(1);setPan({x:0,y:0});cancelAnimationFrame(animRef.current);cancelAnimationFrame(vidRef.current);
    // Cleanup old 3D
    if(threeRef.current){threeRef.current.renderer.dispose();threeRef.current=null;}
    setMediaType(null);

    const name=file.name.toLowerCase();
    const isVideo=file.type.startsWith("video/"),isSvg=file.type==="image/svg+xml"||name.endsWith(".svg");
    const is3D=name.endsWith(".obj")||name.endsWith(".stl")||name.endsWith(".glb")||name.endsWith(".gltf");

    if(is3D){
      const reader=new FileReader();
      reader.onload=(ev)=>{
        try{
          let geoOrGroup;
          if(name.endsWith(".obj")){geoOrGroup=parseOBJ(ev.target.result);}
          else if(name.endsWith(".stl")){geoOrGroup=parseSTL(ev.target.result);}
          else if(name.endsWith(".glb")){geoOrGroup=parseGLB(ev.target.result);}
          else{setErr("Unsupported 3D format");return;}

          const s=setup3DScene(geoOrGroup);
          threeRef.current=s;
          orbitRef.current={theta:0.3,phi:1.2,dist:3.5};
          setMediaType("3d");
          // Render placeholder first frame
          s.renderer.setSize(800,600);s.camera.aspect=4/3;s.camera.updateProjectionMatrix();
          const o=orbitRef.current;
          s.camera.position.set(o.dist*Math.sin(o.phi)*Math.sin(o.theta),o.dist*Math.cos(o.phi),o.dist*Math.sin(o.phi)*Math.cos(o.theta));
          s.camera.lookAt(0,0,0);
          s.renderer.render(s.scene,s.camera);
          const fi=new Image();fi.onload=()=>setImageEl(fi);fi.src=s.renderer.domElement.toDataURL();
        }catch(ex){setErr("3D parse error: "+ex.message);}
      };
      if(name.endsWith(".obj"))reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    }
    else if(isVideo){const url=URL.createObjectURL(file);const v=document.createElement("video");v.muted=true;v.loop=true;v.playsInline=true;v.onloadeddata=()=>{setVideoEl(v);setMediaType("video");const tc=document.createElement("canvas");tc.width=v.videoWidth;tc.height=v.videoHeight;tc.getContext("2d").drawImage(v,0,0);const fi=new Image();fi.onload=()=>setImageEl(fi);fi.src=tc.toDataURL();};v.onerror=()=>{setErr("Video load failed");URL.revokeObjectURL(url);};v.src=url;}
    else{const reader=new FileReader();reader.onload=(ev)=>{const durl=ev.target.result;if(isSvg){const si=new Image();si.onload=()=>{const rc=document.createElement("canvas");rc.width=si.naturalWidth||800;rc.height=si.naturalHeight||600;rc.getContext("2d").drawImage(si,0,0,rc.width,rc.height);const fi=new Image();fi.onload=()=>{setImageEl(fi);setMediaType("image");};fi.src=rc.toDataURL("image/png");};si.onerror=()=>setErr("SVG load failed");si.src=durl;}else{const img=new Image();img.onload=()=>{setImageEl(img);setMediaType("image");};img.onerror=()=>setErr("Image load failed");img.src=durl;}};reader.readAsDataURL(file);}
    if(e.target?.value!==undefined)e.target.value="";
  },[]);
  const onDrop=useCallback((e)=>{e.preventDefault();loadFile(e);},[loadFile]);
  const onDragOver=useCallback((e)=>e.preventDefault(),[]);

  const getPal=useCallback((palName,cc)=>{if(palName==="Original")return null;if(palName==="Custom")return cc.map(c=>{if(c.startsWith("#")&&c.length>=7)return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];return[0,0,0];});return PALETTES[palName];},[]);

  const renderFrame=useCallback((sourceEl,time)=>{
    const P=pRef.current;const src=srcRef.current,dith=ditherRef.current,disp=dispRef.current,ascii=asciiRef.current;if(!src||!dith||!disp)return;

    // 3D mode: render scene to get source pixels
    let actualSource=sourceEl;
    if(threeRef.current){
      const s=threeRef.current,o=orbitRef.current,c3=P.cam3d||{};
      // Resize to viewport
      const vp=viewportRef.current;
      const vpW=vp?vp.clientWidth:800, vpH=vp?vp.clientHeight:600;
      if(s.renderer.domElement.width!==vpW||s.renderer.domElement.height!==vpH){
        s.renderer.setSize(vpW,vpH);
        s.camera.aspect=vpW/vpH;
      }
      // Camera params
      const fov=c3.fov||45;
      if(s.camera.fov!==fov){s.camera.fov=fov;}
      s.camera.updateProjectionMatrix();
      const dist=c3.turntable?(c3.dist||3.5):o.dist;
      const height=c3.height||0.5;
      // Turntable: override theta with time-based rotation
      let theta=o.theta, phi=o.phi;
      if(c3.turntable){
        theta=time*(c3.turnSpeed||0.5);
        phi=Math.PI/2-Math.atan2(height,dist);
        phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));
      }
      s.camera.position.set(dist*Math.sin(phi)*Math.sin(theta),dist*Math.cos(phi)+height*0.5,dist*Math.sin(phi)*Math.cos(theta));
      s.camera.lookAt(0,0,0);
      s.renderer.render(s.scene,s.camera);
      actualSource=s.renderer.domElement;
    }
    if(!actualSource)return;

    const ew=actualSource.videoWidth||actualSource.naturalWidth||actualSource.width;
    const eh=actualSource.videoHeight||actualSource.naturalHeight||actualSource.height;if(!ew||!eh)return;
    const scale=P.dp.scale||1,maxSz=Math.round(800*scale),sc=Math.min(1,maxSz/Math.max(ew,eh))*scale;
    const w=Math.max(1,Math.round(ew*Math.min(sc,scale))),h=Math.max(1,Math.round(eh*Math.min(sc,scale)));
    src.width=w;src.height=h;src.getContext("2d").drawImage(actualSource,0,0,w,h);
    const pal=getPal(P.palette,P.customColors);
    // Compute dither offset animation
    const oFx=P.gfx.offset;
    let ditherOX=0, ditherOY=0;
    if(oFx?.on){
      const amt=oFx.amount||50;
      const dir=oFx.direction||0; // 0=H, 1=V, 2=diag, 3=radial
      const sx=oFx.speedX||0.5, sy=oFx.speedY||0;
      if(dir===0){ditherOX=time*sx*amt;ditherOY=time*sy*amt;}
      else if(dir===1){ditherOX=time*sy*amt;ditherOY=time*sx*amt;}
      else if(dir===2){ditherOX=time*sx*amt;ditherOY=time*sx*amt;}
      else{ditherOX=Math.sin(time*sx)*amt;ditherOY=Math.cos(time*sx)*amt;}
    }
    if(P.ditherAlgo!=="None"){const activePal=pal||[[0,0,0],[255,255,255]];const id=src.getContext("2d").getImageData(0,0,w,h);const dd=ditherImage(id.data,w,h,P.ditherAlgo,activePal,P.dp,ditherOX,ditherOY);dith.width=w;dith.height=h;dith.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(dd),w,h),0,0);}
    else if(pal){const id=src.getContext("2d").getImageData(0,0,w,h);const pp=preProcess(id.data,w,h,P.dp.blur||0,P.dp.sharpen||0);for(let i=0;i<pp.length;i+=4){const c=closestColor(pp[i],pp[i+1],pp[i+2],pal);pp[i]=c[0];pp[i+1]=c[1];pp[i+2]=c[2];}dith.width=w;dith.height=h;dith.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(pp),w,h),0,0);}
    else{dith.width=w;dith.height=h;dith.getContext("2d").drawImage(src,0,0);}

    // --- Pipeline animations: Color Cycle (palette rotation) & Solarize (sweep) ---
    const hasCycle = P.gfx.colorCycle?.on;
    const hasSolar = P.gfx.solarize?.on;
    if((hasCycle || hasSolar) && dith.width > 0){
      const pal = getPal(P.palette, P.customColors);
      const id = dith.getContext("2d").getImageData(0, 0, dith.width, dith.height);
      const d = id.data;

      if(hasCycle && pal && pal.length > 1){
        // Rotate palette indices: find closest palette index for each pixel, shift by time
        const shift = Math.floor(time * (P.gfx.colorCycle.speed ?? 1) * 3) % pal.length;
        if(shift !== 0){
          for(let i = 0; i < d.length; i += 4){
            // Find which palette index this pixel is closest to
            let bestIdx = 0, bestDist = Infinity;
            for(let j = 0; j < pal.length; j++){
              const dr = d[i]-pal[j][0], dg = d[i+1]-pal[j][1], db = d[i+2]-pal[j][2];
              const dist = dr*dr + dg*dg + db*db;
              if(dist < bestDist){ bestDist = dist; bestIdx = j; }
            }
            // Map to shifted palette index
            const newIdx = (bestIdx + shift) % pal.length;
            d[i] = pal[newIdx][0]; d[i+1] = pal[newIdx][1]; d[i+2] = pal[newIdx][2];
          }
        }
      }

      if(hasSolar){
        // Animated solarization: threshold sweeps up and down over time
        const baseT = P.gfx.solarize.threshold ?? 128;
        const sweep = Math.sin(time * (P.gfx.solarize.speed ?? 0.5) * Math.PI) * 127;
        const thr = Math.max(0, Math.min(255, baseT + sweep));
        for(let i = 0; i < d.length; i += 4){
          const lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
          if(lum > thr){ d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2]; }
        }
      }

      dith.getContext("2d").putImageData(id, 0, 0);
    }

    const chars=CHARSETS[P.asciiMode];
    if(chars&&ascii){let cs=chars;if(P.asciiInvert)cs=cs.split("").reverse().join("");renderAscii(dith,ascii,cs,P.asciiCols);const hasG=Object.values(P.gfx).some(v=>typeof v==="object"&&v?.on);if(hasG){const tc=document.createElement("canvas");tc.width=ascii.width;tc.height=ascii.height;tc.getContext("2d").drawImage(ascii,0,0);applyGlitch(ascii.getContext("2d"),ascii,tc,P.gfx,time);}disp.style.display="none";ascii.style.display="block";}
    else{if(ascii)ascii.style.display="none";disp.style.display="block";disp.width=w;disp.height=h;const hasG=Object.values(P.gfx).some(v=>typeof v==="object"&&v?.on);if(hasG)applyGlitch(disp.getContext("2d"),disp,dith,P.gfx,time);else disp.getContext("2d").drawImage(dith,0,0);}
  },[getPal]);

  useEffect(()=>{if(!imageEl||videoPlaying)return;t0Ref.current=performance.now();let r=true;const loop=()=>{if(!r)return;renderFrame(imageEl,animate?(performance.now()-t0Ref.current)/1000:0);animRef.current=requestAnimationFrame(loop);};loop();return()=>{r=false;cancelAnimationFrame(animRef.current);};},[imageEl,animate,renderFrame,videoPlaying,palette,customColors,ditherAlgo,dp,asciiMode,asciiCols,asciiInvert,gfx,cam3d]);
  useEffect(()=>{if(!videoEl||!videoPlaying)return;videoEl.play().catch(()=>{});t0Ref.current=performance.now();let r=true;const loop=()=>{if(!r)return;if(videoEl.paused||videoEl.ended){setVideoPlaying(false);return;}renderFrame(videoEl,(performance.now()-t0Ref.current)/1000);vidRef.current=requestAnimationFrame(loop);};loop();return()=>{r=false;cancelAnimationFrame(vidRef.current);videoEl.pause();};},[videoEl,videoPlaying,renderFrame]);

  const loadGlitchPreset=(k)=>{setGlitchPreset(k);const p=GLITCH_PRESETS[k];const g={...GFX0};for(const key of Object.keys(p)){if(key!=="name"&&typeof p[key]==="object")g[key]={...GFX0[key],...p[key]};}setGfx(g);};
  const setFx=(grp,key,val)=>setGfx(prev=>({...prev,[grp]:{...prev[grp],[key]:val}}));
  const loadMarathonPreset=(name)=>{const p=MARATHON_PRESETS[name];if(!p)return;setPalette(p.palette);setDitherAlgo(p.dither);setDp({...DP0,...p.dp});setGfx(structuredClone(p.gfx));setGlitchPreset("custom");};

  const doExportPng=()=>{const c=asciiMode!=="off"?asciiRef.current:dispRef.current;if(!c||!c.width)return;const link=document.createElement("a");link.download=`UESC_${Date.now()}.png`;link.href=c.toDataURL("image/png");document.body.appendChild(link);link.click();document.body.removeChild(link);};
  const startRec=()=>{const c=asciiMode!=="off"?asciiRef.current:dispRef.current;if(!c)return;chunksRef.current=[];try{const stream=c.captureStream(30);const mr=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9",videoBitsPerSecond:5e6});mr.ondataavailable=(e)=>{if(e.data.size>0)chunksRef.current.push(e.data);};mr.onstop=()=>{const blob=new Blob(chunksRef.current,{type:"video/webm"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`UESC_${Date.now()}.webm`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);setRecording(false);};mr.start();recorderRef.current=mr;setRecording(true);if(!animate)setAnimate(true);}catch(e2){setErr("Recording not supported");}};
  const stopRec=()=>{if(recorderRef.current?.state==="recording")recorderRef.current.stop();};

  const onWheel=useCallback((e)=>{e.preventDefault();
    if(mediaType==="3d"){const nd=Math.max(0.5,Math.min(15,orbitRef.current.dist*(e.deltaY>0?1.08:0.92)));orbitRef.current.dist=nd;setCam3d(p=>({...p,dist:Math.round(nd*10)/10}));return;}
    setZoom(z=>Math.max(0.1,Math.min(10,z*(e.deltaY>0?0.9:1.1))));},[mediaType]);
  const onMouseDown=useCallback((e)=>{
    if(mediaType==="3d"&&e.button===0&&!e.altKey){e.preventDefault();isOrbiting.current=true;orbitStart.current={x:e.clientX,y:e.clientY,theta:orbitRef.current.theta,phi:orbitRef.current.phi};return;}
    if(e.button===1||(e.button===0&&e.altKey)){e.preventDefault();isPanning.current=true;panStart.current={x:e.clientX-pan.x,y:e.clientY-pan.y};}
  },[pan,mediaType]);
  const onMouseMove=useCallback((e)=>{
    if(isOrbiting.current){const dx=(e.clientX-orbitStart.current.x)*0.008,dy=(e.clientY-orbitStart.current.y)*0.008;orbitRef.current.theta=orbitStart.current.theta+dx;orbitRef.current.phi=Math.max(0.1,Math.min(Math.PI-0.1,orbitStart.current.phi+dy));return;}
    if(isPanning.current)setPan({x:e.clientX-panStart.current.x,y:e.clientY-panStart.current.y});},[]);
  const onMouseUp=useCallback(()=>{isPanning.current=false;isOrbiting.current=false;},[]);

  const grp=DITHER_ALGOS[ditherAlgo]?.g;const pw=270;
  const checkerBg="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23111'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23111'/%3E%3Crect x='8' width='8' height='8' fill='%230d0d0d'/%3E%3Crect y='8' width='8' height='8' fill='%230d0d0d'/%3E%3C/svg%3E\")";

  return(
    <div onDrop={onDrop} onDragOver={onDragOver} style={{width:"100%",height:"100vh",display:"flex",background:"#0a0a0a",color:"#ccc",fontFamily:"'Courier New',monospace",overflow:"hidden"}}>
      <canvas ref={srcRef} style={{display:"none"}}/><canvas ref={ditherRef} style={{display:"none"}}/>

      {showPanel&&(<div style={{width:pw,minWidth:pw,height:"100%",borderRight:"1px solid #1a1a1a",display:"flex",flexDirection:"column",background:"#0a0a0a"}}>
        <div style={{padding:"10px 12px 6px",borderBottom:"1px solid #1a1a1a"}}><div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:"#eee"}}>UESC-PROCESSOR</div><div style={{fontSize:7,opacity:0.25,letterSpacing:2,marginTop:1}}>UNIFIED EFFECT PIPELINE</div></div>
        <div style={{padding:"6px 12px",borderBottom:"1px solid #151515"}}>
          <input ref={fileRef} type="file" accept="image/*,.svg,video/*,.obj,.stl,.glb,.gltf" onChange={loadFile} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:"7px 0",fontSize:9,fontFamily:"inherit",letterSpacing:2,textTransform:"uppercase",background:"#111",color:"#aaa",border:"1px dashed #333",borderRadius:2,cursor:"pointer"}}>{imageEl?"\u21BB REPLACE":"\u2295 IMPORT"}</button>
          {err&&<div style={{fontSize:8,color:"#ff4040",marginTop:3,textAlign:"center"}}>{err}</div>}
          {mediaType==="video"&&<button onClick={()=>setVideoPlaying(p=>!p)} style={{width:"100%",padding:"5px 0",fontSize:9,fontFamily:"inherit",letterSpacing:2,textTransform:"uppercase",marginTop:4,background:videoPlaying?"#1a1a1a":"#111",color:videoPlaying?"#fff":"#aaa",border:"1px solid #333",borderRadius:2,cursor:"pointer"}}>{videoPlaying?"\u23F8 PAUSE":"\u25B6 PLAY"}</button>}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 12px 16px"}}>
          <Sec title="Marathon Presets" defaultOpen={false}><div style={{display:"flex",flexDirection:"column",gap:3}}>{Object.keys(MARATHON_PRESETS).map(k=>(<button key={k} onClick={()=>loadMarathonPreset(k)} style={{padding:"4px 8px",fontSize:9,fontFamily:"inherit",background:"#111",color:"#aaa",border:"1px solid #2a2a2a",borderRadius:2,cursor:"pointer",textAlign:"left",letterSpacing:1}}>{k}</button>))}</div><div style={{fontSize:8,opacity:0.25,marginTop:4}}>Palette + dither + glitch</div></Sec>

          {/* PALETTE */}
          <Sec title="Palette"><Sel label="Color Map" value={palette} onChange={v=>setPalette(v)} opts={[...Object.keys(PALETTES).map(k=>({v:k,l:k})),{v:"Custom",l:"Custom..."}]}/>
            {palette==="Custom"&&(<div style={{marginBottom:6}}><div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
              {customColors.map((c,i)=>(<ColorSwatch key={i} color={c} onChange={v=>{const nc=[...customColors];nc[i]=v;setCustomColors(nc);}} onRemove={customColors.length>2?()=>{const nc=[...customColors];nc.splice(i,1);setCustomColors(nc);}:null}/>))}
              <button onClick={()=>setCustomColors([...customColors,"#ffffff"])} style={{width:22,height:22,borderRadius:2,border:"1px dashed #444",background:"transparent",color:"#666",fontSize:14,cursor:"pointer",lineHeight:"20px",textAlign:"center"}}>+</button>
            </div></div>)}
            {palette!=="Original"&&palette!=="Custom"&&<div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:2}}>{(PALETTES[palette]||[]).map((c,i)=>(<div key={i} style={{width:14,height:14,background:`rgb(${c[0]},${c[1]},${c[2]})`,border:"1px solid #2a2a2a",borderRadius:1}}/>))}</div>}
          </Sec>

          {/* DITHER */}
          <Sec title="Dither"><Sel label="Algorithm" value={ditherAlgo} onChange={v=>setDitherAlgo(v)} opts={Object.entries(DITHER_ALGOS).map(([k,v])=>({v:k,l:v.g==="Off"?k:`${k} [${v.g}]`}))}/>
            {ditherAlgo!=="None"&&(<>
              <Rng label="Scale" value={dp.scale} min={0.25} max={2} step={0.05} suffix="x" onChange={v=>setDp(p=>({...p,scale:v}))}/>
              <Rng label="DPI Scale" value={dp.dpi} min={0.25} max={4} step={0.05} suffix="x" onChange={v=>setDp(p=>({...p,dpi:v}))}/>
              <Rng label="Brightness" value={dp.brightness} min={-50} max={50} step={1} onChange={v=>setDp(p=>({...p,brightness:v}))}/>
              <Rng label="Contrast" value={dp.contrast} min={-50} max={50} step={1} onChange={v=>setDp(p=>({...p,contrast:v}))}/>
              <Rng label="Gamma" value={dp.gamma} min={0.3} max={3} step={0.05} onChange={v=>setDp(p=>({...p,gamma:v}))}/>
              <Rng label="Sharpen" value={dp.sharpen} min={0} max={5} step={0.1} onChange={v=>setDp(p=>({...p,sharpen:v}))}/>
              <Rng label="Blur" value={dp.blur} min={0} max={5} step={0.1} onChange={v=>setDp(p=>({...p,blur:v}))}/>
              <Rng label="Threshold Bias" value={dp.bias} min={-50} max={50} step={1} onChange={v=>setDp(p=>({...p,bias:v}))}/>
              <Tog label="Invert" value={dp.invert} onChange={v=>setDp(p=>({...p,invert:v}))}/>
              <Sel label="Color / Tonal Mode" value={dp.colorMode} onChange={v=>setDp(p=>({...p,colorMode:v}))} opts={[{v:"rgb",l:"RGB"},{v:"grayscale",l:"Grayscale"},{v:"sepia",l:"Sepia Tone"},{v:"posterize",l:"Posterize"},{v:"solarize",l:"Solarize"},{v:"duotone",l:"Duotone"}]}/>
              {dp.colorMode==="posterize"&&<Rng label="Levels" value={dp.posterize} min={2} max={16} step={1} onChange={v=>setDp(p=>({...p,posterize:v}))}/>}
              {dp.colorMode==="solarize"&&<Rng label="Threshold" value={dp.solarizeT} min={0} max={255} step={1} onChange={v=>setDp(p=>({...p,solarizeT:v}))}/>}
              {dp.colorMode==="duotone"&&<div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><span style={{...LBL,margin:0}}>Dark</span><ColorSwatch color={dp.duoH} onChange={v=>setDp(p=>({...p,duoH:v}))}/><span style={{...LBL,margin:0}}>Light</span><ColorSwatch color={dp.duoL} onChange={v=>setDp(p=>({...p,duoL:v}))}/></div>}
              <Rng label="Error Strength" value={dp.errStr} min={0} max={2} step={0.05} onChange={v=>setDp(p=>({...p,errStr:v}))}/>
              {grp==="Error Diffusion"&&<Tog label="Serpentine" value={dp.serpentine} onChange={v=>setDp(p=>({...p,serpentine:v}))}/>}
              {grp==="Ordered"&&<Rng label="Spread" value={dp.spread} min={0.1} max={3} step={0.05} onChange={v=>setDp(p=>({...p,spread:v}))}/>}
              {grp==="Pattern"&&(<><Rng label="Line Weight" value={dp.lineWeight} min={0.3} max={3} step={0.1} onChange={v=>setDp(p=>({...p,lineWeight:v}))}/><Rng label="Rotation" value={dp.rotation} min={0} max={360} step={1} suffix={"\u00B0"} onChange={v=>setDp(p=>({...p,rotation:v}))}/>{ditherAlgo==="Halftone"&&(<><Rng label="Angle" value={dp.htAngle} min={0} max={360} step={1} suffix={"\u00B0"} onChange={v=>setDp(p=>({...p,htAngle:v}))}/><Rng label="Dot Gain" value={dp.dotGain} min={-50} max={50} step={1} onChange={v=>setDp(p=>({...p,dotGain:v}))}/><Rng label="Dot Size" value={dp.dotSize} min={0.3} max={3} step={0.1} onChange={v=>setDp(p=>({...p,dotSize:v}))}/></>)}</>)}
              {grp==="Modulation"&&(<><Rng label="Frequency" value={dp.frequency} min={0.1} max={4} step={0.05} onChange={v=>setDp(p=>({...p,frequency:v}))}/><Rng label="Depth" value={dp.depth} min={0.1} max={2} step={0.05} onChange={v=>setDp(p=>({...p,depth:v}))}/><Rng label="Line Weight" value={dp.lineWeight} min={0.3} max={3} step={0.1} onChange={v=>setDp(p=>({...p,lineWeight:v}))}/><Sel label="Direction" value={String(dp.direction)} onChange={v=>setDp(p=>({...p,direction:+v}))} opts={[{v:"0",l:"Horizontal"},{v:"1",l:"Vertical"},{v:"2",l:"Diagonal"}]}/></>)}
              {grp==="Noise"&&(<><Rng label="Spread" value={dp.spread} min={0.1} max={3} step={0.05} onChange={v=>setDp(p=>({...p,spread:v}))}/>{ditherAlgo==="Stipple"&&<Rng label="Cell Size" value={dp.cellSize} min={2} max={20} step={1} onChange={v=>setDp(p=>({...p,cellSize:v}))}/>}</>)}
              {grp==="Special"&&(<><Rng label="Frequency" value={dp.frequency} min={0.1} max={4} step={0.05} onChange={v=>setDp(p=>({...p,frequency:v}))}/>{ditherAlgo==="Spiral"&&<Rng label="Arms" value={dp.arms} min={1} max={12} step={1} onChange={v=>setDp(p=>({...p,arms:v}))}/>}{ditherAlgo==="Voronoi"&&(<><Rng label="Cell Size" value={dp.cellSize} min={4} max={40} step={1} onChange={v=>setDp(p=>({...p,cellSize:v}))}/><Rng label="Edge Spread" value={dp.edgeSpread} min={0.1} max={3} step={0.1} onChange={v=>setDp(p=>({...p,edgeSpread:v}))}/><Rng label="Line Weight" value={dp.lineWeight} min={0.3} max={3} step={0.1} onChange={v=>setDp(p=>({...p,lineWeight:v}))}/></>)}</>)}
              {grp==="Shape"&&(<>
                {ditherAlgo==="Plus"&&(<>
                  <Rng label="Plus Size" value={dp.plusSize} min={2} max={20} step={1} onChange={v=>setDp(p=>({...p,plusSize:v}))}/>
                  <Rng label="Gap" value={dp.plusGap} min={8} max={60} step={1} onChange={v=>setDp(p=>({...p,plusGap:v}))}/>
                  <Rng label="Thickness" value={dp.plusThickness} min={1} max={8} step={1} onChange={v=>setDp(p=>({...p,plusThickness:v}))}/>
                </>)}
                {ditherAlgo==="Numbers"&&(<>
                  <Rng label="Font Size" value={dp.numFontSize} min={5} max={24} step={1} onChange={v=>setDp(p=>({...p,numFontSize:v}))}/>
                  <Rng label="Digits / Row" value={dp.numBlockW} min={2} max={10} step={1} onChange={v=>setDp(p=>({...p,numBlockW:v}))}/>
                  <Rng label="Rows / Block" value={dp.numBlockH} min={2} max={12} step={1} onChange={v=>setDp(p=>({...p,numBlockH:v}))}/>
                  <Rng label="Block Gap" value={dp.numGap} min={4} max={50} step={1} onChange={v=>setDp(p=>({...p,numGap:v}))}/>
                </>)}
              </>)}
            </>)}
          </Sec>

          <Sec title="ASCII" defaultOpen={false}><Sel label="Charset" value={asciiMode} onChange={v=>setAsciiMode(v)} opts={Object.keys(CHARSETS).map(k=>({v:k,l:k==="off"?"Off":k.charAt(0).toUpperCase()+k.slice(1)}))}/>{asciiMode!=="off"&&(<><Rng label="Columns" value={asciiCols} min={30} max={200} step={1} onChange={v=>setAsciiCols(v)}/><Tog label="Invert" value={asciiInvert} onChange={setAsciiInvert}/></>)}</Sec>

          {/* 3D CAMERA */}
          {mediaType==="3d"&&(
            <Sec title="3D Camera" defaultOpen={true}>
              <Tog label="Turntable" value={cam3d.turntable} onChange={v=>{setCam3d(p=>({...p,turntable:v}));if(v&&!animate)setAnimate(true);}}/>
              {cam3d.turntable&&<Rng label="Rotation Speed" value={cam3d.turnSpeed} min={0.05} max={3} step={0.05} onChange={v=>setCam3d(p=>({...p,turnSpeed:v}))}/>}
              <Rng label="Distance" value={cam3d.dist} min={0.5} max={15} step={0.1} onChange={v=>{setCam3d(p=>({...p,dist:v}));orbitRef.current.dist=v;}}/>
              <Rng label="Height" value={cam3d.height} min={-3} max={3} step={0.1} onChange={v=>setCam3d(p=>({...p,height:v}))}/>
              <Rng label="FOV" value={cam3d.fov} min={15} max={120} step={1} suffix={"\u00B0"} onChange={v=>setCam3d(p=>({...p,fov:v}))}/>
              <div style={{fontSize:8,opacity:0.25,marginTop:4}}>Drag to orbit, scroll to zoom</div>
            </Sec>
          )}

          {/* GLITCH */}
          <Sec title="Glitch">
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:8}}>{Object.entries(GLITCH_PRESETS).map(([k,v])=>(<button key={k} onClick={()=>loadGlitchPreset(k)} style={{padding:"2px 7px",fontSize:8,fontFamily:"inherit",background:glitchPreset===k?"#ccc":"transparent",color:glitchPreset===k?"#0a0a0a":"#888",border:`1px solid ${glitchPreset===k?"#ccc":"#333"}`,borderRadius:2,cursor:"pointer",letterSpacing:1}}>{v.name}</button>))}</div>
            <Tog label="Scanlines" value={gfx.scanlines?.on} onChange={v=>setFx("scanlines","on",v)}/>{gfx.scanlines?.on&&<><Rng label="Gap" value={gfx.scanlines.gap??2} min={1} max={8} onChange={v=>setFx("scanlines","gap",v)}/><Rng label="Opacity" value={gfx.scanlines.opacity??0.3} min={0} max={1} step={0.05} onChange={v=>setFx("scanlines","opacity",v)}/><Rng label="Speed" value={gfx.scanlines.speed??0} min={0} max={2} step={0.1} onChange={v=>setFx("scanlines","speed",v)}/></>}
            <Tog label="Glitch" value={gfx.glitch?.on} onChange={v=>setFx("glitch","on",v)}/>{gfx.glitch?.on&&<><Rng label="Intensity" value={gfx.glitch.intensity??0.15} min={0} max={1} step={0.05} onChange={v=>setFx("glitch","intensity",v)}/><Rng label="Block Size" value={gfx.glitch.blockSize??8} min={2} max={40} onChange={v=>setFx("glitch","blockSize",v)}/><Rng label="Speed" value={gfx.glitch.speed??0.5} min={0} max={2} step={0.1} onChange={v=>setFx("glitch","speed",v)}/></>}
            <Tog label="RGB Shift" value={gfx.rgbShift?.on} onChange={v=>setFx("rgbShift","on",v)}/>{gfx.rgbShift?.on&&<><Rng label="Amount" value={gfx.rgbShift.amount??3} min={0} max={20} onChange={v=>setFx("rgbShift","amount",v)}/><Rng label="Angle" value={gfx.rgbShift.angle??0} min={0} max={360} suffix={"\u00B0"} onChange={v=>setFx("rgbShift","angle",v)}/><Rng label="Speed" value={gfx.rgbShift.speed??0} min={0} max={3} step={0.1} onChange={v=>setFx("rgbShift","speed",v)}/></>}
            <Tog label="Chromatic" value={gfx.chromatic?.on} onChange={v=>setFx("chromatic","on",v)}/>{gfx.chromatic?.on&&<><Rng label="Amount" value={gfx.chromatic.amount??3} min={0} max={15} onChange={v=>setFx("chromatic","amount",v)}/><Rng label="Speed" value={gfx.chromatic.speed??0} min={0} max={3} step={0.1} onChange={v=>setFx("chromatic","speed",v)}/></>}
            <Tog label="Block Glitch" value={gfx.blockGlitch?.on} onChange={v=>setFx("blockGlitch","on",v)}/>{gfx.blockGlitch?.on&&<><Rng label="Count" value={gfx.blockGlitch.count??10} min={1} max={50} onChange={v=>setFx("blockGlitch","count",v)}/><Rng label="Max Size" value={gfx.blockGlitch.maxSize??50} min={10} max={150} onChange={v=>setFx("blockGlitch","maxSize",v)}/><Rng label="Speed" value={gfx.blockGlitch.speed??0.5} min={0.1} max={3} step={0.1} onChange={v=>setFx("blockGlitch","speed",v)}/></>}
            <Tog label="Jitter" value={gfx.jitter?.on} onChange={v=>setFx("jitter","on",v)}/>{gfx.jitter?.on&&<><Rng label="Amount" value={gfx.jitter.amount??3} min={1} max={15} onChange={v=>setFx("jitter","amount",v)}/><Rng label="Speed" value={gfx.jitter.speed??1} min={0.1} max={5} step={0.1} onChange={v=>setFx("jitter","speed",v)}/></>}
            <Tog label="Color Cycle" value={gfx.colorCycle?.on} onChange={v=>setFx("colorCycle","on",v)}/>{gfx.colorCycle?.on&&<Rng label="Speed" value={gfx.colorCycle.speed??1} min={0.1} max={5} step={0.1} onChange={v=>setFx("colorCycle","speed",v)}/>}
            <Tog label="Solarize" value={gfx.solarize?.on} onChange={v=>setFx("solarize","on",v)}/>{gfx.solarize?.on&&<><Rng label="Threshold" value={gfx.solarize.threshold??128} min={0} max={255} step={1} onChange={v=>setFx("solarize","threshold",v)}/><Rng label="Sweep Speed" value={gfx.solarize.speed??0.5} min={0.1} max={3} step={0.1} onChange={v=>setFx("solarize","speed",v)}/></>}
            <Tog label="Noise" value={gfx.noise?.on} onChange={v=>setFx("noise","on",v)}/>{gfx.noise?.on&&<><Rng label="Amount" value={gfx.noise.amount??0.06} min={0} max={0.5} step={0.01} onChange={v=>setFx("noise","amount",v)}/><Rng label="Speed" value={gfx.noise.speed??0.3} min={0} max={2} step={0.1} onChange={v=>setFx("noise","speed",v)}/></>}
            <Tog label="Pixelate" value={gfx.pixelate?.on} onChange={v=>setFx("pixelate","on",v)}/>{gfx.pixelate?.on&&<Rng label="Size" value={gfx.pixelate.size??2} min={1} max={12} onChange={v=>setFx("pixelate","size",v)}/>}
            <Tog label="Vignette" value={gfx.vignette?.on} onChange={v=>setFx("vignette","on",v)}/>{gfx.vignette?.on&&<Rng label="Strength" value={gfx.vignette.strength??0.4} min={0} max={1} step={0.05} onChange={v=>setFx("vignette","strength",v)}/>}
            <Tog label="CRT Barrel" value={gfx.crt?.on} onChange={v=>setFx("crt","on",v)}/>{gfx.crt?.on&&<Rng label="Curvature" value={gfx.crt.curvature??0.2} min={0.05} max={1} step={0.05} onChange={v=>setFx("crt","curvature",v)}/>}
            <Tog label="Offset Sweep" value={gfx.offset?.on} onChange={v=>setFx("offset","on",v)}/>{gfx.offset?.on&&<>
              <Rng label="Amount" value={gfx.offset?.amount??50} min={5} max={200} step={1} onChange={v=>setFx("offset","amount",v)}/>
              <Rng label="Speed X" value={gfx.offset?.speedX??0.5} min={0} max={5} step={0.1} onChange={v=>setFx("offset","speedX",v)}/>
              <Rng label="Speed Y" value={gfx.offset?.speedY??0} min={0} max={5} step={0.1} onChange={v=>setFx("offset","speedY",v)}/>
              <Sel label="Direction" value={String(gfx.offset?.direction??0)} onChange={v=>setFx("offset","direction",+v)} opts={[{v:"0",l:"Horizontal"},{v:"1",l:"Vertical"},{v:"2",l:"Diagonal"},{v:"3",l:"Circular"}]}/>
            </>}
          </Sec>

          <Sec title="Animation" defaultOpen={false}><Tog label={"\u25B6 Animate"} value={animate} onChange={setAnimate}/><div style={{fontSize:8,opacity:0.25,marginTop:2}}>Time-based effects. Canvas always live.</div></Sec>
        </div>
        <div style={{padding:"6px 12px",borderTop:"1px solid #1a1a1a",display:"flex",gap:4}}>
          <button onClick={doExportPng} disabled={!imageEl} style={{flex:1,padding:"6px 0",fontSize:9,fontFamily:"inherit",letterSpacing:1,fontWeight:"bold",background:imageEl?"#ccc":"#222",color:"#0a0a0a",border:"none",borderRadius:2,cursor:imageEl?"pointer":"default",opacity:imageEl?1:0.3}}>PNG</button>
          <button onClick={recording?stopRec:startRec} disabled={!imageEl} style={{flex:1,padding:"6px 0",fontSize:9,fontFamily:"inherit",letterSpacing:1,fontWeight:"bold",background:recording?"#ff4040":imageEl?"#888":"#222",color:recording?"#fff":"#0a0a0a",border:"none",borderRadius:2,cursor:imageEl?"pointer":"default",opacity:imageEl?1:0.3}}>{recording?"\u23F9 STOP":"REC WEBM"}</button>
        </div>
      </div>)}

      {/* VIEWPORT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{position:"absolute",top:6,left:6,zIndex:10,display:"flex",gap:4}}>
          <button onClick={()=>setShowPanel(!showPanel)} style={{padding:"3px 7px",fontSize:10,fontFamily:"inherit",background:"#0a0a0acc",color:"#888",border:"1px solid #2a2a2a",borderRadius:2,cursor:"pointer"}}>{showPanel?"\u25C2":"\u25B8"}</button>
          <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} style={{padding:"3px 7px",fontSize:9,fontFamily:"inherit",background:"#0a0a0acc",color:"#666",border:"1px solid #2a2a2a",borderRadius:2,cursor:"pointer"}}>FIT</button>
          <span style={{padding:"3px 7px",fontSize:9,fontFamily:"inherit",background:"#0a0a0acc",color:"#555",border:"1px solid #1a1a1a",borderRadius:2}}>{Math.round(zoom*100)}%</span>
        </div>
        <div ref={viewportRef} style={{flex:1,overflow:"hidden",cursor:mediaType==="3d"?"move":"grab",background:checkerBg}} onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {!imageEl?(<div onClick={()=>fileRef.current?.click()} style={{cursor:"pointer",textAlign:"center",padding:36,border:"1px dashed #2a2a2a",borderRadius:3,maxWidth:380,width:"100%",background:"#0a0a0a"}}><div style={{fontSize:36,marginBottom:10,opacity:0.15}}>{"\u2394"}</div><div style={{fontSize:11,letterSpacing:3,opacity:0.4}}>IMPORT FILE</div><div style={{fontSize:8,opacity:0.15,marginTop:6}}>JPG PNG SVG WebP MP4 WebM OBJ STL GLB</div></div>
            ):(<div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:"center center",imageRendering:"pixelated"}}>
              <canvas ref={dispRef} style={{display:"block",imageRendering:"pixelated"}}/>
              <canvas ref={asciiRef} style={{display:"none",imageRendering:"pixelated",background:"#0a0a0a"}}/>
            </div>)}
          </div>
        </div>
        <div style={{height:22,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px",borderTop:"1px solid #151515",fontSize:7,opacity:0.25,letterSpacing:1}}>
          <span>UESC-PROCESSOR v5.0{recording?" \u2B24 REC":""}</span>
          <span>{imageEl&&`${imageEl.naturalWidth||imageEl.width}\u00D7${imageEl.naturalHeight||imageEl.height}`}{videoEl&&" VIDEO"}{mediaType==="3d"&&" 3D"} {mediaType==="3d"?"DRAG=ORBIT SCROLL=ZOOM":"SCROLL=ZOOM ALT+DRAG=PAN"}</span>
        </div>
      </div>
    </div>
  );
}
