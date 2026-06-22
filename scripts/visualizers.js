document.getElementById('footer-year').textContent=new Date().getFullYear();
// ═══ UPGRADED CINEMATIC TOOLS 24-33 ═══════════════════════════════════════

// ─── SHARED HELPERS ────────────────────────────────────────────────────────
function vizLog(id, msg, cls) {
  var p = document.getElementById(id); if (!p) return;
  var d = document.createElement('div'); d.className = 'viz-log-entry' + (cls ? ' ' + cls : '');
  d.textContent = '► ' + msg; p.appendChild(d); p.scrollTop = p.scrollHeight;
}
function vizClearLog(id) { var p = document.getElementById(id); if (p) p.innerHTML = ''; }
function vizBumpStat(id, val) {
  var el = document.getElementById(id); if (!el) return;
  el.textContent = val; el.classList.remove('viz-stat-bump');
  void el.offsetWidth; el.classList.add('viz-stat-bump');
}
function vizSpeedMs(sliderId) {
  var v = parseInt(document.getElementById(sliderId) ? document.getElementById(sliderId).value : 3);
  return [1200, 700, 350, 150, 60][Math.max(0, Math.min(4, v - 1))];
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 24: BIG-O GROWTH ANIMATOR
// ─────────────────────────────────────────────────────────────────────────────
var _vizBigoFns = [
  { label:'O(1)',       color:'#34d399', fn:function(n){return 1;},              active:true  },
  { label:'O(log n)',   color:'#60a5fa', fn:function(n){return Math.log2(n);},   active:true  },
  { label:'O(n)',       color:'#a78bfa', fn:function(n){return n;},              active:true  },
  { label:'O(n log n)', color:'#fbbf24', fn:function(n){return n*Math.log2(n);}, active:true  },
  { label:'O(n²)',      color:'#fb923c', fn:function(n){return n*n;},            active:true  },
  { label:'O(n³)',      color:'#f472b6', fn:function(n){return n*n*n;},          active:false },
  { label:'O(2ⁿ)',      color:'#ef4444', fn:function(n){return Math.pow(2,n);},  active:false },
  { label:'O(n!)',      color:'#dc2626', fn:function(n){var r=1;for(var i=2;i<=n;i++)r*=i;return r;}, active:false }
];
var _vizBigoRaf = null, _vizBigoRunning = false, _vizBigoCurN = 0, _vizBigoFrames = 0;
var _vizBigoContextMap = {
  sort:   'Sorting — O(1):impossible, O(n log n):MergeSort/HeapSort, O(n²):Bubble/Insertion, O(2ⁿ):brute-force',
  search: 'Searching — O(1):hash lookup, O(log n):BinarySearch, O(n):LinearSearch',
  graph:  'Graph — O(1):adj access, O(V+E):BFS/DFS, O(E log V):Dijkstra/MST, O(V²):Floyd-Warshall(small)',
  dp:     'DP — O(n):Fibonacci, O(n²):LCS/Edit, O(n³):MatrixChain, O(n·W):Knapsack(pseudo-poly)'
};

function bigoInit() {
  var row = document.getElementById('bigo-toggles'); if (!row) return;
  row.innerHTML = _vizBigoFns.map(function(f, i) {
    return '<button class="viz-toggle-btn' + (f.active ? ' active' : '') + '" style="' + (f.active ? 'border-color:' + f.color + ';color:' + f.color : '') + '" onclick="_vizBigoToggle(' + i + ')">' + f.label + '</button>';
  }).join('');
}
function _vizBigoToggle(i) { _vizBigoFns[i].active = !_vizBigoFns[i].active; bigoInit(); bigoDrawStatic(); }
function bigoReset() { _vizBigoRunning = false; if (_vizBigoRaf) { cancelAnimationFrame(_vizBigoRaf); _vizBigoRaf = null; } _vizBigoCurN = 0; _vizBigoFrames = 0; bigoInit(); bigoDrawStatic(); bigoUpdateTable(1); }
function bigoPause() { _vizBigoRunning = false; if (_vizBigoRaf) { cancelAnimationFrame(_vizBigoRaf); _vizBigoRaf = null; } }
function bigoContextChange() {
  var v = document.getElementById('bigo-context').value;
  var lbl = document.getElementById('bigo-context-label');
  if (!lbl) return;
  if (v && _vizBigoContextMap[v]) { lbl.style.display = 'block'; lbl.textContent = _vizBigoContextMap[v]; }
  else lbl.style.display = 'none';
}
function bigoAnimate() {
  _vizBigoRunning = true;
  var canvas = document.getElementById('bigo-canvas'); if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 700;
  var nMax = parseInt(document.getElementById('bigo-nmax-slider').value) || 20;
  var start = null;
  function frame(ts) {
    if (!_vizBigoRunning) return;
    if (!start) start = ts;
    var prog = Math.min((ts - start) / 2000, 1);
    _vizBigoCurN = Math.max(1, Math.floor(prog * nMax));
    _vizBigoFrames++;
    vizBumpStat('bigo-n-display', _vizBigoCurN);
    vizBumpStat('bigo-frames', _vizBigoFrames);
    bigoDrawAnimated(_vizBigoCurN, nMax);
    bigoUpdateTable(_vizBigoCurN);
    if (prog < 1) _vizBigoRaf = requestAnimationFrame(frame);
    else { _vizBigoRunning = false; bigoDrawStatic(); }
  }
  _vizBigoRaf = requestAnimationFrame(frame);
}
function bigoGetMaxY(nMax) {
  var active = _vizBigoFns.filter(function(f){return f.active;});
  var mx = 0;
  for (var n = 1; n <= nMax; n++) active.forEach(function(f){var v=f.fn(n);if(isFinite(v)&&v>mx)mx=v;});
  return mx || 1;
}
function bigoDrawAnimated(curN, nMax) {
  var canvas = document.getElementById('bigo-canvas'); if (!canvas) return;
  var ctx = canvas.getContext('2d'); var W = canvas.width, H = canvas.height;
  var PAD = {t:24,r:20,b:40,l:58};
  var maxY = bigoGetMaxY(nMax);
  var pW = W-PAD.l-PAD.r, pH = H-PAD.t-PAD.b;
  var toX = function(n){return PAD.l+(n/nMax)*pW;};
  var toY = function(v){return PAD.t+pH-Math.min((v/maxY)*pH,pH);};
  ctx.clearRect(0,0,W,H); ctx.fillStyle='#060d1a'; ctx.fillRect(0,0,W,H);
  // grid
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for(var i=0;i<=5;i++){var y=PAD.t+i*(pH/5);ctx.beginPath();ctx.moveTo(PAD.l,y);ctx.lineTo(PAD.l+pW,y);ctx.stroke();ctx.fillStyle='rgba(148,163,184,.5)';ctx.font='9px JetBrains Mono';ctx.textAlign='right';ctx.fillText(Math.round(maxY*(1-i/5)),PAD.l-4,y+3);}
  // axes
  ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(PAD.l,PAD.t);ctx.lineTo(PAD.l,PAD.t+pH);ctx.lineTo(PAD.l+pW,PAD.t+pH);ctx.stroke();
  ctx.fillStyle='rgba(148,163,184,.6)';ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('n', PAD.l+pW/2, H-4);
  // x axis ticks
  for(var n=0;n<=nMax;n+=Math.max(1,Math.floor(nMax/8))){ctx.fillStyle='rgba(148,163,184,.4)';ctx.textAlign='center';ctx.fillText(n,toX(n),PAD.t+pH+14);}
  // draw curves up to curN
  _vizBigoFns.filter(function(f){return f.active;}).forEach(function(f){
    ctx.strokeStyle=f.color; ctx.lineWidth=2.5; ctx.shadowColor=f.color; ctx.shadowBlur=6;
    ctx.beginPath(); var started=false;
    for(var n=1;n<=curN;n++){var v=f.fn(n);if(!isFinite(v)||v>maxY*1.5)continue;var x=toX(n),y=toY(Math.min(v,maxY));started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);}
    ctx.stroke(); ctx.shadowBlur=0;
    // glowing dot at leading edge
    if(curN>=1){var lv=f.fn(curN);if(isFinite(lv)&&lv<=maxY*1.5){var lx=toX(curN),ly=toY(Math.min(lv,maxY));ctx.fillStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(lx,ly,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
  });
}
function bigoDrawStatic() {
  var canvas = document.getElementById('bigo-canvas'); if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 700;
  var nMax = parseInt(document.getElementById('bigo-nmax-slider').value) || 20;
  bigoDrawAnimated(nMax, nMax);
  // Add labels at end of curves
  var ctx = canvas.getContext('2d'); var W=canvas.width,H=canvas.height;
  var PAD={t:24,r:20,b:40,l:58}; var maxY=bigoGetMaxY(nMax);
  var pW=W-PAD.l-PAD.r,pH=H-PAD.t-PAD.b;
  _vizBigoFns.filter(function(f){return f.active;}).forEach(function(f){
    var v=f.fn(nMax); if(!isFinite(v)||v>maxY*1.1) return;
    var x=PAD.l+pW+2, y=PAD.t+pH-Math.min((v/maxY)*pH,pH);
    ctx.fillStyle=f.color; ctx.font='bold 9px JetBrains Mono'; ctx.textAlign='left';
    ctx.fillText(f.label, Math.min(x, W-60), y);
  });
}
function bigoUpdateTable(curN) {
  var tbl = document.getElementById('bigo-value-table'); if (!tbl) return;
  var active = _vizBigoFns.filter(function(f){return f.active;});
  var ns = [1,2,5,10,Math.min(curN,50),20].filter(function(x,i,a){return x>0&&x<=curN&&a.indexOf(x)===i;}).sort(function(a,b){return a-b;});
  if(!ns.length) ns=[1];
  var maxVals = active.map(function(f){return ns.map(function(n){return f.fn(n);});});
  var html='<tr><th style="padding:4px 8px;background:#0d1526;color:#60a5fa;text-align:left">n</th>';
  active.forEach(function(f){html+='<th style="padding:4px 8px;background:#0d1526;color:'+f.color+';white-space:nowrap">'+f.label+'</th>';});
  html+='</tr>';
  ns.forEach(function(n,ni){
    html+='<tr>';
    html+='<td style="padding:3px 8px;color:#94a3b8;font-weight:700">'+n+'</td>';
    active.forEach(function(f,fi){
      var v=f.fn(n); var vs=isFinite(v)?(v>1e9?'∞':Math.round(v).toLocaleString()):'∞';
      var isMax=true; active.forEach(function(f2){var v2=f2.fn(n);if(isFinite(v2)&&v2>v)isMax=false;});
      html+='<td style="padding:3px 8px;'+(isMax&&active.length>1?'background:rgba(239,68,68,.15);color:#ef4444;font-weight:700':'')+'">' + vs + '</td>';
    });
    html+='</tr>';
  });
  tbl.innerHTML=html;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 25: HEAP TREE VISUALIZER
// ─────────────────────────────────────────────────────────────────────────────
var _vizHeapArr = [], _vizHeapSteps = [], _vizHeapStepIdx = 0;
var _vizHeapTimer = null, _vizHeapRunning = false;
var _vizHeapCmps = 0, _vizHeapSwps = 0;
var _vizHeapSorted = [];
var _vizHeapHL = {}; // {idx: 'cmp'|'swp'|'done'|'sel'}

function heapTabSwitch(tab,el){
  ['build','sort','ops'].forEach(function(t){var d=document.getElementById('heap-tab-'+t);if(d)d.style.display=t===tab?'':'none';});
  document.querySelectorAll('#tool-25 .viz-tab').forEach(function(b){b.classList.remove('active');});
  if(el)el.classList.add('active');
}
function heapUpdateSpeedLbl(v){var l=document.getElementById('heap-speed-lbl');if(l)l.textContent=['','Slow','MedSlow','Med','Fast','Fastest'][v]||'Med';}
function heapLog(msg,cls){vizLog('heap-log',msg,cls);}
function heapResetAll(){
  if(_vizHeapTimer)clearTimeout(_vizHeapTimer);_vizHeapTimer=null;_vizHeapRunning=false;
  _vizHeapArr=[];_vizHeapSteps=[];_vizHeapStepIdx=0;_vizHeapCmps=0;_vizHeapSwps=0;_vizHeapSorted=[];_vizHeapHL={};
  vizBumpStat('heap-stat-step',0);vizBumpStat('heap-stat-cmp',0);vizBumpStat('heap-stat-swp',0);
  vizClearLog('heap-log');vizLog('heap-log','Reset. Build a heap to start.','inf');
  var sa=document.getElementById('heap-sorted-area');if(sa)sa.style.display='none';
  heapDrawTree();heapRenderArrRow();
}
function heapCollectBuildSteps(arr,isMax){
  var a=[].concat(arr),steps=[];
  function sift(i,n){
    var best=i,l=2*i+1,r=2*i+2;
    steps.push({type:'cmp',i:i,j:l<n?l:-1,k:r<n?r:-1,arr:[].concat(a),msg:'Heapify: compare node['+i+']='+a[i]+' with children'+(l<n?' L='+a[l]:'')+(r<n?', R='+a[r]:'')});
    if(l<n&&(isMax?a[l]>a[best]:a[l]<a[best]))best=l;
    if(r<n&&(isMax?a[r]>a[best]:a[r]<a[best]))best=r;
    if(best!==i){
      steps.push({type:'swp',i:i,j:best,arr:[].concat(a),msg:'Swap node['+i+']='+a[i]+' ↔ node['+best+']='+a[best]});
      var tmp=a[i];a[i]=a[best];a[best]=tmp;
      steps.push({type:'after_swp',arr:[].concat(a),msg:'After swap: [...'+a.slice(0,Math.min(6,a.length)).join(',')+']'});
      sift(best,n);
    }
  }
  for(var i=Math.floor(a.length/2)-1;i>=0;i--) sift(i,a.length);
  steps.push({type:'done',arr:[].concat(a),msg:'Heap built! Root='+a[0]+'. Array: ['+a.join(',')+']'});
  return steps;
}
function heapCollectSortSteps(arr){
  var a=[].concat(arr),steps=[],sorted=[];
  var isMax=true;
  // build max-heap first
  function sift(i,n){
    var best=i,l=2*i+1,r=2*i+2;
    steps.push({type:'cmp',i:i,j:l<n?l:-1,k:r<n?r:-1,arr:[].concat(a),sorted:[].concat(sorted),msg:'Heapify['+i+']: '+a[i]+(l<n?' vs L='+a[l]:'')+(r<n?', R='+a[r]:'')});
    if(l<n&&a[l]>a[best])best=l;
    if(r<n&&a[r]>a[best])best=r;
    if(best!==i){steps.push({type:'swp',i:i,j:best,arr:[].concat(a),sorted:[].concat(sorted),msg:'Swap '+a[i]+' ↔ '+a[best]});var tmp=a[i];a[i]=a[best];a[best]=tmp;}
  }
  for(var i=Math.floor(a.length/2)-1;i>=0;i--)sift(i,a.length);
  steps.push({type:'heap_built',arr:[].concat(a),sorted:[],msg:'Max-heap built: ['+a.join(',')+']'});
  // extract
  for(var sz=a.length;sz>1;sz--){
    steps.push({type:'extract',i:0,j:sz-1,arr:[].concat(a),sorted:[].concat(sorted),msg:'Extract max='+a[0]+', swap with last active['+a[sz-1]+']'});
    var tmp=a[0];a[0]=a[sz-1];a[sz-1]=tmp;
    sorted.unshift(a[sz-1]);
    steps.push({type:'extracted',arr:[].concat(a),sorted:[].concat(sorted),heapSize:sz-1,msg:'Extracted '+a[sz-1]+' → sorted output'});
    sift(0,sz-1);
  }
  sorted.unshift(a[0]);
  steps.push({type:'sort_done',arr:[].concat(a),sorted:[].concat(sorted),msg:'Sort complete! ['+sorted.join(',')+']'});
  return steps;
}
function heapBuildSteps(){
  var raw=document.getElementById('heap-arr-input').value;
  var arr=raw.split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x);});
  if(arr.length<2){showToast('Enter at least 2 numbers');return;}
  heapResetAll();
  _vizHeapArr=[].concat(arr);
  var isMax=document.getElementById('heap-type-sel').value==='max';
  _vizHeapSteps=heapCollectBuildSteps(arr,isMax);
  _vizHeapStepIdx=0;
  heapRenderArrRow();heapDrawTree();
  vizLog('heap-log','Starting '+( isMax?'Max':'Min')+'-Heap build from ['+arr.join(',')+']','inf');
}
function heapSortSteps(){
  var raw=document.getElementById('heap-sort-input').value;
  var arr=raw.split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x);});
  if(arr.length<2){showToast('Enter at least 2 numbers');return;}
  heapResetAll();
  _vizHeapArr=[].concat(arr);
  _vizHeapSteps=heapCollectSortSteps(arr);
  _vizHeapStepIdx=0;
  var sa=document.getElementById('heap-sorted-area');if(sa)sa.style.display='block';
  heapRenderArrRow();heapDrawTree();
  vizLog('heap-log','Heap Sort steps collected: '+_vizHeapSteps.length+' steps. Click Play!','inf');
}
function heapInsertStep(){
  var v=parseInt(document.getElementById('heap-ins-val').value);
  if(isNaN(v)){showToast('Enter a value');return;}
  if(!_vizHeapArr.length){showToast('Build a heap first');return;}
  _vizHeapArr.push(v);
  var i=_vizHeapArr.length-1;
  var steps=[{type:'cmp',i:i,j:-1,k:-1,arr:[].concat(_vizHeapArr),msg:'Insert '+v+' at position '+i}];
  while(i>0){
    var p=Math.floor((i-1)/2);
    steps.push({type:'cmp',i:i,j:p,k:-1,arr:[].concat(_vizHeapArr),msg:'Compare '+_vizHeapArr[i]+' vs parent['+p+']='+_vizHeapArr[p]});
    if(_vizHeapArr[i]>_vizHeapArr[p]){
      steps.push({type:'swp',i:i,j:p,arr:[].concat(_vizHeapArr),msg:'Bubble up: '+_vizHeapArr[i]+' > '+_vizHeapArr[p]});
      var tmp=_vizHeapArr[i];_vizHeapArr[i]=_vizHeapArr[p];_vizHeapArr[p]=tmp;i=p;
    } else break;
  }
  steps.push({type:'done',arr:[].concat(_vizHeapArr),msg:'Insert done. Root='+_vizHeapArr[0]});
  _vizHeapSteps=steps;_vizHeapStepIdx=0;
  heapRenderArrRow();heapPlay();
}
function heapExtractStep(){
  if(!_vizHeapArr.length){showToast('Heap is empty');return;}
  var root=_vizHeapArr[0];
  var a=[].concat(_vizHeapArr);
  var steps=[{type:'extract',i:0,j:a.length-1,arr:[].concat(a),msg:'Extract root='+root}];
  a[0]=a[a.length-1];a.pop();
  var n=a.length;
  function sift(i){
    var best=i,l=2*i+1,r=2*i+2;
    steps.push({type:'cmp',i:i,j:l<n?l:-1,k:r<n?r:-1,arr:[].concat(a),msg:'Heapify['+i+']: '+a[i]+(l<n?' vs '+a[l]:'')+(r<n?', '+a[r]:'')});
    if(l<n&&a[l]>a[best])best=l;if(r<n&&a[r]>a[best])best=r;
    if(best!==i){steps.push({type:'swp',i:i,j:best,arr:[].concat(a),msg:'Swap '+a[i]+' ↔ '+a[best]});var tmp=a[i];a[i]=a[best];a[best]=tmp;sift(best);}
  }
  sift(0);
  steps.push({type:'done',arr:[].concat(a),msg:'Extracted '+root+'. New root='+a[0]});
  _vizHeapArr=[].concat(a);
  _vizHeapSteps=steps;_vizHeapStepIdx=0;
  heapRenderArrRow();heapPlay();
}
function heapApplyStep(st){
  _vizHeapHL={};
  if(st.arr)_vizHeapArr=[].concat(st.arr);
  if(st.sorted)_vizHeapSorted=[].concat(st.sorted);
  if(st.type==='cmp'){
    _vizHeapCmps++;vizBumpStat('heap-stat-cmp',_vizHeapCmps);
    if(st.i>=0)_vizHeapHL[st.i]='cmp';if(st.j>=0)_vizHeapHL[st.j]='cmp';if(st.k>=0)_vizHeapHL[st.k]='cmp';
    heapLog(st.msg,'cmp');
  } else if(st.type==='swp'||st.type==='extract'){
    _vizHeapSwps++;vizBumpStat('heap-stat-swp',_vizHeapSwps);
    if(st.i>=0)_vizHeapHL[st.i]='swp';if(st.j>=0)_vizHeapHL[st.j]='swp';
    heapLog(st.msg,'swp');
  } else if(st.type==='done'||st.type==='sort_done'||st.type==='heap_built'){
    for(var i=0;i<_vizHeapArr.length;i++)_vizHeapHL[i]='done';
    heapLog(st.msg,'ok');
    if(st.type==='sort_done'){launchConfetti();showToast('Heap Sort Complete! '+_vizHeapSorted.join(', '),'success');}
  } else { heapLog(st.msg,'inf'); }
  heapDrawTree();heapRenderArrRow();
}
function heapPlay(){
  if(_vizHeapRunning)return;
  if(!_vizHeapSteps.length){showToast('Build/sort first');return;}
  _vizHeapRunning=true;
  function tick(){
    if(!_vizHeapRunning||_vizHeapStepIdx>=_vizHeapSteps.length){_vizHeapRunning=false;return;}
    heapApplyStep(_vizHeapSteps[_vizHeapStepIdx++]);
    vizBumpStat('heap-stat-step',_vizHeapStepIdx);
    _vizHeapTimer=setTimeout(tick,vizSpeedMs('heap-speed'));
  }
  tick();
}
function heapPause(){_vizHeapRunning=false;if(_vizHeapTimer)clearTimeout(_vizHeapTimer);}
function heapStep(){
  if(_vizHeapStepIdx>=_vizHeapSteps.length){showToast('All steps done');return;}
  heapApplyStep(_vizHeapSteps[_vizHeapStepIdx++]);
  vizBumpStat('heap-stat-step',_vizHeapStepIdx);
}
function heapRenderArrRow(){
  var row=document.getElementById('heap-arr-row'); if(!row) return;
  row.innerHTML='';
  _vizHeapArr.forEach(function(v,i){
    var b=document.createElement('div');b.className='viz-arr-box'+(_vizHeapHL[i]?(' '+_vizHeapHL[i]):'');
    b.textContent=v;row.appendChild(b);
  });
  var sr=document.getElementById('heap-sorted-row');if(!sr)return;
  sr.innerHTML='';
  _vizHeapSorted.forEach(function(v){var b=document.createElement('div');b.className='viz-arr-box done';b.textContent=v;sr.appendChild(b);});
}
function heapDrawTree(){
  var canvas=document.getElementById('heap-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||700;canvas.height=300;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  if(!_vizHeapArr.length){ctx.fillStyle='#475569';ctx.font='13px JetBrains Mono';ctx.textAlign='center';ctx.fillText('No heap yet',W/2,H/2);return;}
  var n=_vizHeapArr.length,R=20;
  var levels=Math.floor(Math.log2(n))+1;
  function pos(i){var lv=Math.floor(Math.log2(i+1)),p=i+1-Math.pow(2,lv),tot=Math.pow(2,lv);return{x:(p+.5)/tot*W,y:28+lv*(H-30)/Math.max(levels,1)};}
  // edges
  ctx.strokeStyle='rgba(148,163,184,.3)';ctx.lineWidth=1.5;
  for(var i=1;i<n;i++){var pp=pos(Math.floor((i-1)/2)),cp=pos(i);ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(cp.x,cp.y);ctx.stroke();}
  // nodes
  for(var i=0;i<n;i++){
    var p=pos(i),hl=_vizHeapHL[i];
    var col=hl==='cmp'?'#f59e0b':hl==='swp'?'#ef4444':hl==='done'?'#10b981':hl==='sel'?'#8b5cf6':'#3b82f6';
    ctx.shadowColor=col;ctx.shadowBlur=hl?14:4;
    ctx.fillStyle=col+'30';ctx.strokeStyle=col;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(_vizHeapArr[i],p.x,p.y);
    ctx.fillStyle='rgba(148,163,184,.4)';ctx.font='8px JetBrains Mono';ctx.fillText('['+i+']',p.x,p.y+R+9);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 26: RECURRENCE TREE ANIMATOR
// ─────────────────────────────────────────────────────────────────────────────
var _vizRecurrTimer=null,_vizRecurrRunning=false,_vizRecurrNodes=[],_vizRecurrRevealIdx=0;
var _vizRecurrPresets={
  mergesort:{a:2,b:2,fn:'n',lvl:5,name:'Merge Sort',result:'O(n log n)',case:2},
  binsearch:{a:1,b:2,fn:'1',lvl:5,name:'Binary Search',result:'O(log n)',case:2},
  case1:{a:4,b:2,fn:'n',lvl:4,name:'T(n)=4T(n/2)+n',result:'O(n²)',case:1},
  strassen:{a:7,b:2,fn:'n2',lvl:3,name:"Strassen's",result:'O(n^2.807)',case:1},
  hanoi:{a:2,b:2,fn:'1',lvl:5,name:'Tower of Hanoi (sub)',result:'O(2ⁿ)',case:'subtraction'}
};

function recurrLoadPreset(){
  var v=document.getElementById('recurr-preset').value; if(!v)return;
  var p=_vizRecurrPresets[v]; if(!p)return;
  document.getElementById('recurr-a-in').value=p.a;
  document.getElementById('recurr-b-in').value=p.b;
  document.getElementById('recurr-fn-in').value=p.fn;
  document.getElementById('recurr-lvls-in').value=p.lvl;
  recurrAnimate();
}
function recurrReset(){
  if(_vizRecurrTimer)clearTimeout(_vizRecurrTimer);_vizRecurrTimer=null;_vizRecurrRunning=false;
  _vizRecurrNodes=[];_vizRecurrRevealIdx=0;
  vizBumpStat('recurr-stat-levels',0);vizBumpStat('recurr-stat-leaves',0);
  var mc=document.getElementById('recurr-master-card');if(mc)mc.style.display='none';
  vizClearLog('recurr-log');vizLog('recurr-log','Reset.','inf');
  var canvas=document.getElementById('recurr-canvas');if(canvas){canvas.width=canvas.parentElement.clientWidth||700;var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);}
}
function recurrFnVal(fn,n){
  if(fn==='1')return 1;if(fn==='logn')return Math.max(1,Math.log2(n));
  if(fn==='n')return n;if(fn==='nlogn')return n*Math.max(1,Math.log2(n));
  if(fn==='n2')return n*n;return 1;
}
function recurrFnLabel(fn,n){
  if(fn==='1')return '1';if(fn==='logn')return 'log(n/'+n+')';
  if(fn==='n')return 'n/'+n;if(fn==='nlogn')return '(n/'+n+')log';
  if(fn==='n2')return '(n/'+n+')²';return '1';
}
function recurrAnimate(){
  recurrReset();
  var a=parseInt(document.getElementById('recurr-a-in').value)||2;
  var b=parseInt(document.getElementById('recurr-b-in').value)||2;
  var fn=document.getElementById('recurr-fn-in').value||'n';
  var maxLvl=Math.max(2,Math.min(6,parseInt(document.getElementById('recurr-lvls-in').value)||4));
  var canvas=document.getElementById('recurr-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||700;canvas.height=400;
  var W=canvas.width,H=canvas.height;
  vizBumpStat('recurr-stat-levels',maxLvl);
  vizBumpStat('recurr-stat-leaves',Math.round(Math.pow(a,maxLvl-1)));
  // Build node list level by level
  _vizRecurrNodes=[];
  var R=18;
  for(var lv=0;lv<maxLvl;lv++){
    var cnt=Math.pow(a,lv),nodeLevelH=(H-40)/maxLvl,y=30+lv*nodeLevelH+nodeLevelH/2;
    var visible=Math.min(cnt,Math.pow(2,lv+1)); // show up to 2^(lv+1) nodes, rest as "..."
    for(var i=0;i<Math.min(cnt,16);i++){
      var x=(i+.5)/Math.min(cnt,16)*(W-20)+10;
      var nVal=Math.pow(b,lv);
      _vizRecurrNodes.push({lv:lv,i:i,cnt:cnt,x:x,y:y,nVal:'n/b^'+lv,cost:fn,a:a,b:b,revealed:false});
    }
  }
  _vizRecurrRevealIdx=0;_vizRecurrRunning=true;
  vizLog('recurr-log','Animating T(n)='+a+'T(n/'+b+')+ f(n). Total levels: '+maxLvl,'inf');
  function tick(){
    if(!_vizRecurrRunning||_vizRecurrRevealIdx>_vizRecurrNodes.length){_vizRecurrRunning=false;recurrDrawAll(a,b,fn,maxLvl,true);return;}
    _vizRecurrNodes.forEach(function(nd,idx){nd.revealed=idx<_vizRecurrRevealIdx;});
    recurrDrawAll(a,b,fn,maxLvl,false);
    var nd=_vizRecurrNodes[_vizRecurrRevealIdx-1];
    if(nd)vizLog('recurr-log','Level '+nd.lv+': '+Math.pow(a,nd.lv)+' nodes, each cost f(n/b^'+nd.lv+')','inf');
    _vizRecurrRevealIdx++;
    _vizRecurrTimer=setTimeout(tick,vizSpeedMs('recurr-speed'));
  }
  tick();
}
function recurrDrawAll(a,b,fn,maxLvl,showTotals){
  var canvas=document.getElementById('recurr-canvas');if(!canvas)return;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  var nodeLevelH=(H-40)/maxLvl,R=16;
  // draw lines first
  _vizRecurrNodes.filter(function(n){return n.revealed&&n.lv<maxLvl-1;}).forEach(function(nd){
    var childCnt=Math.pow(a,nd.lv+1),childVis=Math.min(childCnt,16);
    for(var c=0;c<a;c++){
      var childIdx=nd.i*a+c;if(childIdx>=childVis)continue;
      var cx=(childIdx+.5)/childVis*(W-20)+10,cy=nd.y+nodeLevelH;
      ctx.strokeStyle='rgba(148,163,184,.2)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(nd.x,nd.y);ctx.lineTo(cx,cy);ctx.stroke();
    }
  });
  // draw nodes
  _vizRecurrNodes.filter(function(n){return n.revealed;}).forEach(function(nd){
    var hue=nd.lv*(360/Math.max(maxLvl,1));
    var col='hsl('+hue+',70%,60%)';
    ctx.shadowColor=col;ctx.shadowBlur=8;
    ctx.fillStyle=col+'30';ctx.strokeStyle=col;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(nd.x-R*1.5,nd.y-R,R*3,R*2,5);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(nd.nVal.replace('b^0','').replace('n/b^','n/'+Math.pow(b,nd.lv)),nd.x,nd.y-5);
    ctx.fillStyle='#f59e0b';ctx.font='8px JetBrains Mono';
    ctx.fillText('+f(·)',nd.x,nd.y+6);
    // "..." indicator if truncated
    if(nd.i===Math.min(Math.pow(a,nd.lv),16)-1&&Math.pow(a,nd.lv)>16){
      ctx.fillStyle='rgba(148,163,184,.5)';ctx.font='10px JetBrains Mono';ctx.textAlign='left';
      ctx.fillText('×'+Math.pow(a,nd.lv),nd.x+R*2,nd.y);
    }
  });
  // right side cost annotations per level
  var revLevels=new Set(_vizRecurrNodes.filter(function(n){return n.revealed;}).map(function(n){return n.lv;}));
  revLevels.forEach(function(lv){
    var y=30+lv*(nodeLevelH)+nodeLevelH/2;
    var nodes=Math.pow(a,lv),fnName=fn;
    ctx.fillStyle='rgba(52,211,153,.7)';ctx.font='bold 9px JetBrains Mono';ctx.textAlign='right';
    ctx.fillText('L'+lv+': a^'+lv+'='+nodes+' nodes',W-4,y);
  });
  if(showTotals){
    ctx.fillStyle='#f59e0b';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText('log_'+b+'(n) levels total   Leaves ≈ a^(log_b n) = n^(log_b a)',W/2,H-8);
  }
}
function recurrSolveMaster(){
  var a=parseFloat(document.getElementById('recurr-a-in').value)||2;
  var b=parseFloat(document.getElementById('recurr-b-in').value)||2;
  var fn=document.getElementById('recurr-fn-in').value||'n';
  if(a<1||b<2){showToast('a≥1, b≥2 required');return;}
  var logba=Math.log(a)/Math.log(b);
  var pMap={1:0,logn:.001,n:1,nlogn:1,n2:2,n3:3};
  var fnNames={1:'1',logn:'log n',n:'n',nlogn:'n log n',n2:'n²',n3:'n³'};
  var p=pMap[fn]||1,fname=fnNames[fn]||fn;
  var eps=0.01,caseNum,result,expl,caseColor;
  if(fn==='nlogn'&&Math.abs(logba-1)<eps){caseNum=2;result='Θ(n log² n)';caseColor='#60a5fa';expl='f(n)=n log n=n^1·log n, log_b(a)=1 → Case 2 with extra log';}
  else if(p<logba-eps){caseNum=1;result='Θ(n^log_'+b+'('+a+')) ≈ Θ(n^'+logba.toFixed(3)+')';caseColor='#34d399';expl='f(n)='+fname+'=Θ(n^'+p+'), log_b(a)='+logba.toFixed(3)+' > '+p+' → f is polynomially smaller';}
  else if(Math.abs(p-logba)<eps){caseNum=2;result='Θ(n^'+logba.toFixed(3)+'·log n)';caseColor='#60a5fa';expl='f(n)=Θ(n^log_b(a)) → multiply by log n';}
  else if(p>logba+eps){caseNum=3;result='Θ(f(n)) = Θ('+fname+')';caseColor='#a78bfa';expl='f(n)='+fname+'=Ω(n^'+logba.toFixed(3)+'+ε) and regularity holds → f dominates';}
  else{caseNum=0;result='Borderline — cannot apply Master Theorem';caseColor='#f59e0b';expl='Difference too small. Use substitution method.';}
  var mc=document.getElementById('recurr-master-card');if(!mc)return;
  mc.style.display='block';
  mc.innerHTML='<div style="background:#0d1526;border:2px solid '+caseColor+';border-radius:10px;padding:16px">'
    +'<div style="font-size:13px;font-weight:800;color:'+caseColor+';margin-bottom:8px">T(n) = '+a+'T(n/'+b+') + '+fname+'</div>'
    +'<div style="font-size:12px;color:#94a3b8;margin-bottom:6px">log_b(a) = log_'+b+'('+a+') ≈ <strong style="color:'+caseColor+'">'+logba.toFixed(3)+'</strong>, p = '+p+'</div>'
    +(caseNum?'<div style="margin-bottom:8px;font-size:12px;color:#e2e8f0"><span style="background:'+caseColor+'30;border:1px solid '+caseColor+';border-radius:4px;padding:2px 8px;font-weight:700">Case '+caseNum+'</span>  '+expl+'</div>':'')
    +'<div style="font-size:16px;font-weight:900;color:'+caseColor+'">Result: '+result+'</div>'
    +'<div style="margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">'
    +['Case 1: f=O(n^(log_b a-ε)) → T=Θ(n^log_b a)','Case 2: f=Θ(n^log_b a) → T=Θ(n^log_b a · log n)','Case 3: f=Ω(n^(log_b a+ε)) → T=Θ(f(n))'].map(function(c,i){
      var ac=i+1===caseNum;
      return '<div style="background:'+(ac?caseColor+'20':'#1e293b')+';border:1px solid '+(ac?caseColor:'rgba(255,255,255,.08)')+';border-radius:6px;padding:8px;font-size:10px;color:'+(ac?caseColor:'#64748b')+'">'+c+'</div>';
    }).join('')
    +'</div></div>';
  vizLog('recurr-log','Master Theorem → '+result,'ok');
  if(caseNum>0)showToast('Result: '+result,'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 27: SCS VISUALIZER
// ─────────────────────────────────────────────────────────────────────────────
var _vizSCSSteps=[],_vizSCSIdx=0,_vizSCSTimer=null,_vizSCSRunning=false;
var _vizSCSX='',_vizSCSY='',_vizSCSDp=[];

function scsReset(){
  if(_vizSCSTimer)clearTimeout(_vizSCSTimer);_vizSCSTimer=null;_vizSCSRunning=false;
  _vizSCSSteps=[];_vizSCSIdx=0;_vizSCSX='';_vizSCSY='';_vizSCSDp=[];
  vizBumpStat('scs-stat-step',0);vizBumpStat('scs-stat-lcs','—');vizBumpStat('scs-stat-scs','—');
  vizClearLog('scs-log');vizLog('scs-log','Reset.','inf');
  var c=document.getElementById('scs-dp-container');if(c)c.innerHTML='';
  var fr=document.getElementById('scs-formula-row');if(fr)fr.style.display='none';
  var sr=document.getElementById('scs-string-row');if(sr)sr.style.display='none';
  var cb=document.getElementById('scs-compare-box');if(cb)cb.style.display='none';
  var tb=document.getElementById('scs-traceback-btn');if(tb)tb.style.display='none';
}
function scsBuildSteps(){
  var X=document.getElementById('scs-x-in').value.toUpperCase().trim();
  var Y=document.getElementById('scs-y-in').value.toUpperCase().trim();
  if(!X||!Y){showToast('Enter both strings');return;}
  if(X.length>12||Y.length>12){showToast('Max 12 chars each');return;}
  scsReset();
  _vizSCSX=X;_vizSCSY=Y;
  var m=X.length,n=Y.length;
  // Build dp table
  var dp=[];for(var i=0;i<=m;i++){dp.push([]);for(var j=0;j<=n;j++)dp[i].push(0);}
  _vizSCSDp=dp;
  // Build steps: each cell fill is one step
  _vizSCSSteps=[];
  for(var i=1;i<=m;i++){
    for(var j=1;j<=n;j++){
      var match=X[i-1]===Y[j-1];
      var val=match?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
      _vizSCSSteps.push({type:'fill',i:i,j:j,val:val,match:match,msg:(match?'Match '+X[i-1]+': dp['+i+']['+j+']=dp['+(i-1)+']['+(j-1)+']+1='+val:'No match: dp['+i+']['+j+']=max('+dp[i-1][j]+','+dp[i][j-1]+')='+val)});
      dp[i][j]=val;
    }
  }
  _vizSCSSteps.push({type:'done',lcsLen:dp[m][n],msg:'LCS length = '+dp[m][n]+'. SCS = '+m+' + '+n+' - '+dp[m][n]+' = '+(m+n-dp[m][n])});
  _vizSCSDp=dp;_vizSCSIdx=0;
  scsRenderTable(-1,-1);
  vizLog('scs-log','DP fill steps: '+_vizSCSSteps.length+'. X="'+X+'" Y="'+Y+'". Click Play!','inf');
}
function scsRenderTable(hi,hj){
  var X=_vizSCSX,Y=_vizSCSY,dp=_vizSCSDp; if(!X||!Y) return;
  var m=X.length,n=Y.length;
  var html='<table style="border-collapse:collapse"><tr><td style="padding:2px 4px"></td><td class="viz-dp-cell" style="color:#60a5fa;font-weight:700">ε</td>';
  for(var j=0;j<n;j++)html+='<td class="viz-dp-cell" style="color:#a78bfa;font-weight:700">'+Y[j]+'</td>';
  html+='</tr>';
  for(var i=0;i<=m;i++){
    html+='<tr><td class="viz-dp-cell" style="color:#f59e0b;font-weight:700">'+(i===0?'ε':X[i-1])+'</td>';
    for(var j=0;j<=n;j++){
      var v=dp[i]?dp[i][j]:0;
      var cls='viz-dp-cell';
      if(i===hi&&j===hj)cls+=' cell-cmp';
      else if(i>0&&j>0&&v>0)cls+=' cell-fill';
      html+='<td class="'+cls+'" id="scs-cell-'+i+'-'+j+'">'+(v||'')+'</td>';
    }
    html+='</tr>';
  }
  html+='</table>';
  var c=document.getElementById('scs-dp-container');if(c)c.innerHTML=html;
}
function scsApplyStep(st){
  if(st.type==='fill'){
    _vizSCSDp[st.i][st.j]=st.val;
    var cell=document.getElementById('scs-cell-'+st.i+'-'+st.j);
    if(cell){cell.textContent=st.val;cell.className='viz-dp-cell '+(st.match?'cell-diagonal':'cell-fill');}
    vizLog('scs-log',st.msg,st.match?'ok':'cmp');
  } else if(st.type==='done'){
    var m=_vizSCSX.length,n=_vizSCSY.length;
    vizBumpStat('scs-stat-lcs',st.lcsLen);
    vizBumpStat('scs-stat-scs',m+n-st.lcsLen);
    vizLog('scs-log',st.msg,'ok');
    var tb=document.getElementById('scs-traceback-btn');if(tb)tb.style.display='';
    var fr=document.getElementById('scs-formula-row');
    if(fr){fr.style.display='block';fr.innerHTML='<span style="color:#94a3b8">|X|='+m+'</span> <span style="color:#e2e8f0">+</span> <span style="color:#94a3b8">|Y|='+n+'</span> <span style="color:#e2e8f0">−</span> <span style="color:#f59e0b">|LCS|='+st.lcsLen+'</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399;font-size:16px;font-weight:900">SCS length = '+(m+n-st.lcsLen)+'</span>';}
  }
}
function scsPlay(){
  if(_vizSCSRunning)return;
  if(!_vizSCSSteps.length){showToast('Build table first');return;}
  _vizSCSRunning=true;
  function tick(){
    if(!_vizSCSRunning||_vizSCSIdx>=_vizSCSSteps.length){_vizSCSRunning=false;return;}
    scsApplyStep(_vizSCSSteps[_vizSCSIdx++]);
    vizBumpStat('scs-stat-step',_vizSCSIdx);
    _vizSCSTimer=setTimeout(tick,vizSpeedMs('scs-speed'));
  }
  tick();
}
function scsPause(){_vizSCSRunning=false;if(_vizSCSTimer)clearTimeout(_vizSCSTimer);}
function scsStepFn(){
  if(_vizSCSIdx>=_vizSCSSteps.length){showToast('All steps done');return;}
  scsApplyStep(_vizSCSSteps[_vizSCSIdx++]);vizBumpStat('scs-stat-step',_vizSCSIdx);
}
function scsTraceback(){
  var X=_vizSCSX,Y=_vizSCSY,dp=_vizSCSDp; if(!X)return;
  var m=X.length,n=Y.length,i=m,j=n,scs='',lcs='';
  while(i>0&&j>0){
    if(X[i-1]===Y[j-1]){scs=X[i-1]+scs;lcs=X[i-1]+lcs;i--;j--;}
    else if(dp[i-1][j]>dp[i][j-1]){scs=X[i-1]+scs;i--;}
    else{scs=Y[j-1]+scs;j--;}
  }
  while(i>0)scs=X[--i]+scs; while(j>0)scs=Y[--j]+scs;
  // render SCS string char by char
  var sr=document.getElementById('scs-string-row');if(sr)sr.style.display='block';
  var sc=document.getElementById('scs-string-chars');if(!sc)return;
  sc.innerHTML='';
  var idx=0;
  function addChar(){
    if(idx>=scs.length){
      var cb=document.getElementById('scs-compare-box');if(cb)cb.style.display='block';
      var cc=document.getElementById('scs-compare-content');
      if(cc)cc.innerHTML='<div style="margin-bottom:6px"><span style="color:#64748b">LCS: </span><span style="color:#f59e0b;font-weight:700">'+lcs+'</span> <span style="color:#64748b">(len='+lcs.length+')</span></div><div><span style="color:#64748b">SCS: </span><span style="color:#34d399;font-weight:700">'+scs+'</span> <span style="color:#64748b">(len='+scs.length+')</span></div><div style="margin-top:8px;font-size:10px;color:#64748b">SCS contains both X="'+X+'" and Y="'+Y+'" as subsequences.</div>';
      showToast('SCS = "'+scs+'"','success');return;
    }
    var ch=document.createElement('div');
    var inX=X.includes(scs[idx]),inY=Y.includes(scs[idx]);
    var col=inX&&inY?'#f59e0b':inX?'#60a5fa':'#a78bfa';
    ch.style.cssText='width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:JetBrains Mono,monospace;font-weight:700;font-size:14px;background:'+col+'20;border:2px solid '+col+';color:'+col+';animation:vizLogFade .3s ease';
    ch.textContent=scs[idx];sc.appendChild(ch);idx++;
    setTimeout(addChar,120);
  }
  addChar();
  // highlight traceback cells
  var ti=m,tj=n;
  function hlNext(){
    if(ti<=0||tj<=0)return;
    var cell=document.getElementById('scs-cell-'+ti+'-'+tj);
    if(cell){cell.className='viz-dp-cell cell-trace';}
    if(X[ti-1]===Y[tj-1]){ti--;tj--;}
    else if(dp[ti-1][tj]>dp[ti][tj-1])ti--;else tj--;
    setTimeout(hlNext,200);
  }
  hlNext();
  vizLog('scs-log','SCS = "'+scs+'" (length '+scs.length+')','ok');
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 28: UNION-FIND
// ─────────────────────────────────────────────────────────────────────────────
var _vizUFParent=[],_vizUFRank=[],_vizUFN=0,_vizUFOps=0,_vizUFPC=0;
var _vizUFHL={},_vizUFTimer=null;
var _vizUFColors=['#ef4444','#3b82f6','#10b981','#f59e0b','#a78bfa','#fb923c','#22d3ee','#f472b6','#4ade80','#818cf8'];

function ufLog(msg,cls){vizLog('uf-log',msg,cls);}
function ufResetAll(){
  if(_vizUFTimer)clearTimeout(_vizUFTimer);_vizUFTimer=null;
  _vizUFParent=[];_vizUFRank=[];_vizUFN=0;_vizUFOps=0;_vizUFPC=0;_vizUFHL={};
  vizBumpStat('uf-stat-ops',0);vizBumpStat('uf-stat-comps',0);vizBumpStat('uf-stat-pc',0);
  vizClearLog('uf-log');vizLog('uf-log','Reset.','inf');
  var row=document.getElementById('uf-ops-row');if(row)row.style.display='none';
  ufDraw();ufRenderTable();
}
function ufInit(){
  _vizUFN=Math.max(3,Math.min(10,parseInt(document.getElementById('uf-n-in').value)||8));
  _vizUFParent=[];_vizUFRank=[];_vizUFHL={};_vizUFOps=0;_vizUFPC=0;
  for(var i=0;i<_vizUFN;i++){_vizUFParent.push(i);_vizUFRank.push(0);}
  var row=document.getElementById('uf-ops-row');if(row)row.style.display='block';
  vizClearLog('uf-log');ufLog('Initialized '+_vizUFN+' elements {0..'+(_vizUFN-1)+'}. Each is its own root.','ok');
  ufDraw();ufRenderTable();ufUpdateStats();
}
function ufFindRoot(x){if(_vizUFParent[x]!==x)_vizUFParent[x]=ufFindRoot(_vizUFParent[x]);return _vizUFParent[x];}
function ufGetComponents(){var roots=new Set();for(var i=0;i<_vizUFN;i++)roots.add(ufFindRoot(i));return roots.size;}
function ufUpdateStats(){vizBumpStat('uf-stat-ops',_vizUFOps);vizBumpStat('uf-stat-comps',ufGetComponents());vizBumpStat('uf-stat-pc',_vizUFPC);}
function ufFindAnim(){
  var x=parseInt(document.getElementById('uf-find-in').value);
  if(isNaN(x)||x<0||x>=_vizUFN){showToast('Invalid element');return;}
  _vizUFOps++;
  // Collect path before compression
  var path=[];var cur=x;
  while(_vizUFParent[cur]!==cur){path.push(cur);cur=_vizUFParent[cur];}
  path.push(cur);// root
  var root=cur;
  _vizUFHL={};
  // animate path lighting up then compression
  var idx=0;
  function step(){
    if(idx<path.length){_vizUFHL[path[idx]]='cmp';ufDraw();idx++;_vizUFTimer=setTimeout(step,400);}
    else{
      // path compression
      path.forEach(function(n){if(n!==root){if(_vizUFParent[n]!==root)_vizUFPC++;_vizUFParent[n]=root;_vizUFHL[n]='done';}});
      _vizUFHL[root]='sel';
      ufDraw();ufRenderTable();ufUpdateStats();
      ufLog('Find('+x+'): path=['+path.join('→')+'], root='+root+'. Path compressed!','ok');
    }
  }
  step();
}
function ufUnionAnim(){
  var a=parseInt(document.getElementById('uf-ua').value),b=parseInt(document.getElementById('uf-ub').value);
  if(isNaN(a)||isNaN(b)||a<0||b<0||a>=_vizUFN||b>=_vizUFN){showToast('Invalid');return;}
  _vizUFOps++;
  var ra=ufFindRoot(a),rb=ufFindRoot(b);
  if(ra===rb){ufLog('Union('+a+','+b+'): already in same component (root='+ra+')','swp');return;}
  _vizUFHL={};_vizUFHL[a]='cmp';_vizUFHL[b]='cmp';ufDraw();
  setTimeout(function(){
    _vizUFHL[ra]='sel';_vizUFHL[rb]='sel';ufDraw();
    setTimeout(function(){
      if(_vizUFRank[ra]<_vizUFRank[rb])_vizUFParent[ra]=rb;
      else if(_vizUFRank[ra]>_vizUFRank[rb])_vizUFParent[rb]=ra;
      else{_vizUFParent[rb]=ra;_vizUFRank[ra]++;}
      for(var i=0;i<_vizUFN;i++)if(ufFindRoot(i)===ufFindRoot(a))_vizUFHL[i]='done';
      ufDraw();ufRenderTable();ufUpdateStats();
      ufLog('Union('+a+','+b+'): merged components. Root='+ufFindRoot(a),'ok');
    },400);
  },300);
}
function ufRunDemo(){
  var pairs=[[0,1],[2,3],[4,5],[1,2],[0,6],[3,7]];
  var idx=0;
  function next(){
    if(idx>=pairs.length){ufLog('Kruskal demo complete! '+ufGetComponents()+' final components.','ok');return;}
    var p=pairs[idx++];
    document.getElementById('uf-ua').value=p[0];document.getElementById('uf-ub').value=p[1];
    ufUnionAnim();setTimeout(next,1200);
  }
  next();
}
function ufDraw(){
  var canvas=document.getElementById('uf-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||700;canvas.height=300;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  if(!_vizUFN){ctx.fillStyle='#475569';ctx.font='13px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Click Init to start',W/2,H/2);return;}
  var R=24,cols=Math.min(_vizUFN,5),rows=Math.ceil(_vizUFN/cols);
  var cw=W/cols,rh=(H-20)/rows;
  var pos=[];
  for(var i=0;i<_vizUFN;i++){var col=i%cols,row=Math.floor(i/cols);pos.push({x:col*cw+cw/2,y:30+row*rh+rh/2});}
  // draw parent arrows
  for(var i=0;i<_vizUFN;i++){
    if(_vizUFParent[i]!==i){
      var px=pos[i],pp=pos[_vizUFParent[i]];
      ctx.strokeStyle='rgba(96,165,250,.4)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(px.x,px.y);ctx.lineTo(pp.x,pp.y);ctx.stroke();
      // arrowhead
      var ang=Math.atan2(pp.y-px.y,pp.x-px.x);
      var ax=pp.x-R*Math.cos(ang),ay=pp.y-R*Math.sin(ang);
      ctx.fillStyle='rgba(96,165,250,.5)';
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-8*Math.cos(ang-.4),ay-8*Math.sin(ang-.4));ctx.lineTo(ax-8*Math.cos(ang+.4),ay-8*Math.sin(ang+.4));ctx.closePath();ctx.fill();
    }
  }
  // draw nodes
  for(var i=0;i<_vizUFN;i++){
    var p=pos[i],isRoot=_vizUFParent[i]===i,hl=_vizUFHL[i];
    var compCol=_vizUFColors[ufFindRoot(i)%_vizUFColors.length];
    var border=hl==='cmp'?'#f59e0b':hl==='swp'?'#ef4444':hl==='done'?'#10b981':hl==='sel'?'#8b5cf6':compCol;
    ctx.shadowColor=border;ctx.shadowBlur=hl?16:isRoot?8:3;
    ctx.fillStyle=compCol+'25';ctx.strokeStyle=border;ctx.lineWidth=isRoot?3:2;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 13px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(i,p.x,p.y);
    if(isRoot){ctx.fillStyle='#34d399';ctx.font='7px JetBrains Mono';ctx.fillText('ROOT',p.x,p.y+R+9);}
    ctx.fillStyle='rgba(148,163,184,.5)';ctx.font='7px JetBrains Mono';
    ctx.fillText('r'+_vizUFRank[i],p.x+R-4,p.y-R+4);
  }
}
function ufRenderTable(){
  var row=document.getElementById('uf-table-row');if(!row)return;
  row.innerHTML='';
  if(!_vizUFN)return;
  var heads=['idx','parent','rank'],data=[Array.from({length:_vizUFN},function(_,i){return i;}),_vizUFParent,_vizUFRank];
  var tbl=document.createElement('table');tbl.style.cssText='border-collapse:collapse;font-family:JetBrains Mono,monospace;font-size:10px';
  heads.forEach(function(h,hi){
    var tr=document.createElement('tr');
    var th=document.createElement('td');th.textContent=h;th.style.cssText='color:#64748b;padding:2px 4px;text-align:right;font-weight:700';tr.appendChild(th);
    data[hi].forEach(function(v,i){var td=document.createElement('td');td.textContent=v;td.style.cssText='padding:2px 6px;text-align:center;background:#0d1526;border:1px solid rgba(255,255,255,.05);color:'+(_vizUFHL[i]?'#f59e0b':'#94a3b8');tr.appendChild(td);});
    tbl.appendChild(tr);
  });
  row.appendChild(tbl);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 29: TOPO SORT + SCC
// ─────────────────────────────────────────────────────────────────────────────
var _vizTopoSteps=[],_vizTopoIdx=0,_vizTopoTimer=null,_vizTopoRunning=false;
var _vizTopoMode='topo';
var _vizTopoNodeState={},_vizTopoNodes=[],_vizTopoEdges=[];
var _vizTopoDisc={},_vizTopoFin={},_vizTopoSCC=[];

function topoTabSwitch(tab,el){
  ['topo','scc'].forEach(function(t){var d=document.getElementById('topo-tab-'+t);if(d)d.style.display=t===tab?'':'none';});
  document.querySelectorAll('#tool-29 .viz-tab').forEach(function(b){b.classList.remove('active');});
  if(el)el.classList.add('active');_vizTopoMode=tab;
}
function topoLog(msg,cls){vizLog('topo-log',msg,cls);}
function topoResetAll(){
  if(_vizTopoTimer)clearTimeout(_vizTopoTimer);_vizTopoTimer=null;_vizTopoRunning=false;
  _vizTopoSteps=[];_vizTopoIdx=0;_vizTopoNodeState={};_vizTopoNodes=[];_vizTopoEdges=[];
  _vizTopoDisc={};_vizTopoFin={};_vizTopoSCC=[];
  vizBumpStat('topo-stat-step',0);vizBumpStat('topo-stat-phase','—');vizBumpStat('topo-stat-scc',0);
  var pb=document.getElementById('topo-phase-banner');if(pb)pb.style.display='none';
  var ob=document.getElementById('topo-order-row');if(ob)ob.style.display='none';
  vizClearLog('topo-log');vizLog('topo-log','Reset.','inf');
  topoDrawCanvas();
}
function topoLoadPreset(){
  var v=document.getElementById('topo-preset-sel').value;
  if(v==='dag')document.getElementById('topo-edges-in').value='5→2,5→0,4→0,4→1,2→3,3→1';
  else if(v==='course')document.getElementById('topo-edges-in').value='CS1→CS2,CS1→CS3,CS2→CS4,CS3→CS4';
}
function sccLoadPreset(){
  var v=document.getElementById('scc-preset-sel').value;
  if(v==='scc1')document.getElementById('scc-edges-in').value='1→0,0→2,2→1,0→3,3→4';
  else if(v==='scc2')document.getElementById('scc-edges-in').value='A→B,B→C,C→A,B→D,D→E,E→D';
}
function topoParseEdges(str){
  var edges=[],nodes=new Set();
  str.split(',').forEach(function(e){var m=e.trim().match(/(\w+)[→>-]+(\w+)/);if(m){edges.push([m[1],m[2]]);nodes.add(m[1]);nodes.add(m[2]);}});
  return{edges:edges,nodes:[...nodes].sort()};
}
function topoBuildSteps(){
  var str=document.getElementById('topo-edges-in').value;
  if(!str.trim()){showToast('Enter edges');return;}
  var parsed=topoParseEdges(str);
  if(!parsed.nodes.length){showToast('No valid edges');return;}
  topoResetAll();
  _vizTopoNodes=parsed.nodes;_vizTopoEdges=parsed.edges;
  parsed.nodes.forEach(function(n){_vizTopoNodeState[n]='white';});
  // Kahn's topo sort steps
  var adj={};parsed.nodes.forEach(function(n){adj[n]=[];});
  parsed.edges.forEach(function(e){if(!adj[e[0]])adj[e[0]]=[];adj[e[0]].push(e[1]);});
  var inDeg={};parsed.nodes.forEach(function(n){inDeg[n]=0;});
  parsed.edges.forEach(function(e){inDeg[e[1]]++;});
  var queue=parsed.nodes.filter(function(n){return inDeg[n]===0;}).sort();
  var order=[],steps=[],time=0;
  steps.push({type:'phase',msg:'Topological Sort (Kahn\'s BFS). Start with zero in-degree nodes: ['+queue.join(',')+']',nodeState:Object.assign({},_vizTopoNodeState),phase:'Kahn BFS'});
  while(queue.length){
    var u=queue.shift();
    steps.push({type:'visit',node:u,msg:'Process '+u+' (d='+time+'). Add to topological order.',nodeState:null,d:time++,order:[].concat(order)});
    order.push(u);
    (adj[u]||[]).forEach(function(v){inDeg[v]--;if(inDeg[v]===0){queue.push(v);steps.push({type:'discover',node:v,msg:'→ '+u+' processed, '+v+' now has in-degree 0. Enqueue.',nodeState:null});}});
  }
  if(order.length!==parsed.nodes.length){
    steps.push({type:'error',msg:'CYCLE DETECTED! No topological sort exists.',nodeState:null});
  } else {
    steps.push({type:'done',order:[].concat(order),msg:'Topological order: '+order.join(' → ')});
  }
  _vizTopoSteps=steps;_vizTopoIdx=0;
  var pb=document.getElementById('topo-phase-banner');if(pb){pb.style.display='block';pb.textContent='Topological Sort — DFS/Kahn\'s Algorithm';}
  topoDrawCanvas();
  vizLog('topo-log',parsed.nodes.length+' nodes, '+parsed.edges.length+' edges. Click Play!','inf');
}
function sccBuildSteps(){
  var str=document.getElementById('scc-edges-in').value;
  if(!str.trim()){showToast('Enter edges');return;}
  var parsed=topoParseEdges(str);
  if(!parsed.nodes.length){showToast('No valid edges');return;}
  topoResetAll();
  _vizTopoNodes=parsed.nodes;_vizTopoEdges=parsed.edges;
  parsed.nodes.forEach(function(n){_vizTopoNodeState[n]='white';});
  var adj={},radj={};
  parsed.nodes.forEach(function(n){adj[n]=[];radj[n]=[];});
  parsed.edges.forEach(function(e){adj[e[0]].push(e[1]);radj[e[1]].push(e[0]);});
  var visited=new Set(),stack=[],steps=[],sccs=[];
  steps.push({type:'phase',msg:'Phase 1: DFS on original graph to compute finish order.',phase:'P1: DFS'});
  function dfs1(u){visited.add(u);_vizTopoNodeState[u]='gray';steps.push({type:'visit',node:u,msg:'Visit '+u,nodeState:Object.assign({},_vizTopoNodeState)});(adj[u]||[]).forEach(function(v){if(!visited.has(v))dfs1(v);});_vizTopoNodeState[u]='black';steps.push({type:'finish',node:u,msg:'Finish '+u+' → push to stack',nodeState:Object.assign({},_vizTopoNodeState)});stack.push(u);}
  parsed.nodes.forEach(function(n){if(!visited.has(n))dfs1(n);});
  steps.push({type:'phase',msg:'Phase 2: Reverse all edges (transpose graph G^T).',phase:'P2: Transpose'});
  steps.push({type:'transpose',msg:'All edges reversed. Stack: ['+stack.join(',')+']'});
  visited.clear();
  steps.push({type:'phase',msg:'Phase 3: DFS on G^T in reverse finish order.',phase:'P3: SCC DFS'});
  function dfs2(u,scc){visited.add(u);scc.push(u);_vizTopoNodeState[u]='scc'+sccs.length;steps.push({type:'scc_visit',node:u,sccIdx:sccs.length,msg:'SCC '+(sccs.length+1)+': Visit '+u,nodeState:Object.assign({},_vizTopoNodeState)});(radj[u]||[]).forEach(function(v){if(!visited.has(v))dfs2(v,scc);});}
  while(stack.length){var u=stack.pop();if(!visited.has(u)){var scc=[];dfs2(u,scc);sccs.push(scc);steps.push({type:'scc_found',scc:[].concat(scc),msg:'SCC '+(sccs.length)+': {'+scc.join(',')+'}'});}}
  steps.push({type:'done',sccs:[].concat(sccs),msg:'Kosaraju complete! '+sccs.length+' SCC(s) found: '+sccs.map(function(s){return'{'+s.join(',')+'}'}).join(', ')});
  _vizTopoSteps=steps;_vizTopoIdx=0;
  var pb=document.getElementById('topo-phase-banner');if(pb){pb.style.display='block';pb.textContent='Kosaraju SCC — Phase 1';}
  topoDrawCanvas();
  vizLog('topo-log',parsed.nodes.length+' nodes, '+parsed.edges.length+' edges. Click Play!','inf');
}
function topoApplyStep(st){
  var sccColors=['#34d399','#60a5fa','#a78bfa','#fbbf24','#fb923c','#f472b6'];
  if(st.nodeState)Object.assign(_vizTopoNodeState,st.nodeState);
  if(st.type==='phase'){
    var pb=document.getElementById('topo-phase-banner');if(pb)pb.textContent=st.msg;
    vizBumpStat('topo-stat-phase',st.phase||'—');
    topoLog(st.msg,'inf');
  } else if(st.type==='visit'||st.type==='scc_visit'){
    _vizTopoNodeState[st.node]='gray';topoDrawCanvas();topoLog(st.msg,'cmp');
  } else if(st.type==='finish'){_vizTopoNodeState[st.node]='black';topoDrawCanvas();topoLog(st.msg,'ok');}
  else if(st.type==='discover'){_vizTopoNodeState[st.node]='queue';topoDrawCanvas();topoLog(st.msg,'inf');}
  else if(st.type==='scc_found'){
    vizBumpStat('topo-stat-scc',_vizTopoSCC.length);
    _vizTopoSCC.push(st.scc);topoDrawCanvas();topoLog(st.msg,'ok');
  } else if(st.type==='done'){
    if(st.order){
      var ob=document.getElementById('topo-order-row');if(ob)ob.style.display='block';
      var boxes=document.getElementById('topo-order-boxes');if(boxes){
        boxes.innerHTML='';
        st.order.forEach(function(n,i){
          var b=document.createElement('div');b.className='viz-arr-box done';b.style.fontFamily='JetBrains Mono,monospace';b.textContent=n;
          setTimeout(function(){boxes.appendChild(b);},i*200);
        });
      }
    }
    if(st.sccs)vizBumpStat('topo-stat-scc',st.sccs.length);
    topoLog(st.msg,'ok');topoDrawCanvas();launchConfetti();showToast(st.msg,'success');
  } else if(st.type==='error'){topoLog(st.msg,'swp');}
  else{topoDrawCanvas();topoLog(st.msg,'inf');}
}
function topoPlay(){
  if(_vizTopoRunning)return;
  if(!_vizTopoSteps.length){showToast('Build graph first');return;}
  _vizTopoRunning=true;
  function tick(){
    if(!_vizTopoRunning||_vizTopoIdx>=_vizTopoSteps.length){_vizTopoRunning=false;return;}
    topoApplyStep(_vizTopoSteps[_vizTopoIdx++]);
    vizBumpStat('topo-stat-step',_vizTopoIdx);
    _vizTopoTimer=setTimeout(tick,vizSpeedMs('topo-speed'));
  }
  tick();
}
function topoPause(){_vizTopoRunning=false;if(_vizTopoTimer)clearTimeout(_vizTopoTimer);}
function topoStep(){if(_vizTopoIdx>=_vizTopoSteps.length){showToast('Done');return;}topoApplyStep(_vizTopoSteps[_vizTopoIdx++]);vizBumpStat('topo-stat-step',_vizTopoIdx);}
function topoDrawCanvas(){
  var canvas=document.getElementById('topo-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||700;canvas.height=360;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  var nodes=_vizTopoNodes,edges=_vizTopoEdges;
  if(!nodes.length){ctx.fillStyle='#475569';ctx.font='13px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Enter edges and click Run',W/2,H/2);return;}
  var R=22,cx=W/2,cy=H/2,rad=Math.min(W,H)/2-50;
  var pos={};
  nodes.forEach(function(n,i){var a=i/nodes.length*Math.PI*2-Math.PI/2;pos[n]={x:cx+rad*Math.cos(a),y:cy+rad*Math.sin(a)};});
  var sccColors=['#34d399','#60a5fa','#a78bfa','#fbbf24','#fb923c','#f472b6'];
  // draw SCC boundaries
  _vizTopoSCC.forEach(function(scc,si){
    if(scc.length<2)return;
    ctx.beginPath();
    scc.forEach(function(n,ni){var p=pos[n];ni?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
    ctx.closePath();ctx.strokeStyle=sccColors[si%sccColors.length];ctx.lineWidth=3;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
  });
  // edges
  edges.forEach(function(e){
    var a=pos[e[0]],b=pos[e[1]]; if(!a||!b)return;
    ctx.strokeStyle='rgba(148,163,184,.3)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    var ang=Math.atan2(b.y-a.y,b.x-a.x),ax=b.x-R*Math.cos(ang),ay=b.y-R*Math.sin(ang);
    ctx.fillStyle='rgba(148,163,184,.4)';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-10*Math.cos(ang-.4),ay-10*Math.sin(ang-.4));ctx.lineTo(ax-10*Math.cos(ang+.4),ay-10*Math.sin(ang+.4));ctx.closePath();ctx.fill();
  });
  // nodes
  nodes.forEach(function(n,ni){
    var p=pos[n],st=_vizTopoNodeState[n]||'white';
    var col=st==='gray'?'#f59e0b':st==='black'?'#10b981':st==='queue'?'#3b82f6':st==='white'?'#475569':'#a78bfa';
    // scc coloring
    for(var si=0;si<_vizTopoSCC.length;si++){if(_vizTopoSCC[si].indexOf(n)>=0){col=sccColors[si%sccColors.length];break;}}
    ctx.shadowColor=col;ctx.shadowBlur=st!=='white'?14:3;
    ctx.fillStyle=col+'30';ctx.strokeStyle=col;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(n,p.x,p.y);
    // state badge
    if(st!=='white'){var badge=st==='gray'?'d':'f';ctx.fillStyle=col;ctx.font='8px JetBrains Mono';ctx.fillText(badge,p.x+R-2,p.y-R+2);}
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 30: BACKTRACKING
// ─────────────────────────────────────────────────────────────────────────────
var _vizBTSteps=[],_vizBTIdx=0,_vizBTTimer=null,_vizBTRunning=false;
var _vizBTMode='subset',_vizBTTreeNodes=[],_vizBTHighNode=-1;
var _vizBTNodeCnt=0,_vizBTPruned=0,_vizBTSols=0;
var _vizBTSet=[],_vizBTTarget=0,_vizBTCurrentPath=[],_vizBTSolutions=[];

function btTabSwitch(tab,el){
  ['subset','color'].forEach(function(t){var d=document.getElementById('bt-tab-'+t);if(d)d.style.display=t===tab?'':'none';});
  document.querySelectorAll('#tool-30 .viz-tab').forEach(function(b){b.classList.remove('active');});
  if(el)el.classList.add('active');_vizBTMode=tab;
}
function btLog(msg,cls){vizLog('bt-log',msg,cls);}
function btUpdateSpeed(v){var lbl=document.getElementById('bt-speed-lbl');if(lbl)lbl.textContent=['','Slow','MedSlow','Med','Fast','Fast'][v]||'Med';}
function btResetAll(){
  if(_vizBTTimer)clearTimeout(_vizBTTimer);_vizBTTimer=null;_vizBTRunning=false;
  _vizBTSteps=[];_vizBTIdx=0;_vizBTTreeNodes=[];_vizBTHighNode=-1;
  _vizBTNodeCnt=0;_vizBTPruned=0;_vizBTSols=0;
  vizBumpStat('bt-stat-nodes',0);vizBumpStat('bt-stat-pruned',0);vizBumpStat('bt-stat-sols',0);
  vizClearLog('bt-log');btDrawTree();btDrawState();
}
function btFastMode(){document.getElementById('bt-speed').value=5;btUpdateSpeed(5);}
function btSubsetSteps(){
  var raw=document.getElementById('bt-set-in').value;
  var set=raw.split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x);});
  var target=parseInt(document.getElementById('bt-target-in').value);
  if(!set.length||isNaN(target)){showToast('Enter set and target');return;}
  btResetAll();_vizBTSet=set;_vizBTTarget=target;_vizBTMode='subset';
  // Collect steps
  var steps=[],nodeId=0,solutions=[];
  function solve(idx,path,sum,parentId){
    var myId=nodeId++;
    var pruned=sum>target;
    var isSol=sum===target;
    steps.push({type:'expand',nodeId:myId,parentId:parentId,path:[].concat(path),sum:sum,pruned:pruned,isSol:isSol,
      msg:pruned?'PRUNE: sum='+sum+'>'+target:(isSol?'SOLUTION FOUND! {'+path.join(',')+'}':'Expand: path={'+path.join(',')+'}  sum='+sum),
      cls:pruned?'swp':isSol?'ok':'cmp'});
    if(pruned||idx>=set.length){if(isSol)solutions.push([].concat(path));return;}
    // Include
    path.push(set[idx]);
    solve(idx+1,path,sum+set[idx],myId);
    path.pop();
    // Exclude
    solve(idx+1,path,sum,myId);
  }
  solve(0,[],0,-1);
  steps.push({type:'all_done',solutions:[].concat(solutions),msg:'Complete. '+solutions.length+' solution(s) found for target='+target});
  _vizBTSteps=steps;_vizBTIdx=0;_vizBTSolutions=solutions;
  vizLog('bt-log','Subset sum: set=['+set.join(',')+'], target='+target+'. '+steps.length+' steps collected. Click Play!','inf');
}
function btColorSteps(){
  var n=parseInt(document.getElementById('bt-cn-in').value)||4;
  var raw=document.getElementById('bt-cedges-in').value;
  var k=parseInt(document.getElementById('bt-ck-in').value)||3;
  var adj=Array.from({length:n},function(){return [];});
  raw.split(',').forEach(function(e){var m=e.trim().match(/(\d+)-(\d+)/);if(m){var u=parseInt(m[1]),v=parseInt(m[2]);if(u<n&&v<n){adj[u].push(v);adj[v].push(u);}}});
  btResetAll();_vizBTMode='color';
  var colors=new Array(n).fill(-1),steps=[],nodeId=0,found=false;
  function solve(v){
    if(found)return;if(v===n){found=true;steps.push({type:'color_done',colors:[].concat(colors),msg:'Solution: '+colors.map(function(c,i){return i+'→C'+(c+1);}).join(', ')});return;}
    for(var c=0;c<k;c++){
      var safe=!adj[v].some(function(u){return colors[u]===c;});
      var myId=nodeId++;
      if(safe){
        colors[v]=c;
        steps.push({type:'color_try',nodeId:myId,v:v,c:c,colors:[].concat(colors),msg:'Try vertex '+v+' = Color '+(c+1),cls:'cmp'});
        solve(v+1);
        if(!found)colors[v]=-1;
      } else {
        steps.push({type:'color_conflict',nodeId:myId,v:v,c:c,colors:[].concat(colors),msg:'Conflict: vertex '+v+' = Color '+(c+1)+' conflicts with neighbor',cls:'swp'});
      }
    }
  }
  solve(0);
  if(!found)steps.push({type:'all_done',solutions:[],msg:'No '+k+'-coloring possible for this graph'});
  _vizBTSteps=steps;_vizBTIdx=0;
  vizLog('bt-log','Graph coloring: '+n+' vertices, k='+k+'. '+steps.length+' steps. Click Play!','inf');
}
function btApplyStep(st){
  if(st.type==='expand'){
    _vizBTNodeCnt++;_vizBTHighNode=st.nodeId;
    if(st.pruned)_vizBTPruned++;
    if(st.isSol)_vizBTSols++;
    _vizBTTreeNodes.push({id:st.nodeId,parent:st.parentId,path:st.path,sum:st.sum,pruned:st.pruned,isSol:st.isSol,active:true});
    _vizBTCurrentPath=st.path;
    vizBumpStat('bt-stat-nodes',_vizBTNodeCnt);vizBumpStat('bt-stat-pruned',_vizBTPruned);vizBumpStat('bt-stat-sols',_vizBTSols);
    btLog(st.msg,st.cls);
    if(st.isSol){showToast('Solution: {'+st.path.join(',')+'}','success');}
  } else if(st.type==='color_try'||st.type==='color_conflict'){
    _vizBTNodeCnt++;if(st.type==='color_conflict')_vizBTPruned++;
    vizBumpStat('bt-stat-nodes',_vizBTNodeCnt);vizBumpStat('bt-stat-pruned',_vizBTPruned);
    btLog(st.msg,st.cls);
    if(st.colors)btDrawColorState(st.colors,st.v,st.c,st.type==='color_conflict');
  } else if(st.type==='color_done'){
    _vizBTSols++;vizBumpStat('bt-stat-sols',_vizBTSols);
    btLog(st.msg,'ok');if(st.colors)btDrawColorState(st.colors,-1,-1,false);
    launchConfetti();showToast(st.msg,'success');
  } else if(st.type==='all_done'){
    btLog(st.msg,st.solutions&&st.solutions.length?'ok':'swp');
    if(st.solutions&&st.solutions.length)launchConfetti();
  }
  btDrawTree();if(_vizBTMode==='subset')btDrawState();
}
function btPlay(){
  if(_vizBTRunning)return;
  if(!_vizBTSteps.length){showToast('Build steps first');return;}
  _vizBTRunning=true;
  function tick(){
    if(!_vizBTRunning||_vizBTIdx>=_vizBTSteps.length){_vizBTRunning=false;return;}
    btApplyStep(_vizBTSteps[_vizBTIdx++]);
    _vizBTTimer=setTimeout(tick,vizSpeedMs('bt-speed'));
  }
  tick();
}
function btPauseFn(){_vizBTRunning=false;if(_vizBTTimer)clearTimeout(_vizBTTimer);}
function btStep(){if(_vizBTIdx>=_vizBTSteps.length){showToast('Done');return;}btApplyStep(_vizBTSteps[_vizBTIdx++]);}
function btDrawTree(){
  var canvas=document.getElementById('bt-tree-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||350;canvas.height=320;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  if(!_vizBTTreeNodes.length){ctx.fillStyle='#475569';ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('State space tree',W/2,H/2-10);ctx.fillText('appears here',W/2,H/2+8);return;}
  var R=12;
  var nodes=_vizBTTreeNodes.slice(0,80); // max 80 nodes visible
  var maxDepth=0;nodes.forEach(function(n){if(n.path.length>maxDepth)maxDepth=n.path.length;});
  var levelH=(H-20)/(maxDepth+1);
  // assign x positions per level
  var levelNodes={};nodes.forEach(function(n){var lv=n.path.length;levelNodes[lv]=levelNodes[lv]||[];levelNodes[lv].push(n);});
  var nodePos={};
  Object.keys(levelNodes).forEach(function(lv){
    var lvNodes=levelNodes[lv],cnt=lvNodes.length;
    lvNodes.forEach(function(n,i){nodePos[n.id]={x:(i+.5)/cnt*W,y:20+parseInt(lv)*levelH};});
  });
  // edges
  nodes.forEach(function(n){
    if(n.parent>=0&&nodePos[n.parent]&&nodePos[n.id]){
      var pp=nodePos[n.parent],cp=nodePos[n.id];
      ctx.strokeStyle=n.pruned?'rgba(239,68,68,.3)':n.isSol?'rgba(16,185,129,.5)':'rgba(148,163,184,.2)';
      ctx.setLineDash(n.pruned?[3,3]:[]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(cp.x,cp.y);ctx.stroke();ctx.setLineDash([]);
    }
  });
  // nodes
  nodes.forEach(function(n){
    var p=nodePos[n.id];if(!p)return;
    var isHL=n.id===_vizBTHighNode;
    var col=n.isSol?'#10b981':n.pruned?'#ef4444':isHL?'#f59e0b':'#3b82f6';
    var opacity=n.pruned?0.35:1;
    ctx.globalAlpha=opacity;
    ctx.shadowColor=col;ctx.shadowBlur=isHL?16:n.isSol?12:4;
    ctx.fillStyle=col+'30';ctx.strokeStyle=col;ctx.lineWidth=isHL?2.5:1.5;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    // X through pruned nodes
    if(n.pruned){ctx.strokeStyle='#ef4444';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x-R*.6,p.y-R*.6);ctx.lineTo(p.x+R*.6,p.y+R*.6);ctx.moveTo(p.x+R*.6,p.y-R*.6);ctx.lineTo(p.x-R*.6,p.y+R*.6);ctx.stroke();}
    ctx.globalAlpha=1;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 8px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(_vizBTMode==='subset'?n.sum:'',p.x,p.y);
  });
}
function btDrawState(){
  var canvas=document.getElementById('bt-state-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||350;canvas.height=320;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  if(!_vizBTSet.length){ctx.fillStyle='#475569';ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Problem state',W/2,H/2-10);ctx.fillText('appears here',W/2,H/2+8);return;}
  var set=_vizBTSet,target=_vizBTTarget,path=_vizBTCurrentPath;
  var sum=path.reduce(function(a,b){return a+b;},0);
  // Draw set elements as boxes
  var bw=Math.min(50,(W-40)/set.length),bh=50,startX=(W-set.length*bw)/2;
  ctx.fillStyle='rgba(148,163,184,.5)';ctx.font='11px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('Set: ['+set.join(', ')+']',W/2,22);
  set.forEach(function(v,i){
    var x=startX+i*bw,y=40;
    var inPath=path.includes(v); // Note: might include duplicates incorrectly, but good enough
    var col=inPath?'#8b5cf6':'#1e293b';
    ctx.fillStyle=col;ctx.strokeStyle=inPath?'#a78bfa':'rgba(255,255,255,.1)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(x+2,y,bw-4,bh,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e2e8f0';ctx.font='bold 14px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(v,x+bw/2,y+bh/2);
  });
  // Progress bar
  var barY=110,barW=W-60,pct=Math.min(sum/target,1.2);
  var barCol=sum>target?'#ef4444':sum===target?'#10b981':'#3b82f6';
  ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(30,barY,barW,18,5);ctx.fill();
  ctx.fillStyle=barCol;ctx.shadowColor=barCol;ctx.shadowBlur=6;
  ctx.beginPath();ctx.roundRect(30,barY,Math.min(pct,1)*barW,18,5);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#e2e8f0';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('Sum: '+sum+' / Target: '+target,W/2,barY+9);
  // Current path
  ctx.fillStyle='#64748b';ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('Current path: {'+path.join(', ')+'}',W/2,140);
  // Solutions found
  ctx.fillStyle='#10b981';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('Solutions found: '+_vizBTSols,W/2,165);
  _vizBTSolutions.slice(0,4).forEach(function(s,i){
    ctx.fillStyle='rgba(16,185,129,.7)';ctx.font='10px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText('{'+s.join(',')+'}',W/2,185+i*18);
  });
}
function btDrawColorState(colors,activeV,activeC,conflict){
  var canvas=document.getElementById('bt-state-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||350;canvas.height=320;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  var COLS=['#ef4444','#3b82f6','#10b981','#f59e0b','#a78bfa'];
  var n=colors.length,R=22,cx=W/2,cy=H/2,rad=Math.min(W,H)/2-45;
  var pos=Array.from({length:n},function(_,i){var a=i/n*Math.PI*2-Math.PI/2;return{x:cx+rad*Math.cos(a),y:cy+rad*Math.sin(a)};});
  ctx.fillStyle='rgba(148,163,184,.5)';ctx.font='11px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('Graph Coloring State',W/2,20);
  // edges
  var raw=document.getElementById('bt-cedges-in').value;
  raw.split(',').forEach(function(e){var m=e.trim().match(/(\d+)-(\d+)/);if(m){var u=parseInt(m[1]),v=parseInt(m[2]);if(u<n&&v<n){var isConflict=conflict&&(u===activeV||v===activeV);ctx.strokeStyle=isConflict?'#ef4444':'rgba(148,163,184,.3)';ctx.lineWidth=isConflict?2.5:1.5;ctx.beginPath();ctx.moveTo(pos[u].x,pos[u].y);ctx.lineTo(pos[v].x,pos[v].y);ctx.stroke();}}});
  // nodes
  for(var i=0;i<n;i++){
    var p=pos[i],c=colors[i],col=c>=0?COLS[c]:'#475569';
    var isActive=i===activeV;ctx.shadowColor=col;ctx.shadowBlur=isActive?16:c>=0?8:2;
    ctx.fillStyle=col+(c>=0?'40':'20');ctx.strokeStyle=col;ctx.lineWidth=isActive?3:2;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(i,p.x,p.y);
    if(c>=0){ctx.fillStyle=col;ctx.font='8px JetBrains Mono';ctx.fillText('C'+(c+1),p.x,p.y+R+10);}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 31: B&B TSP
// ─────────────────────────────────────────────────────────────────────────────
var _vizTSPMatrix=[],_vizTSPN=0;
var _vizTSPSteps=[],_vizTSPIdx=0,_vizTSPTimer=null,_vizTSPRunning=false;
var _vizTSPTreeNodes=[],_vizTSPBestCost=Infinity,_vizTSPBestPath=[];
var _vizTSPNodeCnt=0,_vizTSPPruned=0;

function tspLog(msg,cls){vizLog('tsp-log',msg,cls);}
function tspResetAll(){
  if(_vizTSPTimer)clearTimeout(_vizTSPTimer);_vizTSPTimer=null;_vizTSPRunning=false;
  _vizTSPSteps=[];_vizTSPIdx=0;_vizTSPTreeNodes=[];_vizTSPBestCost=Infinity;_vizTSPBestPath=[];
  _vizTSPNodeCnt=0;_vizTSPPruned=0;
  vizBumpStat('tsp-stat-nodes',0);vizBumpStat('tsp-stat-pruned',0);vizBumpStat('tsp-stat-best','∞');
  var bb=document.getElementById('tsp-best-bar');if(bb)bb.style.display='none';
  vizClearLog('tsp-log');tspDrawGraphCanvas();tspDrawTreeCanvas();
}
function tspGenMatrix(){
  var n=Math.max(3,Math.min(5,parseInt(document.getElementById('tsp-n-in').value)||4));
  _vizTSPN=n;_vizTSPMatrix=[];
  for(var i=0;i<n;i++){_vizTSPMatrix.push([]);for(var j=0;j<n;j++)_vizTSPMatrix[i].push(i===j?0:Math.floor(Math.random()*20)+2);}
  tspRenderMatrix();tspLog('Generated '+n+'×'+n+' random cost matrix.','ok');
  tspDrawGraphCanvas();
}
function tspRenderMatrix(){
  var n=_vizTSPN,mat=_vizTSPMatrix;
  if(!n)return;
  var html='<table style="border-collapse:collapse;font-family:JetBrains Mono,monospace;font-size:11px"><tr><th style="padding:3px 6px;background:#0d1526;color:#60a5fa"></th>';
  for(var j=0;j<n;j++)html+='<th style="padding:3px 6px;background:#0d1526;color:#60a5fa">C'+j+'</th>';
  html+='</tr>';
  for(var i=0;i<n;i++){
    html+='<tr><th style="padding:3px 6px;background:#0d1526;color:#60a5fa">C'+i+'</th>';
    for(var j=0;j<n;j++){
      var isZero=mat[i][j]===0;
      html+='<td style="padding:3px 8px;border:1px solid rgba(255,255,255,.06);text-align:center;'+(isZero?'color:#475569;':'color:#e2e8f0;')+'">'+(isZero?'∞':mat[i][j])+'</td>';
    }
    html+='</tr>';
  }
  html+='</table>';
  var mw=document.getElementById('tsp-matrix-wrap');if(mw)mw.innerHTML=html;
}
function tspBuildSteps(){
  if(!_vizTSPN){showToast('Generate matrix first');return;}
  tspResetAll();
  var n=_vizTSPN,mat=_vizTSPMatrix,steps=[],nodeId=0,bestCost=Infinity,bestPath=[];
  var strategy=document.getElementById('tsp-strategy').value;
  // Branch and bound with DFS-style recursion
  function lb(path){
    var cost=0;
    for(var i=0;i<path.length-1;i++)cost+=mat[path[i]][path[i+1]];
    // lower bound: add minimum outgoing edge for unvisited
    var visited=new Set(path);
    var last=path[path.length-1];
    var minBack=Infinity;
    for(var j=0;j<n;j++)if(!visited.has(j)&&mat[last][j]>0&&mat[last][j]<minBack)minBack=mat[last][j];
    if(path.length<n)cost+=minBack;
    return cost;
  }
  function solve(path,visited,cost,parentId){
    var myId=nodeId++;
    var lbVal=lb(path);
    var pruned=lbVal>=bestCost;
    steps.push({type:'expand',nodeId:myId,parentId:parentId,path:[].concat(path),cost:cost,lb:lbVal,pruned:pruned,
      msg:pruned?'PRUNE node '+myId+': LB='+lbVal+'≥ best='+bestCost:'Explore: '+path.join('→')+' cost='+cost+' LB='+lbVal,
      cls:pruned?'swp':'cmp'});
    if(pruned)return;
    if(path.length===n){
      var total=cost+mat[path[n-1]][path[0]];
      var isNewBest=total<bestCost;
      if(isNewBest){bestCost=total;bestPath=[].concat(path);bestPath.push(path[0]);}
      steps.push({type:'complete',nodeId:myId,path:[].concat(path),cost:total,isNewBest:isNewBest,
        msg:(isNewBest?'★ NEW BEST TOUR: ':'')+path.join('→')+'→C0 cost='+total,
        cls:isNewBest?'ok':'inf'});
      return;
    }
    for(var v=1;v<n;v++){if(!visited.has(v)){visited.add(v);path.push(v);solve(path,visited,cost+mat[path[path.length-2]][v],myId);path.pop();visited.delete(v);}}
  }
  solve([0],new Set([0]),0,-1);
  steps.push({type:'all_done',bestCost:bestCost,bestPath:[].concat(bestPath),msg:'B&B complete! Best tour: '+bestPath.join('→')+' cost='+bestCost});
  _vizTSPSteps=steps;_vizTSPIdx=0;
  tspLog(n+' cities, '+steps.length+' steps. Click Play!','inf');
}
function tspApplyStep(st){
  if(st.type==='expand'){
    _vizTSPNodeCnt++;if(st.pruned)_vizTSPPruned++;
    _vizTSPTreeNodes.push({id:st.nodeId,parent:st.parentId,path:st.path,cost:st.cost,lb:st.lb,pruned:st.pruned,state:st.pruned?'pruned':'exploring'});
    vizBumpStat('tsp-stat-nodes',_vizTSPNodeCnt);vizBumpStat('tsp-stat-pruned',_vizTSPPruned);
    tspLog(st.msg,st.cls);
  } else if(st.type==='complete'){
    if(st.isNewBest){
      _vizTSPBestCost=st.cost;_vizTSPBestPath=st.path.concat([st.path[0]]);
      vizBumpStat('tsp-stat-best',st.cost);
      var bb=document.getElementById('tsp-best-bar');
      if(bb){bb.style.display='block';bb.textContent='★ NEW BEST: '+st.path.join('→')+'→C0 = '+st.cost;bb.style.animation='vizLogFade .3s ease';}
      var node=_vizTSPTreeNodes[_vizTSPTreeNodes.length-1];if(node)node.state='solution';
      tspDrawGraphCanvas();
    }
    tspLog(st.msg,st.cls);
  } else if(st.type==='all_done'){
    tspLog(st.msg,'ok');launchConfetti();showToast('Optimal: '+st.bestPath.join('→')+' = '+st.bestCost,'success');
  }
  tspDrawTreeCanvas();
}
function tspPlay(){
  if(_vizTSPRunning)return;
  if(!_vizTSPSteps.length){showToast('Build steps first');return;}
  _vizTSPRunning=true;
  function tick(){
    if(!_vizTSPRunning||_vizTSPIdx>=_vizTSPSteps.length){_vizTSPRunning=false;return;}
    tspApplyStep(_vizTSPSteps[_vizTSPIdx++]);
    _vizTSPTimer=setTimeout(tick,vizSpeedMs('tsp-speed'));
  }
  tick();
}
function tspPause(){_vizTSPRunning=false;if(_vizTSPTimer)clearTimeout(_vizTSPTimer);}
function tspStep(){if(_vizTSPIdx>=_vizTSPSteps.length){showToast('Done');return;}tspApplyStep(_vizTSPSteps[_vizTSPIdx++]);}
function tspDrawGraphCanvas(){
  var canvas=document.getElementById('tsp-graph-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||300;canvas.height=180;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  var n=_vizTSPN,mat=_vizTSPMatrix;
  if(!n){ctx.fillStyle='#475569';ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Generate matrix first',W/2,H/2);return;}
  var R=16,cx=W/2,cy=H/2,rad=Math.min(W,H)/2-30;
  var pos=Array.from({length:n},function(_,i){var a=i/n*Math.PI*2-Math.PI/2;return{x:cx+rad*Math.cos(a),y:cy+rad*Math.sin(a)};});
  // all edges faint
  for(var i=0;i<n;i++)for(var j=i+1;j<n;j++){ctx.strokeStyle='rgba(148,163,184,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pos[i].x,pos[i].y);ctx.lineTo(pos[j].x,pos[j].y);ctx.stroke();}
  // best path
  if(_vizTSPBestPath.length>1){
    ctx.strokeStyle='#34d399';ctx.lineWidth=2.5;ctx.shadowColor='#34d399';ctx.shadowBlur=8;
    for(var i=0;i<_vizTSPBestPath.length-1;i++){var a=pos[_vizTSPBestPath[i]],b=pos[_vizTSPBestPath[i+1]];if(a&&b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    ctx.shadowBlur=0;
  }
  // nodes
  for(var i=0;i<n;i++){
    var p=pos[i],inBest=_vizTSPBestPath.includes(i);
    ctx.shadowColor=inBest?'#34d399':'#3b82f6';ctx.shadowBlur=inBest?10:4;
    ctx.fillStyle=inBest?'rgba(52,211,153,.25)':'rgba(59,130,246,.2)';ctx.strokeStyle=inBest?'#34d399':'#3b82f6';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('C'+i,p.x,p.y);
  }
}
function tspDrawTreeCanvas(){
  var canvas=document.getElementById('tsp-tree-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||340;canvas.height=360;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  if(!_vizTSPTreeNodes.length){ctx.fillStyle='#475569';ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('B&B search tree',W/2,H/2);return;}
  var nodes=_vizTSPTreeNodes.slice(0,60);
  var maxLv=0;nodes.forEach(function(n){if(n.path.length>maxLv)maxLv=n.path.length;});
  var lvH=(H-20)/(maxLv+1),nw=58,nh=38;
  var levelNodes={};nodes.forEach(function(n){var lv=n.path.length-1;levelNodes[lv]=levelNodes[lv]||[];levelNodes[lv].push(n);});
  var nodePos={};
  Object.keys(levelNodes).forEach(function(lv){
    var lvN=levelNodes[lv],cnt=lvN.length;
    lvN.forEach(function(n,i){nodePos[n.id]={x:(i+.5)/cnt*(W-10)+5,y:18+parseInt(lv)*lvH};});
  });
  // edges
  nodes.forEach(function(n){
    if(n.parent>=0&&nodePos[n.parent]&&nodePos[n.id]){
      var pp=nodePos[n.parent],cp=nodePos[n.id];
      ctx.strokeStyle=n.pruned?'rgba(239,68,68,.3)':'rgba(148,163,184,.2)';ctx.setLineDash(n.pruned?[3,3]:[]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(cp.x,cp.y);ctx.stroke();ctx.setLineDash([]);
    }
  });
  // node cards
  nodes.forEach(function(n){
    var p=nodePos[n.id];if(!p)return;
    var col=n.state==='solution'?'#10b981':n.pruned?'#ef4444':n.state==='exploring'?'#f59e0b':'#475569';
    ctx.shadowColor=col;ctx.shadowBlur=n.state==='solution'?14:n.state==='exploring'?8:2;
    ctx.fillStyle=col+'25';ctx.strokeStyle=col;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(p.x-nw/2,p.y-nh/2,nw,nh,5);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#e2e8f0';ctx.font='bold 8px JetBrains Mono';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText(n.path.join('→'),p.x,p.y-nh/2+3);
    ctx.fillStyle='#f59e0b';ctx.font='8px JetBrains Mono';
    ctx.fillText('LB='+n.lb,p.x,p.y-nh/2+13);
    if(n.pruned){ctx.fillStyle='#ef4444';ctx.font='bold 8px JetBrains Mono';ctx.fillText('PRUNED',p.x,p.y-nh/2+23);}
    else if(n.state==='solution'){ctx.fillStyle='#10b981';ctx.font='bold 8px JetBrains Mono';ctx.fillText('★BEST',p.x,p.y-nh/2+23);}
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 32: RADIX / COUNTING SORT
// ─────────────────────────────────────────────────────────────────────────────
var _vizRadixSteps=[],_vizRadixIdx=0,_vizRadixTimer=null,_vizRadixRunning=false;
var _vizRadixArr=[],_vizRadixMode='radix';
var _vizRadixPassNum=0,_vizRadixStepNum=0;

function radixTabSwitch(tab,el){
  ['radix','counting'].forEach(function(t){var d=document.getElementById('radix-tab-'+t);if(d)d.style.display=t===tab?'':'none';});
  document.querySelectorAll('#tool-32 .viz-tab').forEach(function(b){b.classList.remove('active');});
  if(el)el.classList.add('active');_vizRadixMode=tab;
}
function radixLog(msg,cls){vizLog('radix-log',msg,cls);}
function radixResetAll(){
  if(_vizRadixTimer)clearTimeout(_vizRadixTimer);_vizRadixTimer=null;_vizRadixRunning=false;
  _vizRadixSteps=[];_vizRadixIdx=0;_vizRadixArr=[];_vizRadixPassNum=0;_vizRadixStepNum=0;
  vizBumpStat('radix-stat-pass',0);vizBumpStat('radix-stat-step',0);
  var pb=document.getElementById('radix-pass-banner');if(pb)pb.style.display='none';
  var bs=document.getElementById('radix-buckets-section');if(bs)bs.style.display='none';
  var cp=document.getElementById('counting-panels');if(cp)cp.innerHTML='';
  vizClearLog('radix-log');radixDrawCanvas([]);
  radixRenderCards([],[]);
}
function countingResetAll(){radixResetAll();}
function radixBuildSteps(){
  var raw=document.getElementById('radix-in').value;
  var arr=raw.split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x)&&x>=0;});
  if(arr.length<2){showToast('Enter 2+ non-negative integers');return;}
  radixResetAll();_vizRadixArr=[].concat(arr);_vizRadixMode='radix';
  var max=Math.max.apply(null,arr),steps=[],pass=0;
  steps.push({type:'init',arr:[].concat(arr),msg:'Radix Sort (LSD) on ['+arr.join(',')+'], max='+max});
  for(var exp=1;Math.floor(max/exp)>0;exp*=10){
    var digitPos=Math.log10(exp).toFixed(0);
    steps.push({type:'pass_start',pass:pass,exp:exp,arr:[].concat(arr),msg:'Pass '+(pass+1)+': Sort by 10^'+digitPos+' digit ('+['units','tens','hundreds','thousands'][pass]+' place)'});
    var buckets=Array.from({length:10},function(){return [];});
    var a=[].concat(arr);
    a.forEach(function(v){var d=Math.floor(v/exp)%10;buckets[d].push(v);steps.push({type:'place',v:v,digit:d,bucket:d,exp:exp,pass:pass,buckets:buckets.map(function(b){return [].concat(b);}),msg:'Place '+v+': digit='+d+' → bucket['+d+']'});});
    steps.push({type:'show_buckets',pass:pass,exp:exp,buckets:buckets.map(function(b){return [].concat(b);}),msg:'Buckets after placing all elements'});
    var newArr=[];for(var d=0;d<10;d++)newArr=newArr.concat(buckets[d]);
    arr=[].concat(newArr);
    steps.push({type:'collect',pass:pass,arr:[].concat(arr),msg:'Collect from buckets: ['+arr.join(',')+']'});
    pass++;
  }
  steps.push({type:'sort_done',arr:[].concat(arr),msg:'Sorted: ['+arr.join(',')+']'});
  _vizRadixSteps=steps;_vizRadixIdx=0;
  radixRenderCards(arr,[]);
  radixLog(arr.length+' elements, '+pass+' passes needed. Click Play!','inf');
}
function countingBuildSteps(){
  var raw=document.getElementById('counting-in').value;
  var arr=raw.split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x)&&x>=0;});
  if(arr.length<2){showToast('Enter 2+ non-negative integers');return;}
  radixResetAll();_vizRadixArr=[].concat(arr);_vizRadixMode='counting';
  var max=Math.max.apply(null,arr),steps=[],count=new Array(max+1).fill(0);
  steps.push({type:'init',arr:[].concat(arr),msg:'Counting Sort on ['+arr.join(',')+'], max='+max});
  arr.forEach(function(v,i){count[v]++;steps.push({type:'count',arr:[].concat(arr),count:[].concat(count),idx:i,v:v,msg:'Count A['+i+']='+v+': count['+v+']='+count[v]});});
  steps.push({type:'phase',msg:'Phase 1 complete. Count: ['+count.join(',')+']'});
  var cumCount=[].concat(count);
  for(var i=1;i<=max;i++){cumCount[i]+=cumCount[i-1];steps.push({type:'cumulative',count:[].concat(cumCount),i:i,msg:'Cumulative['+i+']='+cumCount[i-1-1||0]+'+'+count[i]+'='+cumCount[i]});}
  steps.push({type:'phase',msg:'Phase 2 complete. Cumulative: ['+cumCount.slice(0,Math.min(cumCount.length,12)).join(',')+']'});
  var output=new Array(arr.length);
  for(var i=arr.length-1;i>=0;i--){var v=arr[i];cumCount[v]--;output[cumCount[v]]=v;steps.push({type:'place',idx:i,v:v,pos:cumCount[v],output:[].concat(output).map(function(x){return x===undefined?'_':x;}),msg:'Place A['+i+']='+v+' at output['+cumCount[v]+']'});}
  steps.push({type:'sort_done',arr:[].concat(output),msg:'Sorted: ['+output.join(',')+']'});
  _vizRadixSteps=steps;_vizRadixIdx=0;
  radixLog(arr.length+' elements, max='+max+'. Click Play!','inf');
}
function radixApplyStep(st){
  _vizRadixStepNum++;vizBumpStat('radix-stat-step',_vizRadixStepNum);
  var pb=document.getElementById('radix-pass-banner');
  if(st.type==='init'){radixRenderCards(st.arr,[]);radixDrawCanvas(st.arr);radixLog(st.msg,'inf');}
  else if(st.type==='pass_start'){
    _vizRadixPassNum++;vizBumpStat('radix-stat-pass',_vizRadixPassNum);
    if(pb){pb.style.display='block';pb.textContent=st.msg;}
    var bs=document.getElementById('radix-buckets-section');if(bs)bs.style.display='block';
    radixLog(st.msg,'cmp');
  } else if(st.type==='place'){
    radixRenderCards(st.arr||_vizRadixArr,[st.v]);
    if(st.buckets)radixRenderBuckets(st.buckets,st.exp);
    radixLog(st.msg,'cmp');
  } else if(st.type==='show_buckets'){
    if(st.buckets)radixRenderBuckets(st.buckets,st.exp);
    radixLog(st.msg,'inf');
  } else if(st.type==='collect'){
    _vizRadixArr=[].concat(st.arr);radixRenderCards(st.arr,[]);radixDrawCanvas(st.arr);
    var bs=document.getElementById('radix-buckets-section');if(bs)bs.style.display='none';
    radixLog(st.msg,'ok');
  } else if(st.type==='count'||st.type==='cumulative'||st.type==='phase'){
    radixLog(st.msg,st.type==='phase'?'ok':'cmp');
    // render counting panels inline
    var cp=document.getElementById('counting-panels');
    if(cp&&st.count){cp.innerHTML=radixCountingPanel(st.arr||_vizRadixArr,st.count,st.type==='cumulative');}
  } else if(st.type==='sort_done'){
    _vizRadixArr=[].concat(st.arr);radixRenderCards(st.arr.map(function(v){return{v:v,sorted:true};}),null,true);radixDrawCanvas(st.arr);
    if(pb)pb.style.display='none';
    radixLog(st.msg,'ok');launchConfetti();showToast('Sorted: ['+st.arr.join(',')+']','success');
  } else radixLog(st.msg,'inf');
}
function radixCountingPanel(arr,count,isCumulative){
  var html='<div style="margin:8px 0"><div style="font-size:10px;color:#64748b;margin-bottom:4px">'+(isCumulative?'Cumulative Count':'Count Array')+'</div><div style="display:flex;flex-wrap:wrap;gap:3px">';
  count.forEach(function(v,i){
    html+='<div style="text-align:center;min-width:28px"><div style="font-size:9px;color:#64748b">'+i+'</div><div style="background:#0d1526;border:1px solid '+(v>0?'rgba(96,165,250,.4)':'rgba(255,255,255,.06)')+';border-radius:4px;padding:2px 4px;color:'+(v>0?'#60a5fa':'#475569')+';font-family:JetBrains Mono,monospace;font-size:11px">'+v+'</div></div>';
  });
  html+='</div></div>';
  return html;
}
function radixRenderCards(arr,activeVals,allSorted){
  var row=document.getElementById('radix-cards-row');if(!row)return;
  row.innerHTML='';
  if(!arr||!arr.length)return;
  arr.forEach(function(item){
    var v=typeof item==='object'?item.v:item;
    var isSorted=allSorted||(typeof item==='object'&&item.sorted);
    var isActive=activeVals&&activeVals.includes(v);
    var el=document.createElement('div');
    el.className='viz-card-elem'+(isActive?' viz-card-active':isSorted?' viz-card-sorted':'');
    var valSpan=document.createElement('span');valSpan.className='viz-card-val';valSpan.textContent=v;
    el.appendChild(valSpan);row.appendChild(el);
  });
}
function radixRenderBuckets(buckets,exp){
  var row=document.getElementById('radix-buckets-row');if(!row)return;
  row.innerHTML='';
  buckets.forEach(function(bkt,d){
    var col=document.createElement('div');col.className='viz-bucket-col';
    bkt.forEach(function(v){var item=document.createElement('div');item.className='viz-card-elem viz-card-bucket';item.style.cssText='width:40px;height:36px;margin:1px;font-size:12px';item.innerHTML='<span class="viz-card-val" style="font-size:12px">'+v+'</span>';col.appendChild(item);});
    var lbl=document.createElement('div');lbl.className='viz-bucket-label';lbl.textContent=d;col.appendChild(lbl);
    row.appendChild(col);
  });
}
function radixDrawCanvas(arr){
  var canvas=document.getElementById('radix-canvas');if(!canvas)return;
  canvas.width=canvas.parentElement.clientWidth||700;canvas.height=160;
  var ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060d1a';ctx.fillRect(0,0,W,H);
  if(!arr||!arr.length)return;
  var max=Math.max.apply(null,arr)||1,n=arr.length,bw=Math.max(4,(W-n*3)/n),floorY=H-20;
  for(var i=0;i<n;i++){
    var x=i*(bw+3)+2,bh=Math.max(4,(arr[i]/max)*(floorY-15)),y=floorY-bh;
    var g=ctx.createLinearGradient(x,y+bh,x,y);g.addColorStop(0,'#34d399');g.addColorStop(1,'#60a5fa');
    ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,bw,bh,3);ctx.fill();
    if(n<=20){ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='bold '+Math.min(10,bw)+'px JetBrains Mono';ctx.textAlign='center';ctx.fillText(arr[i],x+bw/2,y-3);}
  }
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,floorY);ctx.lineTo(W,floorY);ctx.stroke();
}
function radixPlay(){
  if(_vizRadixRunning)return;
  if(!_vizRadixSteps.length){showToast('Build steps first');return;}
  _vizRadixRunning=true;
  function tick(){
    if(!_vizRadixRunning||_vizRadixIdx>=_vizRadixSteps.length){_vizRadixRunning=false;return;}
    radixApplyStep(_vizRadixSteps[_vizRadixIdx++]);
    _vizRadixTimer=setTimeout(tick,vizSpeedMs('radix-speed'));
  }
  tick();
}
function radixPause(){_vizRadixRunning=false;if(_vizRadixTimer)clearTimeout(_vizRadixTimer);}
function radixStep(){if(_vizRadixIdx>=_vizRadixSteps.length){showToast('Done');return;}radixApplyStep(_vizRadixSteps[_vizRadixIdx++]);}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 33: NP THEORY
// ─────────────────────────────────────────────────────────────────────────────
var _vizNPPNP=false,_vizNPQuizScore=0,_vizNPQuizIdx=0;
var _vizNPQuizData=[
  {q:'Which problem is in class P (polynomial time)?',opts:['A) SAT','B) Merge Sort','C) Clique','D) TSP (Decision)'],ans:1,exp:'Merge Sort runs in O(n log n) — clearly polynomial. SAT, Clique, TSP are NP-Complete.'},
  {q:'What does "NP" stand for?',opts:['A) Non-Polynomial','B) Not Polynomial','C) Nondeterministic Polynomial','D) Negative Polynomial'],ans:2,exp:'NP = Nondeterministic Polynomial time. Problems verifiable in polynomial time.'},
  {q:'Cook\'s theorem (1971) proved which problem is NP-Complete first?',opts:['A) Clique','B) TSP','C) SAT','D) Hamiltonian Cycle'],ans:2,exp:'Cook proved SAT is NP-Complete. All other NPC proofs reduce FROM SAT.'},
  {q:'If you find a polynomial algorithm for any NPC problem, then:',opts:['A) Only that problem is in P','B) P = NP (all NP problems become P)','C) Nothing changes','D) NP-Hard = NP'],ans:1,exp:'Since all NPC problems reduce to each other in poly time, solving one solves all → P = NP.'},
  {q:'Which is NOT NP-Complete?',opts:['A) 3-SAT','B) Vertex Cover','C) Dijkstra\'s problem','D) Subset Sum'],ans:2,exp:'Dijkstra solves shortest paths in O(E log V) — it is in P, not NP-Complete.'}
];
var _vizNPReduceInfo={
  'SAT':'SAT: Any Boolean formula in CNF. Is there an assignment making it TRUE? NPC since Cook (1971).',
  '3-SAT':'3-SAT: SAT where every clause has exactly 3 literals. SAT ≤ₚ 3-SAT via clause expansion.',
  'Clique':'Clique: Does G contain a clique of size ≥ k? 3-SAT ≤ₚ Clique by creating variable/clause gadgets.',
  'Vertex Cover':'Vertex Cover: ≤ k vertices touching all edges? Clique ≤ₚ Vertex Cover (complement relationship).',
  'Subset Sum':'Subset Sum: Does subset sum to t? Vertex Cover ≤ₚ Subset Sum by number gadgets.',
  '0/1 Knapsack':'0/1 Knapsack: Value ≥ V, weight ≤ W? Subset Sum ≤ₚ Knapsack. Pseudo-poly DP does NOT make it polynomial.',
  'Ham. Cycle':'Hamiltonian Cycle: Visit every vertex exactly once. 3-SAT ≤ₚ Ham. Cycle via complex gadgets.',
  'TSP (Dec)':'TSP Decision: Min-cost Hamiltonian cycle ≤ k? Ham. Cycle ≤ₚ TSP (set all costs to 1).'
};

function npBadgeClick(name,desc,from,howFrom){
  var card=document.getElementById('np-info-card');var cont=document.getElementById('np-info-content');
  if(!card||!cont)return;
  document.querySelectorAll('.viz-np-badge').forEach(function(b){b.classList.remove('active-np');});
  card.style.display='block';card.style.animation='vizLogFade .3s ease';
  var isNPC=from&&from!=='—';
  cont.innerHTML='<div style="font-size:14px;font-weight:800;color:#f59e0b;margin-bottom:6px">'+name+'</div>'
    +'<div style="font-size:12px;color:#94a3b8;line-height:1.8;margin-bottom:8px">'+desc+'</div>'
    +(isNPC?'<div style="font-size:11px;color:#60a5fa"><strong>Proved NPC via reduction:</strong> '+howFrom+'</div>':'')
    +'<div style="margin-top:8px;font-size:10px;color:#64748b">Click any other badge to explore more.</div>';
  vizLog('np-log',name+': '+desc.substring(0,80)+'…','ok');
}
function npTogglePNP(){
  _vizNPPNP=!_vizNPPNP;
  var oval=document.getElementById('np-oval');
  var pCircle=document.getElementById('np-p-circle');
  var btn=document.getElementById('np-pnp-btn');
  var overlay=document.getElementById('np-pnp-overlay')||null;
  if(_vizNPPNP){
    if(pCircle){pCircle.style.width='100%';pCircle.style.borderRadius='50%';pCircle.style.background='rgba(16,185,129,.12)';}
    if(btn)btn.textContent='↺ Undo P = NP';
    showToast('P = NP! Cryptography breaks. AI is solved.','success');
    vizLog('np-log','IF P = NP: every NP-Complete problem becomes polynomial! RSA breaks. AI achieves optimal solutions.','ok');
    // Show overlay
    var univ=document.getElementById('np-universe');
    if(univ){
      var ov=document.createElement('div');ov.id='np-pnp-anim-overlay';
      ov.style.cssText='position:absolute;inset:0;background:rgba(16,185,129,.1);border:2px solid rgba(16,185,129,.5);border-radius:14px;display:flex;align-items:center;justify-content:center;z-index:10;animation:vizLogFade .5s ease';
      ov.innerHTML='<div style="background:#060d1a;border:2px solid #10b981;border-radius:12px;padding:20px;max-width:380px;text-align:center;color:#10b981"><div style="font-size:18px;margin-bottom:8px;font-weight:900">P = NP</div><div style="font-size:12px;line-height:1.8">All NP-Complete → now in P!<br><strong>RSA / AES encryption breaks.</strong><br>Protein folding: O(poly) time.<br>Drug discovery: instant.<br>Optimal AI planning: solved.</div><button class="btn btn-grey btn-sm" onclick="npTogglePNP()" style="margin-top:12px">↺ Undo</button></div>';
      univ.style.position='relative';univ.appendChild(ov);
    }
  } else {
    if(pCircle){pCircle.style.width='';pCircle.style.borderRadius='50%';pCircle.style.background='';}
    if(btn)btn.textContent='If P = NP →';
    var ov=document.getElementById('np-pnp-anim-overlay');if(ov)ov.remove();
    vizLog('np-log','P ≠ NP restored. This is the current scientific consensus (likely true, but unproven).','inf');
  }
}
function npReduceClick(el,name){
  document.querySelectorAll('.viz-reduc-node').forEach(function(n){n.classList.remove('active');});
  el.classList.add('active');
  var info=_vizNPReduceInfo[name]||('Reduction to '+name+': polynomial-time transformation proved this NP-Complete.');
  var ri=document.getElementById('np-reduc-info');if(ri){ri.style.display='block';ri.textContent=info;}
  vizLog('np-log','Reduction: '+info,'ok');
}
function npStartQuiz(){
  _vizNPQuizScore=0;_vizNPQuizIdx=0;
  vizBumpStat('np-stat-score',0);vizBumpStat('np-stat-q','0/5');
  var qs=document.getElementById('np-quiz-section');if(qs)qs.style.display='block';
  npShowQuestion();
}
function npResetQuiz(){_vizNPQuizScore=0;_vizNPQuizIdx=0;vizBumpStat('np-stat-score',0);vizBumpStat('np-stat-q','0/5');var qs=document.getElementById('np-quiz-section');if(qs)qs.style.display='none';}
function npShowQuestion(){
  if(_vizNPQuizIdx>=_vizNPQuizData.length){
    var qd=document.getElementById('np-quiz-q');var qo=document.getElementById('np-quiz-opts');
    if(qd)qd.textContent='Quiz Complete! Score: '+_vizNPQuizScore+'/5';
    if(qo)qo.innerHTML='';
    vizBumpStat('np-stat-q','5/5');
    showToast('Quiz done: '+_vizNPQuizScore+'/5','success');return;
  }
  var q=_vizNPQuizData[_vizNPQuizIdx];
  var qd=document.getElementById('np-quiz-q');var qo=document.getElementById('np-quiz-opts');
  var fb=document.getElementById('np-quiz-feedback');
  if(qd)qd.textContent=(_vizNPQuizIdx+1)+'. '+q.q;
  if(qo){qo.innerHTML='';q.opts.forEach(function(opt,i){var btn=document.createElement('button');btn.className='viz-quiz-opt';btn.textContent=opt;btn.onclick=function(){npAnswerQuiz(i);};qo.appendChild(btn);});}
  if(fb)fb.style.display='none';
  vizBumpStat('np-stat-q',(_vizNPQuizIdx+1)+'/5');
}
function npAnswerQuiz(chosen){
  var q=_vizNPQuizData[_vizNPQuizIdx];
  var fb=document.getElementById('np-quiz-feedback');
  document.querySelectorAll('.viz-quiz-opt').forEach(function(b,i){if(i===q.ans)b.classList.add('correct');else if(i===chosen&&chosen!==q.ans)b.classList.add('wrong');});
  if(chosen===q.ans)_vizNPQuizScore++;
  vizBumpStat('np-stat-score',_vizNPQuizScore);
  if(fb){fb.style.display='block';fb.style.background=chosen===q.ans?'rgba(16,185,129,.15)':'rgba(239,68,68,.1)';fb.style.color=chosen===q.ans?'#10b981':'#ef4444';fb.textContent=(chosen===q.ans?'✓ Correct! ':'✗ Wrong. ')+q.exp;}
  _vizNPQuizIdx++;setTimeout(npShowQuestion,2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCHED showTool — lazy init for tools 24-33
// ─────────────────────────────────────────────────────────────────────────────
(function(){
  var _orig=window.showTool||function(){};
  window.showTool=function(idx){
    _orig(idx);
    if(idx===24){setTimeout(function(){bigoInit();bigoDrawStatic();bigoUpdateTable(1);},80);}
    if(idx===25){setTimeout(function(){heapDrawTree();heapRenderArrRow();},80);}
    if(idx===26){/* handled on demand */}
    if(idx===27){/* handled on demand */}
    if(idx===28){setTimeout(function(){ufDraw();},80);}
    if(idx===29){setTimeout(function(){topoDrawCanvas();},80);}
    if(idx===30){setTimeout(function(){btDrawTree();btDrawState();},80);}
    if(idx===31){setTimeout(function(){tspDrawGraphCanvas();tspDrawTreeCanvas();},80);}
    if(idx===32){setTimeout(function(){radixDrawCanvas([]);},80);}
    if(idx===33){/* NP theory: static HTML */}
  };
})();
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// ADA ALGORITHM LAB — HANDWRITTEN EXAM PDF SYSTEM v4
// Generates realistic GTU practical journal style PDFs
// ══════════════════════════════════════════════════════════════════════════════
var ALGO_META = {
  0: {
    title:'Sorting Algorithms',exp:'Experiment No: 01',
    aim:'To study, implement and compare sorting algorithms: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Heap Sort, Counting Sort, and Bucket Sort.',
    theory:'Sorting arranges elements in a defined order. Comparison-based sorts have a lower bound of O(n log n). Bubble Sort repeatedly swaps adjacent out-of-order elements. Selection Sort finds the minimum and moves it front. Insertion Sort builds a sorted array one element at a time. Merge Sort divides the array in halves, sorts each, and merges — always O(n log n). Heap Sort builds a max-heap and extracts elements — in-place O(n log n). Counting Sort counts element frequencies and reconstructs — O(n+k) for integer range k.',
    algorithm:['Start','Accept input array A of n elements','Choose sorting algorithm','For Bubble Sort: pass through array swapping A[j],A[j+1] if A[j]>A[j+1]; repeat n-1 passes','For Merge Sort: recursively split to halves, sort each, then MERGE sorted halves','For Heap Sort: BUILD_MAX_HEAP then repeatedly extract maximum','Print sorted array','Stop'],
    pseudocode:'BUBBLE_SORT(A,n):\n  for i=0 to n-2:\n    for j=0 to n-2-i:\n      if A[j]>A[j+1]: swap(A[j],A[j+1])\n\nMERGE_SORT(A,lo,hi):\n  if lo<hi:\n    mid=(lo+hi)/2\n    MERGE_SORT(A,lo,mid)\n    MERGE_SORT(A,mid+1,hi)\n    MERGE(A,lo,mid,hi)',
    complexity:{best:'O(n) — Insertion (sorted input)',avg:'O(n log n) — Merge/Heap',worst:'O(n²) — Bubble/Selection',space:'O(1) in-place | O(n) Merge Sort'},
    applications:['Database record sorting','Operating system scheduling','Search engine indexing','E-commerce product ranking'],
    advantages:['Merge Sort: stable, always O(n log n)','Heap Sort: in-place O(n log n)','Insertion Sort efficient for nearly-sorted data','Counting Sort achieves O(n) for bounded integer keys'],
    disadvantages:['Bubble/Selection O(n²) slow for large n','Merge Sort needs O(n) extra space','Quick Sort degrades to O(n²) on sorted input'],
    viva:[
      {q:'Best-case time complexity of Bubble Sort?',a:'O(n) — when array is already sorted. Optimized version detects no swaps in first pass and terminates early.'},
      {q:'Why Merge Sort over Quick Sort for linked lists?',a:'Merge Sort uses sequential access, not random access. Linked lists have O(n) random access so Merge Sort is ideal.'},
      {q:'What is a stable sorting algorithm? Give examples.',a:'Stable sort preserves relative order of equal elements. Examples: Merge Sort, Insertion Sort, Bubble Sort, Counting Sort.'},
      {q:'Lower bound for comparison-based sorting?',a:'Ω(n log n) — decision tree argument: tree with n! leaves has height ≥ log₂(n!).'},
      {q:'When prefer Counting Sort over Merge Sort?',a:'When key range k is small relative to n. Counting Sort O(n+k) beats O(n log n) when k = O(n).'}
    ],
    conclusion:'Comparison-based algorithms achieve optimal O(n log n) in Merge and Heap Sort. Counting Sort O(n) for restricted inputs. Choice depends on stability, memory, and data distribution.',
    paradigm:'Comparison-based / Non-comparison',category:'Sorting'
  },
  1: {
    title:'0/1 Knapsack (Dynamic Programming)',exp:'Experiment No: 02',
    aim:'To solve the 0/1 Knapsack Problem using Dynamic Programming and find the maximum profit without exceeding weight capacity W.',
    theory:'0/1 Knapsack: given n items with weights w[] and values v[], and capacity W, maximize total value. Each item is either included (1) or excluded (0). DP table dp[i][w] = max value using first i items with capacity w. Recurrence: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wᵢ]+vᵢ) if wᵢ≤w, else dp[i-1][w]. Final answer: dp[n][W]. Traceback from dp[n][W] identifies selected items.',
    algorithm:['Start','Accept n items weights w[], values v[], capacity W','Create dp[n+1][W+1] initialized to 0','For i=1 to n: For cap=0 to W:','  If w[i]≤cap: dp[i][cap]=max(dp[i-1][cap], dp[i-1][cap-w[i]]+v[i])','  Else: dp[i][cap]=dp[i-1][cap]','Traceback from dp[n][W] to find selected items','Print max profit = dp[n][W]','Stop'],
    pseudocode:'KNAPSACK_01(w[],v[],n,W):\n  dp[0..n][0..W] = 0\n  for i=1 to n:\n    for cap=0 to W:\n      if w[i]<=cap:\n        dp[i][cap]=max(dp[i-1][cap], dp[i-1][cap-w[i]]+v[i])\n      else:\n        dp[i][cap]=dp[i-1][cap]\n  return dp[n][W]',
    complexity:{best:'O(n·W)',avg:'O(n·W)',worst:'O(n·W)',space:'O(n·W) table | O(W) optimized'},
    applications:['Resource allocation in projects','Memory management in OS','Financial portfolio optimization','Cargo loading in logistics'],
    advantages:['Guarantees optimal solution','Avoids exponential brute-force','DP table enables item traceback','Works for any positive integer weights'],
    disadvantages:['O(n·W) — pseudo-polynomial time','O(n·W) space for full table','Not efficient for very large W'],
    viva:[
      {q:'Why is 0/1 Knapsack called pseudo-polynomial?',a:'Complexity O(n·W) depends on numeric value of W, not its bit-length. Exponential in input size when W is large.'},
      {q:'Difference between 0/1 and Fractional Knapsack?',a:'0/1: item fully included or excluded; Greedy fails, DP required. Fractional: can take portions; Greedy by v/w ratio is optimal.'},
      {q:'How to traceback selected items from DP table?',a:'From dp[n][W]: if dp[i][w]≠dp[i-1][w], item i included. Move to dp[i-1][w-w[i]]. Continue until i=0.'},
      {q:'Can DP table space be optimized to O(W)?',a:'Yes — use 1D array updated right-to-left. dp[cap] = max(dp[cap], dp[cap-w[i]]+v[i]). Eliminates row dimension.'},
      {q:'Is 0/1 Knapsack NP-Hard?',a:'Yes — NP-Complete as a decision problem, NP-Hard as optimization. No truly polynomial algorithm unless P=NP.'}
    ],
    conclusion:'0/1 Knapsack DP achieves O(n·W) time. Guarantees optimal solution via bottom-up table. Traceback identifies selected items. Classic example of optimal substructure + overlapping subproblems.',
    paradigm:'Dynamic Programming',category:'Optimization'
  },
  2: {
    title:"Minimum Spanning Tree (Prim's & Kruskal's)",exp:'Experiment No: 03',
    aim:"To find the Minimum Spanning Tree of a weighted undirected graph using Prim's and Kruskal's algorithms.",
    theory:"MST connects all V vertices with V-1 minimum-weight edges, no cycles. Prim's: grow MST from start vertex, always adding minimum weight edge from tree to non-tree vertex (greedy). Kruskal's: sort all edges by weight, add each if it doesn't create a cycle (Union-Find for detection). Both are greedy algorithms proven optimal by the Cut Property: the minimum weight edge crossing any cut of G belongs to every MST.",
    algorithm:["Start","Accept graph G(V,E) with weights","Prim's: Init MST with start vertex. Repeat V-1 times: add min-weight edge connecting tree to non-tree vertex","Kruskal's: Sort edges by weight. For each edge (u,v,w): if Find(u)≠Find(v), add to MST and Union(u,v)","Print MST edges and total weight","Stop"],
    pseudocode:"PRIM(G,start):\n  key[]=INF; key[start]=0; inMST[]=false\n  for each vertex:\n    u=min key not in MST; inMST[u]=true\n    for (v,w) in adj[u]:\n      if !inMST[v] and w<key[v]: key[v]=w; parent[v]=u\n\nKRUSKAL(G):\n  sort edges by weight\n  for (u,v,w) in edges:\n    if FIND(u)!=FIND(v): MST.add(u,v,w); UNION(u,v)",
    complexity:{best:"O(E log V) — Prim's with heap",avg:"O(E log E) — Kruskal's",worst:"O(V²) — Prim's adjacency matrix",space:'O(V+E)'},
    applications:['Network cable design','Cluster analysis in ML','TSP approximation','Electricity distribution planning'],
    advantages:['Guarantees minimum-weight spanning tree','Kruskal handles disconnected components','Prim efficient for dense graphs'],
    disadvantages:['Only undirected connected graphs','Kruskal sorting adds O(E log E)','Prim with adj matrix is O(V²)'],
    viva:[
      {q:'What is the Cut Property for MST?',a:'The minimum weight edge crossing any cut (partition of V into two sets) belongs to every MST. Proves Prim\'s and Kruskal\'s correctness.'},
      {q:'MST vs Shortest Path Tree difference?',a:'MST: minimizes total of V-1 edge weights. SPT (Dijkstra): minimizes path distance from source. They are generally different trees.'},
      {q:"How does Kruskal's detect cycles?",a:'Using DSU. Before adding edge (u,v), check Find(u)==Find(v). If yes, same component — skip. Else add and Union(u,v).'},
      {q:'Can a graph have multiple MSTs?',a:'Yes, if multiple edges have equal weight. All valid MSTs have the same minimum total weight.'},
      {q:"Boruvka's algorithm?",a:"Repeatedly finds minimum edge for each component, merges components. O(E log V). Parallelizes well."}
    ],
    conclusion:"Prim's and Kruskal's both produce optimal MSTs in O(E log V). Prim's better for dense graphs; Kruskal's for sparse. Both use greedy strategy proven optimal by Cut Property.",
    paradigm:'Greedy',category:'Graph Algorithms'
  },
  3: {
    title:'Longest Common Subsequence (LCS)',exp:'Experiment No: 04',
    aim:'To find the Longest Common Subsequence of two strings using Dynamic Programming.',
    theory:'LCS is the longest sequence present in both strings (elements need not be contiguous). DP: dp[i][j]=dp[i-1][j-1]+1 if X[i]=Y[j], else max(dp[i-1][j],dp[i][j-1]). dp[m][n]=LCS length. Traceback: start at dp[m][n]; when X[i]=Y[j] include character and move diagonally. LCS is used in diff tools, DNA alignment, version control.',
    algorithm:['Start','Accept strings X(length m) and Y(length n)','Initialize dp[0..m][0..n]=0','For i=1 to m, j=1 to n: If X[i-1]=Y[j-1]: dp[i][j]=dp[i-1][j-1]+1, Else: dp[i][j]=max(dp[i-1][j],dp[i][j-1])','Traceback from dp[m][n] to reconstruct LCS string','Print LCS string and length','Stop'],
    pseudocode:'LCS(X,Y,m,n):\n  dp[0..m][0..n]=0\n  for i=1 to m:\n    for j=1 to n:\n      if X[i-1]==Y[j-1]: dp[i][j]=dp[i-1][j-1]+1\n      else: dp[i][j]=max(dp[i-1][j],dp[i][j-1])\n  return dp[m][n]',
    complexity:{best:'O(m·n)',avg:'O(m·n)',worst:'O(m·n)',space:'O(m·n) DP table'},
    applications:['File diff/git comparison','DNA sequence alignment','Spell checking','Plagiarism detection'],
    advantages:['Optimal solution guaranteed','Avoids exponential recursive computation','Traceback gives actual LCS string','Applicable to any alphabet'],
    disadvantages:['O(m·n) space costly for very long strings','Multiple LCS may exist','Not suitable for real-time comparison'],
    viva:[
      {q:'LCS vs LCS Substring?',a:'LCS: non-contiguous elements allowed. LCS Substring: contiguous required. "ABCBDAB" and "BDCAB": LCS="BCAB"(4), Substring="AB"(2).'},
      {q:'How does space reduce to O(n)?',a:'dp[i][j] depends only on dp[i-1][j-1], dp[i-1][j], dp[i][j-1] — only 2 rows needed. But traceback is lost with this optimization.'},
      {q:'LCS for 3 strings?',a:'Extend to 3D DP: dp[i][j][k]=LCS(X[1..i],Y[1..j],Z[1..k]). O(m·n·p) time and space.'},
      {q:'Relation between LCS and Edit Distance?',a:'Edit Distance (insertions/deletions only) = m+n-2×LCS(X,Y). With substitutions allowed, it differs.'},
      {q:'Why is LCS useful in bioinformatics?',a:'DNA/protein sequences share common subsequences representing conserved regions. LCS length measures similarity for alignment.'}
    ],
    conclusion:'LCS DP solves core string problem in O(m·n) time and space. Table enables traceback. Applications: version control, bioinformatics, NLP.',
    paradigm:'Dynamic Programming',category:'String Algorithms'
  },
  4: {
    title:'Binary Search',exp:'Experiment No: 05',
    aim:'To search for a target element in a sorted array using Binary Search and determine its index.',
    theory:'Binary Search works on sorted arrays. Compare target with middle element: if equal found; if target smaller search left half; if larger search right half. Halves search space each step: O(log n). Precondition: array must be sorted. Iterative: O(1) space. Recursive: O(log n) stack space. For n=10⁹ needs only 30 comparisons.',
    algorithm:['Start','Accept sorted array A[0..n-1] and target T','Set low=0, high=n-1','While low≤high: mid=(low+high)/2','  If A[mid]=T: return mid (found)','  If A[mid]<T: low=mid+1','  Else: high=mid-1','Return -1 (not found)','Stop'],
    pseudocode:'BINARY_SEARCH(A,n,target):\n  low=0; high=n-1\n  while low<=high:\n    mid=(low+high)/2\n    if A[mid]==target: return mid\n    else if A[mid]<target: low=mid+1\n    else: high=mid-1\n  return -1',
    complexity:{best:'O(1) — target at middle',avg:'O(log n)',worst:'O(log n)',space:'O(1) iterative | O(log n) recursive'},
    applications:['Database indexing','Dictionary lookup','Finding insertion point','Game: guess-the-number'],
    advantages:['Exponentially faster than linear search','Simple to implement','Works on any sorted comparable data'],
    disadvantages:['Requires sorted array','Not for unsorted or frequently updated data','Requires random access — not for linked lists'],
    viva:[
      {q:'What if array is not sorted?',a:'Binary Search gives incorrect results on unsorted data — may incorrectly eliminate halves containing the target.'},
      {q:'Bug in mid=(low+high)/2?',a:'Integer overflow when low+high > INT_MAX. Fix: mid=low+(high-low)/2. Same result without overflow.'},
      {q:'Comparisons for n=1000?',a:'At most ⌈log₂(1001)⌉=10 comparisons. For n=10⁹: only 30 comparisons!'},
      {q:'Binary Search on Answer?',a:'Apply BS to the answer space, not array. E.g., find minimum speed to finish tasks: BS over speed [1..max], check feasibility in O(n).'},
      {q:'Exponential Search?',a:'Find range [2^k, 2^(k+1)] containing target by doubling k. Then Binary Search in that range. Useful for unbounded/unknown-size arrays.'}
    ],
    conclusion:'Binary Search achieves O(log n) on sorted arrays. Divide-and-conquer halving is a reusable pattern. Foundation for many advanced algorithms.',
    paradigm:'Divide and Conquer',category:'Searching'
  },
  5: {
    title:'Rabin-Karp String Matching',exp:'Experiment No: 06',
    aim:'To search for pattern P in text T using Rabin-Karp rolling hash algorithm and identify all match positions.',
    theory:'Rabin-Karp uses hashing for pattern matching. Compute H(P) once. Slide window of size m over text computing H(T[s..s+m-1]). Hash match → verify character by character (avoids spurious hits). Rolling hash: H(s+1)=(d·(H(s)−T[s]·d^(m-1))+T[s+m]) mod q — O(1) per slide. Average O(n+m); worst O(nm) due to collisions.',
    algorithm:['Start','Accept text T(length n), pattern P(length m), base d, modulus q','Compute pattern hash H(P) and initial window hash H(T[0..m-1])','For s=0 to n-m:','  If H(P)=H(T[s..s+m-1]): verify character-by-character','  If match confirmed: record position s','  Update rolling hash for next window','Print all match positions','Stop'],
    pseudocode:'RABIN_KARP(T,P,d,q):\n  n=len(T);m=len(P);h=d^(m-1) mod q\n  hp=ht=0\n  for i=0 to m-1: hp=(d*hp+P[i])%q; ht=(d*ht+T[i])%q\n  for s=0 to n-m:\n    if hp==ht and T[s..s+m-1]==P: output s\n    if s<n-m: ht=(d*(ht-T[s]*h)+T[s+m])%q',
    complexity:{best:'O(n+m)',avg:'O(n+m)',worst:'O(nm) — many collisions',space:'O(1)'},
    applications:['Plagiarism detection','Multiple pattern search','Intrusion detection','DNA sequence matching'],
    advantages:['O(n+m) average','Easily extended to multi-pattern','Rolling hash O(1) per slide'],
    disadvantages:['Worst case O(nm) on many collisions','Requires good hash + prime modulus','More complex than KMP'],
    viva:[
      {q:'What is a spurious hit?',a:'Hash of window equals pattern hash but characters differ — false alarm due to collision. Verification step removes it.'},
      {q:'Why prime modulus?',a:'Prime reduces collisions by distributing hash values more uniformly.'},
      {q:'Multi-pattern extension?',a:'Store all pattern hashes in hash set. Window hash matches any → verify. O((n+m)k) for k patterns.'},
      {q:'Compare with KMP?',a:'KMP: O(n+m) worst case, no collisions, single pattern. Rabin-Karp: O(nm) worst, simpler, better for multiple patterns.'},
      {q:'Rolling hash formula efficiency?',a:'H(s+1)=(d·(H(s)−T[s]·h)+T[s+m]) mod q. Removes leftmost char, adds new char in O(1) vs O(m) recompute.'}
    ],
    conclusion:'Rabin-Karp uses rolling hash for O(n+m) average matching. Excellent for multiple pattern search. Verification step handles hash collisions.',
    paradigm:'Hashing',category:'String Algorithms'
  },
  6: {
    title:'Quick Sort',exp:'Experiment No: 07',
    aim:'To sort an array using Quick Sort with Lomuto partition scheme and analyze its complexity cases.',
    theory:'Quick Sort is divide-and-conquer: select pivot (last element), partition into ≤pivot (left) and >pivot (right), recursively sort partitions. Lomuto: index i tracks ≤pivot boundary; swap when A[j]≤pivot. After partition, pivot in final position. Average O(n log n). Worst O(n²) on sorted/reverse-sorted. Median-of-three pivot avoids worst case. Cache-friendly, in-place.',
    algorithm:['Start','Accept array A[lo..hi]','If lo≥hi: return (base case)','PARTITION: pivot=A[hi], i=lo-1','For j=lo to hi-1: if A[j]≤pivot: i++, swap(A[i],A[j])','swap(A[i+1],A[hi]) — pivot at correct position','Recursively sort A[lo..i] and A[i+2..hi]','Stop'],
    pseudocode:'QUICK_SORT(A,lo,hi):\n  if lo<hi:\n    p=PARTITION(A,lo,hi)\n    QUICK_SORT(A,lo,p-1)\n    QUICK_SORT(A,p+1,hi)\n\nPARTITION(A,lo,hi):\n  pivot=A[hi]; i=lo-1\n  for j=lo to hi-1:\n    if A[j]<=pivot: i++; swap(A[i],A[j])\n  swap(A[i+1],A[hi])\n  return i+1',
    complexity:{best:'O(n log n) — balanced partitions',avg:'O(n log n)',worst:'O(n²) — sorted input',space:'O(log n) recursion stack'},
    applications:['Language standard library sort','Virtual memory management','In-place large dataset sorting'],
    advantages:['Small constant factor — fast in practice','In-place O(1) extra space','Cache-friendly sequential access','Parallelizable'],
    disadvantages:['O(n²) worst case on sorted input','Not stable','Recursive — stack overflow risk for large n'],
    viva:[
      {q:'Worst case and how to avoid?',a:'O(n²) when pivot always min/max. Fix: random pivot, median-of-three, or Introsort.'},
      {q:'Why faster than Merge Sort in practice?',a:'Better cache performance (in-place), smaller constants, O(log n) space vs O(n). Cache misses slow Merge Sort.'},
      {q:'What is Introsort?',a:'Hybrid: Quick Sort until depth>2·log₂n, switch to Heap Sort. Uses Insertion Sort for n<16. Used in C++ std::sort.'},
      {q:'Is Quick Sort stable?',a:'No. Partition step may reorder equal elements.'},
      {q:'Dutch National Flag partition?',a:'3-way partition: <pivot, =pivot, >pivot. Handles many duplicates efficiently — reduces to O(n log n).'}
    ],
    conclusion:'Quick Sort O(n log n) average with minimal space. Cache efficiency makes it practical first choice. Pivot selection critical for performance.',
    paradigm:'Divide and Conquer',category:'Sorting'
  },
  7: {
    title:'Fractional Knapsack (Greedy)',exp:'Experiment No: 08',
    aim:'To solve Fractional Knapsack using Greedy strategy, maximizing value within weight capacity W.',
    theory:'Fractional Knapsack allows taking item fractions. Greedy: sort by v/w ratio descending, take items greedily. If last item doesn\'t fit: take fraction = remaining_capacity/item_weight. Provably optimal: exchange argument shows taking highest v/w ratio first always maximizes profit. Unlike 0/1 Knapsack where greedy fails.',
    algorithm:['Start','Accept n items with w[], v[], capacity W','Compute v[i]/w[i] ratio for each item','Sort items by v/w ratio descending','remaining=W, profit=0','For each item: if w≤remaining: take full, else take fraction remaining/w','Update profit and remaining','Print total_profit','Stop'],
    pseudocode:'FRAC_KNAPSACK(items,W):\n  sort items by (v/w) desc\n  profit=0; rem=W\n  for each item:\n    if w<=rem: profit+=v; rem-=w\n    else: profit+=v*(rem/w); break\n  return profit',
    complexity:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n log n)',space:'O(1)'},
    applications:['Cloud resource allocation','Investment optimization','Time-sharing scheduling','Bandwidth allocation'],
    advantages:['Always optimal (provably)','Simple O(n log n) implementation','No DP table needed'],
    disadvantages:['Cannot apply to 0/1 Knapsack','Real items may not be divisible','Sorting step required'],
    viva:[
      {q:'Why greedy works for fractional but not 0/1?',a:'Fractional: can take any portion so highest v/w always best. 0/1: taking high-ratio item might block multiple lower-ratio items with higher combined value.'},
      {q:'Prove greedy optimality?',a:'Exchange argument: if optimal takes less of item i (higher ratio) and more of j (lower ratio), swapping increases total value. So taking highest ratio first is always optimal.'},
      {q:'If already sorted, complexity?',a:'O(n) — just the greedy pass. O(n log n) comes only from sorting.'},
      {q:'Real-world analogy?',a:'Gold dust (divisible) of different values/kg: take highest value/kg first. vs 0/1: solid gold bars (indivisible).'},
      {q:'What is the knapsack problem with bounded quantities?',a:'Each item available in limited copies. Reduce to 0/1 Knapsack by creating copies, or use specialized DP.'}
    ],
    conclusion:'Fractional Knapsack optimally solved by greedy in O(n log n). v/w ratio determines priority. Greedy provably optimal due to item divisibility.',
    paradigm:'Greedy',category:'Optimization'
  },
  8: {
    title:'Activity Selection Problem',exp:'Experiment No: 09',
    aim:'To select the maximum number of non-overlapping activities using Greedy Activity Selection.',
    theory:'Given n activities with start sᵢ and finish fᵢ times, select maximum compatible (non-overlapping) activities. Greedy: sort by finish time ascending. Always select earliest-finishing compatible activity. Optimal: selecting early-finishing activities leaves maximum time for subsequent ones. Proof: exchange argument shows this greedy choice is always safe.',
    algorithm:['Start','Accept n activities with start s[] and finish f[]','Sort by finish time ascending','Select first activity; lastFinish=f[0]','For each remaining activity i: if s[i]≥lastFinish: select, lastFinish=f[i]','Print selected activities and count','Stop'],
    pseudocode:'ACTIVITY_SELECTION(s[],f[],n):\n  sort by f[]\n  selected=[0]; last=0\n  for i=1 to n-1:\n    if s[i]>=f[last]:\n      selected.append(i); last=i\n  return selected',
    complexity:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n log n)',space:'O(n)'},
    applications:['CPU job scheduling','Meeting room allocation','TV programming','Exam scheduling'],
    advantages:['Provably optimal greedy','Simple O(n log n)','No DP table needed'],
    disadvantages:['Only maximizes count, not profit','Doesn\'t handle weighted activities (needs DP)'],
    viva:[
      {q:'Why sort by finish time not start time?',a:'Earliest finish leaves maximum remaining time for future activities.'},
      {q:'Weighted Activity Selection?',a:'Each activity has profit. Greedy fails — use DP: sort by finish, dp[i]=max profit using first i. dp[i]=max(dp[i-1], profit[i]+dp[j]) where j=last compatible.'},
      {q:'Prove greedy is optimal?',a:'Exchange argument: replace first activity in OPT with earliest-finishing a₁. It ends no later, so remaining activities still fit. Same or better count. By induction, optimal.'},
      {q:'What is Interval Graph Coloring?',a:'Minimum resources (rooms) to schedule ALL activities = maximum simultaneous overlapping activities. Greedy coloring solves it.'},
      {q:'Time if pre-sorted?',a:'O(n) — just one linear pass. O(n log n) only from sorting step.'}
    ],
    conclusion:'Activity Selection demonstrates greedy optimality. Sort by finish time, select greedily, maximize non-overlapping count in O(n log n).',
    paradigm:'Greedy',category:'Scheduling'
  },
  9: {
    title:'BFS and DFS Graph Traversal',exp:'Experiment No: 10',
    aim:'To traverse a graph using BFS and DFS and list the visiting order of vertices.',
    theory:'BFS: explores level by level using Queue (FIFO). Guarantees shortest path in unweighted graphs. Visits all vertices at distance k before k+1. DFS: explores as deep as possible using Stack/recursion before backtracking. Produces DFS tree, classifies edges: tree, back, forward, cross edges. Both: O(V+E) time, O(V) space.',
    algorithm:['Start','Accept graph G(V,E) as adjacency list, start vertex s','BFS: Queue Q; enqueue s; mark visited','While Q not empty: dequeue u; print u; enqueue unvisited neighbors','DFS: Stack S; push s','While S not empty: pop u; if unvisited: mark, print, push neighbors','Print traversal order','Stop'],
    pseudocode:'BFS(G,s):\n  visited={s}; Q=Queue([s])\n  while Q: u=Q.dequeue(); print u\n    for v in adj[u]:\n      if v not in visited: visited.add(v); Q.enqueue(v)\n\nDFS(G,s):\n  visited={}; S=Stack([s])\n  while S: u=S.pop()\n    if u not in visited:\n      visited.add(u); print u\n      for v in adj[u]: S.push(v)',
    complexity:{best:'O(V+E)',avg:'O(V+E)',worst:'O(V+E)',space:'O(V) queue/stack'},
    applications:['BFS: shortest path in unweighted graphs, web crawlers','DFS: cycle detection, topological sort, SCC','Network broadcasting (BFS)'],
    advantages:['BFS finds shortest path in unweighted graphs','DFS uses less memory for deep sparse graphs','Both linear O(V+E)'],
    disadvantages:['BFS: large memory for wide graphs','DFS: doesn\'t find shortest path','Recursion limit for very deep DFS'],
    viva:[
      {q:'When prefer BFS over DFS?',a:'BFS when shortest path needed, solution close to source, or level-order processing. DFS for topological sort, SCC, cycle detection.'},
      {q:'Back edge in DFS?',a:'Edge from vertex to its ancestor in DFS tree. Indicates a cycle in directed graph.'},
      {q:'How BFS guarantees shortest path?',a:'Visits by increasing distance from source. First discovery of v is via shortest path (proof by induction on distance).'},
      {q:'DFS without recursion?',a:'Use explicit stack. Push source, pop, mark visited, push unvisited neighbors. Order may differ from recursive DFS.'},
      {q:'Time for adjacency matrix vs list?',a:'List: O(V+E). Matrix: O(V²) — must check all V columns per vertex. List much better for sparse graphs.'}
    ],
    conclusion:'BFS and DFS are fundamental traversals with O(V+E) complexity. BFS uses queue for level-by-level exploration; DFS uses stack/recursion for deep exploration. BFS guarantees shortest path in unweighted graphs.',
    paradigm:'Graph Traversal',category:'Graph Algorithms'
  },
  10: {
    title:'Matrix Chain Multiplication',exp:'Experiment No: 11',
    aim:'To find optimal parenthesization minimizing scalar multiplications using DP.',
    theory:'Given n matrices A₁..Aₙ with dims p[0..n], find parenthesization minimizing total scalar multiplications. DP: dp[i][j]=min cost to multiply Aᵢ..Aⱼ. Recurrence: dp[i][j]=min over k of (dp[i][k]+dp[k+1][j]+p[i-1]·p[k]·p[j]). dp[i][i]=0. Split table records optimal k. Number of parenthesizations = Catalan number C(n-1) — exponential, so brute force infeasible.',
    algorithm:['Start','Accept dimension array p[0..n] for n matrices','Init dp[i][i]=0','For chain length l=2 to n: For i=1 to n-l+1, j=i+l-1:','  dp[i][j]=∞; For k=i to j-1:','    cost=dp[i][k]+dp[k+1][j]+p[i-1]*p[k]*p[j]','    If cost<dp[i][j]: dp[i][j]=cost; split[i][j]=k','Print dp[1][n] and parenthesization from split[]','Stop'],
    pseudocode:'MCM(p[],n):\n  dp[i][i]=0 for all i\n  for l=2 to n:\n    for i=1 to n-l+1:\n      j=i+l-1; dp[i][j]=INF\n      for k=i to j-1:\n        q=dp[i][k]+dp[k+1][j]+p[i-1]*p[k]*p[j]\n        if q<dp[i][j]: dp[i][j]=q; split[i][j]=k\n  return dp[1][n]',
    complexity:{best:'O(n³)',avg:'O(n³)',worst:'O(n³)',space:'O(n²) dp and split tables'},
    applications:['ML matrix operations','Graphics transformation pipelines','Scientific computing','SQL query join optimization'],
    advantages:['Reduces Catalan-number paths to O(n³)','Optimal substructure enables DP','Split table for parenthesization reconstruction'],
    disadvantages:['O(n³) costly for very large n','O(n²) space','Requires all dimensions upfront'],
    viva:[
      {q:'Number of parenthesizations for n matrices?',a:'Catalan C(n-1) ≈ 4^n/n^(3/2). For n=10: 4862 parenthesizations. Exponential growth makes brute force infeasible.'},
      {q:'Optimal substructure in MCM?',a:'Optimal solution to MCM(i..j) contains optimal sub-solutions to MCM(i..k) and MCM(k+1..j).'},
      {q:'Why diagonal order in DP?',a:'dp[i][j] depends on dp[i][k] and dp[k+1][j] for k between i and j. Fill diagonals (by chain length l) ensures smaller subproblems solved first.'},
      {q:'Reconstruct parenthesization from split table?',a:'PRINT(i,j): if i==j: print Aᵢ. Else: print "("+PRINT(i,split[i][j])+" × "+PRINT(split[i][j]+1,j)+")".'},
      {q:'Why is diagonal order used?',a:'Subproblems of length l depend on length l-1, l-2,... By filling length 2 first, then 3, etc., all needed values are available.'}
    ],
    conclusion:'MCM DP reduces exponential parenthesizations to O(n³). Split table enables reconstruction. Template for chain optimization problems.',
    paradigm:'Dynamic Programming',category:'Optimization'
  },
  11: {
    title:'Coin Change Problem',exp:'Experiment No: 12',
    aim:'To find minimum coins to make amount A using DP (compare with Greedy).',
    theory:'Given denominations and target amount, find minimum coins. DP: dp[0]=0, dp[i]=1+min{dp[i-c] for coin c≤i}. Greedy works for standard coins {1,5,10,25} but fails for {1,3,4}: for amount=6, greedy gives 4+1+1=3 coins but DP gives 3+3=2 coins. DP guarantees optimal for any denominations.',
    algorithm:['Accept coins[] and amount A','Init dp[0]=0, dp[1..A]=∞, from[]=-1','For i=1 to A: For each coin c: If c≤i and dp[i-c]+1<dp[i]: dp[i]=dp[i-c]+1; from[i]=c','Traceback using from[] to find coins used','Print dp[A] and coins used','Stop'],
    pseudocode:'COIN_CHANGE(coins,amount):\n  dp=[INF]*(amount+1); dp[0]=0\n  from=[-1]*(amount+1)\n  for i=1 to amount:\n    for c in coins:\n      if c<=i and dp[i-c]+1<dp[i]:\n        dp[i]=dp[i-c]+1; from[i]=c\n  // Traceback: pos=amount\n  while pos>0: result.add(from[pos]); pos-=from[pos]',
    complexity:{best:'O(n·m) n=amount,m=#coins',avg:'O(n·m)',worst:'O(n·m)',space:'O(n)'},
    applications:['ATM cash dispensing','Point-of-sale change','Budget allocation','Stamp collection'],
    advantages:['Optimal for any denomination set','Handles cases where greedy fails','Traceback gives exact coins'],
    disadvantages:['O(n·m) slow for very large amounts','Greedy faster but not always correct'],
    viva:[
      {q:'When does Greedy work for Coin Change?',a:'Canonical systems like {1,5,10,25} (US), {1,2,5,10,20,50} (Euro). Fails for arbitrary sets like {1,3,4}.'},
      {q:'Is Coin Change NP-Hard?',a:'Decision version is NP-Complete. Optimization: weakly NP-Hard. DP is O(n·m) — pseudo-polynomial.'},
      {q:'What if no solution exists?',a:'dp[amount] remains ∞. Example: coins={2,4}, amount=3 — impossible to make odd amount.'},
      {q:'Count of ways to make amount?',a:'dp[i] = number of ways. Recurrence: dp[i]+=dp[i-c] for each coin c. dp[0]=1.'},
      {q:'Space optimization?',a:'Cannot below O(n) — need full dp array. Can remove from[] array if only counting coins, not listing them.'}
    ],
    conclusion:'Coin Change DP guarantees optimal in O(n·m). Greedy insufficient for general denominations. Bottom-up DP builds solutions from smaller amounts.',
    paradigm:'Dynamic Programming',category:'Optimization'
  },
  12: {
    title:'Job Sequencing with Deadlines',exp:'Experiment No: 13',
    aim:'To schedule jobs with profits and deadlines to maximize total profit using Greedy algorithm.',
    theory:'n jobs with deadlines d[] and profits p[]. Single processor, each job takes 1 unit time. Greedy: sort by profit descending. For each job, assign to latest available slot ≤ deadline. If no slot: reject. Provably optimal for unit-time job maximization.',
    algorithm:['Sort jobs by profit descending','Find maxD=max deadline','Init slots[0..maxD-1]=null','For each job j in sorted order:','  Find latest free slot t where t≤d[j]-1','  If found: assign, profit+=p[j]','  Else: reject','Print schedule and total profit','Stop'],
    pseudocode:'JOB_SEQ(jobs,maxD):\n  sort by profit desc\n  slots[0..maxD-1]=null; profit=0\n  for each job j:\n    for t=min(d[j],maxD)-1 downto 0:\n      if slots[t]==null:\n        slots[t]=j; profit+=p[j]; break\n  return slots,profit',
    complexity:{best:'O(n log n)',avg:'O(n²)',worst:'O(n²)',space:'O(n)'},
    applications:['CPU process scheduling','Manufacturing scheduling','Cloud task scheduling'],
    advantages:['Simple greedy','Maximizes profit with unit-time constraint'],
    disadvantages:['O(n²) slot-finding','Only unit-time jobs','Not for variable-duration jobs'],
    viva:[
      {q:'Union-Find optimization?',a:'DSU finds latest free slot in near O(1) amortized. Total: O(n log n).'},
      {q:'Why assign to latest slot?',a:'Preserves early slots for tight-deadline jobs. Early-slot assignment could block future jobs.'},
      {q:'Difference from Activity Selection?',a:'Activity: maximize COUNT (no profits, variable duration). Job Seq: maximize PROFIT (unit time, deadlines). Both greedy, different criteria.'},
      {q:'Same deadline jobs?',a:'Higher profit job attempted first (descending sort). Gets later slot if available.'},
      {q:'DP for variable-duration weighted jobs?',a:'Sort by finish time; dp[i]=max profit using first i jobs. dp[i]=max(dp[i-1], profit[i]+dp[j]) where j is last non-overlapping job.'}
    ],
    conclusion:'Job Sequencing greedy maximizes profit by processing high-profit jobs first, assigning to latest available slots. O(n²) time, O(n log n) with DSU.',
    paradigm:'Greedy',category:'Scheduling'
  },
  13: {
    title:"Dijkstra's Shortest Path",exp:'Experiment No: 14',
    aim:"To find shortest paths from a source vertex to all vertices using Dijkstra's Algorithm.",
    theory:"Dijkstra's solves Single Source Shortest Path for non-negative edge weights. Maintains dist[] and visited[]. Initially dist[source]=0, others=∞. Greedily selects unvisited vertex u with minimum dist[u], marks visited, relaxes neighbors: if dist[u]+w(u,v)<dist[v], update. Greedy selection correct only for non-negative weights — use Bellman-Ford for negative edges.",
    algorithm:['Accept graph G(V,E), non-negative weights, source s','Init dist[s]=0, dist[others]=∞','Repeat V times: u=unvisited vertex with min dist[u]; mark visited','For each neighbor v: if dist[u]+w(u,v)<dist[v]: dist[v]=dist[u]+w(u,v); prev[v]=u','Print dist[] — shortest distances from s','Stop'],
    pseudocode:"DIJKSTRA(G,s):\n  dist={v:INF}; dist[s]=0; visited={}\n  while unvisited exist:\n    u=min dist unvisited vertex\n    visited.add(u)\n    for (v,w) in adj[u]:\n      if dist[u]+w<dist[v]:\n        dist[v]=dist[u]+w; prev[v]=u\n  return dist,prev",
    complexity:{best:'O((V+E)log V) — min-heap',avg:'O((V+E)log V)',worst:'O(V²) — array impl',space:'O(V+E)'},
    applications:['GPS navigation','Network routing (OSPF)','Social network shortest connection','Flight route optimization'],
    advantages:['Optimal for non-negative weights','O(E log V) with priority queue','Finds paths to ALL vertices'],
    disadvantages:['Fails for negative edges (use Bellman-Ford)','Single source only','O(V²) without priority queue'],
    viva:[
      {q:"Why doesn't Dijkstra work with negative edges?",a:"Greedy assumption: once vertex finalized, distance is optimal. With negative edges, later path via negative edge could be shorter — violates this assumption."},
      {q:'Dijkstra vs Bellman-Ford?',a:'Dijkstra: O(E log V), greedy, fails negative weights. Bellman-Ford: O(VE), handles negative weights, detects negative cycles.'},
      {q:'Fibonacci heap complexity?',a:'O(E+V log V) with Fibonacci heap (decrease-key O(1) amortized).'},
      {q:'Bidirectional Dijkstra?',a:'Run simultaneously from source and target. Stop when searches meet. ~2x speedup. Used in route planning.'},
      {q:'Path reconstruction?',a:'Use prev[] array. Start from target t, follow prev[t]→... until source s. Reverse the path.'}
    ],
    conclusion:"Dijkstra's O((V+E)log V) with min-heap. Provably optimal for non-negative weights. Foundation of GPS and routing systems.",
    paradigm:'Greedy',category:'Graph Algorithms'
  },
  14: {
    title:'Floyd-Warshall All-Pairs Shortest Path',exp:'Experiment No: 15',
    aim:'To find shortest paths between all pairs of vertices using Floyd-Warshall Algorithm.',
    theory:'APSP DP: D^k[i][j]=min(D^(k-1)[i][j], D^(k-1)[i][k]+D^(k-1)[k][j]). D^0=adjacency matrix. After n iterations, D^n[i][j]=shortest path. Handles negative edges (not negative cycles). O(V³) time, O(V²) space.',
    algorithm:['Accept weighted adjacency matrix D(n×n)','Init D[i][i]=0, D[i][j]=w(i,j) if edge, else ∞','For k=0 to n-1 (intermediate): For i=0 to n-1: For j=0 to n-1:','  If D[i][k]+D[k][j]<D[i][j]: D[i][j]=D[i][k]+D[k][j]','Print final D matrix','Stop'],
    pseudocode:'FLOYD_WARSHALL(D,n):\n  for k=0 to n-1:\n    for i=0 to n-1:\n      for j=0 to n-1:\n        if D[i][k]+D[k][j]<D[i][j]:\n          D[i][j]=D[i][k]+D[k][j]\n  // Negative cycle: D[i][i]<0',
    complexity:{best:'O(V³)',avg:'O(V³)',worst:'O(V³)',space:'O(V²)'},
    applications:['Network routing tables','Social network analysis','Transitive closure','Bottleneck path problems'],
    advantages:['All-pairs in one pass','Simple 3-loop implementation','Handles negative edges','Also computes transitive closure'],
    disadvantages:['O(V³) impractical for very large graphs','O(V²) space','Cannot handle negative cycles'],
    viva:[
      {q:'How to detect negative cycles?',a:'After running, check D[i][i]. If any D[i][i]<0: negative cycle through vertex i.'},
      {q:'Floyd-Warshall vs V×Dijkstra?',a:'Floyd: O(V³) simple. V×Dijkstra: O(V·E log V) better for sparse graphs. Dijkstra fails for negative edges.'},
      {q:'Transitive closure with Floyd-Warshall?',a:'Replace weights with booleans: reach[i][j]=reach[i][j] OR (reach[i][k] AND reach[k][j]).'},
      {q:'In-place update safe?',a:'Yes. D[k][k]=0 always ensures D[i][k] and D[k][j] unchanged in iteration k.'},
      {q:'Optimal substructure?',a:'Shortest path via intermediates {1..k} either uses k (split at k) or doesn\'t. DP recurrence captures both cases.'}
    ],
    conclusion:'Floyd-Warshall: O(V³) all-pairs DP. Handles negative edges. For sparse graphs, repeated Dijkstra is more efficient.',
    paradigm:'Dynamic Programming',category:'Graph Algorithms'
  },
  18: {
    title:'N-Queens Problem (Backtracking)',exp:'Experiment No: 16',
    aim:'To place N queens on N×N chessboard with no two queens attacking each other using Backtracking.',
    theory:'Place N queens with no shared row, column, or diagonal. Backtracking: for each row, try each column; if safe, place queen and recurse to next row; if all columns fail, backtrack. isSafe: col[r]≠col[r2] for r2<r; |col[r]-col[r2]|≠|r-r2|. N=8 has 92 solutions. Total states ≤ N! but pruning dramatically reduces actual work.',
    algorithm:['Init board[0..N-1]=-1','Call solve(row=0)','solve(row): if row=N: solution found','For col=0 to N-1: if isSafe(board,row,col):','  board[row]=col; solve(row+1); board[row]=-1 (backtrack)','isSafe: check column + both diagonals against all placed queens','Print all solutions','Stop'],
    pseudocode:'NQUEENS(board,row,N):\n  if row==N: print(board); return\n  for col=0 to N-1:\n    if IS_SAFE(board,row,col,N):\n      board[row]=col\n      NQUEENS(board,row+1,N)\n      board[row]=-1  // backtrack\n\nIS_SAFE(board,row,col):\n  for r=0 to row-1:\n    if board[r]==col or |board[r]-col|==|r-row|: return false\n  return true',
    complexity:{best:'O(N!)',avg:'O(N!)',worst:'O(N!)',space:'O(N) board + stack'},
    applications:['Constraint satisfaction in AI','Parallel scheduling','Circuit board testing'],
    advantages:['Finds ALL solutions','Pruning faster than brute O(N^N)','Simple recursive implementation'],
    disadvantages:['Exponential O(N!)','Slow for large N>20'],
    viva:[
      {q:'Solutions for N=8?',a:'92 solutions. N=1:1, N=2,3:0, N=4:2, N=5:10, N=6:4, N=7:40, N=8:92.'},
      {q:'Backtracking vs brute force?',a:'Brute: N^N placements. Backtracking: ≤N! states with pruning. Actual much fewer due to early constraint violation.'},
      {q:'Constraint propagation?',a:'After placing queen, mark all attacked cells invalid for remaining rows. Reduces branching factor.'},
      {q:'3 conditions in isSafe?',a:'(1) column: board[r]==col (2) left diagonal: board[r]-col==r-row (3) right diagonal: board[r]-col==-(r-row). Combined: |board[r]-col|==|r-row|.'},
      {q:'Can N-Queens be solved in poly time?',a:'No polynomial algorithm known. Decision variant is trivially yes for N≥4.'}
    ],
    conclusion:'N-Queens demonstrates backtracking for constraint satisfaction. Systematic exploration with pruning makes it tractable for moderate N.',
    paradigm:'Backtracking',category:'Backtracking'
  },
  24: {
    title:'Asymptotic Complexity (Big-O)',exp:'Experiment No: 17',
    aim:'To understand Big-O, Big-Omega, Big-Theta notations and compare growth rates of common complexity functions.',
    theory:'Big-O: upper bound — f(n)=O(g(n)) means f(n)≤c·g(n) for all n>n₀. Omega: lower bound. Theta: tight bound. Hierarchy: O(1)<O(log n)<O(n)<O(n log n)<O(n²)<O(n³)<O(2ⁿ)<O(n!). Drop constants and lower terms. Master Theorem: T(n)=aT(n/b)+f(n). Three cases based on comparing f(n) with n^log_b(a).',
    algorithm:['Identify basic operation in algorithm','Count T(n) as function of n','Find dominant term','Express as O(dominant term)','Compare: nested loops→multiply, sequential→add, recursion→Master Theorem'],
    pseudocode:'COMPLEXITY ANALYSIS RULES:\n1. Sequential: O(n)+O(n²)=O(n²)\n2. Nested loops: O(n)×O(n)=O(n²)\n3. Recursion T(n)=aT(n/b)+f(n): Master Theorem\n4. Drop constants+lower terms:\n   O(3n²+5n+10)=O(n²)',
    complexity:{best:'O(1) — constant',avg:'O(log n) — binary search',worst:'O(n!) — TSP brute force',space:'N/A — analysis tool'},
    applications:['Algorithm selection','Performance prediction','Competitive programming','System capacity planning'],
    advantages:['Machine-independent measure','Identifies bottlenecks before coding','Enables comparison of different algorithms'],
    disadvantages:['Ignores constants','Only describes growth rate','Small n: O(n²) may be faster than O(n log n) in practice'],
    viva:[
      {q:'Difference: O, Ω, Θ?',a:'O: upper bound (worst). Ω: lower bound (best). Θ: tight bound (both). Linear Search: O(n), Ω(1), Θ(n) average.'},
      {q:'Why drop constants in Big-O?',a:'For large n, dominant term dwarfs others. Constants depend on machine. We measure growth rate, not exact count.'},
      {q:'Master Theorem cases?',a:'f(n) vs n^log_b(a). Case 1: f(n)=O(n^(c-ε))→T(n)=Θ(n^c). Case 2: equal→Θ(n^c·log n). Case 3: f(n)=Ω(n^(c+ε))→Θ(f(n)).'},
      {q:'O(n log n) vs O(n+k)?',a:'O(n+k) Counting Sort better when k=O(n). For k>>n, degrades. O(n log n) universal.'},
      {q:'Can O(n³) be faster than O(n) in practice?',a:'Yes for very small n if O(n³) has tiny constants and O(n) has large overhead. But O(n) always wins asymptotically.'}
    ],
    conclusion:'Complexity analysis provides machine-independent algorithm comparison. Big-O hierarchy guides selection. Master theorem solves divide-and-conquer recurrences.',
    paradigm:'Analysis Framework',category:'Theory'
  },
  25: {
    title:'Heap Data Structure & Heap Sort',exp:'Experiment No: 18',
    aim:'To build a Max-Heap and perform Heap Sort, analyzing complexity at each step.',
    theory:'Max-Heap: complete binary tree where every parent ≥ children. Array representation: parent(i)=⌊(i-1)/2⌋, left=2i+1, right=2i+2. Build: heapify all non-leaf nodes from ⌊n/2⌋-1 down to 0 — O(n) total. Heap Sort: swap root (max) with last, reduce size, heapify root. Repeat n-1 times. O(n log n) always.',
    algorithm:['Accept A[0..n-1]','BUILD_MAX_HEAP: for i=n/2-1 downto 0: HEAPIFY(A,n,i)','Heap Sort: for i=n-1 downto 1: swap(A[0],A[i]); HEAPIFY(A,i,0)','HEAPIFY(A,n,i): find largest among A[i],A[2i+1],A[2i+2]','If largest≠i: swap; recurse on largest','Print sorted A','Stop'],
    pseudocode:'BUILD_MAX_HEAP(A,n):\n  for i=n/2-1 downto 0: HEAPIFY(A,n,i)\n\nHEAPSORT(A,n):\n  BUILD_MAX_HEAP(A,n)\n  for i=n-1 downto 1:\n    swap(A[0],A[i]); HEAPIFY(A,i,0)\n\nHEAPIFY(A,n,i):\n  largest=i; l=2i+1; r=2i+2\n  if l<n and A[l]>A[largest]: largest=l\n  if r<n and A[r]>A[largest]: largest=r\n  if largest!=i: swap(A[i],A[largest]); HEAPIFY(A,n,largest)',
    complexity:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n log n)',space:'O(1) in-place'},
    applications:['Priority queues','Dijkstra/Prim with heap','K-th largest element','Event simulation'],
    advantages:['Guaranteed O(n log n)','O(1) extra space','O(log n) priority queue ops','Build in O(n)'],
    disadvantages:['Not stable','Poor cache performance','Slower than Quick Sort in practice'],
    viva:[
      {q:'Why Build-Heap O(n) not O(n log n)?',a:'Lower nodes have O(1) heapify cost; only top nodes O(log n). Sum: n/4×1+n/8×2+...=O(n) by geometric series.'},
      {q:'Why not stable?',a:'Root-to-last swap moves elements long-range, destroying relative order of equals.'},
      {q:'Heap vs BST for priority queue?',a:'Heap: insert O(log n), extract-max O(log n), build O(n). BST: same but O(n log n) build. Heap preferred — simpler, array-based, better cache.'},
      {q:'d-ary heap?',a:'d children per node. Decrease-key O(log_d n). Extract-min O(d·log_d n). d=4 often used for cache efficiency.'},
      {q:'What is heap property?',a:'Max-Heap: parent≥children. Maintained by Heapify: swap with larger child when violated, recurse down.'}
    ],
    conclusion:'Heap Sort: guaranteed O(n log n), O(1) space. Heap enables efficient priority queue operations. Build-Heap O(n) insight used in Prim\'s and Dijkstra\'s.',
    paradigm:'Comparison Sorting',category:'Sorting'
  },
  26: {
    title:'Recurrence Relations & Master Theorem',exp:'Experiment No: 19',
    aim:'To analyze recurrence relations of divide-and-conquer algorithms using Recurrence Tree and Master Theorem.',
    theory:'T(n)=aT(n/b)+f(n): a=subproblems, b=size factor, f(n)=combination cost. Master Theorem (c=log_b a): Case 1: f(n)=O(n^(c-ε))→T(n)=Θ(n^c). Case 2: f(n)=Θ(n^c)→T(n)=Θ(n^c·log n). Case 3: f(n)=Ω(n^(c+ε))→T(n)=Θ(f(n)). Recurrence Tree: expand level by level; Level k has a^k nodes each costing f(n/b^k); total levels=log_b n.',
    algorithm:['Identify T(n)=aT(n/b)+f(n)','Compute c=log_b(a)','Compare f(n) with n^c','Apply Master Theorem case','Or use Recurrence Tree:','  Level 0: f(n). Level 1: a×f(n/b). Level k: a^k×f(n/b^k)','Sum all levels'],
    pseudocode:'Master Theorem Examples:\n\nMerge Sort: T(n)=2T(n/2)+n\n  a=2,b=2,c=log₂2=1\n  f(n)=n=n^1 → Case 2\n  T(n)=Θ(n log n)\n\nBinary Search: T(n)=T(n/2)+1\n  a=1,b=2,c=0\n  f(n)=1=n^0 → Case 2\n  T(n)=Θ(log n)',
    complexity:{best:'Θ(n^c) Case 1',avg:'Θ(n^c log n) Case 2',worst:'Θ(f(n)) Case 3',space:'O(log n) tree depth'},
    applications:['Merge/Quick Sort analysis','Matrix mult complexity','FFT complexity','Scientific algorithm analysis'],
    advantages:['Exact asymptotic bounds','O(1) analysis for standard forms','Tree gives intuition'],
    disadvantages:["Doesn't handle T(n)=2T(n/2)+n log n",'Assumes uniform subproblems'],
    viva:[
      {q:'Solve T(n)=4T(n/2)+n?',a:'a=4,b=2,c=log₂4=2. f(n)=n=O(n^(2-1)). Case 1. T(n)=Θ(n²).'},
      {q:"Why can't Master Theorem solve T(n)=2T(n/2)+n log n?",a:'f(n)=n log n vs n^1. f/n^c=log n — not polynomial (not n^ε for any ε>0). No case applies.'},
      {q:'Substitution method?',a:'Guess solution form, prove by induction. Example: T(n)=2T(n/2)+n, guess Θ(n log n), verify substituting T(n/2)≤c(n/2)log(n/2).'},
      {q:'Levels in T(n)=2T(n/2)+n tree?',a:'log₂n levels. Total cost = n per level × log n levels = n log n.'},
      {q:"Strassen's recurrence?",a:"T(n)=7T(n/2)+n². c=log₂7≈2.807. f(n)=n²=O(n^(2.807-0.807)). Case 1. T(n)=Θ(n^2.807)."}
    ],
    conclusion:'Master Theorem provides systematic O(1) analysis for standard divide-and-conquer recurrences. Three cases cover most practical algorithms.',
    paradigm:'Algorithm Analysis',category:'Theory'
  },
  27: {
    title:'Shortest Common Supersequence (SCS)',exp:'Experiment No: 20',
    aim:'To find the Shortest Common Supersequence of two strings using DP via LCS.',
    theory:'SCS(X,Y): shortest string containing both X and Y as subsequences. Key: |SCS|=|X|+|Y|-|LCS(X,Y)|. Compute LCS DP table. Construct SCS: when characters match (LCS), include once; otherwise include non-LCS characters from both.',
    algorithm:['Accept X (length m) and Y (length n)','Compute LCS dp table (m+1)×(n+1)','|SCS|=m+n-LCS_length','Traceback: X[i]=Y[j]→add once, move diag; dp[i-1][j]>dp[i][j-1]→add X[i] up; else add Y[j] left','Return SCS string','Stop'],
    pseudocode:'SCS(X,Y,m,n):\n  dp=LCS_table(X,Y)\n  i=m; j=n; result=[]\n  while i>0 and j>0:\n    if X[i-1]==Y[j-1]: result.add(X[i-1]); i--; j--\n    elif dp[i-1][j]>dp[i][j-1]: result.add(X[i-1]); i--\n    else: result.add(Y[j-1]); j--\n  add remaining X[i:] and Y[j:]\n  return reverse(result)',
    complexity:{best:'O(m·n)',avg:'O(m·n)',worst:'O(m·n)',space:'O(m·n) LCS table'},
    applications:['DNA merging','Version control merge (git)','File merging','Text alignment'],
    advantages:['Reuses LCS DP code','Minimum-length merge','Linear SCS construction after table'],
    disadvantages:['O(m·n) for LCS first','Multiple SCS may exist'],
    viva:[
      {q:'Prove |SCS|=|X|+|Y|-|LCS|?',a:'LCS chars appear once in SCS. Non-LCS from X and Y appear separately. |SCS|=(|X|-|LCS|)+(|Y|-|LCS|)+|LCS|=|X|+|Y|-|LCS|.'},
      {q:'Is SCS unique?',a:'Not necessarily. Multiple LCS→multiple equally-short SCS strings.'},
      {q:'SCS vs concatenation XY?',a:'XY length |X|+|Y|: valid supersequence but not minimum. SCS shares LCS characters, minimum length.'},
      {q:'SCS for 3 strings?',a:'3D LCS: dp[i][j][k]. O(m·n·p). |SCS|=m+n+p-|LCS₃|.'},
      {q:'Relationship with LCS?',a:'Dual problems: longer LCS→shorter SCS. Same DP table, different use.'}
    ],
    conclusion:'SCS=|X|+|Y|-|LCS|. DP table enables both LCS computation and SCS construction. Important in bioinformatics and merge operations.',
    paradigm:'Dynamic Programming',category:'String Algorithms'
  },
  28: {
    title:'Union-Find (Disjoint Set Union)',exp:'Experiment No: 21',
    aim:'To implement DSU with Path Compression and Union by Rank, achieving near-O(1) amortized complexity.',
    theory:'DSU maintains disjoint sets. Find(x): returns root with path compression (flatten path to root). Union(x,y): merges by rank. Path compression: point all nodes on Find path directly to root. Union by rank: attach shorter tree under taller. Together: O(α(n)) amortized where α=inverse Ackermann function (≤4 practically).',
    algorithm:['Init parent[i]=i, rank[i]=0 for all i','FIND(x): if parent[x]≠x: parent[x]=FIND(parent[x]); return parent[x]','UNION(x,y): rx=FIND(x), ry=FIND(y); if rx=ry: return','If rank[rx]<rank[ry]: parent[rx]=ry; Elif rank[rx]>rank[ry]: parent[ry]=rx','Else: parent[ry]=rx; rank[rx]++'],
    pseudocode:'FIND(x):\n  if parent[x]!=x:\n    parent[x]=FIND(parent[x])  // path compression\n  return parent[x]\n\nUNION(x,y):\n  rx=FIND(x); ry=FIND(y)\n  if rx==ry: return\n  if rank[rx]<rank[ry]: swap(rx,ry)\n  parent[ry]=rx\n  if rank[rx]==rank[ry]: rank[rx]++',
    complexity:{best:'O(α(n)) per op',avg:'O(α(n)) inverse Ackermann',worst:'O(log n) without compression',space:'O(n)'},
    applications:["Kruskal's cycle detection",'Image segmentation','Social network components','Network connectivity'],
    advantages:['Near O(1) amortized','Simple array implementation','Foundation for Kruskal\'s'],
    disadvantages:['Cannot split sets','Path compression changes tree structure'],
    viva:[
      {q:'What is α(n)?',a:'Inverse Ackermann. For all practical n, α(n)≤4. DSU operations effectively O(1).'},
      {q:'Rank vs Size?',a:'Rank: tree height-based. Size: element count-based. Both give O(log n) height. Size easier to reason about.'},
      {q:'Path compression correct?',a:'Yes. Doesn\'t change set membership (root unchanged). Only restructures tree for future efficiency.'},
      {q:'Cycle detection in graph?',a:'For edge (u,v): if FIND(u)==FIND(v), cycle. Else UNION(u,v). Exactly Kruskal\'s cycle detection.'},
      {q:'Without path compression?',a:'Union by rank alone: O(log n) per operation. Tree height ≤ log n. Without either: O(n) worst case.'}
    ],
    conclusion:'DSU with path compression + rank: O(α(n)) amortized. Effectively O(1). Foundation for connectivity problems and Kruskal\'s MST.',
    paradigm:'Data Structures',category:'Graph Algorithms'
  },
  29: {
    title:'Topological Sort & SCC (Kosaraju)',exp:'Experiment No: 22',
    aim:"To find topological ordering of DAG (Kahn's algorithm) and Strongly Connected Components (Kosaraju's).",
    theory:"Topological Sort: linear ordering of DAG vertices where for every edge u→v, u comes before v. Kahn's BFS: process in-degree=0 vertices first; reduce neighbors' in-degree. Cycle if not all processed. Kosaraju's SCC: Phase 1 DFS on G for finish order. Phase 2 transpose G. Phase 3 DFS on G^T in reverse finish order — each tree is one SCC.",
    algorithm:["Kahn's: Compute in-degrees; init queue with 0-indegree vertices","While queue: dequeue u, add to order, reduce neighbors' in-degree","If in-degree=0: enqueue. If |order|<V: cycle exists","Kosaraju's: Phase 1 DFS→finish stack. Phase 2 transpose. Phase 3 DFS on G^T","Each complete DFS = one SCC. Print SCCs"],
    pseudocode:"KAHN_TOPO(G):\n  inDeg[v]=count incoming edges\n  Q={v|inDeg[v]==0}; order=[]\n  while Q: u=Q.dequeue(); order.add(u)\n    for v in adj[u]: inDeg[v]--; if 0: Q.add(v)\n  return order if |order|==V else 'Cycle!'\n\nKOSARAJU(G):\n  DFS on G → finish stack\n  G_T=transpose(G)\n  while stack: DFS on G_T from top → each tree=SCC",
    complexity:{best:'O(V+E)',avg:'O(V+E)',worst:'O(V+E)',space:'O(V+E)'},
    applications:['Build system dependencies (Make)','Course prerequisites','Package management','Deadlock detection'],
    advantages:['Linear O(V+E)','Kahn detects cycles','Kosaraju finds ALL SCCs in 2 DFS'],
    disadvantages:['Topo sort only for DAGs','Multiple valid orderings exist'],
    viva:[
      {q:'What is an SCC?',a:'Maximal set of vertices S where for every pair (u,v) in S, path exists u→v AND v→u. Every vertex in exactly one SCC.'},
      {q:"How does Kosaraju's work?",a:'Phase 1: DFS on G, push vertices by finish time. Phase 2: Reverse edges (G^T). Phase 3: DFS on G^T in reverse finish order. Each DFS tree = one SCC.'},
      {q:'Can DAG have SCCs with >1 vertex?',a:'No. In DAG no cycles so no back paths. Each vertex is its own SCC.'},
      {q:"Kahn's vs DFS topo sort?",a:"Kahn's BFS: detects cycle if |output|<V. DFS: add to stack on return, reverse. Both O(V+E)."},
      {q:"Tarjan's vs Kosaraju's?",a:"Tarjan's: ONE DFS pass with low-link values. Slightly complex, no transposition needed. Both O(V+E). Tarjan's preferred for single-pass efficiency."}
    ],
    conclusion:"Kahn's topo sort and Kosaraju's SCC: O(V+E). Topological ordering for DAGs. SCC condensation simplifies complex directed graphs.",
    paradigm:'Graph Algorithms',category:'Graph Algorithms'
  },
  30: {
    title:'Backtracking — Subset Sum & Graph Coloring',exp:'Experiment No: 23',
    aim:'To find all subsets summing to target and solve graph coloring using Backtracking.',
    theory:'Backtracking builds solutions incrementally, abandons when constraints fail. Subset Sum: include/exclude each element; prune if sum>target; record if sum=target. Graph Coloring: assign colors 1..k; if no valid color for vertex, backtrack. Both NP-Complete; backtracking is standard exact approach.',
    algorithm:['Subset Sum: solve(idx=0, path=[], sum=0)','If sum=target: record. If sum>target or idx=n: return','Include set[idx]: sum+=set[idx]; recurse(idx+1); backtrack','Exclude: recurse(idx+1)','Graph Coloring: for each vertex v, try colors 1..k','If safe(v,c): assign; recurse(v+1); unassign (backtrack)'],
    pseudocode:'SUBSET_SUM(set,n,idx,path,sum,target):\n  if sum==target: output(path); return\n  if sum>target or idx>=n: return\n  SUBSET_SUM(set,n,idx+1,path+[set[idx]],sum+set[idx],target)  // include\n  SUBSET_SUM(set,n,idx+1,path,sum,target)  // exclude\n\nGRAPH_COLOR(v,n,k,colors,adj):\n  if v==n: output(colors); return\n  for c=1 to k:\n    if IS_SAFE(v,c): colors[v]=c; recurse(v+1); colors[v]=0',
    complexity:{best:'O(2ⁿ) Subset',avg:'O(2ⁿ)',worst:'O(kⁿ) Coloring',space:'O(n) stack'},
    applications:['Subset Sum: resource allocation','Graph Coloring: register allocation in compilers','Map coloring','Conflict scheduling'],
    advantages:['Finds ALL solutions','Pruning dramatically reduces search','Correct and complete'],
    disadvantages:['Exponential worst case','Stack overflow for large inputs'],
    viva:[
      {q:'Min colors for planar graph?',a:'4 colors — Four Color Theorem (proved 1976 by computer). Chromatic number ≤ 4 for all planar graphs.'},
      {q:'Chromatic number?',a:'Minimum colors for proper coloring. Kₙ: n. Bipartite: 2. Computing it is NP-Hard.'},
      {q:'Backtracking vs Branch and Bound?',a:'Backtracking: prune constraint violations. B&B: additionally prune using bounding function — estimates best achievable. B&B for optimization problems.'},
      {q:'Is Subset Sum NP-Complete?',a:'Yes. Decision version is NP-Complete. Pseudo-polynomial DP O(n·T) exists for bounded T.'},
      {q:'How pruning improves performance?',a:'For Subset Sum: if sum>target, no need to explore deeper. For Coloring: if k adjacent colors used, no valid color. Can reduce O(2ⁿ) dramatically in practice.'}
    ],
    conclusion:'Backtracking: complete exploration with constraint pruning. Subset Sum and Graph Coloring are NP-Complete — backtracking provides exact solutions.',
    paradigm:'Backtracking',category:'Backtracking'
  },
  31: {
    title:'Travelling Salesman Problem (Branch & Bound)',exp:'Experiment No: 24',
    aim:'To find minimum cost Hamiltonian cycle using Branch and Bound algorithm.',
    theory:'TSP: visit all n cities exactly once, return to start, minimum cost. Branch & Bound: explore search tree of partial paths. Lower Bound: current cost + minimum outgoing edges from unvisited cities. If LB≥best known cost, prune. NP-Hard — no known polynomial algorithm. B&B exponential worst case but practical for small n.',
    algorithm:['Start from city 0; best_cost=∞','solve(path=[0],visited={0},cost=0)','Compute LB for current path','If LB≥best_cost: prune (return)','If all cities visited: update best if total<best_cost; return','For each unvisited city c: recurse with path+[c]','Print best_path and best_cost'],
    pseudocode:'TSP_BB(path,visited,cost,n,dist):\n  lb=LOWER_BOUND(path,visited,dist,n)\n  if lb>=best_cost: return  // prune\n  if len(path)==n:\n    total=cost+dist[path[-1]][path[0]]\n    if total<best_cost: best_cost=total; best_path=path\n    return\n  for city=0 to n-1:\n    if city not in visited:\n      TSP_BB(path+[city],visited|{city},cost+dist[path[-1]][city],n,dist)',
    complexity:{best:'O(n²) with pruning',avg:'O(2ⁿ·n²) Held-Karp',worst:'O(n!) brute force',space:'O(n) stack'},
    applications:['Logistics route optimization','PCB drilling sequences','DNA fragment assembly','Vehicle routing'],
    advantages:['Finds exact optimal','Pruning reduces search','Better than O(n!) in practice'],
    disadvantages:['NP-Hard — no poly algorithm','Exponential worst case','Heuristics needed for large n'],
    viva:[
      {q:'Why is TSP NP-Hard?',a:'No polynomial algorithm known. TSP decision is NP-Complete. If P=NP, TSP becomes polynomial. Current best exact: Held-Karp O(2ⁿ·n²).'},
      {q:'Held-Karp algorithm?',a:'DP: dp[S][i]=min cost starting at 0, visiting set S, ending at i. O(2ⁿ·n²) time, O(2ⁿ·n) space.'},
      {q:'2-approximation for metric TSP?',a:'MST + DFS traversal (visits edges twice) + shortcut repeats. Tour ≤ 2×optimal. Christofides: 1.5×optimal.'},
      {q:'Nearest neighbor heuristic?',a:'Always visit nearest unvisited city. O(n²), gives 25%+ above optimal. Useful for large n.'},
      {q:'How LB affects B&B efficiency?',a:'Tighter LB prunes more branches. Loose LB (0) = no pruning = brute force. Good LB (MST of unvisited) dramatically reduces search.'}
    ],
    conclusion:'TSP is NP-Hard. B&B prunes O(n!) search using lower bounds. Held-Karp DP gives O(2ⁿ·n²) exact. Approximation algorithms for large instances.',
    paradigm:'Branch and Bound',category:'Optimization'
  },
  32: {
    title:'Radix Sort & Counting Sort',exp:'Experiment No: 25',
    aim:'To sort arrays using Counting Sort O(n+k) and Radix Sort O(d(n+k)), non-comparison-based algorithms.',
    theory:'Counting Sort: count freq[v] for each value, compute cumulative positions, place in output array. O(n+k), stable. Radix Sort (LSD): sort digit by digit from least to most significant using stable Counting Sort per digit. For d-digit numbers base b: O(d(n+b)). Both break comparison sort lower bound Ω(n log n) for integer keys.',
    algorithm:['Counting Sort: count freq[A[i]]','Cumulative: freq[i]+=freq[i-1] for i=1..k','Output: for i=n-1 downto 0: out[--freq[A[i]]]=A[i]','Radix Sort: for exp=1; max/exp>0; exp×=10:','  Stable sort array by current digit (Counting Sort)','Repeat until all digits processed','Print sorted array'],
    pseudocode:'COUNTING_SORT(A,n,k):\n  count[0..k]=0\n  for i=0..n-1: count[A[i]]++\n  for i=1..k: count[i]+=count[i-1]\n  for i=n-1 downto 0: out[--count[A[i]]]=A[i]\n  return out\n\nRADIX_SORT(A,n):\n  max=MAX(A)\n  for exp=1; max/exp>0; exp*=10:\n    COUNTING_SORT_BY_DIGIT(A,n,exp)',
    complexity:{best:'O(n+k) Counting',avg:'O(d(n+k)) Radix',worst:'O(d(n+k))',space:'O(n+k)'},
    applications:['Integer sorting in bounded range','Suffix array construction','Network packet sorting'],
    advantages:['O(n+k) beats O(n log n) lower bound','Stable sorting','Excellent for bounded integer keys'],
    disadvantages:['Only non-negative integers in bounded range','O(n+k) space','Degrades for large k'],
    viva:[
      {q:'Why not comparison-based?',a:'Uses element values as indices, not comparisons. Breaks Ω(n log n) lower bound.'},
      {q:'Why stability important in Radix?',a:'LSD uses Counting Sort (stable) per digit. Stability preserves correct order of lower digits when sorting higher ones.'},
      {q:'MSD vs LSD?',a:'LSD: right to left, simple, naturally stable. MSD: left to right, recursive per bucket, can terminate early.'},
      {q:'Effective complexity for 32-bit integers?',a:'Base 256 (1 byte per pass): d=4 passes, k=256. O(4(n+256))=O(n). Approaches truly linear.'},
      {q:'When prefer over Merge Sort?',a:'When n large and key range k=O(n). For floating point or variable keys: Merge Sort more appropriate.'}
    ],
    conclusion:'Counting and Radix Sort achieve linear time for bounded integer keys, breaking comparison sort lower bound. Stable, cache-friendly non-comparison sorts.',
    paradigm:'Non-comparison Sorting',category:'Sorting'
  },
  33: {
    title:'P, NP, NP-Complete & NP-Hard Theory',exp:'Experiment No: 26',
    aim:'To understand complexity classes P, NP, NP-Complete, NP-Hard and the P vs NP question.',
    theory:'P: solvable in polynomial time O(nᵏ). NP: verifiable in polynomial time. P⊆NP. NP-Complete: hardest in NP; every NP problem reduces to them. NP-Hard: at least as hard as NPC, may not be in NP. Cook-Levin (1971): SAT first NP-Complete. P vs NP: greatest unsolved problem. $1M Millennium Prize.',
    algorithm:['For NP-Complete proof:','1. Show problem in NP (poly-time verifier)','2. Show known NP-Complete problem reduces to it in poly time','3. Reduction must be polynomial','For P: provide polynomial-time algorithm','For NP-Hard: reduction from known NPC problem'],
    pseudocode:'NP-COMPLETENESS PROOF STRUCTURE:\n\n1. Problem in NP:\n   Given certificate, verify in O(n^k)\n\n2. Known NPC ≤_p New Problem:\n   Transform instance I of known NPC\n   to instance I\' of new problem in O(n^k)\n   such that I is YES ⟺ I\' is YES\n\nExample: SAT ≤_p 3-SAT ≤_p Clique ≤_p ...',
    complexity:{best:'P: O(nᵏ) polynomial',avg:'NP: O(2^poly(n))',worst:'NP-Hard: no known poly',space:'P: poly | NP: poly verifier'},
    applications:['Cryptography (RSA relies on NP-hardness)','Compiler register allocation','Planning/scheduling','Drug discovery'],
    advantages:['Framework for impossibility proofs','NP-hardness justifies approximation/heuristics','Reductions prove new problems hard'],
    disadvantages:['No efficient algorithms for NPC (unless P=NP)','Many practical instances are easy despite worst-case hardness'],
    viva:[
      {q:'Cook-Levin theorem?',a:'SAT is NP-Complete (1971). First NPC problem. All subsequent NPC proofs reduce from SAT or other known NPC problems.'},
      {q:'If P=NP were proven?',a:'RSA broken, protein folding solved, all NP optimization efficient. Greatest math result ever. Millennium Prize $1M.'},
      {q:'Polynomial-time reduction A≤pB?',a:'Transform any instance of A to B in poly time such that YES↔YES. If B∈P then A∈P. If A NP-Hard and A≤pB: B is NP-Hard.'},
      {q:'0/1 Knapsack NP-Complete?',a:'Yes as decision problem. But O(nW) DP is pseudo-polynomial — not truly poly (W can be exponential in bit-length of input).'},
      {q:'NP-Complete vs NP-Hard difference?',a:'NP-Complete = NP ∩ NP-Hard. NP-Hard: at least as hard as NPC but may not be in NP (e.g., Halting Problem — undecidable). All NPC are NP-Hard, not vice versa.'}
    ],
    conclusion:'P, NP, NPC, NP-Hard form computational complexity foundations. P vs NP remains open. NP-hardness guides use of approximation algorithms, heuristics, and exponential exact algorithms.',
    paradigm:'Complexity Theory',category:'Theory'
  }
};

// ─── SVG DIAGRAM GENERATORS (hand-drawn style via feTurbulence filter) ────────
function svgSketchFilter(){
  return '<defs><filter id="hw-sketch" x="-5%" y="-5%" width="110%" height="110%">'
    +'<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="5" result="noise"/>'
    +'<feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>'
    +'</filter></defs>';
}

function svgBinarySearch(arr,target,lo,mid,hi){
  if(!arr||!arr.length)return '';
  var n=arr.length,cellW=Math.min(50,Math.floor(480/n)),cellH=44,padX=20,padY=52;
  var W=n*cellW+padX*2+10;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' 140" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();
  svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="18" text-anchor="middle" fill="#1a237e" font-size="12" font-weight="bold">Binary Search — Array Diagram</text>';
  for(var i=0;i<n;i++){
    var x=padX+i*cellW,y=padY;
    var fill=i===mid?'#bbdefb':(lo!==undefined&&(i<lo||i>hi))?'#eeeeee':'#fffde7';
    var stroke=i===mid?'#1565c0':'#546e7a';
    svg+='<rect x="'+x+'" y="'+y+'" width="'+cellW+'" height="'+cellH+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+(i===mid?2:1.5)+'"/>';
    svg+='<text x="'+(x+cellW/2)+'" y="'+(y+28)+'" text-anchor="middle" fill="#1a237e" font-size="13" font-weight="bold">'+arr[i]+'</text>';
    svg+='<text x="'+(x+cellW/2)+'" y="'+(y+cellH+14)+'" text-anchor="middle" fill="#78909c" font-size="10">'+i+'</text>';
  }
  function ptr(idx,label,color){if(idx<0||idx>=n)return;var x=padX+idx*cellW+cellW/2;svg+='<text x="'+x+'" y="'+(padY-16)+'" text-anchor="middle" fill="'+color+'" font-size="11" font-weight="bold">'+label+'</text><line x1="'+x+'" y1="'+(padY-8)+'" x2="'+x+'" y2="'+(padY-2)+'" stroke="'+color+'" stroke-width="2"/>';}
  if(lo!==undefined&&lo>=0)ptr(lo,'L','#2e7d32');
  if(mid!==undefined&&mid>=0)ptr(mid,'M','#1565c0');
  if(hi!==undefined&&hi>=0)ptr(hi,'H','#b71c1c');
  svg+='<text x="12" y="136" fill="#546e7a" font-size="10">Target = '+target+' | L=Low  M=Mid  H=High | Shaded=eliminated</text>';
  svg+='</g></svg>';return svg;
}

function svgActivityTimeline(acts,selected){
  if(!acts||!acts.length)return '';
  var maxT=Math.max.apply(null,acts.map(function(a){return a.f||0;}))+1;
  var W=500,rowH=26,padX=65,padY=34,timeW=W-padX-16;
  var scale=timeW/maxT,H=padY+acts.length*rowH+36;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' '+H+'" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="20" text-anchor="middle" fill="#1a237e" font-size="12" font-weight="bold">Activity Selection — Timeline</text>';
  svg+='<line x1="'+padX+'" y1="'+(padY-6)+'" x2="'+(W-10)+'" y2="'+(padY-6)+'" stroke="#546e7a" stroke-width="1.5"/>';
  for(var t=0;t<=maxT;t+=Math.max(1,Math.floor(maxT/8))){var tx=padX+t*scale;svg+='<text x="'+tx+'" y="'+(padY-12)+'" text-anchor="middle" fill="#78909c" font-size="9">'+t+'</text><line x1="'+tx+'" y1="'+(padY-8)+'" x2="'+tx+'" y2="'+(padY-2)+'" stroke="#90a4ae" stroke-width="1"/>';}
  acts.forEach(function(a,i){
    var isSel=selected&&selected.some(function(s){return s.name===a.name;});
    var y=padY+i*rowH,x1=padX+a.s*scale,x2=padX+a.f*scale;
    svg+='<text x="'+(padX-5)+'" y="'+(y+rowH/2+4)+'" text-anchor="end" fill="#1a237e" font-size="11">'+a.name+'</text>';
    svg+='<rect x="'+x1+'" y="'+(y+3)+'" width="'+(x2-x1)+'" height="'+(rowH-6)+'" fill="'+(isSel?'#a5d6a7':'#f5f5f5')+'" stroke="'+(isSel?'#2e7d32':'#90a4ae')+'" stroke-width="'+(isSel?2:1)+'" rx="2"/>';
    svg+='<text x="'+((x1+x2)/2)+'" y="'+(y+rowH/2+4)+'" text-anchor="middle" fill="'+(isSel?'#1b5e20':'#546e7a')+'" font-size="9">['+a.s+','+a.f+']</text>';
    if(isSel)svg+='<text x="'+(x2+4)+'" y="'+(y+rowH/2+4)+'" fill="#1b5e20" font-size="11">✓</text>';
  });
  svg+='</g></svg>';return svg;
}

function svgLCSTable(X,Y){
  if(!X||!Y||X.length>10||Y.length>10)return '';
  var m=X.length,n=Y.length,dp=[];
  for(var i=0;i<=m;i++){dp.push([]);for(var j=0;j<=n;j++)dp[i].push(0);}
  for(var i2=1;i2<=m;i2++)for(var j2=1;j2<=n;j2++){if(X[i2-1]===Y[j2-1])dp[i2][j2]=dp[i2-1][j2-1]+1;else dp[i2][j2]=Math.max(dp[i2-1][j2],dp[i2][j2-1]);}
  var cW=30,cH=26,pX=28,pY=26,W=pX+(n+2)*cW+8,H=pY+(m+2)*cH+20;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' '+H+'" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="15" text-anchor="middle" fill="#1a237e" font-size="11" font-weight="bold">LCS DP Table</text>';
  ['ε'].concat(Y.split('')).forEach(function(h,j){svg+='<text x="'+(pX+cW+(j)*cW+cW/2)+'" y="'+(pY+14)+'" text-anchor="middle" fill="#1565c0" font-size="11" font-weight="bold">'+h+'</text>';});
  for(var i3=0;i3<=m;i3++){
    svg+='<text x="'+(pX+cW/2)+'" y="'+(pY+cH+i3*cH+cH/2+4)+'" text-anchor="middle" fill="#f57c00" font-size="11" font-weight="bold">'+(i3===0?'ε':X[i3-1])+'</text>';
    for(var j3=0;j3<=n;j3++){
      var v=dp[i3][j3],cx=pX+cW+j3*cW,cy=pY+cH+i3*cH;
      var isLCS=i3>0&&j3>0&&X[i3-1]===Y[j3-1]&&v===dp[i3-1][j3-1]+1&&v>0;
      svg+='<rect x="'+cx+'" y="'+cy+'" width="'+cW+'" height="'+cH+'" fill="'+(isLCS?'#c8e6c9':'#fffde7')+'" stroke="#90a4ae" stroke-width="0.8"/>';
      svg+='<text x="'+(cx+cW/2)+'" y="'+(cy+cH/2+4)+'" text-anchor="middle" fill="'+(isLCS?'#1b5e20':'#1a237e')+'" font-size="11" font-weight="bold">'+v+'</text>';
    }
  }
  svg+='<text x="'+(W/2)+'" y="'+(H-4)+'" text-anchor="middle" fill="#78909c" font-size="9">Green = LCS characters found</text>';
  svg+='</g></svg>';return svg;
}

function svgKnapsackDP(items,W){
  if(!items||!items.length||W>16)return '';
  var n=items.length,dp=[];
  for(var i=0;i<=n;i++){dp.push([]);for(var w=0;w<=W;w++)dp[i].push(0);}
  for(var i2=1;i2<=n;i2++)for(var w2=0;w2<=W;w2++){if(items[i2-1].w<=w2)dp[i2][w2]=Math.max(dp[i2-1][w2],dp[i2-1][w2-items[i2-1].w]+items[i2-1].v);else dp[i2][w2]=dp[i2-1][w2];}
  var cW=Math.min(28,Math.floor(380/(W+2))),cH=22,pX=36,pY=26,svgW=pX+(W+1)*cW+8,svgH=pY+(n+2)*cH+16;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+svgW+' '+svgH+'" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(svgW/2)+'" y="15" text-anchor="middle" fill="#1a237e" font-size="10" font-weight="bold">0/1 Knapsack DP Table dp[i][w]</text>';
  svg+='<text x="'+(pX/2)+'" y="'+(pY+14)+'" text-anchor="middle" fill="#1565c0" font-size="8">i\\w</text>';
  for(var w=0;w<=W;w++)svg+='<text x="'+(pX+w*cW+cW/2)+'" y="'+(pY+14)+'" text-anchor="middle" fill="#1565c0" font-size="8">'+w+'</text>';
  for(var i=0;i<=n;i++){
    svg+='<text x="'+(pX/2)+'" y="'+(pY+cH+i*cH+cH/2+3)+'" text-anchor="middle" fill="#f57c00" font-size="8">'+(i===0?'0':items[i-1].name)+'</text>';
    for(var w=0;w<=W;w++){var v=dp[i][w],cx=pX+w*cW,cy=pY+cH+i*cH,isOpt=i===n&&w===W;
      svg+='<rect x="'+cx+'" y="'+cy+'" width="'+cW+'" height="'+cH+'" fill="'+(isOpt?'#a5d6a7':v>0?'#fffde7':'#f5f5f5')+'" stroke="#90a4ae" stroke-width="0.6"/>';
      svg+='<text x="'+(cx+cW/2)+'" y="'+(cy+cH/2+3)+'" text-anchor="middle" fill="'+(isOpt?'#1b5e20':'#1a237e')+'" font-size="8">'+v+'</text>';}
  }
  svg+='</g></svg>';return svg;
}

function svgCoinChangeDP(coins,amount){
  if(!coins||!coins.length||amount<1||amount>28)return '';
  var dp=new Array(amount+1).fill(Infinity);dp[0]=0;
  for(var i=1;i<=amount;i++)for(var ci=0;ci<coins.length;ci++){if(coins[ci]<=i&&dp[i-coins[ci]]+1<dp[i])dp[i]=dp[i-coins[ci]]+1;}
  var cW=Math.min(30,Math.floor(450/(amount+2))),cH=38,pX=16,pY=32,W=pX+(amount+1)*cW+16;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' 96" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="18" text-anchor="middle" fill="#1a237e" font-size="11" font-weight="bold">Coin Change DP Array — coins: {'+coins.join(', ')+'}</text>';
  for(var i=0;i<=amount;i++){var v=dp[i],x=pX+i*cW,y=pY,isOpt=i===amount&&v<Infinity;
    svg+='<rect x="'+x+'" y="'+y+'" width="'+cW+'" height="'+cH+'" fill="'+(isOpt?'#a5d6a7':v<Infinity&&v>0?'#fffde7':'#f5f5f5')+'" stroke="#90a4ae" stroke-width="0.8"/>';
    svg+='<text x="'+(x+cW/2)+'" y="'+(y+22)+'" text-anchor="middle" fill="'+(isOpt?'#1b5e20':'#1a237e')+'" font-size="'+(cW>24?10:8)+'" font-weight="bold">'+(v>=Infinity?'∞':v)+'</text>';
    svg+='<text x="'+(x+cW/2)+'" y="'+(y+cH+12)+'" text-anchor="middle" fill="#78909c" font-size="8">'+i+'</text>';
  }
  svg+='</g></svg>';return svg;
}

function svgJobSlots(slots){
  if(!slots||!slots.length)return '';
  var n=slots.length,sW=Math.min(80,Math.floor(480/n)),sH=50,pX=20,pY=36,gap=8;
  var W=pX+n*(sW+gap)+16;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' 110" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="22" text-anchor="middle" fill="#1a237e" font-size="12" font-weight="bold">Job Scheduling — Slot Allocation</text>';
  slots.forEach(function(job,i){var x=pX+i*(sW+gap),y=pY;
    svg+='<rect x="'+x+'" y="'+y+'" width="'+sW+'" height="'+sH+'" fill="'+(job?'#b3e5fc':'#f5f5f5')+'" stroke="'+(job?'#0288d1':'#90a4ae')+'" stroke-width="'+(job?2:1)+'" rx="4"/>';
    svg+='<text x="'+(x+sW/2)+'" y="'+(y+22)+'" text-anchor="middle" fill="'+(job?'#01579b':'#90a4ae')+'" font-size="12" font-weight="bold">'+(job?job.name:'—')+'</text>';
    if(job)svg+='<text x="'+(x+sW/2)+'" y="'+(y+38)+'" text-anchor="middle" fill="#0277bd" font-size="10">p='+job.p+'</text>';
    svg+='<text x="'+(x+sW/2)+'" y="'+(y+sH+16)+'" text-anchor="middle" fill="#546e7a" font-size="10">Slot '+(i+1)+'</text>';
  });
  svg+='</g></svg>';return svg;
}

function svgQuickSortArray(arr){
  if(!arr||!arr.length)return '';
  var n=arr.length,cW=Math.min(48,Math.floor(460/n)),cH=50,pX=18,pY=30;
  var W=pX+n*cW+18,maxV=Math.max.apply(null,arr.concat([1]));
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' 120" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();svg+='<g filter="url(#hw-sketch)">';
  svg+='<text x="'+(W/2)+'" y="18" text-anchor="middle" fill="#1a237e" font-size="11" font-weight="bold">Quick Sort — Pivot = '+arr[n-1]+'</text>';
  arr.forEach(function(v,i){var x=pX+i*cW,y=pY,isPiv=i===n-1,fill=isPiv?'#ff8a65':v<arr[n-1]?'#b3e5fc':'#f5f5f5';
    svg+='<rect x="'+x+'" y="'+y+'" width="'+cW+'" height="'+cH+'" fill="'+fill+'" stroke="'+(isPiv?'#bf360c':'#546e7a')+'" stroke-width="'+(isPiv?2:1.5)+'" rx="2"/>';
    var bH=Math.max(4,Math.floor((v/maxV)*(cH-12)));
    svg+='<rect x="'+(x+3)+'" y="'+(y+cH-bH-2)+'" width="'+(cW-6)+'" height="'+bH+'" fill="'+(isPiv?'#bf360c':v<arr[n-1]?'#0288d1':'#78909c')+'" rx="2" opacity="0.6"/>';
    svg+='<text x="'+(x+cW/2)+'" y="'+(y+cH+14)+'" text-anchor="middle" fill="'+(isPiv?'#bf360c':'#1a237e')+'" font-size="12" font-weight="bold">'+v+'</text>';
    if(isPiv)svg+='<text x="'+(x+cW/2)+'" y="'+(y-6)+'" text-anchor="middle" fill="#bf360c" font-size="9" font-weight="bold">PIVOT</text>';
  });
  svg+='<text x="12" y="116" fill="#78909c" font-size="9">Blue=≤pivot | Gray=>pivot | Orange=pivot element</text>';
  svg+='</g></svg>';return svg;
}

function svgFlowchart(steps){
  if(!steps||!steps.length)return '';
  var bW=200,bH=36,pX=60,gap=48,W=bW+pX*2;
  var H=40+(steps.length*(bH+gap))+20;
  var cx=pX+bW/2;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' '+H+'" font-family="Kalam,cursive">';
  svg+=svgSketchFilter();
  svg+='<defs><marker id="fcarr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M1,2 L7,4 L1,6 Z" fill="#1a237e"/></marker></defs>';
  svg+='<g filter="url(#hw-sketch)">';
  steps.forEach(function(step,i){
    var y=30+i*(bH+gap);
    if(step.type==='terminal')svg+='<ellipse cx="'+cx+'" cy="'+(y+bH/2)+'" rx="'+(bW/2)+'" ry="'+(bH/2)+'" fill="#e8f4fd" stroke="#1a237e" stroke-width="1.5"/>';
    else if(step.type==='decision')svg+='<polygon points="'+cx+','+y+' '+(cx+bW/2)+','+(y+bH/2)+' '+cx+','+(y+bH)+' '+(cx-bW/2)+','+(y+bH/2)+'" fill="#fffde7" stroke="#1a237e" stroke-width="1.5"/>';
    else svg+='<rect x="'+pX+'" y="'+y+'" width="'+bW+'" height="'+bH+'" fill="#ffffff" stroke="#1a237e" stroke-width="1.5" rx="3"/>';
    svg+='<text x="'+cx+'" y="'+(y+bH/2+4)+'" text-anchor="middle" fill="#1a237e" font-size="11">'+step.text+'</text>';
    if(i<steps.length-1)svg+='<line x1="'+cx+'" y1="'+(y+bH)+'" x2="'+cx+'" y2="'+(y+bH+gap-8)+'" stroke="#1a237e" stroke-width="1.5" marker-end="url(#fcarr)"/>';
  });
  svg+='</g></svg>';return svg;
}

// ─── HANDWRITTEN HTML BUILDERS ────────────────────────────────────────────────
function hwEsc(s){return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function hwSectionLabel(label){
  return '<div class="hw-section-label"><span class="hw-label-arrow">▷</span>'+hwEsc(label)+'</div>';
}

function hwParagraph(text){return '<p class="hw-para">'+hwEsc(text)+'</p>';}

function hwAlgoSteps(steps){
  var h='<ol class="hw-algo-list">';
  steps.forEach(function(s){h+='<li class="hw-algo-step">'+hwEsc(s)+'</li>';});
  return h+'</ol>';
}

function hwPseudocode(code){
  return '<div class="hw-pseudo-wrap"><div class="hw-pseudo-label">PSEUDOCODE:</div><pre class="hw-pre">'+hwEsc(code)+'</pre></div>';
}

function hwComplexityTable(cx){
  return '<div class="hw-cx-table">'
    +'<div class="hw-cx-row"><div class="hw-cx-case">Best Case :</div><div class="hw-cx-val">'+hwEsc(cx.best)+'</div></div>'
    +'<div class="hw-cx-row"><div class="hw-cx-case">Average Case :</div><div class="hw-cx-val">'+hwEsc(cx.avg)+'</div></div>'
    +'<div class="hw-cx-row"><div class="hw-cx-case">Worst Case :</div><div class="hw-cx-val">'+hwEsc(cx.worst)+'</div></div>'
    +'<div class="hw-cx-row hw-cx-space"><div class="hw-cx-case">Space Complexity :</div><div class="hw-cx-val">'+hwEsc(cx.space)+'</div></div>'
    +'</div>';
}

function hwBulletList(items,color){
  color=color||'#1a237e';
  var h='<ul class="hw-ul">';
  items.forEach(function(it){h+='<li style="color:'+color+'"><span class="hw-bullet">✦</span> '+hwEsc(it)+'</li>';});
  return h+'</ul>';
}

function hwVivaSection(meta){
  var h='<div class="hw-viva">';
  meta.viva.forEach(function(qa,i){
    h+='<div class="hw-viva-q"><span class="hw-q-num">Q'+(i+1)+'.</span> '+hwEsc(qa.q)+'</div>';
    h+='<div class="hw-viva-a"><span class="hw-a-lbl">Ans:</span> '+hwEsc(qa.a)+'</div>';
  });
  return h+'</div>';
}

function hwMarkAnswers(meta){
  var h='<div class="hw-marks">';
  h+='<div class="hw-mark-section"><span class="hw-mark-badge">2 Marks</span><div class="hw-mark-ans">'+hwEsc(meta.aim)+'</div></div>';
  h+='<div class="hw-mark-section"><span class="hw-mark-badge">3 Marks</span><div class="hw-mark-ans">'+hwEsc(meta.theory.substring(0,280))+'</div></div>';
  var algoText='Algorithm: '+meta.algorithm.map(function(s,i){return (i+1)+'. '+s;}).join(' ');
  h+='<div class="hw-mark-section"><span class="hw-mark-badge">7 Marks</span><div class="hw-mark-ans">'+hwEsc(meta.theory)+'<br><br>'+hwEsc(algoText)+'</div></div>';
  h+='<div class="hw-mark-section"><span class="hw-mark-badge">14 Marks</span><div class="hw-mark-ans">Complete solution — Aim, Theory, Algorithm, Pseudocode, Dry Run with tables, Complexity Analysis, Applications, Advantages, Disadvantages, Conclusion. See all sections above.</div></div>';
  return h+'</div>';
}

function hwDryRunTable(headers,rows){
  if(!rows||!rows.length)return '';
  var h='<div class="hw-table-wrap"><table class="hw-table"><thead><tr>';
  headers.forEach(function(hd){h+='<th>'+hwEsc(hd)+'</th>';});
  h+='</tr></thead><tbody>';
  rows.forEach(function(row,ri){h+='<tr>'+(row.map(function(c){return '<td>'+hwEsc(c)+'</td>';}).join(''))+'</tr>';});
  return h+'</tbody></table></div>';
}

function hwSVGBlock(svgContent,caption){
  return '<div class="hw-svg-block">'+svgContent+(caption?'<div class="hw-svg-caption">Fig: '+hwEsc(caption)+'</div>':'')+'</div>';
}

function hwResult(label,value){
  return '<div class="hw-result"><div class="hw-result-label">∴ '+hwEsc(label)+'</div><div class="hw-result-val">'+hwEsc(value)+'</div></div>';
}

// ─── DRY RUN FROM STATE ───────────────────────────────────────────────────────
function buildDryRun(toolIdx){
  try{
    if(toolIdx===4){
      var arrEl=document.getElementById('bs-array'),targEl=document.getElementById('bs-target');
      var arr=(arrEl?arrEl.value:'').split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x);}).sort(function(a,b){return a-b;});
      var target=parseInt(targEl?targEl.value:0)||0;
      var rows=[],lo=0,hi=arr.length-1,iter=1;
      while(lo<=hi&&iter<=20){var mid=Math.floor((lo+hi)/2),act=arr[mid]===target?'FOUND ✓':arr[mid]<target?'Go Right →':'Go Left ←';rows.push([iter,lo,hi,mid,arr[mid],target,act]);if(arr[mid]===target)break;else if(arr[mid]<target)lo=mid+1;else hi=mid-1;iter++;}
      return {svg:svgBinarySearch(arr,target,lo,rows.length>0?parseInt(rows[rows.length-1][3]):-1,hi),table:hwDryRunTable(['Step','Low','High','Mid','A[mid]','Target','Action'],rows)};
    }
    if(toolIdx===0){
      var arr2=(sortArray||[]),comps=document.getElementById('stat-comparisons')?document.getElementById('stat-comparisons').textContent:'—',swps=document.getElementById('stat-swaps')?document.getElementById('stat-swaps').textContent:'—';
      return {svg:svgQuickSortArray(arr2),table:hwDryRunTable(['Comparisons','Swaps','Array Accesses','Current State'],[[comps,swps,document.getElementById('stat-accesses')?document.getElementById('stat-accesses').textContent:'—',arr2.join(', ')]])};
    }
    if(toolIdx===3){var xEl=document.getElementById('lcs-x'),yEl=document.getElementById('lcs-y'),X=(xEl?xEl.value:'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,8),Y=(yEl?yEl.value:'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,8);return {svg:svgLCSTable(X,Y),table:''};}
    if(toolIdx===1){var items=(ksItems||[]),W=parseInt(document.getElementById('ks-capacity')?document.getElementById('ks-capacity').value:0)||0;return {svg:svgKnapsackDP(items,Math.min(W,16)),table:hwDryRunTable(['Item','Weight (wᵢ)','Value (vᵢ)','v/w'],items.map(function(it){return [it.name,it.w,it.v,(it.v/it.w).toFixed(2)];}))}}
    if(toolIdx===6){var arr3=(qsArray||[]);return {svg:svgQuickSortArray(arr3),table:hwDryRunTable(['Step','Array State','Pivot','Comparisons','Swaps'],[['Initial','['+arr3.join(',')+']',arr3[arr3.length-1]||'—','0','0'],['Final','['+arr3.slice().sort(function(a,b){return a-b;}).join(',')+']','—',qsComparisons||'—',qsSwaps||'—']])};}
    if(toolIdx===8){var acts=(actData||[]).filter(function(a){return a.f>a.s;}).sort(function(a,b){return a.f-b.f;});var sel=[],lastF=-Infinity;acts.forEach(function(a){if(a.s>=lastF){sel.push(a);lastF=a.f;}});return {svg:svgActivityTimeline(acts,sel),table:hwDryRunTable(['Activity','Start sᵢ','Finish fᵢ','Selected?','Reason'],acts.map(function(a,i){var isSel=sel.some(function(s){return s.name===a.name;});return [a.name,a.s,a.f,isSel?'✅ Yes':'❌ No',i===0?'First (always)':(isSel?'start≥lastFinish':'start<lastFinish')];}))}}
    if(toolIdx===11){var coinsEl=document.getElementById('cc-coins'),amtEl=document.getElementById('cc-amount'),coins=(coinsEl?coinsEl.value:'').split(',').map(function(s){return parseInt(s.trim());}).filter(function(x){return !isNaN(x)&&x>0;}),amount=parseInt(amtEl?amtEl.value:0)||0;return {svg:svgCoinChangeDP(coins,Math.min(amount,28)),table:''};}
    if(toolIdx===12){var jobs=(jsData||[]).filter(function(j){return j.d>0&&j.p>0;}).sort(function(a,b){return b.p-a.p;});var maxD=jobs.length?Math.max.apply(null,jobs.map(function(j){return j.d;})):0;var slots=new Array(maxD).fill(null),schd=[];jobs.forEach(function(job){for(var t=Math.min(job.d-1,maxD-1);t>=0;t--){if(slots[t]===null){slots[t]=job;schd.push({job:job,slot:t+1});break;}}});return {svg:svgJobSlots(slots),table:hwDryRunTable(['Job (sorted by profit)','Profit','Deadline','Slot','Status'],jobs.map(function(j){var a=schd.find(function(s){return s.job.name===j.name;});return [j.name,j.p,j.d,a?a.slot:'—',a?'✅ Selected':'❌ Rejected'];}))}}
    if(toolIdx===7){var items=(fkItems||[]).filter(function(x){return x.w>0&&x.v>0;}).map(function(it){return Object.assign({},it,{ratio:(it.v/it.w).toFixed(2)});}).sort(function(a,b){return b.ratio-a.ratio;});return {svg:'',table:hwDryRunTable(['Item','Weight','Value','v/w Ratio','Action'],items.map(function(it,i){return [it.name,it.w,it.v,it.ratio,'Include']}))};}
  }catch(e){console.warn('DryRun err:',e);}
  return {svg:'',table:''};
}

// ─── EXAM CONTENT GENERATOR ───────────────────────────────────────────────────
function buildExamContent(toolIdx,title){
  var meta=ALGO_META[toolIdx];
  if(!meta)return '<p class="hw-para">Run the simulator with your input before exporting.</p>';
  var dr=buildDryRun(toolIdx);
  var flowSteps=[{type:'terminal',text:'START'},{type:'process',text:'Read Input Data'},{type:'decision',text:'Valid Input?'},{type:'process',text:'Initialize Variables'},{type:'process',text:'Execute Core Algorithm'},{type:'decision',text:'Termination?'},{type:'process',text:'Compute Result'},{type:'terminal',text:'STOP'}];
  var html='';
  html+=hwSectionLabel('AIM');
  html+=hwParagraph(meta.aim);
  html+=hwSectionLabel('THEORY');
  html+=hwParagraph(meta.theory);
  html+=hwSectionLabel('ALGORITHM');
  html+=hwAlgoSteps(meta.algorithm);
  html+=hwSectionLabel('PSEUDOCODE');
  html+=hwPseudocode(meta.pseudocode);
  html+=hwSectionLabel('FLOWCHART');
  html+=hwSVGBlock(svgFlowchart(flowSteps),'Flowchart — '+title);
  html+=hwSectionLabel('DRY RUN / ITERATION TABLE');
  if(dr.svg)html+=hwSVGBlock(dr.svg,'Step-by-step diagram');
  if(dr.table)html+=dr.table;
  else html+=hwParagraph('Enter input in the simulator and run it, then export to see the auto-generated iteration table.');
  html+=hwSectionLabel('DIAGRAM / VISUALIZATION');
  var tool=document.getElementById('tool-'+toolIdx),canvases=tool?tool.querySelectorAll('canvas'):[];
  canvases.forEach(function(c){if(c.width>50&&c.height>50){try{var cv=document.createElement('canvas');cv.width=c.width;cv.height=c.height;var ctx=cv.getContext('2d');ctx.fillStyle='#fffef5';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(c,0,0);html+='<div class="hw-canvas-img"><img src="'+cv.toDataURL('image/png')+'" style="max-width:100%;border:1.5px solid #90a4ae;border-radius:4px"></div>';}catch(e){}}});
  html+=hwSectionLabel('COMPLEXITY ANALYSIS');
  html+=hwComplexityTable(meta.complexity);
  html+=hwSectionLabel('APPLICATIONS');
  html+=hwBulletList(meta.applications,'#1565c0');
  html+=hwSectionLabel('ADVANTAGES');
  html+=hwBulletList(meta.advantages,'#2e7d32');
  html+=hwSectionLabel('DISADVANTAGES');
  html+=hwBulletList(meta.disadvantages,'#b71c1c');
  html+=hwSectionLabel('MARK-WISE ANSWERS (GTU Exam Preparation)');
  html+=hwMarkAnswers(meta);
  html+=hwSectionLabel('VIVA QUESTIONS & ANSWERS');
  html+=hwVivaSection(meta);
  html+=hwSectionLabel('GTU EXAM TIPS');
  html+='<div class="hw-tips">'
    +'<div class="hw-tip">📌 Always state the paradigm: '+hwEsc(meta.paradigm)+'</div>'
    +'<div class="hw-tip">📌 Write recurrence/formula before algorithm steps</div>'
    +'<div class="hw-tip">📌 Draw the DP table / execution trace — carries 30% marks</div>'
    +'<div class="hw-tip">📌 State all complexities: Best, Average, Worst + Space</div>'
    +'<div class="hw-tip">📌 Write clear conclusion: "Hence '+hwEsc(title)+' is implemented using '+hwEsc(meta.paradigm)+' technique."</div>'
    +'</div>';
  html+=hwSectionLabel('CONCLUSION');
  html+=hwParagraph(meta.conclusion);
  html+=hwResult('Result','The '+title+' was successfully studied and implemented using '+meta.paradigm+' technique. Time Complexity: '+meta.complexity.worst+'. Space Complexity: '+meta.complexity.space+'.');
  return html;
}

// ─── SHEET ASSEMBLER ──────────────────────────────────────────────────────────
function buildExamSheet(toolIdx,title){
  var meta=ALGO_META[toolIdx]||{};
  var now=new Date();
  var sheet=document.createElement('div');
  sheet.className='hw-sheet';
  sheet.innerHTML=
    '<div class="hw-margin-line"></div>'
    +'<div class="hw-ruled-lines"></div>'
    +'<div class="hw-page-header">'
      +'<div class="hw-college-name">GTU — Design &amp; Analysis of Algorithms (3150703)</div>'
      +'<div class="hw-header-meta">'
        +'<div>Date: '+now.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})+'</div>'
        +'<div>Page: 1</div>'
      +'</div>'
    +'</div>'
    +'<div class="hw-exp-info">'
      +(meta.exp||'Experiment')+'&nbsp;&nbsp;&nbsp;'
      +'<span class="hw-exp-title">'+title+'</span>'
      +(meta.category?'&nbsp;|&nbsp;<em>'+meta.category+' — '+meta.paradigm+'</em>':'')
    +'</div>'
    +'<div class="hw-content">'+buildExamContent(toolIdx,title)+'</div>'
    +'<div class="hw-page-footer">'
      +'<span>⚡ ADA Algorithm Lab — GTU 3150703</span>'
      +'<span>Generated: '+now.toLocaleDateString('en-IN')+'</span>'
    +'</div>';
  return sheet;
}

// ─── EXPORT MENU ──────────────────────────────────────────────────────────────
function showExportMenu(toolIdx,title){
  var ex=document.getElementById('hw-export-menu');if(ex)ex.remove();
  var menu=document.createElement('div');menu.id='hw-export-menu';
  menu.innerHTML=
    '<div class="hw-menu-backdrop" onclick="document.getElementById(\'hw-export-menu\').remove()"></div>'
    +'<div class="hw-menu-box">'
      +'<div class="hw-menu-title">Export — <em>'+hwEsc(title)+'</em></div>'
      +'<button class="hw-menu-btn hw-btn-exam" onclick="exportHandwrittenPDF('+toolIdx+',\''+title.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">'
        +'✍️ <strong>Handwritten Exam Journal PDF</strong>'
        +'<div class="hw-btn-desc">Aim · Theory · Algorithm · Pseudocode · Flowchart · Dry Run · Complexity · Viva · GTU Tips</div>'
      +'</button>'
      +'<button class="hw-menu-btn hw-btn-viva" onclick="exportVivaPDF('+toolIdx+',\''+title.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">'
        +'🎓 <strong>Viva Preparation PDF</strong>'
        +'<div class="hw-btn-desc">5 Viva Q&A · Mark-wise answers (2,3,7,14 marks) · Complexity summary</div>'
      +'</button>'
      +'<button class="hw-menu-btn hw-btn-viz" onclick="exportVisualizationPDF('+toolIdx+',\''+title.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">'
        +'📊 <strong>Visualization PDF</strong>'
        +'<div class="hw-btn-desc">Canvas screenshots · Complexity table · Applications</div>'
      +'</button>'
      +'<button class="hw-menu-close" onclick="document.getElementById(\'hw-export-menu\').remove()">✕ Close</button>'
    +'</div>';
  document.body.appendChild(menu);
}

// ─── MULTI-PAGE PDF HELPER ────────────────────────────────────────────────────
async function renderMultiPagePDF(sheet,filename){
  document.body.appendChild(sheet);
  await new Promise(function(r){setTimeout(r,250);});
  var fullCanvas=await html2canvas(sheet,{backgroundColor:'#fffef7',scale:2,useCORS:true,logging:false,allowTaint:true});
  document.body.removeChild(sheet);
  var {jsPDF}=window.jspdf;
  var pdf=new jsPDF('p','mm','a4');
  var pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=6;
  var availW=pageW-margin*2,availH=pageH-margin*2;
  var pxPerMM=fullCanvas.width/availW;
  var sliceHeightPx=Math.floor(availH*pxPerMM);
  var totalPages=Math.ceil(fullCanvas.height/sliceHeightPx);
  for(var p=0;p<totalPages;p++){
    var startY=p*sliceHeightPx,endY=Math.min(startY+sliceHeightPx,fullCanvas.height),actualH=endY-startY;
    if(actualH<=0)break;
    var sliceCanvas=document.createElement('canvas');
    sliceCanvas.width=fullCanvas.width;sliceCanvas.height=actualH;
    var sctx=sliceCanvas.getContext('2d');
    sctx.fillStyle='#fffef7';sctx.fillRect(0,0,sliceCanvas.width,actualH);
    sctx.drawImage(fullCanvas,0,startY,fullCanvas.width,actualH,0,0,fullCanvas.width,actualH);
    var sliceData=sliceCanvas.toDataURL('image/png');
    if(p>0)pdf.addPage();
    pdf.setFillColor(255,254,247);pdf.rect(0,0,pageW,pageH,'F');
    var sH=actualH/pxPerMM;
    pdf.addImage(sliceData,'PNG',margin,margin,availW,Math.min(sH,availH));
  }
  pdf.save(filename);
}

// ─── EXPORT: HANDWRITTEN EXAM PDF ─────────────────────────────────────────────
async function exportHandwrittenPDF(toolIdx,title){
  var menuEl=document.getElementById('hw-export-menu');if(menuEl)menuEl.remove();
  var overlay=document.getElementById('pdf-export-overlay');if(overlay)overlay.classList.add('show');
  try{
    if(document.fonts&&document.fonts.load)await Promise.all([document.fonts.load('16px Kalam'),document.fonts.load('16px Caveat')]).catch(function(){});
    var sheet=buildExamSheet(toolIdx,title);
    await renderMultiPagePDF(sheet,title.replace(/[^a-z0-9]+/gi,'_')+'_GTU_Journal.pdf');
    showToast('✍️ Handwritten Journal PDF exported!','success');
  }catch(err){console.error(err);showToast('Export failed: '+err.message,'');}
  finally{if(overlay)overlay.classList.remove('show');}
}

// ─── EXPORT: VIVA PDF ─────────────────────────────────────────────────────────
async function exportVivaPDF(toolIdx,title){
  var menuEl=document.getElementById('hw-export-menu');if(menuEl)menuEl.remove();
  var overlay=document.getElementById('pdf-export-overlay');if(overlay)overlay.classList.add('show');
  try{
    if(document.fonts&&document.fonts.load)await Promise.all([document.fonts.load('16px Kalam'),document.fonts.load('16px Caveat')]).catch(function(){});
    var meta=ALGO_META[toolIdx];if(!meta){showToast('No metadata for this tool','');return;}
    var now=new Date();
    var sheet=document.createElement('div');sheet.className='hw-sheet';
    sheet.innerHTML='<div class="hw-margin-line"></div>'
      +'<div class="hw-page-header"><div class="hw-college-name">GTU 3150703 — Viva Preparation: '+hwEsc(title)+'</div>'
      +'<div class="hw-header-meta"><div>'+now.toLocaleDateString('en-IN')+'</div></div></div>'
      +'<div class="hw-exp-info">'+hwEsc(meta.exp||'')+'&nbsp;&nbsp;'+hwEsc(title)+'&nbsp;|&nbsp;'+hwEsc(meta.paradigm||'')+'</div>'
      +'<div class="hw-content">'
      +hwSectionLabel('VIVA QUESTIONS & ANSWERS')+hwVivaSection(meta)
      +hwSectionLabel('MARK-WISE ANSWERS')+hwMarkAnswers(meta)
      +hwSectionLabel('COMPLEXITY ANALYSIS')+hwComplexityTable(meta.complexity)
      +hwSectionLabel('APPLICATIONS')+hwBulletList(meta.applications,'#1565c0')
      +hwSectionLabel('CONCLUSION')+hwParagraph(meta.conclusion)
      +'</div><div class="hw-page-footer"><span>⚡ ADA Algorithm Lab — Viva Prep</span><span>'+now.toLocaleDateString('en-IN')+'</span></div>';
    await renderMultiPagePDF(sheet,title.replace(/[^a-z0-9]+/gi,'_')+'_Viva_Prep.pdf');
    showToast('🎓 Viva Prep PDF exported!','success');
  }catch(err){showToast('Export failed: '+err.message,'');}
  finally{if(overlay)overlay.classList.remove('show');}
}

// ─── EXPORT: VISUALIZATION PDF ────────────────────────────────────────────────
async function exportVisualizationPDF(toolIdx,title){
  var menuEl=document.getElementById('hw-export-menu');if(menuEl)menuEl.remove();
  var overlay=document.getElementById('pdf-export-overlay');if(overlay)overlay.classList.add('show');
  try{
    var meta=ALGO_META[toolIdx];
    var tool=document.getElementById('tool-'+toolIdx),canvases=tool?tool.querySelectorAll('canvas'):[];
    var now=new Date();
    var sheet=document.createElement('div');sheet.className='hw-sheet';
    var cHtml='';
    canvases.forEach(function(c){if(c.width>50){try{var cv=document.createElement('canvas');cv.width=c.width;cv.height=c.height;var ctx=cv.getContext('2d');ctx.fillStyle='#0a0e1a';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(c,0,0);cHtml+='<div class="hw-canvas-img"><img src="'+cv.toDataURL('image/png')+'" style="max-width:100%;border-radius:6px;margin-bottom:10px"></div>';}catch(e){}}});
    if(!cHtml)cHtml=hwParagraph('Run the simulator first to capture visualization.');
    sheet.innerHTML='<div class="hw-margin-line"></div>'
      +'<div class="hw-page-header"><div class="hw-college-name">ADA Lab — Visualization: '+hwEsc(title)+'</div><div class="hw-header-meta"><div>'+now.toLocaleDateString('en-IN')+'</div></div></div>'
      +'<div class="hw-content">'
      +hwSectionLabel('VISUALIZATION')+cHtml
      +(meta?hwSectionLabel('COMPLEXITY ANALYSIS')+hwComplexityTable(meta.complexity):'')
      +(meta?hwSectionLabel('APPLICATIONS')+hwBulletList(meta.applications,'#1565c0'):'')
      +(meta?hwSectionLabel('VIVA QUESTIONS')+hwVivaSection(meta):'')
      +'</div><div class="hw-page-footer"><span>⚡ ADA Algorithm Lab</span><span>'+now.toLocaleDateString('en-IN')+'</span></div>';
    await renderMultiPagePDF(sheet,title.replace(/[^a-z0-9]+/gi,'_')+'_Visualization.pdf');
    showToast('📊 Visualization PDF exported!','success');
  }catch(err){showToast('Export failed: '+err.message,'');}
  finally{if(overlay)overlay.classList.remove('show');}
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────
function exportToolPDF(toolIdx,title){
  showExportMenu(toolIdx,title);
}

