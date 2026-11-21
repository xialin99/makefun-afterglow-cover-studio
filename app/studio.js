const $ = id => document.getElementById(id);
const cover = $('cover');
const formats = [
  {name:'Wide', w:1920, h:1080},
  {name:'Square', w:1080, h:1080},
  {name:'Portrait', w:1080, h:1350}
];
const looks = [
  {name:'Sunset', tint:'#ff9062', dark:'#301d53', light:'#ffc785'},
  {name:'Neon', tint:'#ed60de', dark:'#202766', light:'#f5a4ed'},
  {name:'Natural', tint:null, dark:'#252037', light:'#ffe9c2'}
];
const names = ['Skyline','Lead','Street'];
const demo = names.map((_,i)=>drawDemo(i));
const frame = image => ({image, zoom:1, x:0, y:0});
let panels = demo.map(frame), selected=1, format=0, grade=0, drag;
const revisions = [0,0,0];

function layout() {
  if(format===0) return [
    [[0,0],[.35,0],[.29,1],[0,1]],
    [[.35,0],[.64,0],[.59,1],[.29,1]],
    [[.64,0],[1,0],[1,1],[.59,1]]
  ];
  return [
    [[0,0],[.43,0],[.36,.53],[0,.62]],
    [[.43,0],[1,0],[1,.42],[.36,.53]],
    [[0,.62],[1,.42],[1,1],[0,1]]
  ];
}
function bounds(points) {
  const xs=points.map(p=>p[0]), ys=points.map(p=>p[1]);
  return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
}
function trace(g,points) {
  g.beginPath();
  points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  g.closePath();
}
function crop(panel,b) {
  const image=panel.image, iw=image.naturalWidth || image.width, ih=image.naturalHeight || image.height;
  const scale=Math.max(b.w/iw,b.h/ih)*panel.zoom;
  const w=iw*scale,h=ih*scale;
  return {w,h,dx:Math.max(0,(w-b.w)/2),dy:Math.max(0,(h-b.h)/2)};
}
function paintPhoto(g,panel,b,index) {
  const {w,h,dx,dy}=crop(panel,b);
  g.drawImage(panel.image,b.x-dx+panel.x*dx,b.y-dy+panel.y*dy,w,h);
  const look=looks[grade];
  if(!look.tint) return;
  const wash=g.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
  wash.addColorStop(0,look.dark);
  wash.addColorStop(.65,look.tint);
  wash.addColorStop(1,look.light);
  g.save();
  g.globalCompositeOperation='soft-light';
  g.globalAlpha=index===1?.47:.63;
  g.fillStyle=wash;
  g.fillRect(b.x,b.y,b.w,b.h);
  g.restore();
}
function captionLines(g, text, maxWidth) {
  const words=text.split(/\s+/);
  if(g.measureText(text).width<=maxWidth || words.length<2) return [text];
  let best=[text], width=Infinity;
  for(let i=1;i<words.length;i++){
    const pair=[words.slice(0,i).join(' '),words.slice(i).join(' ')];
    const widest=Math.max(...pair.map(line=>g.measureText(line).width));
    if(widest<width){best=pair;width=widest;}
  }
  return best;
}
function render(canvas, w, h, editor=false) {
  canvas.width=w;
  canvas.height=h;
  const g=canvas.getContext('2d');
  g.fillStyle='#171121';
  g.fillRect(0,0,w,h);
  const unit=Math.min(w,h);
  const polygons=layout().map(poly=>poly.map(([x,y])=>[x*w,y*h]));
  const look=looks[grade];
  polygons.forEach((poly,i)=>{
    trace(g,poly);
    g.save();
    g.clip();
    paintPhoto(g,panels[i],bounds(poly),i);
    g.restore();
  });
  const shade=g.createLinearGradient(0,h*.45,0,h);
  shade.addColorStop(0,'#170e2200');
  shade.addColorStop(.74,'#170e2240');
  shade.addColorStop(1,'#140e24dc');
  g.fillStyle=shade;
  g.fillRect(0,0,w,h);
  g.strokeStyle='#171121';
  g.lineWidth=unit*.012;
  for(const poly of polygons){trace(g,poly);g.stroke();}
  g.lineWidth=unit*.016;
  g.strokeRect(0,0,w,h);
  g.strokeStyle='#ffd2a37a';
  g.lineWidth=unit*.0015;
  const border=unit*.025;
  g.strokeRect(border,border,w-2*border,h-2*border);
  const caption=$('caption').value.trim().toUpperCase();
  if(caption) {
    const y=h*(format===0?.89:.91), font=unit*(format===0?.255:.218);
    const maxWidth=w*(format===0?.73:.87);
    g.font='italic 800 '+font+'px Barlow, sans-serif';
    g.textAlign='center';
    g.textBaseline='alphabetic';
    g.lineJoin='round';
    const lines=captionLines(g,caption,maxWidth);
    lines.forEach((line,index)=>{
      const baseline=y-(lines.length-1-index)*font*.74;
      const fill=g.createLinearGradient(0,baseline-font*.68,0,baseline);
      fill.addColorStop(0,'#fff4ce');
      fill.addColorStop(.53,look.light);
      fill.addColorStop(1,'#ff8d9d');
      g.lineWidth=unit*.024;
      g.strokeStyle='#1a1228';
      g.strokeText(line,w*.5,baseline+unit*.016,maxWidth);
      g.strokeText(line,w*.5,baseline,maxWidth);
      g.fillStyle=fill;
      g.fillText(line,w*.5,baseline,maxWidth);
    });
  }
  if(editor && drag){
    trace(g,polygons[selected]);
    g.strokeStyle='#ffd0a4';
    g.lineWidth=4;
    g.stroke();
  }
}
function preview() {
  const {w,h}=formats[format];
  const stage=cover.parentElement;
  const style=getComputedStyle(stage);
  const fit=Math.min((stage.clientWidth-2*parseFloat(style.paddingLeft))/w,
    (stage.clientHeight-2*parseFloat(style.paddingTop))/h);
  const width=Math.max(1,Math.floor(w*fit)), height=Math.max(1,Math.floor(h*fit));
  cover.style.width=width+'px';
  cover.style.height=height+'px';
  render(cover,width*2,height*2,true);
}
function makeOptions(id,items,change) {
  items.forEach((item,i)=>{
    const button=document.createElement('button');
    button.textContent=item.name ?? item;
    if(item.w){
      const dimensions=document.createElement('small');
      dimensions.textContent=item.w+' × '+item.h;
      button.append(dimensions);
    }
    if(id==='panels'){
      const thumb=document.createElement('canvas');
      thumb.width=180;thumb.height=64;
      thumb.setAttribute('aria-hidden','true');
      const label=document.createElement('span');
      label.textContent=item;
      button.replaceChildren(thumb,label);
    }
    button.onclick=()=>{change(i);update();};
    $(id).append(button);
  });
}
function update() {
  for(const [id,active] of [['panels',selected],['formats',format],['grades',grade]])
    Array.from($(id).children).forEach((button,i)=>button.setAttribute('aria-pressed',i===active));
  Array.from($('panels').children).forEach((button,i)=>{
    const thumb=button.firstElementChild;
    paintPhoto(thumb.getContext('2d'),panels[i],{x:0,y:0,w:180,h:64},i);
  });
  $('zoom').value=panels[selected].zoom;
  $('zoomValue').value=Number(panels[selected].zoom).toFixed(2)+'×';
  $('size').textContent=formats[format].w+' × '+formats[format].h;
  preview();
}
function status(message){$('status').textContent=message;}
async function loadPhoto(file,index){
  if(!file) return;
  const revision=++revisions[index];
  const url=URL.createObjectURL(file);
  const image=new Image();
  try{
    image.src=url;
    await image.decode();
    if(revision!==revisions[index]) return;
    panels[index]=frame(image);
    status(names[index]+' photo loaded.');
    update();
  }catch{
    if(revision===revisions[index]) status('Could not open that image. Try a JPEG, PNG or WebP.');
  }finally{URL.revokeObjectURL(url);}
}
let filePanel=selected;
$('replace').onclick=()=>{filePanel=selected;$('file').click();};
$('file').onchange=e=>{loadPhoto(e.target.files[0],filePanel);e.target.value='';};
$('duplicate').onclick=()=>{
  revisions.forEach((_,i)=>revisions[i]++);
  panels=panels.map(()=>frame(panels[selected].image));
  status('Photo placed in all panels.');
  update();
};
$('demo').onclick=()=>{
  revisions.forEach((_,i)=>revisions[i]++);
  panels=demo.map(frame);
  $('caption').value='DUSK RUN';
  selected=1;grade=0;
  status('Demo artwork restored.');
  update();
};
$('reset').onclick=()=>{panels[selected]=frame(panels[selected].image);update();};
$('zoom').oninput=e=>{panels[selected].zoom=Number(e.target.value);update();};
$('caption').oninput=preview;

function pointer(e) {
  const box=cover.getBoundingClientRect();
  return [(e.clientX-box.left)/box.width,(e.clientY-box.top)/box.height];
}
function panelAt(x,y){
  const g=cover.getContext('2d');
  return layout().findIndex(poly=>{
    trace(g,poly.map(([a,b])=>[a*cover.width,b*cover.height]));
    return g.isPointInPath(x*cover.width,y*cover.height);
  });
}
const clamp=value=>Math.max(-1,Math.min(1,value));
cover.onpointerdown=e=>{
  if(drag || e.button!==0) return;
  const [x,y]=pointer(e), index=panelAt(x,y);
  if(index<0) return;
  selected=index;
  const panel=panels[index];
  drag={id:e.pointerId,x,y,px:panel.x,py:panel.y};
  cover.setPointerCapture(e.pointerId);
  update();
};
cover.onpointermove=e=>{
  if(e.pointerId!==drag?.id) return;
  const [x,y]=pointer(e);
  const box=bounds(layout()[selected].map(([a,b])=>[a*cover.width,b*cover.height]));
  const panel=panels[selected], {dx,dy}=crop(panel,box);
  if(dx>.001) panel.x=clamp(drag.px+(x-drag.x)*cover.width/dx);
  if(dy>.001) panel.y=clamp(drag.py+(y-drag.y)*cover.height/dy);
  preview();
};
cover.onlostpointercapture=()=>{drag=null;update();};
cover.ondragover=e=>e.preventDefault();
cover.ondrop=e=>{
  e.preventDefault();
  const index=panelAt(...pointer(e));
  if(index<0) return;
  selected=index;
  update();
  loadPhoto(e.dataTransfer.files[0],index);
};

$('download').onclick=async ()=>{
  const button=$('download');
  button.disabled=true;
  try{
    await document.fonts.ready;
    const output=document.createElement('canvas');
    // Capture the current format and state together after the font is ready.
    const current=formats[format];
    render(output,current.w,current.h);
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob) throw new Error('PNG encoding failed');
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;
    link.download='afterglow-'+current.name.toLowerCase()+'.png';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    status('PNG downloaded · '+current.w+' × '+current.h);
  }catch{status('Could not create the PNG. Please try again.');}
  finally{button.disabled=false;}
};

makeOptions('panels',names,i=>selected=i);
makeOptions('formats',formats,i=>format=i);
makeOptions('grades',looks,i=>grade=i);
new ResizeObserver(preview).observe(cover.parentElement);
update();
document.fonts.ready.then(preview);
