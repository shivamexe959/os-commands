// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
function showTool(idx) {
  document.querySelectorAll('.tool').forEach((t,i) => t.classList.toggle('active', i===idx));
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function(t,i) {
    t.classList.toggle('active', i===idx);
    t.setAttribute('aria-selected', i===idx ? 'true' : 'false');
  });
  var activeTab = tabs[idx];
  if (activeTab) {
    var titleEl = document.getElementById('active-tool-title');
    if (titleEl) titleEl.innerHTML = activeTab.innerHTML;
  }
  var sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth <= 992) sidebar.classList.remove('active-mobile');
  if(idx===0) { setTimeout(()=>{ sortResizeCanvas(); sortDrawBars(); },100); }
  if(idx===2) { setTimeout(()=>mstResizeCanvas(),100); }
  if(idx===9) { setTimeout(()=>bfsdfsResizeCanvas(),100); }
  if(idx===13) { setTimeout(()=>djkResizeCanvas(),100); }
  if(idx===16 && typeof buildCoverageAnalytics==='function') buildCoverageAnalytics();
  if(idx===17 && typeof renderGallery==='function') renderGallery();
  if(idx===18) { var board=document.getElementById('nq-board'); if(board&&board.innerHTML===''&&typeof nqReset==='function') nqReset(); }
  if(idx===19 && typeof buildAlgoTree==='function') buildAlgoTree();
  if(idx===20 && typeof wbInit==='function') setTimeout(wbInit,60);
  if(idx===21 && typeof cgbInit==='function') setTimeout(cgbInit,60);
  if(idx===22 && typeof buildNotesGrid==='function') buildNotesGrid();
}

function showToast(msg, type='error') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + (type==='success'?'success':type==='info'?'info':'');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(), 3100);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function shuffleArray(arr) {
  for(let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

let _confettiActive = false;
function launchConfetti() {
  if(_confettiActive) return;
  _confettiActive = true;
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#f97316'];
  const frag = document.createDocumentFragment();
  for(let i=0;i<60;i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100+'vw';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration = (1.5+Math.random()*2)+'s';
    p.style.animationDelay = Math.random()*0.5+'s';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    p.style.width = (6+Math.random()*10)+'px';
    p.style.height = (6+Math.random()*10)+'px';
    frag.appendChild(p);
  }
  document.body.appendChild(frag);
  setTimeout(()=>{
    document.querySelectorAll('.confetti-piece').forEach(p=>p.remove());
    _confettiActive = false;
  }, 3600);
}

// ═══════════════════════════════════════════════════════════
// TOOL 1: SORTING VISUALIZER
// ═══════════════════════════════════════════════════════════
let sortArray = [];
let sortRunning = false;
let sortPaused = false;
let sortShouldStop = false;
let sortComparisons=0, sortSwaps=0, sortAccesses=0;
let sortDelay = 80;
let sortStates = [];

const sortCanvas = document.getElementById('sort-canvas');
const sortCtx = sortCanvas.getContext('2d');

const sortComplexities = {
  bubble:    { best:'O(n)', avg:'O(n²)', worst:'O(n²)' },
  selection: { best:'O(n²)', avg:'O(n²)', worst:'O(n²)' },
  insertion: { best:'O(n)', avg:'O(n²)', worst:'O(n²)' },
  merge:     { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)' },
  heap:      { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)' },
  counting:  { best:'O(n+k)', avg:'O(n+k)', worst:'O(n+k)' },
  bucket:    { best:'O(n+k)', avg:'O(n+k)', worst:'O(n²)' },
};

function updateSortSpeed() {
  const v = parseInt(document.getElementById('sort-speed').value);
  const labels = ['','Slow','Medium','Fast'];
  const delays = [200,200,80,20];
  document.getElementById('sort-speed-val').textContent = labels[v];
  sortDelay = delays[v];
}

function sortResizeCanvas() {
  const container = document.getElementById('sort-canvas-container');
  sortCanvas.width = container.clientWidth;
  sortCanvas.height = container.clientHeight;
}

function sortGenRandom() {
  sortShouldStop = true;
  sortRunning = false;
  const n = parseInt(document.getElementById('sort-size').value);
  sortArray = Array.from({length:n},()=>Math.floor(Math.random()*90)+10);
  sortStates = new Array(n).fill('default');
  sortReset(); sortDrawBars();
}

function sortGenNearly() {
  sortShouldStop = true;
  sortRunning = false;
  const n = parseInt(document.getElementById('sort-size').value);
  sortArray = Array.from({length:n},(_,i)=>Math.floor((i/n)*90)+10);
  for(let i=0;i<Math.floor(n*0.15);i++){
    const a=Math.floor(Math.random()*n), b=Math.floor(Math.random()*n);
    [sortArray[a],sortArray[b]]=[sortArray[b],sortArray[a]];
  }
  sortStates = new Array(n).fill('default');
  sortReset(); sortDrawBars();
}

function sortGenReversed() {
  sortShouldStop = true;
  sortRunning = false;
  const n = parseInt(document.getElementById('sort-size').value);
  sortArray = Array.from({length:n},(_,i)=>Math.floor(((n-i)/n)*90)+10);
  sortStates = new Array(n).fill('default');
  sortReset(); sortDrawBars();
}

function sortApplyCustom() {
  sortShouldStop = true;
  sortRunning = false;
  const raw = document.getElementById('sort-custom').value;
  const parsed = raw.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x));
  if(parsed.length<2){showToast('Enter at least 2 valid numbers');return;}
  sortArray = parsed.slice(0,60);
  sortStates = new Array(sortArray.length).fill('default');
  sortReset(); sortDrawBars();
}

function sortReset() {
  sortShouldStop=true; sortRunning=false;
  sortComparisons=0; sortSwaps=0; sortAccesses=0;
  document.getElementById('stat-comparisons').textContent='0';
  document.getElementById('stat-swaps').textContent='0';
  document.getElementById('stat-accesses').textContent='0';
  const algo = document.getElementById('sort-algo').value;
  const cx = sortComplexities[algo];
  document.getElementById('stat-complexity').textContent = cx.avg;
}

function sortUpdateStats() {
  document.getElementById('stat-comparisons').textContent = sortComparisons;
  document.getElementById('stat-swaps').textContent = sortSwaps;
  document.getElementById('stat-accesses').textContent = sortAccesses;
}

function sortDrawBars(comparing=[], swapping=[], sorted=[]) {
  sortResizeCanvas();
  const W = sortCanvas.width, H = sortCanvas.height;
  sortCtx.clearRect(0,0,W,H);
  const n = sortArray.length;
  const maxVal = Math.max(...sortArray, 1);
  const barW = Math.max(2, (W - n*2) / n);
  const floorY = H - 20;

  // reflection
  const grad = sortCtx.createLinearGradient(0, floorY, 0, H);
  grad.addColorStop(0,'rgba(59,130,246,0.15)');
  grad.addColorStop(1,'rgba(59,130,246,0)');
  sortCtx.fillStyle = grad;
  sortCtx.fillRect(0, floorY, W, H-floorY);

  // floor line
  sortCtx.strokeStyle='rgba(255,255,255,0.1)';
  sortCtx.lineWidth=1;
  sortCtx.beginPath();
  sortCtx.moveTo(0,floorY); sortCtx.lineTo(W,floorY);
  sortCtx.stroke();

  for(let i=0;i<n;i++) {
    const x = i*(barW+2) + 1;
    const barH = Math.max(4, (sortArray[i]/maxVal)*(floorY-10));
    const y = floorY - barH;

    let color;
    if(sorted.includes(i) || sortStates[i]==='sorted') color='#10b981';
    else if(swapping.includes(i)) color='#ef4444';
    else if(comparing.includes(i)) color='#f59e0b';
    else {
      const barGrad = sortCtx.createLinearGradient(x, y+barH, x, y);
      barGrad.addColorStop(0,'#3b82f6');
      barGrad.addColorStop(1,'#8b5cf6');
      color = barGrad;
    }

    // shadow on highlighted
    if(swapping.includes(i)) {
      sortCtx.shadowColor='rgba(239,68,68,0.6)';
      sortCtx.shadowBlur=12;
    } else if(comparing.includes(i)) {
      sortCtx.shadowColor='rgba(245,158,11,0.6)';
      sortCtx.shadowBlur=12;
    } else if(sorted.includes(i)||sortStates[i]==='sorted') {
      sortCtx.shadowColor='rgba(16,185,129,0.4)';
      sortCtx.shadowBlur=8;
    } else {
      sortCtx.shadowBlur=0;
    }

    sortCtx.fillStyle = color;
    const r = Math.min(4, barW/2);
    sortCtx.beginPath();
    sortCtx.moveTo(x+r,y);
    sortCtx.lineTo(x+barW-r,y);
    sortCtx.quadraticCurveTo(x+barW,y,x+barW,y+r);
    sortCtx.lineTo(x+barW,y+barH);
    sortCtx.lineTo(x,y+barH);
    sortCtx.lineTo(x,y+r);
    sortCtx.quadraticCurveTo(x,y,x+r,y);
    sortCtx.closePath();
    sortCtx.fill();
    sortCtx.shadowBlur=0;

    // value on top for small arrays
    if(n<=30) {
      sortCtx.fillStyle='rgba(255,255,255,0.75)';
      sortCtx.font=`bold ${Math.min(10,barW-1)}px JetBrains Mono`;
      sortCtx.textAlign='center';
      sortCtx.fillText(sortArray[i], x+barW/2, y-3);
    }
  }
}

function sortPause() { sortPaused = !sortPaused; }

async function sortStart() {
  if(sortRunning) return;
  if(sortArray.length===0) { sortGenRandom(); }
  sortShouldStop = false;
  sortRunning = true;
  sortPaused = false;
  sortComparisons=0; sortSwaps=0; sortAccesses=0;
  sortStates = new Array(sortArray.length).fill('default');

  const algo = document.getElementById('sort-algo').value;
  const arr = [...sortArray];

  async function waitIfPaused() {
    while(sortPaused && !sortShouldStop) await sleep(100);
  }

  async function doCompare(i,j) {
    if(sortShouldStop) throw 'stopped';
    await waitIfPaused();
    sortComparisons++; sortAccesses+=2; sortUpdateStats();
    sortDrawBars([i,j],[],[]);
    await sleep(sortDelay);
  }

  async function doSwap(i,j) {
    if(sortShouldStop) throw 'stopped';
    sortSwaps++; sortAccesses+=2; sortUpdateStats();
    [arr[i],arr[j]]=[arr[j],arr[i]];
    sortArray = [...arr];
    sortDrawBars([],[i,j],[]);
    await sleep(sortDelay);
  }

  async function markSorted(i) {
    sortStates[i]='sorted';
  }

  try {
    if(algo==='bubble') {
      for(let i=0;i<arr.length;i++) {
        let swapped=false;
        for(let j=0;j<arr.length-i-1;j++) {
          await doCompare(j,j+1);
          if(arr[j]>arr[j+1]) { await doSwap(j,j+1); swapped=true; }
        }
        markSorted(arr.length-1-i);
        sortDrawBars([],[],[arr.length-1-i]);
        if(!swapped) { for(let k=0;k<arr.length;k++) sortStates[k]='sorted'; break; }
      }
    } else if(algo==='selection') {
      for(let i=0;i<arr.length;i++) {
        let minIdx=i;
        for(let j=i+1;j<arr.length;j++) {
          await doCompare(minIdx,j);
          if(arr[j]<arr[minIdx]) minIdx=j;
        }
        if(minIdx!==i) await doSwap(i,minIdx);
        markSorted(i);
        sortDrawBars([],[],[i]);
      }
    } else if(algo==='insertion') {
      markSorted(0);
      for(let i=1;i<arr.length;i++) {
        let j=i;
        while(j>0) {
          await doCompare(j-1,j);
          if(arr[j-1]>arr[j]) { await doSwap(j-1,j); j--; }
          else break;
        }
        markSorted(i);
      }
    } else if(algo==='merge') {
      async function mergeSortHelper(l,r) {
        if(sortShouldStop) throw 'stopped';
        if(l>=r) return;
        const m=Math.floor((l+r)/2);
        await mergeSortHelper(l,m);
        await mergeSortHelper(m+1,r);
        await mergeOp(l,m,r);
      }
      async function mergeOp(l,m,r) {
        const left=arr.slice(l,m+1), right=arr.slice(m+1,r+1);
        let i=0,j=0,k=l;
        while(i<left.length&&j<right.length) {
          if(sortShouldStop) throw 'stopped';
          sortComparisons++; sortAccesses+=2; sortUpdateStats();
          sortDrawBars([l+i,m+1+j],[k],[]);
          await sleep(sortDelay);
          if(left[i]<=right[j]) { arr[k++]=left[i++]; }
          else { arr[k++]=right[j++]; }
          sortArray=[...arr];
          sortAccesses++;
        }
        while(i<left.length){ arr[k++]=left[i++]; sortArray=[...arr]; sortAccesses++; }
        while(j<right.length){ arr[k++]=right[j++]; sortArray=[...arr]; sortAccesses++; }
        for(let x=l;x<=r;x++) markSorted(x);
      }
      await mergeSortHelper(0,arr.length-1);
    } else if(algo==='heap') {
      async function heapify(n,i) {
        let largest=i, l=2*i+1, r=2*i+2;
        if(l<n){ sortAccesses+=2; sortComparisons++; if(arr[l]>arr[largest]) largest=l; }
        if(r<n){ sortAccesses+=2; sortComparisons++; if(arr[r]>arr[largest]) largest=r; }
        if(largest!==i){ await doSwap(i,largest); await heapify(n,largest); }
      }
      for(let i=Math.floor(arr.length/2)-1;i>=0;i--) await heapify(arr.length,i);
      for(let i=arr.length-1;i>0;i--) {
        await doSwap(0,i);
        markSorted(i);
        await heapify(i,0);
      }
      markSorted(0);
    } else if(algo==='counting') {
      const max=Math.max(...arr), min=Math.min(...arr);
      const count=new Array(max-min+1).fill(0);
      for(let x of arr){ count[x-min]++; sortAccesses++; }
      let idx=0;
      for(let i=0;i<count.length;i++) {
        while(count[i]-->0) {
          if(sortShouldStop) throw 'stopped';
          arr[idx]=i+min; sortArray=[...arr];
          sortAccesses++; sortUpdateStats();
          markSorted(idx++);
          sortDrawBars([],[],[idx-1]);
          await sleep(sortDelay);
        }
      }
    } else if(algo==='bucket') {
      const max=Math.max(...arr), min=Math.min(...arr);
      const n=arr.length, buckets=Array.from({length:n},()=>[]);
      for(let x of arr) {
        const bi=Math.min(Math.floor(((x-min)/(max-min+1))*n),n-1);
        buckets[bi].push(x); sortAccesses++;
      }
      let idx=0;
      for(let b of buckets) {
        b.sort((a,x)=>a-x);
        for(let x of b) {
          if(sortShouldStop) throw 'stopped';
          arr[idx]=x; sortArray=[...arr];
          sortAccesses++; sortUpdateStats();
          markSorted(idx++);
          sortDrawBars([],[],[idx-1]);
          await sleep(sortDelay);
        }
      }
    }

    for(let i=0;i<arr.length;i++) sortStates[i]='sorted';
    sortDrawBars([],[],[]);
    showToast('Sorting complete! ✅','success');
  } catch(e) {
    // stopped
  }
  sortRunning = false;
}

// Init sorting
sortGenRandom();

// ═══════════════════════════════════════════════════════════
// TOOL 2: 0/1 KNAPSACK
// ═══════════════════════════════════════════════════════════
let ksItems = [
  {name:'Item A', w:2, v:3},
  {name:'Item B', w:3, v:4},
  {name:'Item C', w:4, v:5},
  {name:'Item D', w:5, v:6},
];
let ksDpSteps = [];
let ksStepIdx = 0;
let ksStepping = false;

function ksRenderItemsTable() {
  const tbody = document.getElementById('ks-items-body');
  tbody.innerHTML = '';
  ksItems.forEach((item,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${item.name}" style="width:80px" onchange="ksItems[${i}].name=this.value"></td>
      <td><input type="number" value="${item.w}" min="1" max="99" style="width:60px" onchange="ksItems[${i}].w=parseInt(this.value)||1"></td>
      <td><input type="number" value="${item.v}" min="1" max="999" style="width:60px" onchange="ksItems[${i}].v=parseInt(this.value)||1"></td>
      <td><button class="btn btn-red btn-sm" onclick="ksRemoveItem(${i})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function ksAddItem() {
  if(ksItems.length>=8){showToast('Max 8 items');return;}
  ksItems.push({name:`Item ${String.fromCharCode(65+ksItems.length)}`, w:3, v:5});
  ksRenderItemsTable();
}

function ksRemoveItem(i) {
  ksItems.splice(i,1);
  ksRenderItemsTable();
}

function ksReset() {
  ksStepping=false;
  document.getElementById('ks-dp-card').style.display='none';
  document.getElementById('ks-result-card').style.display='none';
  ksDpSteps=[]; ksStepIdx=0;
}

function ksBuildDP() {
  const W = parseInt(document.getElementById('ks-capacity').value)||1;
  const items = ksItems.filter(x=>x.w>0&&x.v>0);
  const n = items.length;
  if(n===0||W<1){showToast('Add items and set capacity');return null;}
  const dp = Array.from({length:n+1},()=>new Array(W+1).fill(0));
  const steps = [];
  for(let i=1;i<=n;i++) {
    for(let w=0;w<=W;w++) {
      if(items[i-1].w>w) { dp[i][w]=dp[i-1][w]; }
      else { dp[i][w]=Math.max(dp[i-1][w], dp[i-1][w-items[i-1].w]+items[i-1].v); }
      steps.push({i,w,val:dp[i][w],taken:dp[i][w]>dp[i-1][w]&&items[i-1].w<=w});
    }
  }
  return {dp,steps,items,n,W};
}

function ksRenderTable(dp,items,n,W,highlightI=-1,highlightW=-1,tracebackCells=[]) {
  const table = document.getElementById('ks-dp-table');
  let html='<thead><tr><th class="row-header">Item \\ W</th>';
  for(let w=0;w<=W;w++) html+=`<th>${w}</th>`;
  html+='</tr></thead><tbody>';
  for(let i=0;i<=n;i++) {
    const label = i===0?'∅':items[i-1].name;
    html+=`<tr><th class="row-header" style="text-align:left;padding:6px 10px;font-size:11px">${label}<br><span style="color:#475569;font-size:10px">${i>0?'w='+items[i-1].w+', v='+items[i-1].v:''}</span></th>`;
    for(let w=0;w<=W;w++) {
      let cls='';
      const isTB = tracebackCells.some(c=>c[0]===i&&c[1]===w);
      if(isTB) cls='traceback';
      else if(i===highlightI&&w===highlightW) cls='computing';
      else if(dp[i][w]!==undefined&&dp[i][w]!==0) cls='computed';
      const val = (dp[i]&&dp[i][w]!==undefined) ? dp[i][w] : '';
      html+=`<td class="${cls}">${val}</td>`;
    }
    html+='</tr>';
  }
  html+='</tbody>';
  table.innerHTML=html;
}

async function ksSolveStep() {
  const result = ksBuildDP();
  if(!result) return;
  const {dp,steps,items,n,W} = result;
  document.getElementById('ks-dp-card').style.display='block';

  ksDpSteps=steps; ksStepIdx=0; ksStepping=true;
  const partialDp = Array.from({length:n+1},()=>new Array(W+1).fill(undefined));
  partialDp[0].fill(0);
  document.getElementById('ks-step-counter').textContent = `Step 0 of ${steps.length}`;
  const delay = parseInt(document.getElementById('ks-capacity').value)<15?200:80;

  while(ksStepIdx < steps.length && ksStepping) {
    const s = steps[ksStepIdx];
    partialDp[s.i][s.w] = s.val;
    ksRenderTable(partialDp,items,n,W,s.i,s.w,[]);
    document.getElementById('ks-step-counter').textContent = `Step ${ksStepIdx+1} of ${steps.length}`;
    ksStepIdx++;
    await sleep(delay);
  }

  if(ksStepping) { ksFinish(dp,items,n,W); }
  ksStepping = false;
}

async function ksSolveAll() {
  const result = ksBuildDP();
  if(!result) return;
  const {dp,items,n,W} = result;
  document.getElementById('ks-dp-card').style.display='block';
  ksRenderTable(dp,items,n,W,-1,-1,[]);
  document.getElementById('ks-step-counter').textContent='Complete';
  setTimeout(()=>ksFinish(dp,items,n,W),300);
}

function ksFinish(dp,items,n,W) {
  const maxProfit=dp[n][W];
  // traceback
  const tbCells=[];
  let i=n,w=W;
  while(i>0&&w>0) {
    tbCells.push([i,w]);
    if(dp[i][w]!==dp[i-1][w]) { w-=items[i-1].w; i--; tbCells.push([i,w]); }
    else i--;
  }
  tbCells.push([0,0]);
  ksRenderTable(dp,items,n,W,-1,-1,tbCells);

  const selectedItems=[];
  i=n; w=W;
  while(i>0&&w>0) {
    if(dp[i][w]!==dp[i-1][w]) { selectedItems.push(items[i-1]); w-=items[i-1].w; }
    i--;
  }

  document.getElementById('ks-result-card').style.display='block';
  document.getElementById('ks-max-profit').textContent=maxProfit;
  const si=document.getElementById('ks-selected-items');
  si.innerHTML='';
  const usedW=selectedItems.reduce((a,x)=>a+x.w,0);
  selectedItems.forEach(item=>{
    const d=document.createElement('div');
    d.className='stat-badge';
    d.style.animation='popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    d.innerHTML=`<div class="value" style="font-size:14px">${item.name}</div><div class="label">w=${item.w}, v=${item.v}</div>`;
    si.appendChild(d);
  });
  document.getElementById('ks-weight-used').textContent=usedW;
  document.getElementById('ks-cap-show').textContent=W;
  document.getElementById('ks-weight-bar').style.width=Math.min(100,(usedW/W*100))+'%';
  launchConfetti();
}

ksRenderItemsTable();

// ═══════════════════════════════════════════════════════════
// TOOL 3: MST GRAPH VISUALIZER
// ═══════════════════════════════════════════════════════════
const mstCanvas = document.getElementById('mst-canvas');
const mstCtx = mstCanvas.getContext('2d');
let mstNodes = [], mstEdges = [];
let mstMode = 'node';
let mstEdgeSource = null;
let mstDragging = null, mstDragOffX=0, mstDragOffY=0;
let mstAnimating = false;

// Edge state colors for MST
let mstEdgeState = {}; // edgeIdx -> 'default'|'mst'|'candidate'|'rejected'|'faded'
let mstNodeState = {}; // nodeIdx -> 'default'|'start'|'selected'|'candidate'

function mstResizeCanvas() {
  const container = mstCanvas.parentElement;
  mstCanvas.width = container.clientWidth;
  mstCanvas.height = 520;
  mstRedraw();
}

function setMSTMode(mode) {
  mstMode = mode;
  mstEdgeSource = null;
  document.querySelectorAll('#tool-2 .mode-btn').forEach(b=>b.classList.remove('active-mode'));
  document.getElementById('mst-mode-'+mode).classList.add('active-mode');
  const labels = {
    node:'Add Node — Click anywhere to place a node',
    edge:'Add Edge — Click source node, then target node',
    drag:'Drag — Click and drag nodes',
    delete:'Delete — Click a node or edge to remove it'
  };
  document.getElementById('mst-mode-label').textContent='Mode: '+labels[mode];
  mstCanvas.style.cursor = mode==='drag'?'grab':'crosshair';
  mstRedraw();
}

function mstGetNodeAt(x,y) {
  return mstNodes.find(n=>Math.hypot(n.x-x,n.y-y)<28);
}

function mstGetEdgeAt(x,y) {
  return mstEdges.findIndex(e=>{
    const a=mstNodes[e.a], b=mstNodes[e.b];
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    return Math.hypot(mx-x,my-y)<16;
  });
}

mstCanvas.addEventListener('mousedown', mstMouseDown);
mstCanvas.addEventListener('mousemove', mstMouseMove);
mstCanvas.addEventListener('mouseup', mstMouseUp);
mstCanvas.addEventListener('mouseleave', ()=>{ mstDragging=null; });

function mstMouseDown(e) {
  if(mstAnimating) return;
  const rect = mstCanvas.getBoundingClientRect();
  const x=e.clientX-rect.left, y=e.clientY-rect.top;

  if(mstMode==='node') {
    const label=String.fromCharCode(65+mstNodes.length%26);
    mstNodes.push({x,y,label,scale:0});
    mstNodeState[mstNodes.length-1]='default';
    animateNodeEntry(mstNodes.length-1);
    mstRedraw();
  } else if(mstMode==='edge') {
    const node=mstGetNodeAt(x,y);
    if(!node) return;
    if(!mstEdgeSource) {
      mstEdgeSource=node;
      mstNodeState[mstNodes.indexOf(node)]='candidate';
      mstRedraw();
    } else if(mstEdgeSource!==node) {
      const ai=mstNodes.indexOf(mstEdgeSource), bi=mstNodes.indexOf(node);
      if(mstEdges.some(e=>(e.a===ai&&e.b===bi)||(e.a===bi&&e.b===ai))) {
        showToast('Edge already exists between these nodes');
        mstEdgeSource=null;
        mstNodeState[ai]='default';
        mstRedraw();
        return;
      }
      // show popup
      const popup=document.getElementById('mst-weight-popup');
      popup.dataset.a=ai; popup.dataset.b=bi;
      popup.style.display='block';
      popup.style.left=(x+mstCanvas.getBoundingClientRect().left-mstCanvas.parentElement.getBoundingClientRect().left)+'px';
      popup.style.top=(y+mstCanvas.getBoundingClientRect().top-mstCanvas.parentElement.getBoundingClientRect().top)+'px';
      document.getElementById('mst-weight-input').value=1;
      document.getElementById('mst-weight-input').focus();
      mstEdgeSource=null;
      mstNodeState[ai]='default';
      mstRedraw();
    }
  } else if(mstMode==='drag') {
    const node=mstGetNodeAt(x,y);
    if(node) { mstDragging=node; mstDragOffX=node.x-x; mstDragOffY=node.y-y; mstCanvas.style.cursor='grabbing'; }
  } else if(mstMode==='delete') {
    const node=mstGetNodeAt(x,y);
    if(node) {
      const idx=mstNodes.indexOf(node);
      mstEdges=mstEdges.filter(e=>e.a!==idx&&e.b!==idx).map(e=>({...e,a:e.a>idx?e.a-1:e.a,b:e.b>idx?e.b-1:e.b}));
      mstNodes.splice(idx,1);
      mstNodeState={};
      mstNodes.forEach((_,i)=>mstNodeState[i]='default');
      mstRedraw(); return;
    }
    const edgeIdx=mstGetEdgeAt(x,y);
    if(edgeIdx>=0) { mstEdges.splice(edgeIdx,1); mstRedraw(); }
  }
}

function mstMouseMove(e) {
  if(!mstDragging) return;
  const rect=mstCanvas.getBoundingClientRect();
  mstDragging.x=e.clientX-rect.left+mstDragOffX;
  mstDragging.y=e.clientY-rect.top+mstDragOffY;
  mstDragging.x=Math.max(30,Math.min(mstCanvas.width-30,mstDragging.x));
  mstDragging.y=Math.max(30,Math.min(mstCanvas.height-30,mstDragging.y));
  mstRedraw();
}

function mstMouseUp() {
  mstDragging=null;
  if(mstMode==='drag') mstCanvas.style.cursor='grab';
}

function mstConfirmEdge() {
  const popup=document.getElementById('mst-weight-popup');
  const w=Math.max(1,Math.min(999,parseInt(document.getElementById('mst-weight-input').value)||1));
  const ai=parseInt(popup.dataset.a), bi=parseInt(popup.dataset.b);
  const idx=mstEdges.length;
  mstEdges.push({a:ai,b:bi,w});
  mstEdgeState[idx]='default';
  popup.style.display='none';
  mstRedraw();
}

function mstCancelEdge() {
  document.getElementById('mst-weight-popup').style.display='none';
  mstEdgeSource=null;
  mstNodes.forEach((_,i)=>mstNodeState[i]='default');
  mstRedraw();
}

function animateNodeEntry(idx) {
  const node=mstNodes[idx];
  node.scale=0;
  let t=0;
  function step() {
    t+=0.08;
    if(t<0.7) node.scale=t/0.7*1.1;
    else if(t<1) node.scale=1.1-(t-0.7)/0.3*0.1;
    else { node.scale=1; mstRedraw(); return; }
    mstRedraw();
    requestAnimationFrame(step);
  }
  step();
}

function mstRedraw() {
  const W=mstCanvas.width, H=mstCanvas.height;
  mstCtx.clearRect(0,0,W,H);

  // draw edges
  mstEdges.forEach((e,idx)=>{
    const a=mstNodes[e.a], b=mstNodes[e.b];
    if(!a||!b) return;
    const state=mstEdgeState[idx]||'default';
    let strokeColor='#475569', lw=2, dash=[];
    if(state==='mst') { strokeColor='#10b981'; lw=3; mstCtx.shadowColor='rgba(16,185,129,0.6)'; mstCtx.shadowBlur=12; }
    else if(state==='candidate') { strokeColor='#f59e0b'; lw=2; dash=[8,4]; mstCtx.shadowColor='rgba(245,158,11,0.4)'; mstCtx.shadowBlur=8; }
    else if(state==='rejected') { strokeColor='rgba(71,85,105,0.4)'; lw=1; }
    else if(state==='testing') { strokeColor='#ef4444'; lw=2; mstCtx.shadowColor='rgba(239,68,68,0.5)'; mstCtx.shadowBlur=10; }
    else { mstCtx.shadowBlur=0; }
    mstCtx.strokeStyle=strokeColor;
    mstCtx.lineWidth=lw;
    mstCtx.setLineDash(dash);
    mstCtx.beginPath();
    mstCtx.moveTo(a.x,a.y);
    mstCtx.lineTo(b.x,b.y);
    mstCtx.stroke();
    mstCtx.setLineDash([]);
    mstCtx.shadowBlur=0;

    // weight badge
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    mstCtx.fillStyle=state==='mst'?'rgba(16,185,129,0.3)':'#1e293b';
    mstCtx.strokeStyle=state==='mst'?'#10b981':'rgba(255,255,255,0.15)';
    mstCtx.lineWidth=1;
    mstCtx.beginPath();
    mstCtx.roundRect(mx-12,my-10,24,20,6);
    mstCtx.fill(); mstCtx.stroke();
    mstCtx.fillStyle='#f1f5f9';
    mstCtx.font='bold 11px JetBrains Mono';
    mstCtx.textAlign='center';
    mstCtx.textBaseline='middle';
    mstCtx.fillText(e.w,mx,my);
  });

  // draw nodes
  mstNodes.forEach((node,idx)=>{
    const sc=node.scale||1;
    mstCtx.save();
    mstCtx.translate(node.x,node.y);
    mstCtx.scale(sc,sc);
    const state=mstNodeState[idx]||'default';
    let gStart='#3b82f6', gEnd='#8b5cf6';
    if(state==='start') { gStart='#d97706'; gEnd='#f59e0b'; mstCtx.shadowColor='rgba(245,158,11,0.6)'; mstCtx.shadowBlur=20; }
    else if(state==='selected') { gStart='#059669'; gEnd='#10b981'; mstCtx.shadowColor='rgba(16,185,129,0.6)'; mstCtx.shadowBlur=20; }
    else if(state==='candidate') { gStart='#1d4ed8'; gEnd='#3b82f6'; mstCtx.shadowColor='rgba(59,130,246,0.6)'; mstCtx.shadowBlur=20; }
    else if(state==='rejected') { gStart='#374151'; gEnd='#4b5563'; mstCtx.shadowBlur=0; }
    else { mstCtx.shadowColor='rgba(139,92,246,0.3)'; mstCtx.shadowBlur=10; }
    const g=mstCtx.createRadialGradient(0,-8,2,0,0,28);
    g.addColorStop(0,gStart);
    g.addColorStop(1,gEnd);
    mstCtx.beginPath();
    mstCtx.arc(0,0,28,0,Math.PI*2);
    mstCtx.fillStyle=g;
    mstCtx.fill();
    mstCtx.strokeStyle='rgba(255,255,255,0.6)';
    mstCtx.lineWidth=2;
    mstCtx.stroke();
    mstCtx.shadowBlur=0;
    mstCtx.fillStyle='#fff';
    mstCtx.font='bold 14px Orbitron';
    mstCtx.textAlign='center';
    mstCtx.textBaseline='middle';
    mstCtx.fillText(node.label,0,0);
    mstCtx.restore();
  });
}

function mstClearAll() {
  mstNodes=[]; mstEdges=[]; mstEdgeState={}; mstNodeState={};
  mstEdgeSource=null; mstAnimating=false;
  document.getElementById('mst-steps-log').innerHTML='';
  document.getElementById('mst-total-weight').textContent='';
  document.getElementById('mst-union-find').innerHTML='';
  mstRedraw();
}

function mstRandomGraph() {
  mstClearAll();
  const W=mstCanvas.width, H=mstCanvas.height;
  const n=6+Math.floor(Math.random()*3);
  const labels='ABCDEFGHIJ';
  for(let i=0;i<n;i++) {
    mstNodes.push({x:80+(Math.random()*(W-160)), y:80+(Math.random()*(H-160)), label:labels[i], scale:1});
    mstNodeState[i]='default';
  }
  // ensure connected spanning tree first
  const perm=shuffleArray([...Array(n).keys()]);
  for(let i=1;i<n;i++) {
    const a=perm[i-1], b=perm[i];
    const w=1+Math.floor(Math.random()*20);
    mstEdges.push({a,b,w});
    mstEdgeState[mstEdges.length-1]='default';
  }
  // add some random extra edges
  const extra=Math.floor(Math.random()*4)+2;
  for(let k=0;k<extra;k++) {
    const a=Math.floor(Math.random()*n), b=Math.floor(Math.random()*n);
    if(a!==b&&!mstEdges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))) {
      mstEdges.push({a,b,w:1+Math.floor(Math.random()*20)});
      mstEdgeState[mstEdges.length-1]='default';
    }
  }
  mstRedraw();
}

function mstAddStep(text, cls='') {
  const log=document.getElementById('mst-steps-log');
  const d=document.createElement('div');
  d.className='step-card '+cls;
  d.textContent=text;
  log.appendChild(d);
  log.scrollTop=log.scrollHeight;
}

async function runPrims() {
  if(mstNodes.length<2){showToast('Add at least 2 nodes');return;}
  if(mstEdges.length===0){showToast('Add edges first');return;}
  if(mstAnimating) return;
  mstAnimating=true;
  document.getElementById('mst-steps-log').innerHTML='';
  document.getElementById('mst-total-weight').textContent='';
  const speed=parseInt(document.getElementById('mst-speed').value);

  // reset states
  mstNodes.forEach((_,i)=>mstNodeState[i]='default');
  mstEdges.forEach((_,i)=>mstEdgeState[i]='default');
  mstRedraw();

  const n=mstNodes.length;
  const inMST=new Array(n).fill(false);
  const key=new Array(n).fill(Infinity);
  const parent=new Array(n).fill(-1);
  key[0]=0;
  mstNodeState[0]='start';
  mstAddStep('Start from node '+mstNodes[0].label,'gold');
  mstRedraw();
  await sleep(speed);

  let totalW=0;
  for(let iter=0;iter<n;iter++) {
    // find min key not in MST
    let u=-1;
    for(let i=0;i<n;i++) { if(!inMST[i]&&(u===-1||key[i]<key[u])) u=i; }
    if(u===-1||key[u]===Infinity) break;
    inMST[u]=true;
    mstNodeState[u]='selected';

    if(parent[u]!==-1) {
      const ei=mstEdges.findIndex(e=>(e.a===u&&e.b===parent[u])||(e.a===parent[u]&&e.b===u));
      if(ei>=0) { mstEdgeState[ei]='mst'; totalW+=mstEdges[ei].w; }
      mstAddStep(`Added edge ${mstNodes[parent[u]].label}-${mstNodes[u].label} (weight ${key[u]})`,'green');
    }
    mstRedraw();
    await sleep(speed);

    // update neighbors
    mstEdges.forEach((e,ei)=>{
      let v=-1;
      if(e.a===u&&!inMST[e.b]) v=e.b;
      else if(e.b===u&&!inMST[e.a]) v=e.a;
      if(v>=0) {
        if(e.w<key[v]) {
          key[v]=e.w; parent[v]=u;
          mstEdgeState[ei]='candidate';
          if(mstNodeState[v]==='default') mstNodeState[v]='candidate';
        }
      }
    });
    mstRedraw();
    await sleep(speed/2);
  }

  // fade non-MST edges
  mstEdges.forEach((_,i)=>{ if(mstEdgeState[i]!=='mst') mstEdgeState[i]='rejected'; });
  mstRedraw();
  document.getElementById('mst-total-weight').textContent=`MST Total Weight: ${totalW}`;
  mstAddStep(`Prim's MST Complete! Total weight: ${totalW}`,'gold');
  mstAnimating=false;
  showToast("Prim's MST complete! ✅",'success');
}

async function runKruskals() {
  if(mstNodes.length<2){showToast('Add at least 2 nodes');return;}
  if(mstEdges.length===0){showToast('Add edges first');return;}
  if(mstAnimating) return;
  mstAnimating=true;
  document.getElementById('mst-steps-log').innerHTML='';
  document.getElementById('mst-total-weight').textContent='';
  document.getElementById('mst-union-find').innerHTML='';
  const speed=parseInt(document.getElementById('mst-speed').value);

  mstNodes.forEach((_,i)=>mstNodeState[i]='default');
  mstEdges.forEach((_,i)=>mstEdgeState[i]='default');
  mstRedraw();

  const n=mstNodes.length;
  const sortedEdges=[...mstEdges.map((e,i)=>({...e,idx:i}))].sort((a,b)=>a.w-b.w);

  // Union-Find
  const parent=[...Array(n).keys()], rank=new Array(n).fill(0);
  function find(x){return parent[x]===x?x:parent[x]=find(parent[x]);}
  function union(x,y){const rx=find(x),ry=find(y);if(rx===ry)return false;if(rank[rx]<rank[ry])parent[rx]=ry;else if(rank[rx]>rank[ry])parent[ry]=rx;else{parent[ry]=rx;rank[rx]++;}return true;}

  mstAddStep('Sorted edges by weight: '+sortedEdges.map(e=>`${mstNodes[e.a].label}-${mstNodes[e.b].label}(${e.w})`).join(', '),'gold');
  await sleep(speed);

  let totalW=0, mstCount=0;
  for(const e of sortedEdges) {
    mstEdgeState[e.idx]='testing';
    mstRedraw();
    await sleep(speed);
    if(union(e.a,e.b)) {
      mstEdgeState[e.idx]='mst';
      mstNodeState[e.a]='selected'; mstNodeState[e.b]='selected';
      totalW+=e.w; mstCount++;
      mstAddStep(`✅ Accept edge ${mstNodes[e.a].label}-${mstNodes[e.b].label} (w=${e.w})`,'green');
    } else {
      mstEdgeState[e.idx]='rejected';
      mstAddStep(`❌ Reject edge ${mstNodes[e.a].label}-${mstNodes[e.b].label} (cycle!)`,'red');
    }
    mstRedraw();
    await sleep(speed);
  }

  document.getElementById('mst-total-weight').textContent=`MST Total Weight: ${totalW}`;
  mstAddStep(`Kruskal's MST Complete! Total weight: ${totalW}`,'gold');

  // Show union-find groups
  const groups={};
  mstNodes.forEach((_,i)=>{const r=find(i);(groups[r]=groups[r]||[]).push(mstNodes[i].label);});
  const ufDiv=document.getElementById('mst-union-find');
  ufDiv.innerHTML='<div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">Final Union-Find sets:</div><div class="flex flex-wrap gap-8">'+
    Object.values(groups).map((g,gi)=>`<span class="stat-badge" style="min-width:auto;padding:4px 10px;font-family:JetBrains Mono;font-size:12px">{${g.join(',')}}</span>`).join('')+'</div>';

  mstAnimating=false;
  showToast("Kruskal's MST complete! ✅",'success');
}

// Init MST canvas
setTimeout(()=>{mstResizeCanvas(); mstRandomGraph();},200);

// ═══════════════════════════════════════════════════════════
// TOOL 4: LCS
// ═══════════════════════════════════════════════════════════
let lcsAnimating=false, lcsShouldStop=false;
let lcsDpTable=[], lcsArrows=[];

function lcsReset() {
  lcsAnimating=false; lcsShouldStop=true;
  document.getElementById('lcs-table').innerHTML='';
  document.getElementById('lcs-result').style.display='none';
  document.getElementById('lcs-step-info').textContent='';
  document.getElementById('lcs-chars').innerHTML='';
}

function lcsBuild(X,Y) {
  const m=X.length, n=Y.length;
  const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  const arr=Array.from({length:m+1},()=>new Array(n+1).fill(''));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) {
    if(X[i-1]===Y[j-1]) { dp[i][j]=dp[i-1][j-1]+1; arr[i][j]='↖'; }
    else if(dp[i-1][j]>=dp[i][j-1]) { dp[i][j]=dp[i-1][j]; arr[i][j]='↑'; }
    else { dp[i][j]=dp[i][j-1]; arr[i][j]='←'; }
  }
  return {dp,arr,m,n};
}

function lcsTraceback(dp,arr,X,Y,m,n) {
  const path=[];
  let i=m,j=n;
  while(i>0&&j>0) {
    path.push([i,j]);
    if(arr[i][j]==='↖') {i--;j--;}
    else if(arr[i][j]==='↑') i--;
    else j--;
  }
  const lcs=[]; let ti=m,tj=n;
  while(ti>0&&tj>0) {
    if(arr[ti][tj]==='↖'){lcs.unshift(X[ti-1]);ti--;tj--;}
    else if(arr[ti][tj]==='↑') ti--;
    else tj--;
  }
  return {path,lcs};
}

function lcsRenderFull(X,Y,dp,arr,highlightI=-1,highlightJ=-1,tbPath=[]) {
  const m=X.length,n=Y.length;
  let html='<thead><tr>';
  html+='<th></th><th style="background:#0d1117">∅</th>';
  Y.split('').forEach((c,j)=>{
    html+=`<th class="${X.includes(c)?'match':''}">${c}</th>`;
  });
  html+='</tr></thead><tbody>';
  for(let i=0;i<=m;i++) {
    html+='<tr>';
    if(i===0) html+='<th style="background:#0d1117">∅</th>';
    else html+=`<th class="${Y.includes(X[i-1])?'match':''}">${X[i-1]}</th>`;
    for(let j=0;j<=n;j++) {
      const isTB=tbPath.some(p=>p[0]===i&&p[1]===j);
      const isComp=(i===highlightI&&j===highlightJ);
      let cls='';
      if(isTB) cls='traceback';
      else if(isComp) cls='computing';
      else if(arr[i]&&arr[i][j]==='↖') cls='diag';
      else if(arr[i]&&arr[i][j]==='↑') cls='up';
      else if(arr[i]&&arr[i][j]==='←') cls='left';
      const val=dp[i][j];
      const arrow=(i>0&&j>0)?arr[i][j]:'';
      html+=`<td class="${cls}" title="dp[${i}][${j}]">${val}<span style="font-size:9px;display:block;line-height:1">${arrow}</span></td>`;
    }
    html+='</tr>';
  }
  html+='</tbody>';
  document.getElementById('lcs-table').innerHTML=html;
}

async function lcsAnimate() {
  const X=document.getElementById('lcs-x').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,12);
  const Y=document.getElementById('lcs-y').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,12);
  if(!X||!Y){showToast('Enter both strings');return;}
  if(lcsAnimating){lcsShouldStop=true;await sleep(100);}
  lcsAnimating=true; lcsShouldStop=false;
  document.getElementById('lcs-result').style.display='none';
  const speed=parseInt(document.getElementById('lcs-speed').value);
  const {dp,arr,m,n}=lcsBuild(X,Y);

  // animate cell by cell
  const partDp=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  const partArr=Array.from({length:m+1},()=>new Array(n+1).fill(''));
  for(let i=0;i<=m;i++) for(let j=0;j<=n;j++) {
    if(lcsShouldStop) break;
    partDp[i][j]=dp[i][j]; partArr[i][j]=arr[i][j];
    document.getElementById('lcs-step-info').textContent=`Computing dp[${i}][${j}] = ${dp[i][j]}`;
    lcsRenderFull(X,Y,partDp,partArr,i,j,[]);
    await sleep(speed);
  }
  if(lcsShouldStop){lcsAnimating=false;return;}

  // traceback
  const {path,lcs}=lcsTraceback(dp,arr,X,Y,m,n);
  for(let k=0;k<path.length;k++) {
    lcsRenderFull(X,Y,dp,arr,-1,-1,path.slice(0,k+1));
    await sleep(speed*0.8);
  }

  lcsShowResult(lcs,m,n);
  lcsAnimating=false;
}

async function lcsInstant() {
  const X=document.getElementById('lcs-x').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,12);
  const Y=document.getElementById('lcs-y').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,12);
  if(!X||!Y){showToast('Enter both strings');return;}
  lcsShouldStop=true; await sleep(50);
  const {dp,arr,m,n}=lcsBuild(X,Y);
  const {path,lcs}=lcsTraceback(dp,arr,X,Y,m,n);
  lcsRenderFull(X,Y,dp,arr,-1,-1,path);
  lcsShowResult(lcs,m,n);
}

function lcsShowResult(lcs,m,n) {
  document.getElementById('lcs-result').style.display='block';
  document.getElementById('lcs-length').textContent=lcs.length;
  const chars=document.getElementById('lcs-chars');
  chars.innerHTML='';
  lcs.forEach((c,i)=>{
    setTimeout(()=>{
      const span=document.createElement('span');
      span.className='lcs-char-badge';
      span.textContent=c;
      chars.appendChild(span);
    },i*120);
  });
}

// ═══════════════════════════════════════════════════════════
// TOOL 5: BINARY SEARCH
// ═══════════════════════════════════════════════════════════
let bsRunning=false, bsShouldStop=false;

function bsReset() {
  bsShouldStop=true; bsRunning=false;
  document.getElementById('bs-elements').innerHTML='';
  document.getElementById('bs-steps').innerHTML='';
  document.getElementById('bs-result-msg').textContent='';
}

async function bsStart() {
  bsShouldStop=true; await sleep(50);
  const rawArr=document.getElementById('bs-array').value.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x));
  const target=parseInt(document.getElementById('bs-target').value);
  if(rawArr.length===0){showToast('Enter a valid array');return;}
  rawArr.sort((a,b)=>a-b);
  const arr=[...rawArr];
  const speed=parseInt(document.getElementById('bs-speed').value);

  bsShouldStop=false; bsRunning=true;
  document.getElementById('bs-steps').innerHTML='';
  document.getElementById('bs-result-msg').textContent='';

  function renderBS(arr,low,high,mid,found) {
    const cont=document.getElementById('bs-elements');
    cont.innerHTML='';
    arr.forEach((val,i)=>{
      const wrap=document.createElement('div');
      wrap.className='bs-elem';
      const pill=document.createElement('div');
      pill.className='bs-pill';
      if(found===i) pill.classList.add('found');
      else if(i===mid) pill.classList.add('mid');
      else if(i===low&&i===high) { pill.classList.add('low'); }
      else if(i===low) pill.classList.add('low');
      else if(i===high) pill.classList.add('high');
      else if(i<low||i>high) pill.classList.add('eliminated');
      pill.textContent=val;

      let pointerText='';
      if(found===i) pointerText='✓';
      else if(i===mid&&i===low&&i===high) pointerText='L/M/H';
      else {
        const parts=[];
        if(i===low) parts.push('L');
        if(i===mid) parts.push('M');
        if(i===high) parts.push('H');
        pointerText=parts.join('/');
      }
      const ptr=document.createElement('div');
      ptr.className='bs-pointer';
      ptr.textContent=pointerText;

      wrap.appendChild(pill); wrap.appendChild(ptr);
      cont.appendChild(wrap);
    });
  }

  function addStep(text,type='') {
    const d=document.createElement('div');
    d.className='bs-step-row '+(type==='match'?'match':type==='nomatch'?'nomatch':'');
    d.textContent=text;
    document.getElementById('bs-steps').appendChild(d);
  }

  let low=0, high=arr.length-1;
  renderBS(arr,low,high,-1,-1);
  await sleep(speed/2);

  while(low<=high) {
    if(bsShouldStop) break;
    const mid=Math.floor((low+high)/2);
    renderBS(arr,low,high,mid,-1);
    await sleep(speed);
    if(arr[mid]===target) {
      renderBS(arr,low,high,-1,mid);
      addStep(`mid=${mid}, arr[${mid}]=${arr[mid]} === target ${target} ✓ FOUND!`,'match');
      document.getElementById('bs-result-msg').innerHTML=`<span style="color:var(--accent-green)">✅ Found ${target} at index ${mid}!</span>`;
      bsRunning=false; return;
    } else if(arr[mid]<target) {
      addStep(`mid=${mid}, arr[${mid}]=${arr[mid]} < target=${target}, go RIGHT`,'nomatch');
      low=mid+1;
    } else {
      addStep(`mid=${mid}, arr[${mid}]=${arr[mid]} > target=${target}, go LEFT`,'nomatch');
      high=mid-1;
    }
    renderBS(arr,low,high,-1,-1);
    await sleep(speed/2);
  }

  if(!bsShouldStop) {
    document.getElementById('bs-result-msg').innerHTML=`<span style="color:var(--accent-red)">❌ ${target} not found in array</span>`;
  }
  bsRunning=false;
}

// ═══════════════════════════════════════════════════════════
// TOOL 6: RABIN-KARP
// ═══════════════════════════════════════════════════════════
let rkRunning=false, rkShouldStop=false;

function rkReset() {
  rkShouldStop=true; rkRunning=false;
  document.getElementById('rk-chars').innerHTML='';
  document.getElementById('rk-results-body').innerHTML='';
  document.getElementById('rk-phash').textContent='-';
  document.getElementById('rk-whash').textContent='-';
  document.getElementById('rk-spurious').textContent='0';
  document.getElementById('rk-matches').textContent='0';
  document.getElementById('rk-badge-row').textContent='';
}

function rkHash(s,base,mod) {
  let h=0;
  for(let i=0;i<s.length;i++) h=(h*base+s.charCodeAt(i))%mod;
  return h;
}

async function rkRun() {
  rkShouldStop=true; await sleep(50);
  const T=document.getElementById('rk-text').value;
  const P=document.getElementById('rk-pattern').value;
  const q=Math.max(2,parseInt(document.getElementById('rk-mod').value)||13);
  const d=Math.max(2,parseInt(document.getElementById('rk-base').value)||10);
  if(!T||!P){showToast('Enter text and pattern');return;}
  if(P.length>T.length){showToast('Pattern longer than text');return;}
  if(P.length===0){showToast('Pattern cannot be empty');return;}
  const speed=parseInt(document.getElementById('rk-speed').value);
  rkShouldStop=false; rkRunning=true;

  // render chars
  const charsDiv=document.getElementById('rk-chars');
  charsDiv.innerHTML='';
  [...T].forEach(c=>{
    const d2=document.createElement('div');
    d2.className='rk-char';
    d2.textContent=c;
    charsDiv.appendChild(d2);
  });

  const patHash=rkHash(P,d,q);
  document.getElementById('rk-phash').textContent=patHash;

  const m=P.length, n=T.length;
  let spurious=0, matches=0;
  let h=rkHash(T.substring(0,m),d,q);
  const tbody=document.getElementById('rk-results-body');
  tbody.innerHTML='';

  // high order value: d^(m-1) mod q
  let dh=1;
  for(let i=0;i<m-1;i++) dh=(dh*d)%q;

  for(let s=0;s<=n-m;s++) {
    if(rkShouldStop) break;
    // update window highlight
    const chars=charsDiv.children;
    for(let i=0;i<n;i++) {
      chars[i].className='rk-char';
      if(i>=s&&i<s+m) chars[i].classList.add('checking');
    }
    document.getElementById('rk-whash').textContent=h;

    const windowStr=T.substring(s,s+m);
    let rowClass='';
    let result='';

    await sleep(speed);
    if(h===patHash) {
      if(windowStr===P) {
        for(let i=s;i<s+m;i++) chars[i].className='rk-char match';
        result='✅ Valid Match'; rowClass='match-row'; matches++;
        document.getElementById('rk-matches').textContent=matches;
        document.getElementById('rk-badge-row').innerHTML=`<span style="color:var(--accent-green);font-weight:700">✓ Match at position ${s}</span>`;
      } else {
        for(let i=s;i<s+m;i++) chars[i].className='rk-char spurious';
        result='⚠ Spurious Hit'; rowClass='spurious-row'; spurious++;
        document.getElementById('rk-spurious').textContent=spurious;
        document.getElementById('rk-badge-row').innerHTML=`<span style="color:var(--accent-orange);font-weight:700">✗ Spurious hit at ${s}</span>`;
      }
      await sleep(speed*0.8);
    } else {
      document.getElementById('rk-badge-row').innerHTML='';
    }

    const tr=document.createElement('tr');
    tr.className=rowClass;
    tr.innerHTML=`<td>${s}</td><td style="font-family:JetBrains Mono">${windowStr}</td><td>${h}</td><td>${patHash}</td><td>${result||'—'}</td>`;
    tbody.appendChild(tr);
    tr.scrollIntoView({behavior:'smooth',block:'nearest'});

    // rolling hash
    if(s<n-m) {
      h=(d*(h-(T.charCodeAt(s)*dh%q)+q)+T.charCodeAt(s+m))%q;
      if(h<0) h+=q;
    }
  }
  rkRunning=false;
}

// ═══════════════════════════════════════════════════════════
// TOOL 7: QUICK SORT
// ═══════════════════════════════════════════════════════════
let qsArray=[], qsRunning=false, qsShouldStop=false;
let qsComparisons=0, qsSwaps=0;
let qsSortedSet=new Set();

function qsReset() {
  qsShouldStop=true; qsRunning=false;
  const raw=document.getElementById('qs-input').value;
  qsArray=raw.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x));
  if(qsArray.length===0) qsArray=[25,29,30,35,42,47,50,52,60];
  qsComparisons=0; qsSwaps=0; qsSortedSet=new Set();
  document.getElementById('qs-comparisons').textContent='0';
  document.getElementById('qs-swaps').textContent='0';
  document.getElementById('qs-tree').innerHTML='';
  document.getElementById('qs-depth-info').textContent='';
  qsRenderElements(qsArray,-1,-1,-1,-1,new Set(),-1,qsArray.length-1);
}

function qsRenderElements(arr,pivot,iIdx,jIdx,sortedIdx,sorted,low,high) {
  const cont=document.getElementById('qs-elements');
  cont.innerHTML='';
  arr.forEach((v,i)=>{
    const tile=document.createElement('div');
    tile.className='qs-tile';
    tile.textContent=v;
    if(sorted.has(i)||sortedIdx===i) tile.classList.add('sorted');
    else if(i===pivot) { tile.classList.add('pivot'); const crown=document.createElement('span'); crown.className='crown'; crown.textContent='👑'; tile.appendChild(crown); }
    else if(i===iIdx) tile.classList.add('comparing-i');
    else if(i===jIdx) tile.classList.add('comparing-j');
    cont.appendChild(tile);
  });
}

function qsAddLog(text,cls='') {
  const d=document.createElement('div');
  d.className='qs-tree-node '+(cls);
  d.innerHTML=text;
  document.getElementById('qs-tree').appendChild(d);
}

async function qsStart() {
  if(qsRunning) return;
  qsReset();
  await sleep(100);
  qsShouldStop=false; qsRunning=true;
  qsComparisons=0; qsSwaps=0;
  const arr=[...qsArray];
  const speed=parseInt(document.getElementById('qs-speed').value);

  async function partition(arr,low,high) {
    const pivot=arr[high];
    let i=low-1;
    qsRenderElements(arr,high,i+1,-1,-1,qsSortedSet,low,high);
    qsAddLog(`partition([${arr.slice(low,high+1).join(',')}], pivot=${pivot})`,'active');
    await sleep(speed);
    for(let j=low;j<high;j++) {
      if(qsShouldStop) return low;
      qsComparisons++;
      document.getElementById('qs-comparisons').textContent=qsComparisons;
      qsRenderElements(arr,high,i+1,j,-1,qsSortedSet,low,high);
      await sleep(speed);
      if(arr[j]<=pivot) {
        i++;
        if(i!==j){[arr[i],arr[j]]=[arr[j],arr[i]]; qsSwaps++; document.getElementById('qs-swaps').textContent=qsSwaps;}
        qsRenderElements(arr,high,i+1,j,-1,qsSortedSet,low,high);
        await sleep(speed*0.5);
      }
    }
    [arr[i+1],arr[high]]=[arr[high],arr[i+1]];
    if(i+1!==high){qsSwaps++; document.getElementById('qs-swaps').textContent=qsSwaps;}
    qsSortedSet.add(i+1);
    qsArray=[...arr];
    qsRenderElements(arr,i+1,-1,-1,i+1,qsSortedSet,low,high);
    await sleep(speed);
    return i+1;
  }

  async function quickSort(arr,low,high,depth=0) {
    if(qsShouldStop) return;
    if(low<high) {
      document.getElementById('qs-depth-info').textContent=`Current depth: ${depth} | Subarray: [${arr.slice(low,high+1).join(', ')}]`;
      const pi=await partition(arr,low,high);
      await quickSort(arr,low,pi-1,depth+1);
      await quickSort(arr,pi+1,high,depth+1);
    } else if(low===high) {
      qsSortedSet.add(low);
      qsArray=[...arr];
      qsRenderElements(arr,-1,-1,-1,-1,qsSortedSet,low,high);
    }
  }

  await quickSort(arr,0,arr.length-1);
  if(!qsShouldStop) {
    for(let i=0;i<arr.length;i++) qsSortedSet.add(i);
    qsRenderElements(arr,-1,-1,-1,-1,qsSortedSet,0,arr.length-1);
    showToast('Quick Sort complete! ✅','success');
  }
  qsRunning=false;
}

qsReset();

// ═══════════════════════════════════════════════════════════
// TOOL 8: FRACTIONAL KNAPSACK
// ═══════════════════════════════════════════════════════════
let fkItems=[
  {name:'A',w:10,v:60},
  {name:'B',w:20,v:100},
  {name:'C',w:30,v:120},
  {name:'D',w:5,v:30},
];

function fkRenderItems() {
  const tbody=document.getElementById('fk-items-body');
  tbody.innerHTML='';
  fkItems.forEach((item,i)=>{
    const ratio=(item.v/item.w).toFixed(2);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="text" value="${item.name}" style="width:60px" onchange="fkItems[${i}].name=this.value"></td>
      <td><input type="number" value="${item.w}" min="1" style="width:60px" onchange="fkItems[${i}].w=parseFloat(this.value)||1"></td>
      <td><input type="number" value="${item.v}" min="1" style="width:60px" onchange="fkItems[${i}].v=parseFloat(this.value)||1"></td>
      <td style="font-family:JetBrains Mono;font-size:12px;color:var(--accent-gold)">${ratio}</td>
      <td><button class="btn btn-red btn-sm" onclick="fkItems.splice(${i},1);fkRenderItems()">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function fkAddItem() {
  if(fkItems.length>=10){showToast('Max 10 items');return;}
  fkItems.push({name:String.fromCharCode(65+fkItems.length),w:10,v:50});
  fkRenderItems();
}

function fkReset() {
  document.getElementById('fk-viz').style.display='none';
}

async function fkSolve() {
  const cap=parseFloat(document.getElementById('fk-capacity').value)||1;
  const items=fkItems.filter(x=>x.w>0&&x.v>0);
  if(items.length===0){showToast('Add items');return;}

  const sorted=[...items].map((item,i)=>({...item,ratio:item.v/item.w,origIdx:i})).sort((a,b)=>b.ratio-a.ratio);
  document.getElementById('fk-viz').style.display='block';

  // render cards
  const cardsDiv=document.getElementById('fk-cards');
  cardsDiv.innerHTML='';
  sorted.forEach((item,i)=>{
    const card=document.createElement('div');
    card.className='fk-item-card';
    const rClass=i===0?'ratio-gold':i===1?'ratio-silver':i===2?'ratio-bronze':'ratio-default';
    card.innerHTML=`
      <div class="ratio-badge ${rClass}">${item.ratio.toFixed(2)}</div>
      <div style="font-family:Orbitron;font-weight:700;font-size:18px;color:var(--accent-blue);margin-bottom:4px">${item.name}</div>
      <div style="font-size:12px;color:var(--text-secondary)">w=${item.w}</div>
      <div style="font-size:12px;color:var(--text-secondary)">v=${item.v}</div>
      <div style="font-size:11px;font-family:JetBrains Mono;color:var(--accent-gold);margin-top:6px">v/w=${item.ratio.toFixed(2)}</div>
    `;
    card.style.minWidth='100px';
    card.style.animation='popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
    card.style.animationDelay=(i*0.08)+'s';
    cardsDiv.appendChild(card);
  });

  // greedy fill
  let remCap=cap, totalProfit=0;
  const taken=[];
  const detail=[];
  const fillDiv=document.getElementById('fk-bag-fill');
  const labelDiv=document.getElementById('fk-bag-label');

  for(const item of sorted) {
    if(remCap<=0) break;
    if(item.w<=remCap) {
      remCap-=item.w; totalProfit+=item.v;
      taken.push({...item,frac:1,takenW:item.w,takenV:item.v});
      detail.push(`<span style="color:var(--accent-green)">✅ ${item.name}: Full (w=${item.w}, v=${item.v})</span>`);
    } else {
      const frac=remCap/item.w;
      totalProfit+=item.v*frac;
      taken.push({...item,frac,takenW:remCap,takenV:item.v*frac});
      detail.push(`<span style="color:var(--accent-gold)">⚡ ${item.name}: ${(frac*100).toFixed(1)}% (w=${remCap.toFixed(2)}, v=${(item.v*frac).toFixed(2)})</span>`);
      remCap=0;
    }
  }

  const fillPct=Math.min(100,(cap-remCap)/cap*100);
  setTimeout(()=>{ fillDiv.style.height=fillPct+'%'; labelDiv.textContent=fillPct.toFixed(0)+'%'; },200);
  document.getElementById('fk-total-profit').textContent=totalProfit.toFixed(2);
  document.getElementById('fk-result-detail').innerHTML=detail.join('<br>');
}

fkRenderItems();

// ═══════════════════════════════════════════════════════════
// TOOL 9: ACTIVITY SELECTION
// ═══════════════════════════════════════════════════════════
let actData=[
  {name:'I1',s:1,f:4},{name:'I2',s:3,f:5},{name:'I3',s:0,f:6},
  {name:'I4',s:5,f:7},{name:'I5',s:3,f:9},{name:'I6',s:5,f:9},{name:'I7',s:6,f:10}
];

function actRenderTable() {
  const tbody=document.getElementById('act-body');
  tbody.innerHTML='';
  actData.forEach((a,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="text" value="${a.name}" style="width:50px" onchange="actData[${i}].name=this.value"></td>
      <td><input type="number" value="${a.s}" min="0" style="width:60px" onchange="actData[${i}].s=parseInt(this.value)||0"></td>
      <td><input type="number" value="${a.f}" min="1" style="width:60px" onchange="actData[${i}].f=parseInt(this.value)||1"></td>
      <td><button class="btn btn-red btn-sm" onclick="actData.splice(${i},1);actRenderTable()">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function actAddRow() {
  actData.push({name:'I'+(actData.length+1),s:0,f:1});
  actRenderTable();
}

function actReset() {
  document.getElementById('activity-timeline').innerHTML='';
  document.getElementById('act-result-card').style.display='none';
}

async function actSolve() {
  const acts=actData.filter(a=>a.f>a.s);
  if(acts.length===0){showToast('Add valid activities');return;}
  const sorted=[...acts].sort((a,b)=>a.f-b.f);
  const maxT=Math.max(...sorted.map(a=>a.f));
  const tl=document.getElementById('activity-timeline');
  tl.innerHTML='';

  // timeline axis
  const axis=document.createElement('div');
  axis.className='timeline-axis';
  tl.appendChild(axis);

  // ticks
  for(let t=0;t<=maxT;t++) {
    const tick=document.createElement('div');
    tick.className='timeline-tick';
    tick.style.left=(10+(t/maxT)*85)+'%';
    tick.style.bottom='0';
    tick.style.position='absolute';
    tick.innerHTML=`<div class="timeline-tick-line"></div><div class="timeline-tick-label">${t}</div>`;
    tl.appendChild(tick);
  }

  const tlW=85; const tlLeft=10;
  const barH=28, barGap=6, topPad=16;
  const bars=[];

  sorted.forEach((act,i)=>{
    const bar=document.createElement('div');
    bar.className='activity-bar unprocessed';
    bar.style.left=(tlLeft+(act.s/maxT)*tlW)+'%';
    bar.style.width=((act.f-act.s)/maxT*tlW)+'%';
    bar.style.bottom=(24+i*(barH+barGap))+'px';
    bar.textContent=`${act.name} [${act.s},${act.f}]`;
    tl.appendChild(bar);
    bars.push(bar);
  });

  tl.style.height=(24+sorted.length*(barH+barGap)+topPad)+'px';

  await sleep(600);

  // greedy selection
  const selected=[];
  let lastFinish=-Infinity;
  for(let i=0;i<sorted.length;i++) {
    const act=sorted[i];
    if(act.s>=lastFinish) {
      selected.push(act);
      lastFinish=act.f;
      bars[i].className='activity-bar selected';
    } else {
      await sleep(300);
      bars[i].className='activity-bar rejected';
    }
    await sleep(400);
  }

  const resCard=document.getElementById('act-result-card');
  resCard.style.display='block';
  document.getElementById('act-result-detail').innerHTML=
    `<div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">Selected Activities: <span style="color:var(--accent-green);font-weight:700">${selected.length}</span></div>`+
    selected.map(a=>`<span class="stat-badge" style="display:inline-flex;min-width:auto;margin:4px;padding:6px 14px"><span style="color:var(--accent-green);font-family:JetBrains Mono">${a.name} [${a.s},${a.f}]</span></span>`).join('');
}

actRenderTable();

// ═══════════════════════════════════════════════════════════
// TOOL 10: BFS/DFS
// ═══════════════════════════════════════════════════════════
const bfsCanvas=document.getElementById('bfsdfs-canvas');
const bfsCtx=bfsCanvas.getContext('2d');
let bfsNodes=[], bfsEdges=[];
let bfsMode='node', bfsEdgeSource=null, bfsDragging=null, bfsDragOX=0, bfsDragOY=0;
let bfsNodeState={}, bfsEdgeState={};
let bfsAnimating=false;

function bfsdfsResizeCanvas() {
  const container=bfsCanvas.parentElement;
  bfsCanvas.width=container.clientWidth;
  bfsCanvas.height=400;
  bfsdfsRedraw();
}

function setBFSMode(mode) {
  bfsMode=mode;
  bfsEdgeSource=null;
  document.querySelectorAll('#tool-9 .mode-btn').forEach(b=>b.classList.remove('active-mode'));
  document.getElementById('bfs-mode-'+mode).classList.add('active-mode');
}

function bfsdfsRandomGraph() {
  bfsNodes=[]; bfsEdges=[]; bfsNodeState={}; bfsEdgeState={};
  const W=bfsCanvas.width, H=bfsCanvas.height;
  const n=7; const labels='ABCDEFG';
  for(let i=0;i<n;i++) {
    bfsNodes.push({x:80+(Math.random()*(W-160)),y:80+(Math.random()*(H-160)),label:labels[i]});
    bfsNodeState[i]='default';
  }
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,4],[3,5],[4,6],[2,6]];
  edges.forEach(([a,b])=>{ const ei=bfsEdges.length; bfsEdges.push({a,b}); bfsEdgeState[ei]='default'; });
  bfsdfsUpdateStartSelect();
  bfsdfsRedraw();
}

function bfsdfsUpdateStartSelect() {
  const sel=document.getElementById('bfsdfs-start');
  sel.innerHTML='';
  bfsNodes.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n.label;sel.appendChild(o);});
}

bfsCanvas.addEventListener('mousedown',bfsMouseDown);
bfsCanvas.addEventListener('mousemove',bfsMouseMove);
bfsCanvas.addEventListener('mouseup',()=>{bfsDragging=null;});

function bfsGetNodeAt(x,y){return bfsNodes.find(n=>Math.hypot(n.x-x,n.y-y)<26);}

function bfsMouseDown(e) {
  if(bfsAnimating) return;
  const rect=bfsCanvas.getBoundingClientRect();
  const x=e.clientX-rect.left, y=e.clientY-rect.top;
  if(bfsMode==='node') {
    const label=String.fromCharCode(65+bfsNodes.length%26);
    bfsNodes.push({x,y,label}); bfsNodeState[bfsNodes.length-1]='default';
    bfsdfsUpdateStartSelect(); bfsdfsRedraw();
  } else if(bfsMode==='edge') {
    const node=bfsGetNodeAt(x,y);
    if(!node) return;
    if(!bfsEdgeSource) { bfsEdgeSource=node; bfsdfsRedraw(); return; }
    if(bfsEdgeSource!==node) {
      const ai=bfsNodes.indexOf(bfsEdgeSource), bi=bfsNodes.indexOf(node);
      if(!bfsEdges.some(e=>(e.a===ai&&e.b===bi)||(e.a===bi&&e.b===ai))) {
        const popup=document.getElementById('bfsdfs-weight-popup');
        popup.dataset.a=ai; popup.dataset.b=bi;
        popup.style.display='block';
        popup.style.left=(e.clientX-bfsCanvas.parentElement.getBoundingClientRect().left+8)+'px';
        popup.style.top=(e.clientY-bfsCanvas.parentElement.getBoundingClientRect().top+8)+'px';
      }
      bfsEdgeSource=null; bfsdfsRedraw();
    }
  } else if(bfsMode==='drag') {
    const node=bfsGetNodeAt(x,y);
    if(node) { bfsDragging=node; bfsDragOX=node.x-x; bfsDragOY=node.y-y; }
  }
}

function bfsMouseMove(e) {
  if(!bfsDragging) return;
  const rect=bfsCanvas.getBoundingClientRect();
  bfsDragging.x=Math.max(30,Math.min(bfsCanvas.width-30,e.clientX-rect.left+bfsDragOX));
  bfsDragging.y=Math.max(30,Math.min(bfsCanvas.height-30,e.clientY-rect.top+bfsDragOY));
  bfsdfsRedraw();
}

function bfsdfsConfirmEdge() {
  const popup=document.getElementById('bfsdfs-weight-popup');
  const ai=parseInt(popup.dataset.a), bi=parseInt(popup.dataset.b);
  const ei=bfsEdges.length;
  bfsEdges.push({a:ai,b:bi}); bfsEdgeState[ei]='default';
  popup.style.display='none';
  bfsdfsRedraw();
}

function bfsdfsCancel() { document.getElementById('bfsdfs-weight-popup').style.display='none'; }

function bfsdfsRedraw() {
  const W=bfsCanvas.width, H=bfsCanvas.height;
  bfsCtx.clearRect(0,0,W,H);
  bfsEdges.forEach((e,i)=>{
    const a=bfsNodes[e.a], b=bfsNodes[e.b];
    if(!a||!b) return;
    const state=bfsEdgeState[i]||'default';
    bfsCtx.strokeStyle=state==='tree'?'#10b981':state==='cross'?'rgba(100,116,139,0.5)':'#475569';
    bfsCtx.lineWidth=state==='tree'?3:2;
    bfsCtx.setLineDash(state==='cross'?[5,4]:[]);
    if(state==='tree'){bfsCtx.shadowColor='rgba(16,185,129,0.5)';bfsCtx.shadowBlur=10;}else bfsCtx.shadowBlur=0;
    bfsCtx.beginPath(); bfsCtx.moveTo(a.x,a.y); bfsCtx.lineTo(b.x,b.y); bfsCtx.stroke();
    bfsCtx.setLineDash([]); bfsCtx.shadowBlur=0;
  });
  bfsNodes.forEach((node,i)=>{
    const state=bfsNodeState[i]||'default';
    let gStart='#1e293b', gEnd='#334155', shadowC='rgba(139,92,246,0.2)';
    if(state==='current'){gStart='#7c3aed';gEnd='#8b5cf6';shadowC='rgba(139,92,246,0.7)';}
    else if(state==='queued'){gStart='#92400e';gEnd='#f59e0b';shadowC='rgba(245,158,11,0.5)';}
    else if(state==='done'){gStart='#064e3b';gEnd='#10b981';shadowC='rgba(16,185,129,0.5)';}
    bfsCtx.shadowColor=shadowC; bfsCtx.shadowBlur=14;
    const g=bfsCtx.createRadialGradient(node.x-8,node.y-8,4,node.x,node.y,26);
    g.addColorStop(0,gStart); g.addColorStop(1,gEnd);
    bfsCtx.fillStyle=g;
    bfsCtx.beginPath(); bfsCtx.arc(node.x,node.y,26,0,Math.PI*2); bfsCtx.fill();
    bfsCtx.strokeStyle=state==='done'?'#10b981':state==='current'?'#8b5cf6':state==='queued'?'#f59e0b':'rgba(255,255,255,0.3)';
    bfsCtx.lineWidth=2; bfsCtx.stroke();
    bfsCtx.shadowBlur=0;
    bfsCtx.fillStyle='#fff'; bfsCtx.font='bold 14px Orbitron';
    bfsCtx.textAlign='center'; bfsCtx.textBaseline='middle';
    bfsCtx.fillText(node.label,node.x,node.y);
    if(node.visitOrder!==undefined) {
      bfsCtx.fillStyle='rgba(16,185,129,0.9)'; bfsCtx.font='bold 10px JetBrains Mono';
      bfsCtx.fillText(node.visitOrder,node.x+18,node.y-18);
    }
  });
}

function bfsdfsReset() {
  bfsAnimating=false;
  bfsNodes.forEach((n,i)=>{ delete n.visitOrder; bfsNodeState[i]='default'; });
  bfsEdges.forEach((_,i)=>bfsEdgeState[i]='default');
  document.getElementById('bfsdfs-queue-visual').innerHTML='';
  document.getElementById('bfsdfs-order').innerHTML='';
  bfsdfsRedraw();
}

function bfsdfsUpdateDS(queue, currentLabel) {
  const vis=document.getElementById('bfsdfs-queue-visual');
  vis.innerHTML='';
  const algo=document.getElementById('bfsdfs-algo').value;
  const ds=algo==='bfs'?[...queue]:[...queue].reverse();
  ds.forEach((ni,pos)=>{
    const b=document.createElement('div');
    b.className='qs-node-badge '+(pos===0?'current':'queued');
    b.textContent=bfsNodes[ni]?.label||'?';
    vis.appendChild(b);
  });
}

async function bfsdfsRun() {
  if(bfsNodes.length===0){showToast('Add nodes first');return;}
  if(bfsAnimating) return;
  bfsdfsReset();
  bfsAnimating=true;
  const algo=document.getElementById('bfsdfs-algo').value;
  const startIdx=parseInt(document.getElementById('bfsdfs-start').value)||0;
  const speed=parseInt(document.getElementById('bfsdfs-speed').value);
  document.getElementById('bfsdfs-ds-title').textContent=algo==='bfs'?'Queue (BFS)':'Stack (DFS)';

  const visited=new Set();
  const orderDiv=document.getElementById('bfsdfs-order');
  let visitCount=0;

  function getNeighbors(ni) {
    return bfsEdges.filter(e=>e.a===ni||e.b===ni).map(e=>e.a===ni?e.b:e.a);
  }

  function addToOrder(nodeIdx) {
    const badge=document.createElement('span');
    badge.className='traversal-node';
    badge.textContent=bfsNodes[nodeIdx].label;
    if(orderDiv.children.length>0) {
      const arr=document.createElement('span');
      arr.className='traversal-arrow';
      arr.textContent=' → ';
      orderDiv.appendChild(arr);
    }
    orderDiv.appendChild(badge);
  }

  if(algo==='bfs') {
    const queue=[startIdx];
    visited.add(startIdx);
    bfsNodeState[startIdx]='queued';
    bfsdfsRedraw();
    while(queue.length>0) {
      bfsdfsUpdateDS(queue);
      const ni=queue.shift();
      bfsNodeState[ni]='current';
      bfsdfsRedraw();
      await sleep(speed);
      visited.add(ni);
      bfsNodes[ni].visitOrder=++visitCount;
      addToOrder(ni);
      for(const nb of getNeighbors(ni)) {
        if(!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
          bfsNodeState[nb]='queued';
          const ei=bfsEdges.findIndex(e=>(e.a===ni&&e.b===nb)||(e.a===nb&&e.b===ni));
          if(ei>=0) bfsEdgeState[ei]='tree';
        }
      }
      bfsNodeState[ni]='done';
      bfsdfsRedraw();
      await sleep(speed/2);
    }
  } else {
    // DFS iterative
    const stack=[startIdx];
    while(stack.length>0) {
      bfsdfsUpdateDS(stack);
      const ni=stack.pop();
      if(visited.has(ni)) continue;
      visited.add(ni);
      bfsNodeState[ni]='current';
      bfsdfsRedraw();
      await sleep(speed);
      bfsNodes[ni].visitOrder=++visitCount;
      addToOrder(ni);
      for(const nb of getNeighbors(ni)) {
        if(!visited.has(nb)) {
          stack.push(nb);
          bfsNodeState[nb]='queued';
          const ei=bfsEdges.findIndex(e=>(e.a===ni&&e.b===nb)||(e.a===nb&&e.b===ni));
          if(ei>=0) bfsEdgeState[ei]='tree';
        }
      }
      bfsNodeState[ni]='done';
      bfsdfsRedraw();
      await sleep(speed/2);
    }
  }

  bfsdfsUpdateDS([]);
  bfsAnimating=false;
  showToast(`${algo.toUpperCase()} traversal complete! ✅`,'success');
}

// Init BFS/DFS canvas
setTimeout(()=>{bfsdfsResizeCanvas(); bfsdfsRandomGraph();},300);
window.addEventListener('resize',()=>{ sortDrawBars(); mstResizeCanvas(); bfsdfsResizeCanvas(); djkResizeCanvas(); });

// ═══════════════════════════════════════════════════════════
// SHARED NEW MODULE UTILITIES
// ═══════════════════════════════════════════════════════════
function toggleTheory(id, btn) {
  const body = document.getElementById(id);
  body.classList.toggle('open');
  btn.classList.toggle('open');
}

function addLog(loggerId, text, cls='') {
  const log = document.getElementById(loggerId);
  if(!log) return;
  const d = document.createElement('div');
  d.className = 'step-log-entry ' + cls;
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function clearLog(loggerId) {
  const el = document.getElementById(loggerId);
  if(el) el.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════
// TOOL 11: MATRIX CHAIN MULTIPLICATION
// ═══════════════════════════════════════════════════════════
let mcmAnimating=false, mcmShouldStop=false;
let mcmDpSteps=[], mcmStepIndex=0;
let mcmDp=[], mcmSplit=[], mcmDims=[];
let mcmOps=0, mcmComps=0, mcmIter=0;

function mcmSetView(mode, btn) {
  document.querySelectorAll('#tool-10 .view-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mcm-interactive-view').style.display = mode==='interactive'?'block':'none';
  document.getElementById('mcm-exam-view').style.display = mode==='exam'?'block':'none';
  if(mode==='exam') mcmBuildExamView();
}

function mcmReset() {
  mcmShouldStop=true; mcmAnimating=false;
  mcmDpSteps=[]; mcmStepIndex=0;
  mcmOps=0; mcmComps=0; mcmIter=0;
  document.getElementById('mcm-cost-table').innerHTML='';
  document.getElementById('mcm-split-table').innerHTML='';
  document.getElementById('mcm-result').style.display='none';
  document.getElementById('mcm-matrices-info').textContent='';
  document.getElementById('mcm-stat-ops').textContent='0';
  document.getElementById('mcm-stat-comp').textContent='0';
  document.getElementById('mcm-stat-iter').textContent='0';
  clearLog('mcm-steps');
}

function mcmParseDims() {
  const raw = document.getElementById('mcm-input').value;
  const dims = raw.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x)&&x>0);
  if(dims.length<3){showToast('Enter at least 3 dimensions (2+ matrices)');return null;}
  return dims;
}

function mcmBuildMatricesInfo(dims) {
  const n=dims.length-1;
  const info = Array.from({length:n},(_,i)=>`A${i+1}(${dims[i]}×${dims[i+1]})`).join(' × ');
  document.getElementById('mcm-matrices-info').textContent=`Matrices: ${info}`;
}

function mcmBuildTables(dp, split, n, hiI=-1, hiJ=-1) {
  function buildTable(tableId, data, label) {
    const table = document.getElementById(tableId);
    let html='<thead><tr><th>i\\j</th>';
    for(let j=1;j<=n;j++) html+=`<th>${j}</th>`;
    html+='</tr></thead><tbody>';
    for(let i=1;i<=n;i++) {
      html+=`<tr><th>${i}</th>`;
      for(let j=1;j<=n;j++) {
        let cls='', val='';
        if(i>j) { cls=''; val='-'; }
        else if(data[i][j]===undefined||data[i][j]===null) { val=''; }
        else {
          val = data[i][j]===Infinity?'∞':data[i][j];
          if(i===hiI&&j===hiJ) cls='computing';
          else if(i===1&&j===n&&label==='cost') cls='optimal';
          else cls='computed';
        }
        html+=`<td class="${cls}">${val}</td>`;
      }
      html+='</tr>';
    }
    html+='</tbody>';
    table.innerHTML=html;
  }
  buildTable('mcm-cost-table', dp, 'cost');
  buildTable('mcm-split-table', split, 'split');
}

function mcmCompute(dims) {
  const n=dims.length-1;
  const dp=Array.from({length:n+1},()=>new Array(n+1).fill(null));
  const split=Array.from({length:n+1},()=>new Array(n+1).fill(null));
  for(let i=1;i<=n;i++) dp[i][i]=0;
  const steps=[];
  for(let l=2;l<=n;l++) {
    for(let i=1;i<=n-l+1;i++) {
      const j=i+l-1;
      dp[i][j]=Infinity;
      for(let k=i;k<j;k++) {
        const cost=dp[i][k]+dp[k+1][j]+dims[i-1]*dims[k]*dims[j];
        if(cost<dp[i][j]) { dp[i][j]=cost; split[i][j]=k; }
        steps.push({i,j,k,cost,dpIJ:dp[i][j],splitIJ:split[i][j],dpSnapshot:dp.map(r=>[...r]),splitSnapshot:split.map(r=>[...r])});
      }
    }
  }
  return {dp,split,steps,n};
}

function mcmBuildParens(split,i,j) {
  if(i===j) return `A${i}`;
  const k=split[i][j];
  return `(${mcmBuildParens(split,i,k)} × ${mcmBuildParens(split,k+1,j)})`;
}

async function mcmStart() {
  mcmReset(); await sleep(50);
  const dims=mcmParseDims(); if(!dims) return;
  mcmDims=dims;
  mcmBuildMatricesInfo(dims);
  const {dp,split,steps,n}=mcmCompute(dims);
  mcmDp=[...dp]; mcmSplit=[...split];
  mcmDpSteps=steps; mcmStepIndex=0;
  mcmShouldStop=false; mcmAnimating=true;
  const speed=parseInt(document.getElementById('mcm-speed').value);

  const partDp=Array.from({length:n+1},()=>new Array(n+1).fill(null));
  const partSplit=Array.from({length:n+1},()=>new Array(n+1).fill(null));
  for(let i=1;i<=n;i++) partDp[i][i]=0;

  for(let si=0;si<steps.length;si++) {
    if(mcmShouldStop) break;
    const s=steps[si];
    mcmOps++; mcmComps++;
    partDp[s.i][s.j]=s.dpIJ;
    partSplit[s.i][s.j]=s.splitIJ;
    mcmBuildTables(partDp,partSplit,n,s.i,s.j);
    addLog('mcm-steps',`dp[${s.i}][${s.j}]: k=${s.k}, cost=${s.cost} → best=${s.dpIJ}`,'highlight');
    document.getElementById('mcm-stat-ops').textContent=mcmOps;
    document.getElementById('mcm-stat-comp').textContent=mcmComps;
    document.getElementById('mcm-stat-iter').textContent=Math.floor(si/(n*(n-1)/2))+1;
    await sleep(speed);
  }

  if(!mcmShouldStop) {
    mcmBuildTables(dp,split,n,-1,-1);
    const parens=mcmBuildParens(split,1,n);
    document.getElementById('mcm-min-cost').textContent=dp[1][n];
    document.getElementById('mcm-parens').textContent=parens;
    document.getElementById('mcm-result').style.display='block';
    addLog('mcm-steps',`✅ Optimal: ${parens} = ${dp[1][n]}`,'success');
    showToast('MCM solved! ✅','success');
  }
  mcmAnimating=false;
}

async function mcmSolveAll() {
  mcmReset(); await sleep(50);
  const dims=mcmParseDims(); if(!dims) return;
  mcmDims=dims;
  mcmBuildMatricesInfo(dims);
  const {dp,split,n}=mcmCompute(dims);
  mcmBuildTables(dp,split,n,-1,-1);
  const parens=mcmBuildParens(split,1,n);
  document.getElementById('mcm-min-cost').textContent=dp[1][n];
  document.getElementById('mcm-parens').textContent=parens;
  document.getElementById('mcm-result').style.display='block';
  addLog('mcm-steps',`dp[1][${n}] = ${dp[1][n]}`,'success');
  addLog('mcm-steps',`Optimal: ${parens}`,'success');
}

function mcmStepFwd() {
  const dims=mcmParseDims(); if(!dims) return;
  if(mcmDpSteps.length===0) { mcmSolveAll(); return; }
  if(mcmStepIndex>=mcmDpSteps.length) return;
  const s=mcmDpSteps[mcmStepIndex];
  const n2=dims.length-1;
  const partDp=Array.from({length:n2+1},()=>new Array(n2+1).fill(null));
  const partSplit=Array.from({length:n2+1},()=>new Array(n2+1).fill(null));
  for(let i=1;i<=n2;i++) partDp[i][i]=0;
  for(let si=0;si<=mcmStepIndex;si++) {
    const ss=mcmDpSteps[si];
    partDp[ss.i][ss.j]=ss.dpIJ;
    partSplit[ss.i][ss.j]=ss.splitIJ;
  }
  mcmBuildTables(partDp,partSplit,n2,s.i,s.j);
  addLog('mcm-steps',`Step ${mcmStepIndex+1}: dp[${s.i}][${s.j}] via k=${s.k} = ${s.dpIJ}`,'highlight');
  mcmStepIndex++;
}

function mcmStepBack() {
  if(mcmStepIndex<=1) return;
  mcmStepIndex--;
  const dims=mcmParseDims(); if(!dims) return;
  if(mcmDpSteps.length===0) return;
  const n2=dims.length-1;
  const partDp=Array.from({length:n2+1},()=>new Array(n2+1).fill(null));
  const partSplit=Array.from({length:n2+1},()=>new Array(n2+1).fill(null));
  for(let i=1;i<=n2;i++) partDp[i][i]=0;
  for(let si=0;si<mcmStepIndex;si++) {
    const ss=mcmDpSteps[si];
    partDp[ss.i][ss.j]=ss.dpIJ;
    partSplit[ss.i][ss.j]=ss.splitIJ;
  }
  mcmBuildTables(partDp,partSplit,n2,-1,-1);
}

function mcmBuildExamView() {
  const dims=mcmParseDims(); if(!dims) return;
  const {dp,split,n}=mcmCompute(dims);
  const parens=mcmBuildParens(split,1,n);
  const ev=document.getElementById('mcm-exam-view');
  let html=`<div class="exam-section"><h3>Matrix Chain Multiplication — GTU Exam Format</h3>`;
  html+=`<p><b>Given:</b> Dimensions = [${dims.join(', ')}]</p>`;
  html+=`<p><b>Matrices:</b> ${Array.from({length:n},(_,i)=>`A${i+1}(${dims[i]}×${dims[i+1]})`).join(', ')}</p><br>`;
  html+=`<p><b>DP Cost Table (dp[i][j]):</b></p><table><tr><th>i\\j</th>`;
  for(let j=1;j<=n;j++) html+=`<th>${j}</th>`;
  html+='</tr>';
  for(let i=1;i<=n;i++) {
    html+=`<tr><th>${i}</th>`;
    for(let j=1;j<=n;j++) html+=`<td>${i>j?'-':dp[i][j]===null?'':dp[i][j]===Infinity?'∞':dp[i][j]}</td>`;
    html+='</tr>';
  }
  html+=`</table><br><p><b>Split Table (s[i][j]):</b></p><table><tr><th>i\\j</th>`;
  for(let j=1;j<=n;j++) html+=`<th>${j}</th>`;
  html+='</tr>';
  for(let i=1;i<=n;i++) {
    html+=`<tr><th>${i}</th>`;
    for(let j=1;j<=n;j++) html+=`<td>${i>=j?'-':split[i][j]||''}</td>`;
    html+='</tr>';
  }
  html+=`</table><br><p><b>Minimum Cost:</b> ${dp[1][n]}</p>`;
  html+=`<p><b>Optimal Parenthesization:</b> ${parens}</p></div>`;
  ev.innerHTML=html;
}

// Init MCM
(function(){const dims=mcmParseDims();if(dims)mcmBuildMatricesInfo(dims);})();

// ═══════════════════════════════════════════════════════════
// TOOL 12: COIN CHANGE
// ═══════════════════════════════════════════════════════════
let ccMode='dp', ccRunning=false, ccShouldStop=false;

function ccSetMode(mode, btn) {
  ccMode=mode;
  document.querySelectorAll('#tool-11 .view-toggle .view-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function ccSetView(mode, btn) {
  document.querySelectorAll('#tool-11 > .card .view-toggle .view-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cc-interactive-view').style.display = mode==='interactive'?'block':'none';
  document.getElementById('cc-exam-view').style.display = mode==='exam'?'block':'none';
  if(mode==='exam') ccBuildExamView();
}

function ccReset() {
  ccShouldStop=true; ccRunning=false;
  document.getElementById('cc-coin-display').innerHTML='';
  document.getElementById('cc-dp-array').innerHTML='';
  document.getElementById('cc-result').style.display='none';
  clearLog('cc-steps');
}

function ccParseInputs() {
  const coins=document.getElementById('cc-coins').value.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x)&&x>0);
  const amount=parseInt(document.getElementById('cc-amount').value)||0;
  if(coins.length===0||amount<1){showToast('Enter valid coins and amount');return null;}
  return {coins:[...new Set(coins)].sort((a,b)=>b-a),amount};
}

function ccRenderCoins(coins,usedCoins=[]) {
  const div=document.getElementById('cc-coin-display');
  div.innerHTML='';
  coins.forEach(c=>{
    const b=document.createElement('div');
    const useCount=usedCoins.filter(x=>x===c).length;
    b.className='coin-bubble gold'+(useCount?' used':'');
    b.textContent=c;
    if(useCount>1){const cnt=document.createElement('span');cnt.style.cssText='font-size:10px;position:absolute;top:-6px;right:-6px;background:#f59e0b;color:#000;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:700';cnt.textContent=useCount;b.style.position='relative';b.appendChild(cnt);}
    div.appendChild(b);
  });
}

function ccRenderDPArray(dp, amount, highlightIdx=-1, pathCells=[]) {
  const div=document.getElementById('cc-dp-array');
  div.innerHTML='';
  for(let i=0;i<=amount;i++) {
    const wrap=document.createElement('div');
    wrap.className='dp-arr-cell';
    const val=document.createElement('div');
    val.className='dp-arr-val'+
      (i===highlightIdx?' computing':
       pathCells.includes(i)?' path':
       dp[i]<Infinity&&dp[i]>0?' optimal':'');
    val.textContent=dp[i]>=Infinity?'∞':dp[i];
    const idx=document.createElement('div');
    idx.className='dp-arr-idx';
    idx.textContent=i;
    wrap.appendChild(val); wrap.appendChild(idx);
    div.appendChild(wrap);
  }
}

async function ccRun() {
  ccReset(); await sleep(50);
  const inp=ccParseInputs(); if(!inp) return;
  const {coins,amount}=inp;
  const speed=parseInt(document.getElementById('cc-speed').value);
  ccRunning=true; ccShouldStop=false;

  ccRenderCoins(coins);
  if(ccMode==='greedy'||ccMode==='compare') {
    addLog('cc-steps','─── GREEDY APPROACH ───','highlight');
    let rem=amount, usedCoins=[], count=0;
    let possible=true;
    const greedyCoins=[...coins].sort((a,b)=>b-a);
    for(const c of greedyCoins) { while(rem>=c){rem-=c;usedCoins.push(c);count++;} }
    if(rem>0){addLog('cc-steps','❌ Greedy FAILS — cannot make exact amount','');possible=false;}
    else{addLog('cc-steps',`✅ Greedy: ${count} coins [${usedCoins.join(',')}]`,'success');}
    ccRenderCoins(coins,usedCoins);
    if(ccMode==='greedy') {
      document.getElementById('cc-result').style.display='block';
      document.getElementById('cc-min-coins').textContent=possible?count:'∞';
      document.getElementById('cc-coins-used').textContent=possible?usedCoins.join(' + '):'No solution';
      ccRunning=false; return;
    }
    await sleep(speed*2);
  }

  if(ccMode==='dp'||ccMode==='compare') {
    addLog('cc-steps','─── DP APPROACH ───','info');
    const dp=new Array(amount+1).fill(Infinity);
    const from=new Array(amount+1).fill(-1);
    dp[0]=0;
    ccRenderDPArray(dp,amount);
    await sleep(speed);

    for(let i=1;i<=amount;i++) {
      if(ccShouldStop) break;
      for(const c of coins) {
        if(i-c>=0&&dp[i-c]+1<dp[i]) {
          dp[i]=dp[i-c]+1; from[i]=c;
          ccRenderDPArray(dp,amount,i,[]);
          addLog('cc-steps',`dp[${i}] updated via coin ${c}: dp[${i}]=${dp[i]}`,'highlight');
          await sleep(speed/3);
        }
      }
      ccRenderDPArray(dp,amount,i,[]);
      await sleep(speed/2);
    }

    if(!ccShouldStop) {
      // reconstruct path
      const pathCells=[];
      let pos=amount;
      const usedDP=[];
      while(pos>0&&from[pos]!==-1){pathCells.push(pos);usedDP.push(from[pos]);pos-=from[pos];}
      pathCells.push(0);
      ccRenderDPArray(dp,amount,-1,pathCells);

      const minCoins=dp[amount];
      document.getElementById('cc-result').style.display='block';
      document.getElementById('cc-min-coins').textContent=minCoins===Infinity?'∞':minCoins;
      document.getElementById('cc-coins-used').textContent=minCoins===Infinity?'No solution':usedDP.join(' + ');
      addLog('cc-steps',`✅ Min coins for ${amount}: ${minCoins===Infinity?'∞':minCoins}`,'success');
      if(ccMode==='compare'&&minCoins!==Infinity) addLog('cc-steps',`DP coins: ${usedDP.join('+')}  (may differ from greedy)`,'success');
      ccRenderCoins(coins,usedDP);
    }
  }
  ccRunning=false;
}

function ccBuildExamView() {
  const inp=ccParseInputs(); if(!inp) return;
  const {coins,amount}=inp;
  const dp=new Array(amount+1).fill(Infinity);
  dp[0]=0;
  const from=new Array(amount+1).fill(-1);
  for(let i=1;i<=amount;i++) for(const c of coins) if(i-c>=0&&dp[i-c]+1<dp[i]){dp[i]=dp[i-c]+1;from[i]=c;}
  let pos=amount; const usedDP=[];
  while(pos>0&&from[pos]!==-1){usedDP.push(from[pos]);pos-=from[pos];}
  const ev=document.getElementById('cc-exam-view');
  let html=`<div class="exam-section"><h3>Coin Change — DP Solution</h3>`;
  html+=`<p><b>Coins:</b> {${coins.join(', ')}}&nbsp;&nbsp;&nbsp;<b>Amount:</b> ${amount}</p><br>`;
  html+=`<p><b>DP Array:</b></p><table><tr><th>i</th>`;
  for(let i=0;i<=Math.min(amount,20);i++) html+=`<th>${i}</th>`;
  html+=`</tr><tr><th>dp[i]</th>`;
  for(let i=0;i<=Math.min(amount,20);i++) html+=`<td>${dp[i]===Infinity?'∞':dp[i]}</td>`;
  html+=`</tr></table><br>`;
  html+=`<p><b>Minimum coins:</b> ${dp[amount]===Infinity?'Not possible':dp[amount]}</p>`;
  if(dp[amount]!==Infinity) html+=`<p><b>Coins used:</b> ${usedDP.join(' + ')}</p>`;
  html+=`</div>`;
  ev.innerHTML=html;
}

// ═══════════════════════════════════════════════════════════
// TOOL 13: JOB SCHEDULING
// ═══════════════════════════════════════════════════════════
let jsData=[
  {name:'J1',d:2,p:100},{name:'J2',d:1,p:19},{name:'J3',d:2,p:27},
  {name:'J4',d:1,p:25},{name:'J5',d:3,p:15}
];

function jsRenderTable() {
  const tbody=document.getElementById('js-body');
  tbody.innerHTML='';
  jsData.forEach((j,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="text" value="${j.name}" style="width:50px" onchange="jsData[${i}].name=this.value"></td>
      <td><input type="number" value="${j.d}" min="1" style="width:60px" onchange="jsData[${i}].d=parseInt(this.value)||1"></td>
      <td><input type="number" value="${j.p}" min="1" style="width:70px" onchange="jsData[${i}].p=parseInt(this.value)||1"></td>
      <td><button class="btn btn-red btn-sm" onclick="jsData.splice(${i},1);jsRenderTable()">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function jsAddJob() {
  jsData.push({name:'J'+(jsData.length+1),d:2,p:50});
  jsRenderTable();
}

function jsReset() {
  document.getElementById('js-slots').innerHTML='';
  document.getElementById('js-cards').innerHTML='';
  document.getElementById('js-selected').textContent='0';
  document.getElementById('js-rejected').textContent='0';
  document.getElementById('js-profit').textContent='0';
  document.getElementById('js-util').textContent='0%';
  clearLog('js-steps');
}

async function jsSolve() {
  jsReset();
  const jobs=[...jsData].filter(j=>j.d>0&&j.p>0);
  if(jobs.length===0){showToast('Add jobs');return;}
  const sorted=[...jobs].sort((a,b)=>b.p-a.p);
  const maxD=Math.max(...sorted.map(j=>j.d));
  const slots=new Array(maxD).fill(null);
  const speed=400;

  // render slot boxes
  const slotsDiv=document.getElementById('js-slots');
  slotsDiv.innerHTML='';
  for(let t=0;t<maxD;t++) {
    const s=document.createElement('div');
    s.className='job-slot empty';
    s.id=`js-slot-${t}`;
    s.innerHTML=`<div><div style="font-size:10px;color:var(--text-secondary)">Slot ${t+1}</div><div>Empty</div></div>`;
    s.style.minWidth='90px';
    slotsDiv.appendChild(s);
  }

  // render job cards
  const cardsDiv=document.getElementById('js-cards');
  cardsDiv.innerHTML='';
  sorted.forEach((job,i)=>{
    const c=document.createElement('div');
    c.className='job-card';
    c.id=`js-card-${i}`;
    c.innerHTML=`<div style="font-family:Orbitron;font-weight:700;font-size:16px;color:#fb923c">${job.name}</div><div style="font-size:11px;color:var(--text-secondary)">Deadline: ${job.d}</div><div style="font-size:11px;color:#fbbf24;font-weight:700">Profit: ${job.p}</div>`;
    cardsDiv.appendChild(c);
  });

  addLog('js-steps','Sorted by profit: '+sorted.map(j=>`${j.name}(${j.p})`).join(' > '),'info');
  await sleep(speed);

  let selected=0, rejected=0, totalProfit=0;

  for(let i=0;i<sorted.length;i++) {
    const job=sorted[i];
    // find latest free slot ≤ deadline
    let found=-1;
    for(let t=Math.min(job.d-1,maxD-1);t>=0;t--) {
      if(slots[t]===null){found=t;break;}
    }
    if(found>=0) {
      slots[found]=job;
      selected++; totalProfit+=job.p;
      const slotEl=document.getElementById(`js-slot-${found}`);
      slotEl.className='job-slot filled';
      slotEl.innerHTML=`<div><div style="font-size:10px">${job.name}</div><div style="font-size:12px">p=${job.p}</div></div>`;
      document.getElementById(`js-card-${i}`).classList.add('selected');
      addLog('js-steps',`✅ ${job.name}: slot ${found+1} assigned (profit +${job.p})`,'success');
    } else {
      rejected++;
      document.getElementById(`js-card-${i}`).classList.add('rejected');
      addLog('js-steps',`❌ ${job.name}: no available slot ≤ deadline ${job.d}`,'');
    }
    document.getElementById('js-selected').textContent=selected;
    document.getElementById('js-rejected').textContent=rejected;
    document.getElementById('js-profit').textContent=totalProfit;
    document.getElementById('js-util').textContent=Math.round(selected/maxD*100)+'%';
    await sleep(speed);
  }
  showToast(`Scheduling complete! Profit: ${totalProfit} ✅`,'success');
}

jsRenderTable();

// ═══════════════════════════════════════════════════════════
// TOOL 14: DIJKSTRA SHORTEST PATH
// ═══════════════════════════════════════════════════════════
const djkCanvas=document.getElementById('djk-canvas');
const djkCtx=djkCanvas.getContext('2d');
let djkNodes=[], djkEdges=[];
let djkMode='node', djkEdgeSrc=null, djkDragging=null, djkDragOX=0, djkDragOY=0;
let djkNodeState={}, djkEdgeState={};
let djkNodeDist={}, djkNodePrev={};
let djkAnimating=false;

function djkResizeCanvas() {
  const container=djkCanvas.parentElement;
  djkCanvas.width=container.clientWidth;
  djkCanvas.height=420;
  djkRedraw();
}

function setDjkMode(mode) {
  djkMode=mode; djkEdgeSrc=null;
  document.querySelectorAll('#tool-13 .mode-btn').forEach(b=>b.classList.remove('active-mode'));
  document.getElementById('djk-mode-'+mode).classList.add('active-mode');
  const labels={node:'Add Node — Click canvas',edge:'Add Edge — Click source then target',drag:'Drag — Move nodes'};
  document.getElementById('djk-mode-label').textContent='Mode: '+labels[mode];
  djkCanvas.style.cursor=mode==='drag'?'grab':'crosshair';
}

function djkGetNodeAt(x,y){return djkNodes.find(n=>Math.hypot(n.x-x,n.y-y)<28);}

djkCanvas.addEventListener('mousedown',djkMouseDown);
djkCanvas.addEventListener('mousemove',djkMouseMove);
djkCanvas.addEventListener('mouseup',()=>{djkDragging=null;if(djkMode==='drag')djkCanvas.style.cursor='grab';});
djkCanvas.addEventListener('mouseleave',()=>{djkDragging=null;});

function djkMouseDown(e) {
  if(djkAnimating) return;
  const rect=djkCanvas.getBoundingClientRect();
  const x=e.clientX-rect.left, y=e.clientY-rect.top;
  if(djkMode==='node') {
    const label=String.fromCharCode(65+djkNodes.length%26);
    djkNodes.push({x,y,label,scale:0});
    djkNodeState[djkNodes.length-1]='default';
    djkUpdateSourceSelect(); djkRedraw();
    let sc=0;
    const anim=()=>{sc=Math.min(1,sc+0.12);djkNodes[djkNodes.length-1].scale=sc<0.7?sc/0.7*1.1:1.1-(sc-0.7)/0.3*0.1;djkRedraw();if(sc<1)requestAnimationFrame(anim);else djkNodes[djkNodes.length-1].scale=1;};
    anim();
  } else if(djkMode==='edge') {
    const node=djkGetNodeAt(x,y);
    if(!node) return;
    if(!djkEdgeSrc) { djkEdgeSrc=node; djkNodeState[djkNodes.indexOf(node)]='candidate'; djkRedraw(); return; }
    if(djkEdgeSrc!==node) {
      const ai=djkNodes.indexOf(djkEdgeSrc), bi=djkNodes.indexOf(node);
      if(djkEdges.some(e=>(e.a===ai&&e.b===bi)||(e.a===bi&&e.b===ai))) { showToast('Edge already exists'); djkEdgeSrc=null; djkNodeState[ai]='default'; djkRedraw(); return; }
      const popup=document.getElementById('djk-weight-popup');
      popup.dataset.a=ai; popup.dataset.b=bi; popup.style.display='block';
      popup.style.left=(e.clientX-djkCanvas.parentElement.getBoundingClientRect().left+8)+'px';
      popup.style.top=(e.clientY-djkCanvas.parentElement.getBoundingClientRect().top+8)+'px';
      djkEdgeSrc=null; djkNodeState[ai]='default'; djkRedraw();
    }
  } else if(djkMode==='drag') {
    const node=djkGetNodeAt(x,y);
    if(node){djkDragging=node;djkDragOX=node.x-x;djkDragOY=node.y-y;djkCanvas.style.cursor='grabbing';}
  }
}

function djkMouseMove(e) {
  if(!djkDragging) return;
  const rect=djkCanvas.getBoundingClientRect();
  djkDragging.x=Math.max(30,Math.min(djkCanvas.width-30,e.clientX-rect.left+djkDragOX));
  djkDragging.y=Math.max(30,Math.min(djkCanvas.height-30,e.clientY-rect.top+djkDragOY));
  djkRedraw();
}

function djkConfirmEdge() {
  const popup=document.getElementById('djk-weight-popup');
  const w=Math.max(1,Math.min(999,parseInt(document.getElementById('djk-weight-input').value)||1));
  const ai=parseInt(popup.dataset.a), bi=parseInt(popup.dataset.b);
  djkEdges.push({a:ai,b:bi,w});
  djkEdgeState[djkEdges.length-1]='default';
  popup.style.display='none';
  djkRedraw();
}

function djkCancelEdge() { document.getElementById('djk-weight-popup').style.display='none'; }

function djkUpdateSourceSelect() {
  const sel=document.getElementById('djk-source');
  sel.innerHTML='';
  djkNodes.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n.label;sel.appendChild(o);});
}

function djkRedraw() {
  const W=djkCanvas.width, H=djkCanvas.height;
  djkCtx.clearRect(0,0,W,H);
  // edges
  djkEdges.forEach((e,i)=>{
    const a=djkNodes[e.a], b=djkNodes[e.b];
    if(!a||!b) return;
    const state=djkEdgeState[i]||'default';
    let color='#475569', lw=2;
    if(state==='path'){color='#10b981';lw=4;djkCtx.shadowColor='rgba(16,185,129,0.7)';djkCtx.shadowBlur=14;}
    else if(state==='relaxed'){color='#3b82f6';lw=2;djkCtx.shadowColor='rgba(59,130,246,0.4)';djkCtx.shadowBlur=8;}
    else djkCtx.shadowBlur=0;
    djkCtx.strokeStyle=color; djkCtx.lineWidth=lw;
    djkCtx.beginPath(); djkCtx.moveTo(a.x,a.y); djkCtx.lineTo(b.x,b.y); djkCtx.stroke();
    djkCtx.shadowBlur=0;
    // weight badge
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    djkCtx.fillStyle=state==='path'?'rgba(16,185,129,0.3)':'#1e293b';
    djkCtx.strokeStyle=state==='path'?'#10b981':'rgba(255,255,255,0.2)';
    djkCtx.lineWidth=1;
    djkCtx.beginPath(); djkCtx.roundRect(mx-12,my-10,24,20,6); djkCtx.fill(); djkCtx.stroke();
    djkCtx.fillStyle='#f1f5f9'; djkCtx.font='bold 11px JetBrains Mono';
    djkCtx.textAlign='center'; djkCtx.textBaseline='middle'; djkCtx.fillText(e.w,mx,my);
  });
  // nodes
  djkNodes.forEach((node,i)=>{
    const sc=node.scale||1;
    djkCtx.save(); djkCtx.translate(node.x,node.y); djkCtx.scale(sc,sc);
    const state=djkNodeState[i]||'default';
    let gS='#1e293b', gE='#334155';
    if(state==='source'){gS='#d97706';gE='#f59e0b';djkCtx.shadowColor='rgba(245,158,11,0.7)';djkCtx.shadowBlur=20;}
    else if(state==='current'){gS='#7c3aed';gE='#8b5cf6';djkCtx.shadowColor='rgba(139,92,246,0.7)';djkCtx.shadowBlur=20;}
    else if(state==='finalized'){gS='#064e3b';gE='#10b981';djkCtx.shadowColor='rgba(16,185,129,0.5)';djkCtx.shadowBlur=14;}
    else if(state==='candidate'){gS='#1e3a5f';gE='#3b82f6';djkCtx.shadowColor='rgba(59,130,246,0.5)';djkCtx.shadowBlur=12;}
    else djkCtx.shadowBlur=0;
    const g=djkCtx.createRadialGradient(0,-8,2,0,0,28);
    g.addColorStop(0,gS); g.addColorStop(1,gE);
    djkCtx.beginPath(); djkCtx.arc(0,0,28,0,Math.PI*2); djkCtx.fillStyle=g; djkCtx.fill();
    djkCtx.strokeStyle='rgba(255,255,255,0.5)'; djkCtx.lineWidth=2; djkCtx.stroke();
    djkCtx.shadowBlur=0;
    djkCtx.fillStyle='#fff'; djkCtx.font='bold 13px Orbitron';
    djkCtx.textAlign='center'; djkCtx.textBaseline='middle'; djkCtx.fillText(node.label,0,0);
    // show distance
    const d=djkNodeDist[i];
    if(d!==undefined) {
      djkCtx.fillStyle=state==='finalized'?'#34d399':'#60a5fa';
      djkCtx.font='bold 10px JetBrains Mono';
      djkCtx.fillText(d===Infinity?'∞':d,0,38/sc);
    }
    djkCtx.restore();
  });
}

function djkReset() {
  djkAnimating=false;
  djkNodes.forEach((_,i)=>{djkNodeState[i]='default';});
  djkEdges.forEach((_,i)=>{djkEdgeState[i]='default';});
  djkNodeDist={}; djkNodePrev={};
  document.getElementById('djk-dist-body').innerHTML='';
  document.getElementById('djk-pq').innerHTML='';
  document.getElementById('djk-path-result').textContent='';
  clearLog('djk-steps');
  djkRedraw();
}

function djkUpdateDistTable() {
  const tbody=document.getElementById('djk-dist-body');
  tbody.innerHTML='';
  djkNodes.forEach((node,i)=>{
    const tr=document.createElement('tr');
    const state=djkNodeState[i]||'default';
    const d=djkNodeDist[i];
    const prev=djkNodePrev[i];
    tr.innerHTML=`<td style="font-family:Orbitron;font-weight:700">${node.label}</td>
      <td class="${state==='current'?'current':state==='finalized'?'finalized':d!==undefined&&d!==Infinity?'updated':''}">${d===undefined?'∞':d===Infinity?'∞':d}</td>
      <td>${prev!==undefined&&prev>=0?djkNodes[prev].label:'—'}</td>
      <td style="font-size:11px;color:${state==='finalized'?'#34d399':state==='current'?'#a78bfa':'#94a3b8'}">${state==='finalized'?'✅ Done':state==='current'?'⚡ Processing':'⏳ Pending'}</td>`;
    tbody.appendChild(tr);
  });
}

function djkUpdatePQ(pq) {
  const div=document.getElementById('djk-pq');
  div.innerHTML='';
  pq.forEach((item,i)=>{
    const b=document.createElement('div');
    b.className='pq-item'+(i===0?' processing':'');
    b.innerHTML=`<span style="font-family:Orbitron;font-weight:700">${djkNodes[item.node]?.label}</span><span style="color:#94a3b8">d=${item.dist}</span>`;
    div.appendChild(b);
  });
}

async function djkRun() {
  if(djkNodes.length<2){showToast('Add at least 2 nodes');return;}
  if(djkEdges.length===0){showToast('Add edges first');return;}
  if(djkAnimating) return;
  djkReset(); djkAnimating=true;
  const srcIdx=parseInt(document.getElementById('djk-source').value)||0;
  const speed=parseInt(document.getElementById('djk-speed').value);
  const n=djkNodes.length;

  // Build adjacency
  const adj=Array.from({length:n},()=>[]);
  djkEdges.forEach((e,i)=>{
    adj[e.a].push({node:e.b,w:e.w,edgeIdx:i});
    adj[e.b].push({node:e.a,w:e.w,edgeIdx:i}); // undirected
  });

  // Init distances
  djkNodes.forEach((_,i)=>{djkNodeDist[i]=Infinity;djkNodePrev[i]=-1;djkNodeState[i]='default';});
  djkNodeDist[srcIdx]=0;
  djkNodeState[srcIdx]='source';

  // Simple PQ simulation
  let pq=[{node:srcIdx,dist:0}];
  const visited=new Set();

  djkUpdateDistTable();
  djkUpdatePQ(pq);
  djkRedraw();
  addLog('djk-steps',`Start: ${djkNodes[srcIdx].label} (dist=0)`,'info');
  await sleep(speed);

  while(pq.length>0) {
    pq.sort((a,b)=>a.dist-b.dist);
    const {node:u,dist:du}=pq.shift();
    if(visited.has(u)) { djkUpdatePQ(pq); continue; }
    visited.add(u);
    djkNodeState[u]=u===srcIdx?'source':'current';
    djkUpdatePQ(pq);
    djkUpdateDistTable();
    djkRedraw();
    addLog('djk-steps',`Processing ${djkNodes[u].label} (dist=${du})`,'highlight');
    await sleep(speed);

    for(const {node:v,w,edgeIdx} of adj[u]) {
      if(visited.has(v)) continue;
      const nd=djkNodeDist[u]+w;
      if(nd<djkNodeDist[v]) {
        djkNodeDist[v]=nd;
        djkNodePrev[v]=u;
        djkNodeState[v]='candidate';
        djkEdgeState[edgeIdx]='relaxed';
        pq.push({node:v,dist:nd});
        addLog('djk-steps',`Relax ${djkNodes[u].label}→${djkNodes[v].label}: dist=${nd}`,'');
      }
    }
    djkNodeState[u]='finalized';
    djkUpdateDistTable();
    djkUpdatePQ(pq);
    djkRedraw();
    await sleep(speed/2);
  }

  // Highlight shortest paths from source to all
  djkEdges.forEach((_,i)=>{
    const e=djkEdges[i];
    if(djkNodePrev[e.b]===e.a||djkNodePrev[e.a]===e.b) djkEdgeState[i]='path';
  });
  djkRedraw();

  const results=djkNodes.map((n,i)=>`${n.label}:${djkNodeDist[i]===Infinity?'∞':djkNodeDist[i]}`).join('  ');
  document.getElementById('djk-path-result').textContent='Distances from '+djkNodes[srcIdx].label+': '+results;
  addLog('djk-steps','✅ Dijkstra complete!','success');
  djkAnimating=false;
  showToast('Dijkstra complete! ✅','success');
}

function djkRandom() {
  djkNodes=[]; djkEdges=[]; djkNodeState={}; djkEdgeState={};
  djkNodeDist={}; djkNodePrev={};
  const W=djkCanvas.width, H=djkCanvas.height;
  const labels='ABCDEFG'; const n=6;
  for(let i=0;i<n;i++){djkNodes.push({x:80+Math.random()*(W-160),y:80+Math.random()*(H-160),label:labels[i],scale:1});djkNodeState[i]='default';}
  const perm=shuffleArray([...Array(n).keys()]);
  for(let i=1;i<n;i++){const w=1+Math.floor(Math.random()*15);djkEdges.push({a:perm[i-1],b:perm[i],w});djkEdgeState[djkEdges.length-1]='default';}
  for(let k=0;k<4;k++){const a=Math.floor(Math.random()*n),b=Math.floor(Math.random()*n);if(a!==b&&!djkEdges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))){djkEdges.push({a,b,w:1+Math.floor(Math.random()*15)});djkEdgeState[djkEdges.length-1]='default';}}
  djkUpdateSourceSelect();
  djkUpdateDistTable();
  djkRedraw();
}

setTimeout(()=>{djkResizeCanvas();djkRandom();},400);

// ═══════════════════════════════════════════════════════════
// TOOL 15: FLOYD WARSHALL
// ═══════════════════════════════════════════════════════════
let fwN=4, fwInputMatrix=[], fwMatrices=[], fwStepIdx=0, fwAllSteps=[];
let fwTotalUpdates=0, fwTotalComps=0;

function fwBuildInput() {
  fwN=Math.min(6,Math.max(2,parseInt(document.getElementById('fw-n').value)||4));
  document.getElementById('fw-n').value=fwN;
  const INF=999;
  // default GTU-style adjacency
  const defaults=[
    [0,3,INF,7],[8,0,2,INF],[5,INF,0,1],[2,INF,INF,0]
  ];
  fwInputMatrix=Array.from({length:fwN},(_,i)=>Array.from({length:fwN},(_2,j)=>{
    if(i===j) return 0;
    return (defaults[i]&&defaults[i][j]!==undefined)?defaults[i][j]:INF;
  }));
  renderFWInputMatrix();
}

function renderFWInputMatrix() {
  const INF=999;
  const div=document.getElementById('fw-input-matrix');
  let html=`<table class="fw-matrix" id="fw-adj-table">`;
  html+=`<tr><th></th>${Array.from({length:fwN},(_,j)=>`<th>${String.fromCharCode(65+j)}</th>`).join('')}</tr>`;
  for(let i=0;i<fwN;i++){
    html+=`<tr><th>${String.fromCharCode(65+i)}</th>`;
    for(let j=0;j<fwN;j++){
      const v=fwInputMatrix[i][j];
      html+=`<td><input type="number" value="${v===999?'∞':v}" style="width:44px;background:transparent;border:none;color:${v===999?'#475569':'#f1f5f9'};font-family:JetBrains Mono;font-size:13px;text-align:center" onchange="fwUpdateCell(${i},${j},this.value)"></td>`;
    }
    html+='</tr>';
  }
  html+=`</table>`;
  div.innerHTML=html;
}

function fwUpdateCell(i,j,val){
  const v=val==='∞'||val===''?999:parseInt(val)||999;
  fwInputMatrix[i][j]=v;
}

function fwReset() {
  fwStepIdx=0; fwAllSteps=[];
  document.getElementById('fw-display-matrix').innerHTML='';
  document.getElementById('fw-iteration-label').textContent='';
  document.getElementById('fw-stat-iter').textContent='0';
  document.getElementById('fw-stat-updates').textContent='0';
  document.getElementById('fw-stat-comps').textContent='0';
  clearLog('fw-steps');
  fwTotalUpdates=0; fwTotalComps=0;
}

function fwRenderMatrix(mat, k, hiI=-1, hiJ=-1, updatedCells=[]) {
  const INF=999;
  let html=`<thead><tr><th>→</th>`;
  for(let j=0;j<fwN;j++) html+=`<th>${String.fromCharCode(65+j)}</th>`;
  html+=`</tr></thead><tbody>`;
  for(let i=0;i<fwN;i++){
    html+=`<tr><th>${String.fromCharCode(65+i)}</th>`;
    for(let j=0;j<fwN;j++){
      const isUpdated=updatedCells.some(c=>c[0]===i&&c[1]===j);
      const isPivotRow=i===k, isPivotCol=j===k;
      let cls='';
      if(isUpdated) cls='updated';
      else if(isPivotRow||isPivotCol) cls='pivot-row';
      if(i===hiI&&j===hiJ) cls='updated';
      const v=mat[i][j];
      html+=`<td class="${cls} ${v===INF?'inf':''}">${v===INF?'∞':v}</td>`;
    }
    html+='</tr>';
  }
  html+='</tbody>';
  document.getElementById('fw-display-matrix').innerHTML=html;
}

function fwComputeAllMatrices() {
  const INF=999;
  const matrices=[fwInputMatrix.map(r=>[...r])];
  const allStepData=[{mat:fwInputMatrix.map(r=>[...r]),k:-1,updatedCells:[],label:'D⁰ — Initial Distance Matrix'}];

  for(let k=0;k<fwN;k++){
    const prev=matrices[matrices.length-1];
    const curr=prev.map(r=>[...r]);
    const updated=[];
    for(let i=0;i<fwN;i++){
      for(let j=0;j<fwN;j++){
        fwTotalComps++;
        if(prev[i][k]+prev[k][j]<curr[i][j]){
          curr[i][j]=prev[i][k]+prev[k][j];
          updated.push([i,j]);
          fwTotalUpdates++;
        }
      }
    }
    matrices.push(curr);
    allStepData.push({mat:curr,k,updatedCells:updated,label:`D${k+1} — Via intermediate node ${String.fromCharCode(65+k)}`});
  }
  return {matrices,allStepData};
}

async function fwSolve() {
  fwReset();
  if(!fwInputMatrix||fwInputMatrix.length===0) fwBuildInput();
  fwTotalUpdates=0; fwTotalComps=0;
  const {matrices,allStepData}=fwComputeAllMatrices();
  fwAllSteps=allStepData; fwStepIdx=0;
  const speed=parseInt(document.getElementById('fw-speed').value);

  for(let si=0;si<allStepData.length;si++){
    const s=allStepData[si];
    document.getElementById('fw-iteration-label').textContent=s.label;
    fwRenderMatrix(s.mat,s.k,-1,-1,s.updatedCells);
    if(si>0) {
      s.updatedCells.forEach(([i,j])=>addLog('fw-steps',`D${si}[${String.fromCharCode(65+i)}][${String.fromCharCode(65+j)}] improved to ${s.mat[i][j]} via ${String.fromCharCode(65+s.k)}`,'highlight'));
      if(s.updatedCells.length===0) addLog('fw-steps',`D${si}: No improvements via ${String.fromCharCode(65+s.k)}`,'info');
    } else {
      addLog('fw-steps','D⁰: Initial matrix loaded','info');
    }
    document.getElementById('fw-stat-iter').textContent=si;
    document.getElementById('fw-stat-updates').textContent=fwTotalUpdates;
    document.getElementById('fw-stat-comps').textContent=fwTotalComps;
    await sleep(speed);
  }
  addLog('fw-steps','✅ Floyd-Warshall complete!','success');
  showToast('Floyd-Warshall complete! ✅','success');
}

function fwStepFwd() {
  if(fwAllSteps.length===0){fwSolve();return;}
  if(fwStepIdx>=fwAllSteps.length) return;
  const s=fwAllSteps[fwStepIdx];
  document.getElementById('fw-iteration-label').textContent=s.label;
  fwRenderMatrix(s.mat,s.k,-1,-1,s.updatedCells);
  document.getElementById('fw-stat-iter').textContent=fwStepIdx;
  fwStepIdx++;
}

function fwStepBack() {
  if(fwStepIdx<=1) return;
  fwStepIdx--;
  const s=fwAllSteps[fwStepIdx-1];
  document.getElementById('fw-iteration-label').textContent=s.label;
  fwRenderMatrix(s.mat,s.k,-1,-1,[]);
}

function fwSetView(mode, btn) {
  document.querySelectorAll('#tool-14 .view-toggle .view-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fw-interactive-view').style.display=mode==='interactive'?'block':'none';
  document.getElementById('fw-exam-view').style.display=mode==='exam'?'block':'none';
  if(mode==='exam') fwBuildExamView();
}

function fwBuildExamView() {
  if(!fwInputMatrix||fwInputMatrix.length===0) fwBuildInput();
  fwTotalUpdates=0; fwTotalComps=0;
  const {allStepData}=fwComputeAllMatrices();
  const INF=999;
  const ev=document.getElementById('fw-exam-view');
  let html=`<div class="exam-section"><h3>Floyd-Warshall — GTU Exam Format</h3>`;
  allStepData.forEach((s,si)=>{
    html+=`<p><b>${s.label}</b></p><table><tr><th></th>${Array.from({length:fwN},(_,j)=>`<th>${String.fromCharCode(65+j)}</th>`).join('')}</tr>`;
    for(let i=0;i<fwN;i++){
      html+=`<tr><th>${String.fromCharCode(65+i)}</th>`;
      for(let j=0;j<fwN;j++) html+=`<td style="${s.updatedCells.some(c=>c[0]===i&&c[1]===j)?'background:#e6f3ff;font-weight:700':''}">${s.mat[i][j]===INF?'∞':s.mat[i][j]}</td>`;
      html+='</tr>';
    }
    html+=`</table><br>`;
  });
  html+=`</div>`;
  ev.innerHTML=html;
}

// Init Floyd Warshall
fwBuildInput();
fwRenderMatrix(fwInputMatrix,-1,-1,-1,[]);
document.getElementById('fw-iteration-label').textContent='D⁰ — Initial Distance Matrix';

// ═══════════════════════════════════════════════════════════
// TOOL 16: PDF EXPORT CENTER
// ═══════════════════════════════════════════════════════════

// Export registry — each completed module stores its data here
const exportRegistry = {};

function registerExport(key, data) {
  exportRegistry[key] = { ...data, timestamp: new Date().toISOString() };
}

function getExportData() {
  return {
    title: 'ADA Algorithm Lab — GTU Solution Report',
    subtitle: 'GTU BE04000241 — Analysis and Design of Algorithms',
    generated: new Date().toLocaleString(),
    algorithms: exportRegistry
  };
}

function refreshExportPreview() {
  const data = getExportData();
  const preview = document.getElementById('export-preview');

  let html = `<div style="font-family:'Courier New',monospace;font-size:12px;color:#000">`;
  html += `<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px">
    <div style="font-size:20px;font-weight:900;letter-spacing:2px">ADA ALGORITHM LAB</div>
    <div style="font-size:13px;margin-top:4px">GTU ADA Solution Report</div>
    <div style="font-size:11px;color:#666;margin-top:4px">Generated: ${data.generated}</div>
  </div>`;

  // Collect current algorithm states from the page
  const algorithms = [];

  // MCM
  const mcmCost = document.getElementById('mcm-min-cost');
  const mcmParens = document.getElementById('mcm-parens');
  if(mcmCost && mcmCost.textContent && mcmCost.textContent !== '0') {
    algorithms.push({name:'Matrix Chain Multiplication',result:`Min Cost = ${mcmCost.textContent}  |  ${mcmParens.textContent}`});
  }
  // Coin Change
  const ccMin = document.getElementById('cc-min-coins');
  const ccUsed = document.getElementById('cc-coins-used');
  if(ccMin && ccMin.textContent && ccMin.textContent !== '0') {
    algorithms.push({name:'Coin Change',result:`Min Coins = ${ccMin.textContent}  |  ${ccUsed.textContent}`});
  }
  // Job Scheduling
  const jsP = document.getElementById('js-profit');
  const jsSel = document.getElementById('js-selected');
  if(jsP && jsP.textContent && jsP.textContent !== '0') {
    algorithms.push({name:'Job Scheduling',result:`Total Profit = ${jsP.textContent}  |  Jobs Selected = ${jsSel.textContent}`});
  }
  // Dijkstra
  const djkPath = document.getElementById('djk-path-result');
  if(djkPath && djkPath.textContent) {
    algorithms.push({name:"Dijkstra's Shortest Path",result:djkPath.textContent});
  }
  // Floyd Warshall
  const fwIter = document.getElementById('fw-stat-iter');
  if(fwIter && fwIter.textContent && fwIter.textContent !== '0') {
    algorithms.push({name:'Floyd-Warshall',result:`Completed ${fwIter.textContent} iterations`});
  }
  // Knapsack
  const ksProfit = document.getElementById('ks-max-profit');
  if(ksProfit && ksProfit.textContent && ksProfit.textContent !== '0') {
    algorithms.push({name:'0/1 Knapsack',result:`Max Profit = ${ksProfit.textContent}`});
  }
  // LCS
  const lcsLen = document.getElementById('lcs-length');
  if(lcsLen && lcsLen.textContent && lcsLen.textContent !== '0') {
    algorithms.push({name:'LCS',result:`Length = ${lcsLen.textContent}`});
  }

  if(algorithms.length === 0) {
    html += `<div style="color:#888;text-align:center;padding:20px">No algorithms solved yet. Run some tools first, then refresh.</div>`;
  } else {
    algorithms.forEach((algo, i) => {
      html += `<div style="margin-bottom:14px;padding:10px;border:1px solid #ccc;border-radius:4px">
        <div style="font-weight:700;font-size:13px">${i+1}. ${algo.name}</div>
        <div style="color:#333;margin-top:4px">${algo.result}</div>
      </div>`;
    });
  }

  html += `<div style="border-top:1px solid #ccc;padding-top:12px;margin-top:16px;font-size:10px;color:#888;text-align:center">
    ADA Algorithm Lab · GTU BE04000241 · Generated ${data.generated}
  </div></div>`;

  preview.innerHTML = html;
}

function exportPDF() {
  const data = getExportData();
  // Build print content
  const printEl = document.getElementById('print-template');
  printEl.innerHTML = `
    <div style="font-family:serif;color:#000;padding:24px;max-width:800px;margin:0 auto">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px">
        <h1 style="font-size:24px;margin:0;letter-spacing:2px">ADA ALGORITHM LAB</h1>
        <p style="margin:4px 0;font-size:14px">GTU ADA Solution Report — BE04000241</p>
        <p style="margin:4px 0;font-size:12px;color:#555">Generated: ${data.generated}</p>
      </div>
      <p style="font-size:12px;color:#333">This report was generated from the ADA Algorithm Lab interactive visualizer. Run algorithms and use Print/Save as PDF to create a university-ready solution document.</p>
    </div>
  `;
  window.print();
}

function exportJSON() {
  const data = getExportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ada-lab-results.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('JSON exported! ✅','success');
}

function exportText() {
  const lines = [
    '╔══════════════════════════════════════════╗',
    '║      ADA ALGORITHM LAB — GTU REPORT      ║',
    '╚══════════════════════════════════════════╝',
    `Generated: ${new Date().toLocaleString()}`,
    `GTU BE04000241 — Analysis and Design of Algorithms`,
    '─'.repeat(50),
    '',
  ];

  const checks = [
    ['Matrix Chain Multiplication', 'mcm-min-cost', 'mcm-parens'],
    ['0/1 Knapsack', 'ks-max-profit', null],
    ['LCS Length', 'lcs-length', null],
    ['Coin Change Min Coins', 'cc-min-coins', 'cc-coins-used'],
    ['Job Scheduling Profit', 'js-profit', null],
    ['Dijkstra', 'djk-path-result', null],
  ];

  let hasAny = false;
  checks.forEach(([name, id1, id2]) => {
    const el1 = document.getElementById(id1);
    const el2 = id2 ? document.getElementById(id2) : null;
    if(el1 && el1.textContent && el1.textContent !== '0' && el1.textContent !== '-') {
      lines.push(`▸ ${name}: ${el1.textContent}${el2?' | '+el2.textContent:''}`);
      hasAny = true;
    }
  });

  if(!hasAny) lines.push('No algorithms completed yet.');
  lines.push('','─'.repeat(50));

  const text = lines.join('\n');
  const blob = new Blob([text], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ada-lab-report.txt';
  a.click(); URL.revokeObjectURL(url);
  showToast('Text report exported! ✅','success');
}

// Btn class alias for cyan
document.querySelectorAll('.btn-cyan').forEach(b=>{
  b.style.background='linear-gradient(135deg,#0e7490,#06b6d4)';
  b.style.color='#fff';
});

// ═══════════════════════════════════════════════════════════════════════════
// GTU PYQ QUESTION BANK  —  GTU BE-V 3150703 (2023-2025)
// ═══════════════════════════════════════════════════════════════════════════
const GTUQuestionBank = {

  sorting: [
    { id:'sort_s23_1', year:'Summer 2023', marks:4, topic:'Bucket Sort',
      question:'Perform Bucket sort for following sequence:\n30, 12, 22, 66, 48, 27, 35, 43, 47, 41',
      load:{ algo:'bucket', array:'30,12,22,66,48,27,35,43,47,41' },
      solution:{
        given:'Array = [30,12,22,66,48,27,35,43,47,41]',
        algorithm:'Bucket Sort',
        complexity:'O(n+k) average, O(n²) worst',
        steps:['Divide range [0,100) into 10 buckets of size 10','Assign each element to bucket⌊n/10⌋',
               'Bucket 1:[12] Bucket 2:[22,27] Bucket 3:[30,35] Bucket 4:[41,43,47,48] Bucket 6:[66]',
               'Sort each bucket individually','Concatenate all buckets in order'],
        answer:'Sorted: 12, 22, 27, 30, 35, 41, 43, 47, 48, 66'
      }},
    { id:'sort_w23_1', year:'Winter 2023', marks:7, topic:'Heap Sort',
      question:'Sort the following data using Heap Sort Method:\n20, 50, 30, 75, 90, 60, 80, 25, 10, 40',
      load:{ algo:'heap', array:'20,50,30,75,90,60,80,25,10,40' },
      solution:{
        given:'Array = [20,50,30,75,90,60,80,25,10,40]',
        algorithm:'Heap Sort',
        complexity:'O(n log n) all cases',
        steps:['Build Max-Heap from input array','Max-Heap: [90,75,80,50,40,30,60,25,10,20]',
               'Phase 2: repeatedly extract max and heapify',
               'Swap root with last, reduce heap size, call Heapify'],
        answer:'Sorted: 10, 20, 25, 30, 40, 50, 60, 75, 80, 90'
      }},
    { id:'sort_w24_1', year:'Winter 2024', marks:3, topic:'Counting Sort',
      question:'Sort the following elements using counting sort:\n2, 5, 3, 0, 2, 3, 0, 3',
      load:{ algo:'counting', array:'2,5,3,0,2,3,0,3' },
      solution:{
        given:'Array = [2,5,3,0,2,3,0,3], k=5',
        algorithm:'Counting Sort',
        complexity:'O(n+k)',
        steps:['Count: C[0]=2, C[2]=2, C[3]=3, C[5]=1','Cumulative count: C[0]=2,C[1]=2,C[2]=4,C[3]=7,C[4]=7,C[5]=8',
               'Place elements in output array from right to left'],
        answer:'Sorted: 0, 0, 2, 2, 3, 3, 3, 5'
      }},
    { id:'sort_w24_2', year:'Winter 2024', marks:4, topic:'Bucket Sort',
      question:'Sort the following elements using bucket sort:\n10, 21, 29, 41, 52',
      load:{ algo:'bucket', array:'10,21,29,41,52' },
      solution:{
        given:'Array = [10,21,29,41,52]',
        algorithm:'Bucket Sort',
        complexity:'O(n+k)',
        steps:['Create 6 buckets for range [0,60)','10→B[1], 21→B[2], 29→B[2], 41→B[4], 52→B[5]',
               'B[1]:[10], B[2]:[21,29], B[4]:[41], B[5]:[52]','Concatenate sorted buckets'],
        answer:'Sorted: 10, 21, 29, 41, 52'
      }},
    { id:'sort_w25_1', year:'Winter 2025', marks:7, topic:'Bubble Sort',
      question:'Apply bubble sort on the given data sequence:\n77, 22, 55, 11, 33, 66, 44',
      load:{ algo:'bubble', array:'77,22,55,11,33,66,44' },
      solution:{
        given:'Array = [77,22,55,11,33,66,44], n=7',
        algorithm:'Bubble Sort',
        complexity:'O(n²) worst/average, O(n) best',
        steps:['Pass 1: Compare adjacent pairs, bubble max to end → [22,55,11,33,66,44,77]',
               'Pass 2: → [22,11,33,55,44,66,77]','Pass 3: → [11,22,33,44,55,66,77]',
               'Passes 4-6: array already sorted, no swaps'],
        answer:'Sorted: 11, 22, 33, 44, 55, 66, 77'
      }},
    { id:'sort_w25_2', year:'Winter 2025', marks:7, topic:'Merge Sort',
      question:'Construct solution using Merge sort on the given data sequence:\n88, 77, 22, 55, 11, 33, 66, 99, 44',
      load:{ algo:'merge', array:'88,77,22,55,11,33,66,99,44' },
      solution:{
        given:'Array = [88,77,22,55,11,33,66,99,44], n=9',
        algorithm:'Merge Sort',
        complexity:'O(n log n) all cases',
        steps:['Divide: [88,77,22,55] | [11,33,66,99,44]',
               'Recursively sort each half',
               'Left sorted: [22,55,77,88], Right sorted: [11,33,44,66,99]',
               'Merge two sorted halves'],
        answer:'Sorted: 11, 22, 33, 44, 55, 66, 77, 88, 99\nRecurrence: T(n)=2T(n/2)+O(n) → O(n log n)'
      }},
  ],

  binarySearch: [
    { id:'bs_s24_1', year:'Summer 2024', marks:4, topic:'Binary Search',
      question:'Demonstrate Binary Search method to search Key = 14\nfrom the array A = ⟨2, 4, 7, 8, 9, 10, 12, 14, 18⟩',
      load:{ array:'2,4,7,8,9,10,12,14,18', target:14 },
      solution:{
        given:'Array A = [2,4,7,8,9,10,12,14,18], Key = 14',
        algorithm:'Binary Search',
        complexity:'O(log n)',
        steps:['low=0, high=8, mid=4 → A[4]=9 < 14 → search right',
               'low=5, high=8, mid=6 → A[6]=12 < 14 → search right',
               'low=7, high=8, mid=7 → A[7]=14 = Key ✓'],
        answer:'Key 14 found at index 7. Comparisons = 3. Time: O(log n)=O(log 9)≈3'
      }},
    { id:'bs_w23_1', year:'Winter 2023', marks:3, topic:'Binary Search',
      question:'Demonstrate Binary Search method to search Key = 14\nfrom the array A = ⟨2, 4, 7, 8, 10, 13, 14, 60⟩',
      load:{ array:'2,4,7,8,10,13,14,60', target:14 },
      solution:{
        given:'Array A = [2,4,7,8,10,13,14,60], Key = 14',
        algorithm:'Binary Search',
        complexity:'O(log n)',
        steps:['low=0, high=7, mid=3 → A[3]=8 < 14 → search right',
               'low=4, high=7, mid=5 → A[5]=13 < 14 → search right',
               'low=6, high=7, mid=6 → A[6]=14 = Key ✓'],
        answer:'Key 14 found at index 6. Comparisons = 3. Time: O(log 8)=O(3)'
      }},
  ],

  quickSort: [
    { id:'qs_s24_1', year:'Summer 2024', marks:7, topic:'Quick Sort',
      question:'Illustrate the working of Quick Sort on input:\n25, 29, 30, 35, 42, 47, 50, 52, 60\nComment on the nature of input (best/average/worst case).',
      load:{ array:'25,29,30,35,42,47,50,52,60' },
      solution:{
        given:'Array = [25,29,30,35,42,47,50,52,60], n=9',
        algorithm:'Quick Sort (last element as pivot)',
        complexity:'O(n²) — sorted input is worst case for naive pivot',
        steps:['Pivot=60: partition → [25,29,30,35,42,47,50,52] | 60',
               'Pivot=52: partition → [25,29,30,35,42,47,50] | 52 | 60',
               'Each partition puts pivot at rightmost position',
               'This is WORST CASE: already-sorted array with last-element pivot',
               'Recursion depth = n−1, comparisons = n(n−1)/2'],
        answer:'This is WORST CASE: T(n)=T(n-1)+O(n) → O(n²)\nFor random pivot on sorted array → O(n log n) average.'
      }},
    { id:'qs_w23_1', year:'Winter 2023', marks:7, topic:'Quick Sort',
      question:'Illustrate the working of Quick Sort on input:\n25, 29, 30, 35, 42, 47, 50, 52, 60\nAlso discuss worst and best case.',
      load:{ array:'25,29,30,35,42,47,50,52,60' },
      solution:{
        given:'Array = [25,29,30,35,42,47,50,52,60]',
        algorithm:'Quick Sort',
        complexity:'Best: O(n log n), Worst: O(n²)',
        steps:['Already sorted — with last-element pivot: WORST CASE',
               'Best case: pivot always splits array into equal halves → T(n)=2T(n/2)+O(n) → O(n log n)',
               'Worst case: pivot is always min/max → T(n)=T(n-1)+O(n) → O(n²)',
               'Average case: O(n log n)'],
        answer:'Input is sorted → WORST CASE for last-element pivot: O(n²)\nBest case T(n)=O(n log n) when pivot = median'
      }},
    { id:'qs_w25_1', year:'Winter 2025', marks:7, topic:'Quick Sort (Theory)',
      question:'Illustrate and solve recurrence for best and worst case of Quick Sort.',
      load:null,
      solution:{
        given:'Quick Sort recurrence analysis',
        algorithm:'Quick Sort',
        complexity:'Best: O(n log n), Worst: O(n²)',
        steps:['BEST CASE: Pivot always at median',
               'T(n) = 2T(n/2) + Θ(n)',
               'By Master Theorem (Case 2): T(n) = Θ(n log n)',
               'WORST CASE: Pivot always at min or max (sorted/reverse input)',
               'T(n) = T(n-1) + Θ(n)',
               'Substitution: T(n) = T(n-1)+cn = cn + c(n-1) + ... + c·1 = c·n(n+1)/2 = Θ(n²)'],
        answer:'Best Case: T(n) = O(n log n)\nWorst Case: T(n) = O(n²)\nAverage Case: T(n) = O(n log n)'
      }},
  ],

  lcs: [
    { id:'lcs_s24_1', year:'Summer 2024', marks:7, topic:'LCS (DP)',
      question:'Obtain Longest Common Subsequence using dynamic programming.\nA = "acabaca"   B = "bacac"',
      load:{ x:'acabaca', y:'bacac' },
      solution:{
        given:'X = acabaca (m=7), Y = bacac (n=5)',
        algorithm:'LCS — Dynamic Programming',
        complexity:'O(m×n) time, O(m×n) space',
        steps:['Build (m+1)×(n+1) DP table initialized to 0',
               'If X[i]=Y[j]: dp[i][j] = dp[i-1][j-1] + 1',
               'Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])',
               'LCS length = dp[7][5]','Traceback from dp[7][5] to find actual subsequence'],
        answer:'LCS Length = 5\nLCS = "acaca" or "bacac"\nTime: O(7×5) = O(35) = O(mn)'
      }},
    { id:'lcs_s25_1', year:'Summer 2025', marks:7, topic:'LCS (DP)',
      question:'Find the longest common subsequence using dynamic programming.\nX = 10101010011   Y = 101001',
      load:{ x:'10101010011', y:'101001' },
      solution:{
        given:'X = 10101010011 (m=11), Y = 101001 (n=6)',
        algorithm:'LCS — Dynamic Programming',
        complexity:'O(m×n) = O(66)',
        steps:['Build 12×7 DP table','Fill row by row using recurrence',
               'Traceback from dp[11][6]'],
        answer:'LCS Length = 6\nLCS = "101001"\nTime Complexity: O(m×n) = O(11×6) = O(66)'
      }},
    { id:'lcs_w25_1', year:'Winter 2025', marks:7, topic:'LCS (DP)',
      question:'Infer the Longest Common Subsequence for following strings:\nX = 10010100   Y = 10011',
      load:{ x:'10010100', y:'10011' },
      solution:{
        given:'X = 10010100 (m=8), Y = 10011 (n=5)',
        algorithm:'LCS — Dynamic Programming',
        complexity:'O(m×n) = O(40)',
        steps:['Build 9×6 DP table','Fill using LCS recurrence',
               'Traceback: follow diagonal arrows for matches'],
        answer:'LCS Length = 5\nLCS = "10011"\nTime Complexity: O(8×5) = O(40)'
      }},
  ],

  matrixChain: [
    { id:'mcm_w23_1', year:'Winter 2023', marks:7, topic:'Matrix Chain Multiplication',
      question:'Find optimal parenthesization of matrix chain:\nDimensions = (5, 10, 3, 12, 5, 50, 6)',
      load:{ dims:'5,10,3,12,5,50,6' },
      solution:{
        given:'Matrices A1(5×10), A2(10×3), A3(3×12), A4(12×5), A5(5×50), A6(50×6)',
        algorithm:'Matrix Chain Multiplication — DP',
        complexity:'O(n³) time, O(n²) space',
        steps:['n=6 matrices, dp[i][j] = min cost to multiply Ai..Aj',
               'Chain length l=2: dp[1][2]=150, dp[2][3]=360, dp[3][4]=180, dp[4][5]=3000, dp[5][6]=1500',
               'Chain length l=3,4,5,6: continue DP',
               'dp[1][6] gives minimum multiplications'],
        answer:'Minimum multiplications = 2010\nOptimal: ((A1(A2A3))((A4A5)A6))'
      }},
    { id:'mcm_s25_1', year:'Summer 2025', marks:7, topic:'Matrix Chain Multiplication',
      question:'Find optimal way of multiplying following matrices:\nA:2×3, B:3×5, C:5×6, D:6×2, E:2×3\nDimensions = (2, 3, 5, 6, 2, 3)',
      load:{ dims:'2,3,5,6,2,3' },
      solution:{
        given:'5 matrices: A(2×3),B(3×5),C(5×6),D(6×2),E(2×3)',
        algorithm:'Matrix Chain Multiplication — DP',
        complexity:'O(n³)=O(125)',
        steps:['Dimensions array p=[2,3,5,6,2,3]','l=2: dp[1][2]=30,dp[2][3]=90,dp[3][4]=60,dp[4][5]=36',
               'l=3,4: fill DP table systematically','l=5: dp[1][5] = minimum cost'],
        answer:'Minimum multiplications = 108\nOptimal parenthesization: (A(BC))(DE) or similar'
      }},
    { id:'mcm_w24_1', year:'Winter 2024', marks:7, topic:'Matrix Chain Multiplication',
      question:'Matrices A(5×10), B(10×15), C(15×20), D(20×25)\nDimensions = (5, 10, 15, 20, 25)',
      load:{ dims:'5,10,15,20,25' },
      solution:{
        given:'Dimensions p=[5,10,15,20,25], 4 matrices',
        algorithm:'Matrix Chain Multiplication — DP',
        complexity:'O(n³)=O(64)',
        steps:['l=2: dp[1][2]=750, dp[2][3]=3000, dp[3][4]=7500',
               'l=3: dp[1][3]=min(750+3000+5×15×20, 3000+750+5×10×20)=2750',
               'dp[2][4]=min(3000+7500+10×20×25,...)=8750 via k=3: 3000+7500... wait',
               'l=4: dp[1][4] = min over k=1,2,3'],
        answer:'Minimum multiplications = 11250\nOptimal: ((AB)(CD)) or (A(B(CD)))'
      }},
  ],

  coinChange: [
    { id:'cc_s23_1', year:'Summer 2023', marks:7, topic:'Coin Change (DP)',
      question:'Given the denominations d1=1, d2=4, d3=6.\nCalculate minimum coins for change of Rs. 8 using dynamic programming.',
      load:{ coins:'1,4,6', amount:8 },
      solution:{
        given:'Coins = {1, 4, 6}, Amount = 8',
        algorithm:'Coin Change — Dynamic Programming',
        complexity:'O(n·W) where n=3 coins, W=8',
        steps:['dp[0]=0, dp[1..8]=∞','dp[1]=dp[0]+1=1 (coin 1)',
               'dp[2]=2, dp[3]=3','dp[4]=min(dp[3]+1, dp[0]+1)=1 (coin 4)',
               'dp[5]=2, dp[6]=min(dp[5]+1, dp[2]+1, dp[0]+1)=1 (coin 6)',
               'dp[7]=2 (6+1), dp[8]=min(dp[7]+1, dp[4]+1, dp[2]+1)=2 (4+4)'],
        answer:'Minimum coins = 2\nCoins used: {4, 4}\nNote: Greedy fails: 6+1+1=3 coins, DP gives 4+4=2 coins'
      }},
    { id:'cc_w23_1', year:'Winter 2023', marks:4, topic:'Coin Change (DP)',
      question:'Given coins of denominations 2, 3, 4 with amount to pay is 5.\nFind optimal no. of coins using dynamic method.',
      load:{ coins:'2,3,4', amount:5 },
      solution:{
        given:'Coins = {2, 3, 4}, Amount = 5',
        algorithm:'Coin Change — Dynamic Programming',
        complexity:'O(n·W) = O(3×5) = O(15)',
        steps:['dp[0]=0, dp[1]=∞','dp[2]=1 (coin 2), dp[3]=1 (coin 3)',
               'dp[4]=min(dp[2]+1, dp[0]+1)=1 (coin 4 or 2+2)',
               'dp[5]=min(dp[3]+1, dp[2]+1)=2 (coin 2+3 or 3+2)'],
        answer:'Minimum coins = 2\nCoins used: {2, 3} or {3, 2}\nSequence: 2+3=5 ✓'
      }},
  ],

  knapsack: [
    { id:'ks_s23_1', year:'Summer 2023', marks:7, topic:'0/1 Knapsack (DP)',
      question:'Weights w=(3,4,6,5), Profit v=(2,3,1,4), Knapsack capacity W=8.\nFind maximum profit using dynamic programming.',
      load:{ capacity:8, items:[{w:3,v:2},{w:4,v:3},{w:6,v:1},{w:5,v:4}] },
      solution:{
        given:'n=4 items, W=8\nWeights=[3,4,6,5], Values=[2,3,1,4]',
        algorithm:'0/1 Knapsack — DP Table',
        complexity:'O(nW) = O(4×8) = O(32)',
        steps:['Build (n+1)×(W+1) table','Row 1 (w=3,v=2): dp[1][w]=2 for w≥3',
               'Row 2 (w=4,v=3): dp[2][7]=5, dp[2][8]=5','Row 3 (w=6,v=1): no improvement',
               'Row 4 (w=5,v=4): dp[4][8]=max(5, dp[3][3]+4)=max(5,6)=6',
               'Traceback: Item 4(w=5,v=4) + Item 1(w=3,v=2) selected'],
        answer:'Maximum Profit = 6\nSelected Items: Item D (w=5,v=4) + Item A (w=3,v=2)\nTotal Weight = 8 = capacity'
      }},
    { id:'ks_s24_1', year:'Summer 2024', marks:7, topic:'0/1 Knapsack (DP)',
      question:'Values=[12,10,20,15], Weights=[2,1,3,2], Capacity=7.\nSolve using dynamic programming.',
      load:{ capacity:7, items:[{w:2,v:12},{w:1,v:10},{w:3,v:20},{w:2,v:15}] },
      solution:{
        given:'n=4, W=7\nValues=[12,10,20,15], Weights=[2,1,3,2]',
        algorithm:'0/1 Knapsack — DP Table',
        complexity:'O(nW) = O(4×7) = O(28)',
        steps:['Row 1 (w=2,v=12): dp[1][2..7]=12','Row 2 (w=1,v=10): dp[2][1]=10, dp[2][3]=22, dp[2][4..7]=22',
               'Row 3 (w=3,v=20): dp[3][3]=max(22,20)=22, dp[3][4]=max(22,32)=32',
               'Row 4 (w=2,v=15): dp[4][2]=max(12,15)=15, dp[4][7]=max(dp[3][7],dp[3][5]+15)'],
        answer:'Maximum Value = 45\nSelected: Items 2(v=10,w=1) + 3(v=20,w=3) + 4(v=15,w=2) + partial\nActual: 37 → check traceback'
      }},
    { id:'ks_w23_1', year:'Winter 2023', marks:7, topic:'0/1 Knapsack (DP)',
      question:'Knapsack capacity W=5\nItems: (w=2,v=12), (w=1,v=10), (w=3,v=20), (w=2,v=15)',
      load:{ capacity:5, items:[{w:2,v:12},{w:1,v:10},{w:3,v:20},{w:2,v:15}] },
      solution:{
        given:'n=4, W=5, Items={(2,12),(1,10),(3,20),(2,15)}',
        algorithm:'0/1 Knapsack — DP Table',
        complexity:'O(nW) = O(4×5) = O(20)',
        steps:['dp[0][*]=0','dp[1][2..5]=12','dp[2][1]=10, dp[2][3]=22, dp[2][4]=22, dp[2][5]=22',
               'dp[3][3]=22, dp[3][4]=32, dp[3][5]=32','dp[4][2]=15, dp[4][4]=32, dp[4][5]=max(32,37)=37'],
        answer:'Maximum Value = 37\nSelected: Item B(w=1,v=10) + Item C(w=3,v=20) + Item D(w=2,v=15)→ wait w=1+2=3\nActual: B+C+D=w=1+3+2=6>5; Best: B(1)+D(2)+A(2)=5, v=10+15+12=37\nTotal weight=5=W ✓'
      }},
    { id:'ks_w24_1', year:'Winter 2024', marks:7, topic:'0/1 Knapsack (DP)',
      question:'Capacity=5 kg\nI1(w=2,v=3), I2(w=3,v=4), I3(w=4,v=5), I4(w=5,v=6)',
      load:{ capacity:5, items:[{w:2,v:3},{w:3,v:4},{w:4,v:5},{w:5,v:6}] },
      solution:{
        given:'n=4, W=5, Weights=[2,3,4,5], Values=[3,4,5,6]',
        algorithm:'0/1 Knapsack — DP Table',
        complexity:'O(nW) = O(20)',
        steps:['dp[1][2..5]=3','dp[2][3]=4, dp[2][5]=7','dp[3][4]=5, dp[3][5]=7',
               'dp[4][5]=max(dp[3][5], dp[3][0]+6)=max(7,6)=7'],
        answer:'Maximum Value = 7\nSelected: I1(w=2,v=3) + I2(w=3,v=4)\nTotal weight=5=W ✓'
      }},
    { id:'ks_w25_1', year:'Winter 2025', marks:7, topic:'0/1 Knapsack (DP)',
      question:'W=[1,2,5,6,10], V=[1,6,18,22,30], Knapsack capacity M=12.\nSolve using dynamic programming.',
      load:{ capacity:12, items:[{w:1,v:1},{w:2,v:6},{w:5,v:18},{w:6,v:22},{w:10,v:30}] },
      solution:{
        given:'n=5, M=12, W=[1,2,5,6,10], V=[1,6,18,22,30]',
        algorithm:'0/1 Knapsack — DP Table',
        complexity:'O(nM) = O(5×12) = O(60)',
        steps:['Build 6×13 DP table','Row-by-row fill using recurrence',
               'dp[i][w]=max(dp[i-1][w], dp[i-1][w-Wi]+Vi) if w≥Wi',
               'Key cells: dp[5][12]=40'],
        answer:'Maximum Value = 40\nSelected: Items with w=2(v=6) + w=4… compute exactly via calculator\nRun the calculator for precise traceback!'
      }},
  ],

  fractionalKnapsack: [
    { id:'fk_s24_1', year:'Summer 2024', marks:7, topic:'Fractional Knapsack (Greedy)',
      question:'n=5 items, Knapsack capacity W=100\nWeights={50,40,30,20,10}, Profits={1,2,3,4,5}',
      load:{ capacity:100, items:[{w:50,v:1},{w:40,v:2},{w:30,v:3},{w:20,v:4},{w:10,v:5}] },
      solution:{
        given:'n=5, W=100, Weights=[50,40,30,20,10], Profits=[1,2,3,4,5]',
        algorithm:'Fractional Knapsack — Greedy (sort by v/w ratio)',
        complexity:'O(n log n) for sorting',
        steps:['Compute ratios: 0.02, 0.05, 0.10, 0.20, 0.50',
               'Sort by ratio desc: Item5(0.50), Item4(0.20), Item3(0.10), Item2(0.05), Item1(0.02)',
               'Take Item5: w=10, profit=5, remaining=90','Take Item4: w=20, profit=4, remaining=70',
               'Take Item3: w=30, profit=3, remaining=40','Take Item2: w=40, profit=2, remaining=0'],
        answer:'Maximum Profit = 14.0\nAll items taken in order: Item5+Item4+Item3+Item2\nTotal weight = 10+20+30+40 = 100 = W ✓'
      }},
    { id:'fk_s25_1', year:'Summer 2025', marks:4, topic:'Fractional Knapsack (Greedy)',
      question:'n=7, M=17\nProfits p[]={10,5,15,7,6,16,4}\nWeights w[]={2,3,5,7,1,4,1}',
      load:{ capacity:17, items:[{w:2,v:10},{w:3,v:5},{w:5,v:15},{w:7,v:7},{w:1,v:6},{w:4,v:16},{w:1,v:4}] },
      solution:{
        given:'n=7, M=17, p=[10,5,15,7,6,16,4], w=[2,3,5,7,1,4,1]',
        algorithm:'Fractional Knapsack — Greedy',
        complexity:'O(n log n)',
        steps:['Ratios: 5.0, 1.67, 3.0, 1.0, 6.0, 4.0, 4.0',
               'Sort desc: I5(6.0),I1(5.0),I6(4.0),I7(4.0),I3(3.0),I2(1.67),I4(1.0)',
               'I5: take all w=1, profit=6, rem=16','I1: take all w=2, profit=10, rem=14',
               'I6: take all w=4, profit=16, rem=10','I7: take all w=1, profit=4, rem=9',
               'I3: take all w=5, profit=15, rem=4','I2: take 3/3 w=3, profit=5, rem=1',
               'I4: take 1/7 w=1, profit=1.0, rem=0'],
        answer:'Maximum Profit = 57.0 (approx)\nFull items: I5+I1+I6+I7+I3+I2 + fraction of I4'
      }},
  ],

  activitySelection: [
    { id:'act_s25_1', year:'Summer 2025', marks:7, topic:'Activity Selection (Greedy)',
      question:'Select activities using greedy algorithm.\nI1(1,3), I2(0,2), I3(3,6), I4(2,5), I5(5,8), I6(3,10), I7(7,9)',
      load:{ activities:[{name:'I1',s:1,f:3},{name:'I2',s:0,f:2},{name:'I3',s:3,f:6},{name:'I4',s:2,f:5},{name:'I5',s:5,f:8},{name:'I6',s:3,f:10},{name:'I7',s:7,f:9}] },
      solution:{
        given:'7 activities with start and finish times',
        algorithm:'Activity Selection — Greedy (earliest finish time first)',
        complexity:'O(n log n) for sorting',
        steps:['Sort by finish time: I2(0,2), I1(1,3), I4(2,5), I3(3,6), I5(5,8), I7(7,9), I6(3,10)',
               'Select I2 (finish=2). Last selected end=2',
               'I1: start=1 < end=2 → skip','I4: start=2 = end=2 → select, end=5',
               'I3: start=3 < 5 → skip','I5: start=5 ≥ 5 → select, end=8',
               'I7: start=7 < 8 → skip','I6: start=3 < 8 → skip'],
        answer:'Selected Activities: I2, I4, I5  (3 activities)\nTime slots: [0,2], [2,5], [5,8]\nComplexity: O(n log n)'
      }},
  ],

  jobScheduling: [
    { id:'js_s24_1', year:'Summer 2024', marks:4, topic:'Job Scheduling (Greedy)',
      question:'n=7 jobs, find optimal schedule.\nProfits P=(3,5,18,20,6,1,38), Deadlines d=(1,3,3,4,1,2,1)',
      load:{ jobs:[{name:'J1',d:1,p:3},{name:'J2',d:3,p:5},{name:'J3',d:3,p:18},{name:'J4',d:4,p:20},{name:'J5',d:1,p:6},{name:'J6',d:2,p:1},{name:'J7',d:1,p:38}] },
      solution:{
        given:'7 jobs with profits and deadlines, 1 unit processing time each',
        algorithm:'Job Scheduling — Greedy (sort by profit desc)',
        complexity:'O(n²) or O(n log n) with union-find',
        steps:['Sort by profit desc: J7(38,d=1),J4(20,d=4),J3(18,d=3),J5(6,d=1),J2(5,d=3),J1(3,d=1),J6(1,d=2)',
               'Schedule J7 in slot 1 (latest available ≤ d=1)','Schedule J4 in slot 4',
               'Schedule J3 in slot 3','J5: d=1, slot 1 taken → skip',
               'Schedule J2 in slot 2','J1: d=1, no slot → skip','J6: d=2, slot 2 taken → skip'],
        answer:'Selected Jobs: J7, J2, J3, J4\nSchedule: [J7, J2, J3, J4]\nTotal Profit = 38+5+18+20 = 81'
      }},
  ],


  sortingExtra: [
    { id:'sort_w25_bbl', year:'Winter 2025', marks:7, topic:'Bubble Sort',
      question:'Apply bubble sort on: 77, 22, 55, 11, 33, 66, 44\nShow all passes.',
      load:{ algo:'bubble', array:'77,22,55,11,33,66,44' },
      solution:{ given:'[77,22,55,11,33,66,44]', algorithm:'Bubble Sort', complexity:'O(n²)',
        steps:['Pass 1: compare & swap adjacent','Pass 2: second pass','Pass 3: sorted'],
        answer:'Sorted: 11,22,33,44,55,66,77\nPasses needed: 3' }},
    { id:'sort_w23_heap', year:'Winter 2023', marks:7, topic:'Heap Sort',
      question:'Sort using Heap Sort: 20,50,30,75,90,60,80,25,10,40',
      load:{ algo:'heap', array:'20,50,30,75,90,60,80,25,10,40' },
      solution:{ given:'Array=[20,50,30,75,90,60,80,25,10,40]', algorithm:'Heap Sort', complexity:'O(n log n)',
        steps:['Build Max-Heap: [90,75,80,50,40,60,30,25,10,20]','Extract max 10 times'],
        answer:'Sorted: 10,20,25,30,40,50,60,75,80,90\nComplexity: O(n log n) always' }},
    { id:'sort_w25_mrg', year:'Winter 2025', marks:7, topic:'Merge Sort',
      question:'Apply merge sort on: 88,77,22,55,11,33,66,99,44\nAlso state its recurrence.',
      load:{ algo:'merge', array:'88,77,22,55,11,33,66,99,44' },
      solution:{ given:'Array=[88,77,22,55,11,33,66,99,44]', algorithm:'Merge Sort', complexity:'O(n log n)',
        steps:['Divide: [88,77,22,55] | [11,33,66,99,44]','Recursively sort halves','Merge sorted halves',
               'Recurrence: T(n)=2T(n/2)+n → O(n log n)'],
        answer:'Sorted: 11,22,33,44,55,66,77,88,99\nRecurrence T(n)=2T(n/2)+Θ(n) → O(n log n)' }},
    { id:'sort_w24_cnt', year:'Winter 2024', marks:3, topic:'Counting Sort',
      question:'Sort using counting sort: 2,5,3,0,2,3,0,3',
      load:{ algo:'counting', array:'2,5,3,0,2,3,0,3' },
      solution:{ given:'Array=[2,5,3,0,2,3,0,3]', algorithm:'Counting Sort', complexity:'O(n+k)',
        steps:['Count: c[0]=2,c[1]=0,c[2]=2,c[3]=3,c[4]=0,c[5]=1','Cumulative count','Output sorted array'],
        answer:'Sorted: 0,0,2,2,3,3,3,5\nComplexity: O(n+k)' }},
    { id:'sort_w24_bkt', year:'Winter 2024', marks:4, topic:'Bucket Sort',
      question:'Sort using bucket sort: 10,21,29,41,52',
      load:{ algo:'bucket', array:'10,21,29,41,52' },
      solution:{ given:'Array=[10,21,29,41,52]', algorithm:'Bucket Sort', complexity:'O(n+k) avg',
        steps:['5 buckets across range','Each element to its bucket','Sort each bucket','Concatenate'],
        answer:'Sorted: 10,21,29,41,52\nComplexity: O(n+k) average' }},
  ],

  mstPrim: [
    { id:'mst_s23_prim', year:'Summer 2023', marks:7, topic:'Prim MST',
      question:'Find MST of given graph using Prim\'s algorithm. Find MST weight.\n(6 nodes A-F)',
      load:{ nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1,w:6},{a:0,b:3,w:1},{a:1,b:2,w:5},{a:1,b:3,w:2},{a:1,b:4,w:5},{a:2,b:4,w:5},{a:3,b:4,w:1},{a:4,b:5,w:4}],
             positions:[{x:120,y:200},{x:260,y:100},{x:420,y:100},{x:260,y:310},{x:420,y:310},{x:560,y:200}] },
      solution:{ given:'6-node weighted graph', algorithm:"Prim's MST — Greedy", complexity:'O(V²)',
        steps:['Start A. Pick min edge A-D(1)','From {A,D}: pick D-E(1)','Pick D-B(2)',
               'Pick E-F(4)','Pick B-C(5). Done.'],
        answer:'MST: A-D(1),D-E(1),D-B(2),E-F(4),B-C(5)\nTotal Weight = 13' }},
    { id:'mst_s24_prim', year:'Summer 2024', marks:7, topic:'Prim MST',
      question:'Find MST using Prim\'s algorithm.\n(6 nodes A-F)',
      load:{ nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1,w:4},{a:0,b:2,w:2},{a:1,b:2,w:1},{a:1,b:3,w:5},{a:2,b:4,w:10},{a:3,b:4,w:2},{a:3,b:5,w:6},{a:4,b:5,w:3}],
             positions:[{x:100,y:200},{x:260,y:100},{x:260,y:300},{x:420,y:100},{x:420,y:300},{x:580,y:200}] },
      solution:{ given:'6-node weighted graph, start from A', algorithm:"Prim's MST", complexity:'O(E log V)',
        steps:['A→C(2), A→B(4). Pick C(2)','C→B(1). Pick B(1)','B→D(5). Pick D(5)',
               'D→E(2). Pick E(2)','E→F(3). Pick F(3). Done.'],
        answer:'MST: A-C(2),C-B(1),B-D(5),D-E(2),E-F(3)\nTotal Weight = 13' }},
    { id:'mst_w25_prim', year:'Winter 2025', marks:7, topic:'Prim MST',
      question:'Find MST using Prim\'s method for given graph (7 nodes).',
      load:{ nodes:['A','B','C','D','E','F','G'],
             edges:[{a:0,b:1,w:7},{a:0,b:3,w:5},{a:1,b:2,w:8},{a:1,b:3,w:9},{a:1,b:4,w:7},{a:2,b:4,w:5},{a:3,b:4,w:15},{a:3,b:5,w:6},{a:4,b:5,w:8},{a:4,b:6,w:9},{a:5,b:6,w:11}],
             positions:[{x:100,y:250},{x:260,y:120},{x:450,y:120},{x:260,y:380},{x:450,y:380},{x:370,y:250},{x:580,y:250}] },
      solution:{ given:'7-node graph', algorithm:"Prim's MST", complexity:'O(V²)',
        steps:['Start A. Pick A-D(5)','Pick D-F(6)','Pick A-B(7)','Pick B-E(7)','Pick C-E(5)','Pick E-G(9)'],
        answer:'MST: A-D(5),D-F(6),A-B(7),B-E(7),C-E(5),E-G(9)\nTotal Weight = 39' }},
    { id:'mst_w23_prim', year:'Winter 2023', marks:4, topic:'Prim MST',
      question:'Find MST using Prim\'s algorithm for given weighted graph.',
      load:{ nodes:['A','B','C','D','E'],
             edges:[{a:0,b:1,w:3},{a:0,b:3,w:1},{a:1,b:2,w:1},{a:1,b:3,w:3},{a:2,b:4,w:6},{a:3,b:4,w:5}],
             positions:[{x:120,y:200},{x:280,y:100},{x:440,y:200},{x:280,y:320},{x:440,y:320}] },
      solution:{ given:'5-node graph', algorithm:"Prim's MST", complexity:'O(V²)',
        steps:['Start A. Pick A-D(1)','Pick D-B(3) or A-B(3). Pick A-B(3)','Pick B-C(1)','Pick D-E(5) or C-E(6). Pick D-E(5). Done.'],
        answer:'MST: A-D(1),A-B(3),B-C(1),D-E(5)\nTotal Weight = 10' }},
  ],

  mstKruskal: [
    { id:'mst_s23_krus', year:'Summer 2023', marks:7, topic:'Kruskal MST',
      question:'Find MST using Kruskal\'s algorithm. Find MST weight.\n(Same 6-node graph)',
      load:{ nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1,w:6},{a:0,b:3,w:1},{a:1,b:2,w:5},{a:1,b:3,w:2},{a:1,b:4,w:5},{a:2,b:4,w:5},{a:3,b:4,w:1},{a:4,b:5,w:4}],
             positions:[{x:120,y:200},{x:260,y:100},{x:420,y:100},{x:260,y:310},{x:420,y:310},{x:560,y:200}] },
      solution:{ given:'6-node graph', algorithm:"Kruskal's MST — Sort + Union-Find", complexity:'O(E log E)',
        steps:['Sort: A-D(1),D-E(1),D-B(2),E-F(4),B-C(5),B-E(5),C-E(5),A-B(6)',
               'Add A-D(1)','Add D-E(1)','Add D-B(2)','Add E-F(4)','Add B-C(5). MST done!'],
        answer:'MST: A-D(1),D-E(1),D-B(2),E-F(4),B-C(5)\nTotal Weight = 13' }},
    { id:'mst_w23_krus', year:'Winter 2023', marks:4, topic:'Kruskal MST',
      question:'Find MST using Kruskal\'s algorithm for given graph.',
      load:{ nodes:['A','B','C','D','E'],
             edges:[{a:0,b:1,w:3},{a:0,b:3,w:1},{a:1,b:2,w:1},{a:1,b:3,w:3},{a:2,b:4,w:6},{a:3,b:4,w:5}],
             positions:[{x:120,y:200},{x:280,y:100},{x:440,y:200},{x:280,y:320},{x:440,y:320}] },
      solution:{ given:'5-node graph', algorithm:"Kruskal's", complexity:'O(E log E)',
        steps:['Sort: A-D(1),B-C(1),A-B(3),B-D(3),D-E(5),C-E(6)',
               'Add A-D(1)','Add B-C(1)','Add A-B(3) — connects components','Skip B-D(cycle)','Add D-E(5). Done.'],
        answer:'MST: A-D(1),B-C(1),A-B(3),D-E(5)\nTotal Weight = 10' }},
    { id:'mst_w25_krus', year:'Winter 2025', marks:7, topic:'Kruskal MST',
      question:'Find MST using Kruskal\'s method for given graph (7 nodes).',
      load:{ nodes:['A','B','C','D','E','F','G'],
             edges:[{a:0,b:1,w:7},{a:0,b:3,w:5},{a:1,b:2,w:8},{a:1,b:3,w:9},{a:1,b:4,w:7},{a:2,b:4,w:5},{a:3,b:4,w:15},{a:3,b:5,w:6},{a:4,b:5,w:8},{a:4,b:6,w:9},{a:5,b:6,w:11}],
             positions:[{x:100,y:250},{x:260,y:120},{x:450,y:120},{x:260,y:380},{x:450,y:380},{x:370,y:250},{x:580,y:250}] },
      solution:{ given:'7-node graph', algorithm:"Kruskal's MST", complexity:'O(E log E)',
        steps:['Sort edges by weight','Add A-D(5),C-E(5),D-F(6),A-B(7),B-E(7)',
               'Skip C-B(8) cycle','Add E-G(9). MST complete!'],
        answer:'MST: A-D(5),C-E(5),D-F(6),A-B(7),B-E(7),E-G(9)\nTotal Weight = 39' }},
  ],

  dijkstraQ: [
    { id:'djk_s23_1', year:'Summer 2023', marks:7, topic:'Dijkstra Shortest Path',
      question:'Apply Dijkstra\'s algorithm on given graph. Find shortest path from source A.',
      load:{ nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1,w:10},{a:0,b:3,w:5},{a:1,b:2,w:1},{a:1,b:3,w:2},{a:2,b:4,w:4},{a:3,b:1,w:3},{a:3,b:4,w:9},{a:3,b:5,w:2},{a:4,b:5,w:6},{a:5,b:4,w:7}],
             positions:[{x:100,y:200},{x:300,y:100},{x:500,y:100},{x:300,y:320},{x:500,y:320},{x:200,y:380}] },
      solution:{ given:'6-node directed graph, source = A', algorithm:"Dijkstra's SSSP", complexity:'O(V² ) or O(E log V)',
        steps:['Init: dist=[0,∞,∞,∞,∞,∞]','Process A(0): update B=10,D=5',
               'Process D(5): update B=8,E=14,F=7','Process F(7): update E=13',
               'Process B(8): update C=9','Process C(9): update E=13','Process E(13). Done.'],
        answer:'Shortest distances from A: B=8,C=9,D=5,E=13,F=7' }},
  ],

  floydWarshall: [
    { id:'fw_s24_1', year:'Summer 2024', marks:7, topic:'Floyd-Warshall',
      question:'Find all-pair shortest paths using Floyd-Warshall.\nDirected graph: 1→2(3), 1→4(7), 2→3(2), 3→1(5), 3→4(1), 4→2(init 8)',
      load:{ n:4, matrix:[[0,3,999,7],[8,0,2,999],[5,999,0,1],[2,999,999,0]] },
      solution:{ given:'4-node directed graph\nD0=[[0,3,∞,7],[8,0,2,∞],[5,∞,0,1],[2,∞,∞,0]]', algorithm:'Floyd-Warshall', complexity:'O(V³)=O(64)',
        steps:['D1 via 1: D[2][4]=15, D[4][2]=5','D2 via 2: D[1][3]=5, D[3][1]=5','D3 via 3: D[1][4]=6, D[2][4]=3','D4 via 4: D[3][2]=6'],
        answer:'Final: [[0,3,5,6],[5,0,2,3],[5,6,0,1],[2,5,4,0]]\nComplexity: O(V³)' }},
    { id:'fw_w23_1', year:'Winter 2023', marks:7, topic:'Floyd-Warshall',
      question:'Find all-pair shortest paths using Floyd\'s algorithm for given directed graph.',
      load:{ n:4, matrix:[[0,3,999,999],[999,0,999,2],[999,7,0,999],[1,999,999,0]] },
      solution:{ given:'4-node directed graph', algorithm:'Floyd-Warshall', complexity:'O(64)',
        steps:['D0: Initial matrix','D1: via node 1','D2: via node 2','D3: via node 3','D4: via node 4 — final'],
        answer:'Run Floyd-Warshall calculator with this matrix for exact result!' }},
    { id:'fw_w24_1', year:'Winter 2024', marks:7, topic:'Floyd-Warshall',
      question:'Find shortest distance between all pairs of vertices using Floyd-Warshall.',
      load:{ n:4, matrix:[[0,5,999,10],[999,0,3,999],[999,999,0,1],[999,999,999,0]] },
      solution:{ given:'4-node directed graph', algorithm:'Floyd-Warshall', complexity:'O(V³)',
        steps:['D0: [[0,5,∞,10],[∞,0,3,∞],[∞,∞,0,1],[∞,∞,∞,0]]','Fill D1,D2,D3,D4'],
        answer:'Run Floyd-Warshall calculator for complete answer!' }},
  ],

  bfsDfs: [
    { id:'bfs_w23_1', year:'Winter 2023', marks:4, topic:'BFS Traversal',
      question:'Traverse using BFS. Draw BFS tree.\nEdges: A-B, A-C, B-D, B-E, C-E, D-F, E-F',
      load:{ startIdx:0, nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1},{a:0,b:2},{a:1,b:3},{a:1,b:4},{a:2,b:4},{a:3,b:5},{a:4,b:5}],
             positions:[{x:200,y:80},{x:100,y:200},{x:300,y:200},{x:50,y:330},{x:250,y:330},{x:150,y:460}] },
      solution:{ given:'6-node undirected graph, Start from A', algorithm:'BFS — Queue', complexity:'O(V+E)',
        steps:['Enqueue A. Visit A.','Dequeue A → Enqueue B,C. Visit B.',
               'Dequeue B → Enqueue D,E. Visit C.','Dequeue C (E already queued).',
               'Visit D,E,F in order.'],
        answer:'BFS: A→B→C→D→E→F\nBFS Tree: A-B, A-C, B-D, B-E, D-F' }},
    { id:'dfs_s24_1', year:'Summer 2024', marks:7, topic:'DFS Traversal',
      question:'Write DFS algorithm and apply on given graph. Draw DFS tree.',
      load:{ startIdx:0, nodes:['A','B','C','D','E','F'],
             edges:[{a:0,b:1},{a:0,b:2},{a:1,b:3},{a:1,b:4},{a:2,b:5}],
             positions:[{x:200,y:80},{x:100,y:220},{x:320,y:220},{x:50,y:360},{x:170,y:360},{x:320,y:360}] },
      solution:{ given:'6-node graph, Start from A', algorithm:'DFS — Recursive/Stack', complexity:'O(V+E)',
        steps:['Visit A → Visit B (first neighbor)','Visit D (B\'s first unvisited)',
               'Backtrack to B → Visit E','Backtrack to A → Visit C → Visit F'],
        answer:'DFS: A→B→D→E→C→F\nComplexity: O(V+E)' }},
    { id:'dfs_s25_1', year:'Summer 2025', marks:7, topic:'DFS Traversal',
      question:'Write DFS traversal and draw DFS tree for given graph.\nNodes: C,G,A,B,D,E,F,H',
      load:{ startIdx:0, nodes:['C','G','A','B','D','E','F','H'],
             edges:[{a:0,b:1},{a:0,b:4},{a:1,b:2},{a:1,b:4},{a:2,b:3},{a:4,b:5},{a:5,b:6},{a:5,b:7}],
             positions:[{x:200,y:60},{x:100,y:180},{x:260,y:180},{x:350,y:280},{x:120,y:310},{x:200,y:400},{x:90,y:480},{x:300,y:480}] },
      solution:{ given:'8-node graph, Start from C', algorithm:'DFS — Recursive', complexity:'O(V+E)',
        steps:['Visit C → G → A → B (leaf, backtrack)','Backtrack to A → backtrack to G',
               'G → D → E → F (leaf)','Backtrack → E → H'],
        answer:'DFS: C,G,A,B,D,E,F,H (approx)\nComplexity: O(V+E)' }},
  ],

  nQueens: [
    { id:'nq_s23_1', year:'Summer 2023', marks:7, topic:'N-Queens Backtracking',
      question:'What is state space tree? Solve 4-Queens using backtracking with state space tree.',
      load:{ n:4 },
      solution:{ given:'N=4, 4×4 chessboard', algorithm:'Backtracking — State Space Tree', complexity:'O(N!)',
        steps:['Row 1 Col 2: safe. Row 2 Col 4: safe. Row 3 Col 1: safe. Row 4 Col 3: safe → Solution 1!',
               'Row 1 Col 3: safe. Row 2 Col 1: safe. Row 3 Col 4: safe. Row 4 Col 2: safe → Solution 2!'],
        answer:'4-Queens has exactly 2 solutions:\n[2,4,1,3] — cols for rows 1-4\n[3,1,4,2] — cols for rows 1-4' }},
    { id:'nq_w23_1', year:'Winter 2023', marks:7, topic:'N-Queens Backtracking',
      question:'Explain Backtracking. Solve 4-Queens using backtracking.',
      load:{ n:4 },
      solution:{ given:'N=4', algorithm:'Backtracking', complexity:'O(N!)',
        steps:['Try placing queen row by row','At each row try each column','If conflict: backtrack','Record solution when all N queens placed'],
        answer:'Solutions: [2,4,1,3] and [3,1,4,2]\nBacktracking avoids exploring invalid subtrees' }},
    { id:'nq_s24_1', year:'Summer 2024', marks:4, topic:'N-Queens (4-Queens)',
      question:'Draw state space tree diagram for 4-Queens problem.',
      load:{ n:4 },
      solution:{ given:'N=4', algorithm:'State Space Tree', complexity:'O(N!)',
        steps:['Level 0: root','Level 1: Q1 in col 1,2,3,4','Level 2: Q2 tries all valid cols','...','Leaf: solution or dead end'],
        answer:'Exactly 2 solutions. State space tree prunes branches where queens attack each other.' }},
    { id:'nq_w25_1', year:'Winter 2025', marks:7, topic:'N-Queens Backtracking',
      question:'Explain backtracking. What is 4-Queens? Show ALL possible solutions.',
      load:{ n:4 },
      solution:{ given:'N=4', algorithm:'Backtracking', complexity:'O(N!)',
        steps:['Solution 1: (1,2),(2,4),(3,1),(4,3) — notation (row,col)','Solution 2: (1,3),(2,1),(3,4),(4,2)'],
        answer:'ALL solutions for 4-Queens (exactly 2):\n1) Queens at cols [2,4,1,3]\n2) Queens at cols [3,1,4,2]' }},
  ],

  lcsExtra: [
    { id:'lcs_s25_1', year:'Summer 2025', marks:7, topic:'LCS (DP)',
      question:'Find LCS using DP.\nX = 10101010011\nY = 101001',
      load:{ x:'10101010011', y:'101001' },
      solution:{ given:'X=10101010011, Y=101001', algorithm:'LCS DP Table', complexity:'O(11×6)=O(66)',
        steps:['Build 12×7 DP table','Fill row-by-row','dp[11][6]=6'],
        answer:'LCS = "101001" (length 6)\nY is a subsequence of X!' }},
    { id:'lcs_s25_2', year:'Summer 2025', marks:7, topic:'LCS (DP)',
      question:'Find LCS using DP.\nX = ACABACA\nY = BACAC',
      load:{ x:'ACABACA', y:'BACAC' },
      solution:{ given:'X=ACABACA, Y=BACAC', algorithm:'LCS DP Table', complexity:'O(35)',
        steps:['Build 8×6 table','dp[7][5]=5 or 4 depending on alignment'],
        answer:'LCS length = 5, LCS = "ACAC" or "BACAC"\nVerify with calculator!' }},
  ],

  matrixChainExtra: [
    { id:'mcm_w23_1', year:'Winter 2023', marks:7, topic:'Matrix Chain Multiplication',
      question:'Find optimal parenthesization: A1(5×10), A2(10×3), A3(3×12), A4(12×5), A5(5×50), A6(50×6)',
      load:{ dims:'5,10,3,12,5,50,6' },
      solution:{ given:'Dimensions=(5,10,3,12,5,50,6), 6 matrices', algorithm:'MCM DP', complexity:'O(n³)',
        steps:['Build 7×7 m table','l=2: m[1][2]=5×10×3=150, m[2][3]=10×3×12=360...','l=3,4,5,6: fill table'],
        answer:'Minimum multiplications = 2010\nOptimal: ((A1(A2A3))((A4A5)A6))' }},
    { id:'mcm_s25_1', year:'Summer 2025', marks:7, topic:'Matrix Chain Multiplication',
      question:'Find optimal order: A(2×3), B(3×5), C(5×6), D(6×2), E(2×3)\nDimensions=(2,3,5,6,2,3)',
      load:{ dims:'2,3,5,6,2,3' },
      solution:{ given:'5 matrices, dims=[2,3,5,6,2,3]', algorithm:'MCM DP', complexity:'O(125)',
        steps:['l=2: m[1][2]=30,m[2][3]=90,m[3][4]=60,m[4][5]=36','l=3,4: fill table','l=5: answer'],
        answer:'Minimum = 108\nRun calculator for exact parenthesization!' }},
    { id:'mcm_w24_1', year:'Winter 2024', marks:7, topic:'Matrix Chain Multiplication',
      question:'DP table for: A(5×10), B(10×15), C(15×20), D(20×25)\nDimensions=(5,10,15,20,25)',
      load:{ dims:'5,10,15,20,25' },
      solution:{ given:'4 matrices, dims=[5,10,15,20,25]', algorithm:'MCM DP', complexity:'O(64)',
        steps:['l=2: m[1][2]=750, m[2][3]=3000, m[3][4]=7500',
               'l=3: m[1][3]=2250, m[2][4]=8000','l=4: m[1][4]=11250'],
        answer:'Minimum multiplications = 11250\nRun calculator for traceback!' }},
  ],

  rabinKarp: [
    { id:'rk_s24_1', year:'Summer 2024', marks:7, topic:'Rabin-Karp (Spurious Hits)',
      question:'Working modulo q=13, find spurious hits in Rabin-Karp matcher.\nText T = 2359023141526739921\nPattern P = 31415',
      load:{ text:'2359023141526739921', pattern:'31415', mod:13, base:10 },
      solution:{
        given:'T=2359023141526739921, P=31415, q=13, d=10',
        algorithm:'Rabin-Karp String Matching',
        complexity:'O((n-m+1)·m) worst, O(n+m) average',
        steps:['Pattern hash h(P) = 31415 mod 13 = 7',
               'Slide window of length 5 through T',
               'Valid match at position 7: T[7..11]="31415" ✓ (hash=7)',
               'Check all windows with hash=7 for spurious hits'],
        answer:'Valid matches: 1 (at position 7, "31415")\nSpurious hits: check calculator output\nPattern P=31415 found at index 7'
      }},
    { id:'rk_w23_1', year:'Winter 2023', marks:7, topic:'Rabin-Karp (Spurious Hits)',
      question:'Working modulo q=13, find spurious hits in Rabin-Karp matcher.\nText T = 2359023141526739921\nPattern P = 26739',
      load:{ text:'2359023141526739921', pattern:'26739', mod:13, base:10 },
      solution:{
        given:'T=2359023141526739921, P=26739, q=13, d=10',
        algorithm:'Rabin-Karp String Matching',
        complexity:'O(n+m) average',
        steps:['Pattern hash h(26739) mod 13','Slide window, compare hashes','Character verify on hash match'],
        answer:'Run calculator with T=2359023141526739921, P=26739, mod=13 for exact spurious hit count'
      }},
    { id:'rk_w25_1', year:'Winter 2025', marks:7, topic:'Rabin-Karp (Spurious Hits)',
      question:'For modulo q=13, find spurious hits in Rabin-Karp matcher.\nText T = 4359023141526739921\nPattern P = 31415',
      load:{ text:'4359023141526739921', pattern:'31415', mod:13, base:10 },
      solution:{
        given:'T=4359023141526739921, P=31415, q=13, d=10',
        algorithm:'Rabin-Karp String Matching',
        complexity:'O(n+m) average',
        steps:['Pattern hash h(31415) mod 13 = 7','Slide window through T',
               'Valid match: T[7..11]="31415"'],
        answer:'Pattern P=31415 found at index 7\nRun calculator for full spurious hit count with q=13'
      }},
  ],
};

// ─── PYQ PANEL BUILDER ───────────────────────────────────────────────────────
const PYQ_TOOL_MAP = [
  { toolIdx:0,  key:'sorting',             label:'Sorting' },
  { toolIdx:0,  key:'sortingExtra',        label:'Sorting (Extra)' },
  { toolIdx:1,  key:'knapsack',            label:'0/1 Knapsack' },
  { toolIdx:3,  key:'lcs',                 label:'LCS' },
  { toolIdx:4,  key:'binarySearch',        label:'Binary Search' },
  { toolIdx:5,  key:'rabinKarp',           label:'Rabin-Karp' },
  { toolIdx:6,  key:'quickSort',           label:'Quick Sort' },
  { toolIdx:7,  key:'fractionalKnapsack',  label:'Frac Knapsack' },
  { toolIdx:8,  key:'activitySelection',   label:'Activity Selection' },
  { toolIdx:10, key:'matrixChain',         label:'Matrix Chain' },
  { toolIdx:11, key:'coinChange',          label:'Coin Change' },
  { toolIdx:12, key:'jobScheduling',       label:'Job Scheduling' },
  { toolIdx:2,  key:'mstPrim',             label:'Prim MST' },
  { toolIdx:2,  key:'mstKruskal',          label:'Kruskal MST' },
  { toolIdx:13, key:'dijkstraQ',           label:'Dijkstra' },
  { toolIdx:14, key:'floydWarshall',       label:'Floyd-Warshall' },
  { toolIdx:9,  key:'bfsDfs',             label:'BFS/DFS' },
  { toolIdx:18, key:'nQueens',            label:'N-Queens' },
  { toolIdx:10, key:'matrixChainExtra',   label:'Matrix Chain (Extra)' },
  { toolIdx:3,  key:'lcsExtra',           label:'LCS (Extra)' },
];

function pyqGetYears(questions) {
  return [...new Set(questions.map(q=>q.year))].sort((a,b)=>{
    const order=['Summer 2023','Winter 2023','Summer 2024','Winter 2024','Summer 2025','Winter 2025'];
    return order.indexOf(a)-order.indexOf(b);
  });
}

function pyqBuildPanel(toolDiv, key, label) {
  const qs = GTUQuestionBank[key]||[];
  const years = pyqGetYears(qs);
  const panel = document.createElement('div');
  panel.className = 'pyq-panel';
  panel.id = `pyq-panel-${key}`;
  panel.innerHTML = `
    <div class="pyq-header" onclick="pyqToggle('${key}')">
      <span class="pyq-header-title">📚 GTU Previous Year Questions — ${label}</span>
      <span class="pyq-coverage-badge" id="pyq-badge-${key}">${qs.length} Questions · ${years.length} Years</span>
      <button class="pyq-toggle-btn" id="pyq-btn-${key}">▼</button>
    </div>
    <div class="pyq-body" id="pyq-body-${key}">
      <div class="pyq-filter-row">
        <label>Filter by Year:</label>
        <select class="pyq-year-select" id="pyq-year-${key}" onchange="pyqRender('${key}')">
          <option value="">All Years</option>
          ${years.map(y=>`<option value="${y}">${y}</option>`).join('')}
        </select>
        <span style="font-size:11px;color:#64748b;margin-left:8px">Click ▶ Load to auto-fill the calculator</span>
      </div>
      <div class="pyq-list" id="pyq-list-${key}"></div>
      <div class="pyq-analytics-bar">
        <div class="pyq-stat"><div class="pyq-stat-val">${qs.length}</div><div class="pyq-stat-lbl">Questions</div></div>
        <div class="pyq-stat"><div class="pyq-stat-val">${years.length}</div><div class="pyq-stat-lbl">Years</div></div>
        <div class="pyq-stat"><div class="pyq-stat-val">${qs.reduce((s,q)=>s+q.marks,0)}</div><div class="pyq-stat-lbl">Total Marks</div></div>
        <div class="pyq-stat"><div class="pyq-stat-val">${Math.round(qs.filter(q=>q.load).length/Math.max(qs.length,1)*100)}%</div><div class="pyq-stat-lbl">Loadable</div></div>
      </div>
    </div>`;
  toolDiv.insertBefore(panel, toolDiv.firstChild);
  pyqRender(key);
}

function pyqToggle(key) {
  const body = document.getElementById(`pyq-body-${key}`);
  const btn  = document.getElementById(`pyq-btn-${key}`);
  body.classList.toggle('open');
  btn.classList.toggle('open');
}

function pyqRender(key) {
  const qs = GTUQuestionBank[key]||[];
  const year = document.getElementById(`pyq-year-${key}`)?.value||'';
  const list = document.getElementById(`pyq-list-${key}`);
  if(!list) return;
  const filtered = year ? qs.filter(q=>q.year===year) : qs;
  list.innerHTML = filtered.length ? '' : '<div style="color:#64748b;font-size:12px;padding:8px">No questions for selected year.</div>';
  filtered.forEach(q=>{
    const card = document.createElement('div');
    card.className = 'pyq-q-card';
    card.id = `pyq-card-${q.id}`;
    card.innerHTML = `
      <div class="pyq-q-meta">
        <span class="pyq-year-tag">${q.year}</span>
        <span class="pyq-marks-tag">${q.marks} Marks</span>
        <span class="pyq-topic-tag">${q.topic}</span>
      </div>
      <div class="pyq-q-text">${q.question.replace(/\n/g,'<br>')}</div>
      <div class="pyq-btn-row">
        ${q.load?`<button class="pyq-btn pyq-btn-load" onclick="loadGTUQuestion('${q.id}','${key}')">▶ Load Question</button>`:'<span style="font-size:11px;color:#64748b">Theory question — no auto-fill</span>'}
        <button class="pyq-btn pyq-btn-solve" onclick="pyqToggleSolution('${q.id}')">📝 GTU Solution</button>
        ${q.load?`<button class="pyq-btn pyq-btn-practice" onclick="generatePracticeQuestion('${q.id}','${key}')">🎲 Practice</button>`:''}
      </div>
      <div class="pyq-solution-box" id="pyq-sol-${q.id}"></div>`;
    list.appendChild(card);
  });
}

function pyqToggleSolution(qid) {
  const box = document.getElementById(`pyq-sol-${qid}`);
  if(!box) return;
  if(box.classList.contains('visible')) { box.classList.remove('visible'); return; }
  // find question
  let q=null;
  for(const key of Object.keys(GTUQuestionBank)) {
    q = GTUQuestionBank[key].find(x=>x.id===qid);
    if(q) break;
  }
  if(!q) return;
  const s = q.solution;
  box.innerHTML = [
    `<span class="pyq-sol-section">═══ GTU SOLUTION SHEET ═══</span>`,
    `<span class="pyq-sol-section">QUESTION (${q.year} · ${q.marks} Marks · ${q.topic})</span>`,
    q.question,
    '',
    `<span class="pyq-sol-section">GIVEN:</span>`,
    s.given,
    '',
    `<span class="pyq-sol-section">ALGORITHM:</span>`,
    s.algorithm,
    '',
    `<span class="pyq-sol-section">STEP-BY-STEP SOLUTION:</span>`,
    ...s.steps.map((st,i)=>`<span class="pyq-sol-step">Step ${i+1}:</span> ${st}`),
    '',
    `<span class="pyq-sol-section">FINAL ANSWER:</span>`,
    `<span class="pyq-sol-answer">${s.answer}</span>`,
    '',
    `<span class="pyq-sol-section">TIME COMPLEXITY:</span>`,
    s.complexity,
    '',
    `<span style="color:#475569;font-size:10px">📌 GTU ADA 3150703 · Verify with calculator above ↑</span>`,
  ].join('\n');
  box.classList.add('visible');
}

// ─── LOAD QUESTION INTO CALCULATOR ──────────────────────────────────────────
function loadGTUQuestion(qid, key) {
  let q=null;
  for(const k of Object.keys(GTUQuestionBank)) {
    q = GTUQuestionBank[k].find(x=>x.id===qid);
    if(q) break;
  }
  if(!q||!q.load) { showToast('This question has no loadable data'); return; }
  const L = q.load;

  try {
    switch(key) {
      case 'sorting':
        if(L.algo) document.getElementById('sort-algo').value = L.algo;
        if(L.array) { document.getElementById('sort-custom').value = L.array; sortApplyCustom(); }
        break;

      case 'binarySearch':
        if(L.array)  document.getElementById('bs-array').value = L.array;
        if(L.target !== undefined) document.getElementById('bs-target').value = L.target;
        break;

      case 'quickSort':
        if(L.array) document.getElementById('qs-input').value = L.array;
        break;

      case 'lcs':
        if(L.x) { document.getElementById('lcs-x').value = L.x.toUpperCase(); }
        if(L.y) { document.getElementById('lcs-y').value = L.y.toUpperCase(); }
        break;

      case 'matrixChain':
        if(L.dims) document.getElementById('mcm-input').value = L.dims;
        break;

      case 'coinChange':
        if(L.coins)  document.getElementById('cc-coins').value = L.coins;
        if(L.amount !== undefined) document.getElementById('cc-amount').value = L.amount;
        break;

      case 'knapsack':
        if(L.capacity !== undefined) document.getElementById('ks-capacity').value = L.capacity;
        if(L.items) {
          ksItems = L.items.map((it,i)=>({name:'Item '+String.fromCharCode(65+i), w:it.w, v:it.v}));
          ksRenderItemsTable(); ksReset();
        }
        break;

      case 'fractionalKnapsack':
        if(L.capacity !== undefined) document.getElementById('fk-capacity').value = L.capacity;
        if(L.items) {
          fkItems = L.items.map((it,i)=>({name:String.fromCharCode(65+i), w:it.w, v:it.v}));
          fkRenderItems(); fkReset();
        }
        break;

      case 'activitySelection':
        if(L.activities) {
          actData = L.activities.map(a=>({name:a.name, s:a.s, f:a.f}));
          actRenderTable(); actReset();
        }
        break;

      case 'jobScheduling':
        if(L.jobs) {
          jsData = L.jobs.map(j=>({name:j.name, d:j.d, p:j.p}));
          jsRenderTable(); jsReset();
        }
        break;

      case 'rabinKarp':
        if(L.text)    document.getElementById('rk-text').value    = L.text;
        if(L.pattern) document.getElementById('rk-pattern').value = L.pattern;
        if(L.mod)     document.getElementById('rk-mod').value     = L.mod;
        if(L.base)    document.getElementById('rk-base').value    = L.base;
        break;

      case 'sortingExtra':
        if(L.algo)  document.getElementById('sort-algo').value = L.algo;
        if(L.array) { document.getElementById('sort-custom').value = L.array; sortApplyCustom(); }
        break;

      case 'mstPrim':
      case 'mstKruskal':
        if(L.nodes && L.edges && L.positions) {
          mstNodes = L.positions.map((p,i) => ({x:p.x, y:p.y, label:L.nodes[i], scale:1}));
          mstEdges = L.edges.map(e => ({a:e.a, b:e.b, w:e.w||1}));
          mstNodeState = {}; mstEdgeState = {};
          mstNodes.forEach((_,i) => { mstNodeState[i]='default'; });
          mstEdges.forEach((_,i) => { mstEdgeState[i]='default'; });
          clearLog('mst-steps-log');
          document.getElementById('mst-total-weight').textContent='';
          const edgesToShow = L.edges.map(e=>L.nodes[e.a]+'-'+L.nodes[e.b]+'('+e.w+')').join(', ');
          document.getElementById('mst-info').innerHTML =
            '<b style="color:#34d399">Loaded from GTU PYQ</b><br>'+edgesToShow+'<br><br>'+
            'Press <b>Prim\'s MST</b> or <b>Kruskal\'s MST</b> to solve!';
          setTimeout(()=>{mstResizeCanvas();mstRedraw();},80);
          showTool(2);
        }
        break;

      case 'dijkstraQ':
        if(L.nodes && L.edges && L.positions) {
          djkNodes=[]; djkEdges=[];
          djkNodes = L.positions.map((p,i) => ({x:p.x, y:p.y, label:L.nodes[i], scale:1}));
          djkEdges = L.edges.map(e => ({a:e.a, b:e.b, w:e.w||1}));
          djkNodeState={}; djkEdgeState={};
          djkNodes.forEach((_,i)=>{djkNodeState[i]='default';});
          djkEdges.forEach((_,i)=>{djkEdgeState[i]='default';});
          djkNodeDist={}; djkNodePrev={};
          djkUpdateSourceSelect();
          setTimeout(()=>{djkResizeCanvas();djkRedraw();},80);
          showTool(13);
        }
        break;

      case 'floydWarshall':
        if(L.matrix) {
          fwN = L.n||4;
          document.getElementById('fw-n').value = fwN;
          fwInputMatrix = L.matrix.map(r=>[...r]);
          renderFWInputMatrix();
          fwReset();
          fwRenderMatrix(fwInputMatrix,-1,-1,-1,[]);
          document.getElementById('fw-iteration-label').textContent='D⁰ — Initial Distance Matrix';
        }
        break;

      case 'bfsDfs':
        if(L.nodes && L.edges && L.positions) {
          loadGTUBFSGraph(L);
          showTool(9);
        }
        break;

      case 'nQueens':
        if(L.n) document.getElementById('nq-n').value = L.n;
        nqReset();
        showTool(18);
        break;

      case 'lcsExtra':
        if(L.x) document.getElementById('lcs-x').value = L.x.toUpperCase();
        if(L.y) document.getElementById('lcs-y').value = L.y.toUpperCase();
        break;

      case 'matrixChainExtra':
        if(L.dims) document.getElementById('mcm-input').value = L.dims;
        break;
    }
    showToast(`✅ Loaded: ${q.year} — ${q.topic}`, 'success');
  } catch(e) {
    showToast('Load failed: '+e.message);
  }
}

// ─── PRACTICE QUESTION GENERATOR ────────────────────────────────────────────
function generatePracticeQuestion(qid, key) {
  let q=null;
  for(const k of Object.keys(GTUQuestionBank)) {
    q = GTUQuestionBank[k].find(x=>x.id===qid);
    if(q) break;
  }
  if(!q||!q.load) return;

  const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const shuffle = arr => [...arr].sort(()=>Math.random()-0.5);
  const L = q.load;
  let practiceLoad = null;
  let practiceText = '';

  switch(key) {
    case 'sorting': {
      const n = rand(6,12);
      const arr = Array.from({length:n},()=>rand(5,99));
      practiceLoad = {...L, array:arr.join(',')};
      practiceText = `Perform ${q.topic.split(' ')[0]} sort on:\n${arr.join(', ')}`;
      break;
    }
    case 'binarySearch': {
      const n = rand(7,12);
      const sorted = [...new Set(Array.from({length:n+3},()=>rand(1,100)))].sort((a,b)=>a-b).slice(0,n);
      const target = sorted[rand(0,sorted.length-1)];
      practiceLoad = {array:sorted.join(','), target};
      practiceText = `Binary Search: Key=${target}\nArray: ⟨${sorted.join(', ')}⟩`;
      break;
    }
    case 'quickSort': {
      const n = rand(6,10);
      const arr = Array.from({length:n},()=>rand(5,99));
      practiceLoad = {array:arr.join(',')};
      practiceText = `Illustrate Quick Sort on:\n${arr.join(', ')}`;
      break;
    }
    case 'lcs': {
      const chars='01ABCDEFGHIJKL';
      const rx = rand(5,9), ry = rand(4,7);
      const px = Array.from({length:rx},()=>chars[rand(0,3)]).join('');
      const py = Array.from({length:ry},()=>chars[rand(0,3)]).join('');
      practiceLoad = {x:px, y:py};
      practiceText = `Find LCS using DP:\nX = ${px}\nY = ${py}`;
      break;
    }
    case 'matrixChain': {
      const n = rand(4,6);
      const dims = Array.from({length:n+1},()=>rand(2,20));
      practiceLoad = {dims:dims.join(',')};
      practiceText = `Find optimal matrix chain multiplication:\nDimensions = (${dims.join(', ')})`;
      break;
    }
    case 'coinChange': {
      const coins = shuffle([1,2,3,4,5,6,7,9,10]).slice(0,3).sort((a,b)=>a-b);
      const amt = rand(6,15);
      practiceLoad = {coins:coins.join(','), amount:amt};
      practiceText = `Coin Change DP:\nDenominations: {${coins.join(', ')}}\nTarget Amount: ${amt}`;
      break;
    }
    case 'knapsack': {
      const n = rand(3,5);
      const items = Array.from({length:n},(_,i)=>({w:rand(1,6),v:rand(2,15)}));
      const cap = rand(6,12);
      practiceLoad = {capacity:cap, items};
      practiceText = `0/1 Knapsack (Capacity=${cap}):\n${items.map((it,i)=>`Item${i+1}: w=${it.w}, v=${it.v}`).join('\n')}`;
      break;
    }
    case 'fractionalKnapsack': {
      const n = rand(4,6);
      const items = Array.from({length:n},()=>({w:rand(5,30),v:rand(10,60)}));
      const cap = rand(40,80);
      practiceLoad = {capacity:cap, items};
      practiceText = `Fractional Knapsack (Capacity=${cap}):\n${items.map((it,i)=>`Item${i+1}: w=${it.w}, p=${it.v}`).join('\n')}`;
      break;
    }
    case 'activitySelection': {
      const n = rand(5,7);
      const acts = Array.from({length:n},(_,i)=>{const s=rand(0,8);return{name:'I'+(i+1),s,f:s+rand(1,4)};});
      practiceLoad = {activities:acts};
      practiceText = `Activity Selection:\n${acts.map(a=>`${a.name}(${a.s},${a.f})`).join(', ')}`;
      break;
    }
    case 'jobScheduling': {
      const n = rand(5,7);
      const jobs = Array.from({length:n},(_,i)=>({name:'J'+(i+1),d:rand(1,4),p:rand(5,50)}));
      practiceLoad = {jobs};
      practiceText = `Job Scheduling (n=${n}):\nProfits: ${jobs.map(j=>j.p).join(',')}\nDeadlines: ${jobs.map(j=>j.d).join(',')}`;
      break;
    }
    case 'rabinKarp': {
      const texts=['1234567890','9876543210','2468013579','1357924680'];
      const pats=['1234','5678','9012','3456'];
      const t=texts[rand(0,3)], p=pats[rand(0,3)];
      const mods=[7,11,13,17];
      const mod=mods[rand(0,3)];
      practiceLoad={text:t,pattern:p,mod,base:10};
      practiceText=`Rabin-Karp with q=${mod}:\nText: ${t}\nPattern: ${p}`;
      break;
    }
    default: return;
  }

  // Load the generated practice question
  const fakeQ = {id:'practice_'+Date.now(), year:'Practice', topic:q.topic, load:practiceLoad};
  const origId = q.id;

  // Display practice info
  const box = document.getElementById(`pyq-sol-${origId}`);
  if(box) {
    box.classList.add('visible');
    box.innerHTML = [
      `<span class="pyq-sol-section">🎲 PRACTICE QUESTION (GTU Style · Similar to ${q.year})</span>`,
      '',
      `<span class="pyq-sol-step">${practiceText}</span>`,
      '',
      `<span style="color:#fbbf24">↑ Loading into calculator automatically...</span>`,
      `<span style="color:#34d399;font-size:11px">Solve it, then click "📝 GTU Solution" on the original question to check the method.</span>`,
    ].join('\n');
  }

  // Auto-load into calculator
  const tempQ = {...q, id:'practice_tmp', load:practiceLoad};
  GTUQuestionBank[key] = GTUQuestionBank[key]||[];
  GTUQuestionBank[key].push(tempQ);
  loadGTUQuestion('practice_tmp', key);
  GTUQuestionBank[key].pop();
}

// ─── INITIALISE PANELS ON PAGE LOAD ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  PYQ_TOOL_MAP.forEach(({toolIdx, key, label})=>{
    const toolDiv = document.getElementById(`tool-${toolIdx}`);
    if(toolDiv) pyqBuildPanel(toolDiv, key, label);
  });
});

// ═══════════════════════════════════════════════════════════
// BFS/DFS GRAPH LOADER (bridge from PYQ)
// ═══════════════════════════════════════════════════════════
function loadGTUBFSGraph(L) {
  try {
    // The BFS/DFS tool uses bfsNodes, bfsEdges, bfsNodeState, bfsEdgeState
    if(typeof bfsNodes === 'undefined') return;
    bfsNodes.length=0; bfsEdges.length=0;
    L.positions.forEach((p,i)=>bfsNodes.push({x:p.x,y:p.y,label:L.nodes[i],scale:1}));
    L.edges.forEach((e,i)=>{bfsEdges.push({a:e.a,b:e.b}); bfsEdgeState[i]='default';});
    bfsNodes.forEach((_,i)=>{bfsNodeState[i]='default';});
    if(typeof bfsUpdateStartSelect==='function') bfsUpdateStartSelect();
    if(typeof bfsResizeCanvas==='function') setTimeout(()=>{bfsResizeCanvas();bfsRedraw();},80);
  } catch(ex){ showToast('Graph load: '+ex.message); }
}

// ═══════════════════════════════════════════════════════════
// TOOL 17: COVERAGE ANALYTICS
// ═══════════════════════════════════════════════════════════
function buildCoverageAnalytics() {
  var container = document.getElementById('analytics-container');
  if(!container || container.dataset.built==='1') return;
  container.dataset.built='1';

  var LABELS={sorting:'Sorting',sortingExtra:'Sorting+',knapsack:'0/1 Knapsack',lcs:'LCS',
    lcsExtra:'LCS+',binarySearch:'Binary Search',rabinKarp:'Rabin-Karp',quickSort:'Quick Sort',
    fractionalKnapsack:'Frac Knapsack',activitySelection:'Activity Sel.',matrixChain:'Matrix Chain',
    matrixChainExtra:'MCM+',coinChange:'Coin Change',jobScheduling:'Job Sched.',
    mstPrim:'Prim MST',mstKruskal:'Kruskal MST',dijkstraQ:'Dijkstra',floydWarshall:'Floyd-Warshall',
    bfsDfs:'BFS/DFS',nQueens:'N-Queens'};
  var PAPERS=['Summer 2023','Winter 2023','Summer 2024','Winter 2024','Summer 2025','Winter 2025'];
  var COLORS=['#60a5fa','#34d399','#a78bfa','#fbbf24','#fb923c','#f472b6','#22d3ee','#4ade80','#818cf8','#f87171','#2dd4bf','#c084fc'];

  var allQs=[], paperMap={};
  PAPERS.forEach(p=>{paperMap[p]={count:0,marks:0};});
  Object.keys(GTUQuestionBank).forEach(key=>{
    GTUQuestionBank[key].forEach(q=>{
      allQs.push(q);
      if(paperMap[q.year]){paperMap[q.year].count++;paperMap[q.year].marks+=q.marks;}
    });
  });

  var topicData=Object.keys(GTUQuestionBank).map((k,i)=>({
    key:k, name:LABELS[k]||k, n:GTUQuestionBank[k].length, color:COLORS[i%COLORS.length],
    marks:GTUQuestionBank[k].reduce((s,q)=>s+q.marks,0)
  })).filter(t=>t.n>0).sort((a,b)=>b.n-a.n);
  var maxN=topicData[0]?.n||1;

  var html='<div style="background:#111827;border:1.5px solid rgba(52,211,153,0.25);border-radius:14px;padding:20px">';

  // Big stats
  html+='<div class="big-stats">';
  var statData=[
    {v:allQs.length,l:'Total Questions'},
    {v:PAPERS.length,l:'GTU Papers'},
    {v:allQs.reduce((s,q)=>s+q.marks,0),l:'Total Marks'},
    {v:allQs.filter(q=>q.load).length,l:'Auto-Loadable'},
    {v:topicData.length,l:'Topics Covered'}
  ];
  statData.forEach(s=>{
    html+='<div class="big-stat"><div class="big-stat-val">'+s.v+'</div><div class="big-stat-lbl">'+s.l+'</div></div>';
  });
  html+='</div>';

  // Two column grid
  html+='<div class="cov-grid">';

  // Paper breakdown
  html+='<div class="cov-card"><div class="cov-card-title">📅 Questions per Paper</div><div class="paper-row">';
  PAPERS.forEach(p=>{
    var d=paperMap[p];
    html+='<div class="paper-mini"><div class="paper-mini-yr">'+p+'</div><div class="paper-mini-n">'+d.count+'</div><div class="paper-mini-m">'+d.marks+' marks</div></div>';
  });
  html+='</div></div>';

  // Topic breakdown
  html+='<div class="cov-card" style="grid-column:span 2"><div class="cov-card-title">📊 Coverage by Topic</div>';
  topicData.forEach(t=>{
    html+='<div class="cov-topic-row"><div class="cov-topic-name">'+t.name+'</div><div class="cov-bar-track" style="flex:1"><div class="cov-bar-fill" style="width:'+Math.round(t.n/maxN*100)+'%;background:'+t.color+'"></div></div><div class="cov-topic-count" style="color:'+t.color+'">'+t.n+'</div></div>';
  });
  html+='</div>';
  html+='</div>'; // end cov-grid

  // High priority topics
  html+='<div class="cov-card" style="margin-top:0"><div class="cov-card-title">🎯 Exam Priority Guide</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:10px">';
  var tips=[
    {c:'#34d399',t:'Guaranteed (Every Year)','l':'MST Prim/Kruskal · 0/1 Knapsack · Sorting · N-Queens'},
    {c:'#60a5fa',t:'High (4-5 of 6 papers)','l':'Floyd-Warshall · LCS · Matrix Chain · Rabin-Karp'},
    {c:'#a78bfa',t:'Regular (3-4 papers)','l':'Dijkstra · BFS/DFS · Frac Knapsack · Job Scheduling'},
    {c:'#fbbf24',t:'Common Theory','l':'Recurrences · Asymptotic Notations · Algorithm Design'}
  ];
  tips.forEach(tip=>{
    html+='<div style="background:#0e1420;border:1px solid '+tip.c+'30;border-radius:8px;padding:10px"><div style="color:'+tip.c+';font-weight:700;font-size:11px;margin-bottom:4px">'+tip.t+'</div><div style="font-size:10px;color:#94a3b8;line-height:1.7">'+tip.l+'</div></div>';
  });
  html+='</div></div>';
  html+='</div>';
  container.innerHTML=html;
}

// ═══════════════════════════════════════════════════════════
// TOOL 18: GRAPH GALLERY
// ═══════════════════════════════════════════════════════════
var _galleryFilter='all';

var GRAPH_GALLERY=[
  {id:'gg1',year:'Summer 2023',algo:'prim',marks:7,title:'Prim MST — Summer 2023 (6 Nodes)',
   nodes:['A','B','C','D','E','F'],
   edges:[{a:0,b:1,w:6},{a:0,b:3,w:1},{a:1,b:2,w:5},{a:1,b:3,w:2},{a:1,b:4,w:5},{a:2,b:4,w:5},{a:3,b:4,w:1},{a:4,b:5,w:4}],
   positions:[{x:120,y:200},{x:260,y:100},{x:420,y:100},{x:260,y:310},{x:420,y:310},{x:560,y:200}],
   desc:'MST Weight = 13. Edges: A-D(1), D-E(1), D-B(2), E-F(4), B-C(5)',
   toolTab:2, toolKey:'mstPrim'},
  {id:'gg2',year:'Summer 2023',algo:'kruskal',marks:7,title:'Kruskal MST — Summer 2023',
   nodes:['A','B','C','D','E','F'],
   edges:[{a:0,b:1,w:6},{a:0,b:3,w:1},{a:1,b:2,w:5},{a:1,b:3,w:2},{a:1,b:4,w:5},{a:2,b:4,w:5},{a:3,b:4,w:1},{a:4,b:5,w:4}],
   positions:[{x:120,y:200},{x:260,y:100},{x:420,y:100},{x:260,y:310},{x:420,y:310},{x:560,y:200}],
   desc:'Same graph. Sort edges & apply Union-Find. MST = 13.',
   toolTab:2, toolKey:'mstKruskal'},
  {id:'gg3',year:'Winter 2023',algo:'kruskal',marks:4,title:'Kruskal MST — Winter 2023 (5 Nodes)',
   nodes:['A','B','C','D','E'],
   edges:[{a:0,b:1,w:3},{a:0,b:3,w:1},{a:1,b:2,w:1},{a:1,b:3,w:3},{a:2,b:4,w:6},{a:3,b:4,w:5}],
   positions:[{x:120,y:200},{x:280,y:100},{x:440,y:200},{x:280,y:320},{x:440,y:320}],
   desc:'MST: A-D(1), B-C(1), A-B(3), D-E(5). Total = 10',
   toolTab:2, toolKey:'mstKruskal'},
  {id:'gg4',year:'Summer 2024',algo:'prim',marks:7,title:'Prim MST — Summer 2024 (6 Nodes)',
   nodes:['A','B','C','D','E','F'],
   edges:[{a:0,b:1,w:4},{a:0,b:2,w:2},{a:1,b:2,w:1},{a:1,b:3,w:5},{a:2,b:4,w:10},{a:3,b:4,w:2},{a:3,b:5,w:6},{a:4,b:5,w:3}],
   positions:[{x:100,y:200},{x:260,y:100},{x:260,y:300},{x:420,y:100},{x:420,y:300},{x:580,y:200}],
   desc:'MST: A-C(2), C-B(1), B-D(5), D-E(2), E-F(3). Total = 13',
   toolTab:2, toolKey:'mstPrim'},
  {id:'gg5',year:'Winter 2025',algo:'prim',marks:7,title:'Prim+Kruskal — Winter 2025 (7 Nodes)',
   nodes:['A','B','C','D','E','F','G'],
   edges:[{a:0,b:1,w:7},{a:0,b:3,w:5},{a:1,b:2,w:8},{a:1,b:3,w:9},{a:1,b:4,w:7},{a:2,b:4,w:5},{a:3,b:4,w:15},{a:3,b:5,w:6},{a:4,b:5,w:8},{a:4,b:6,w:9},{a:5,b:6,w:11}],
   positions:[{x:100,y:250},{x:260,y:120},{x:450,y:120},{x:260,y:380},{x:450,y:380},{x:370,y:250},{x:580,y:250}],
   desc:'MST Total = 39. Both Prim & Kruskal — same result.',
   toolTab:2, toolKey:'mstPrim'},
  {id:'gg6',year:'Summer 2024',algo:'floyd',marks:7,title:'Floyd-Warshall — Summer 2024 (4×4)',
   matrix:[[0,3,999,7],[8,0,2,999],[5,999,0,1],[2,999,999,0]], n:4,
   desc:'4-node directed. Final D=[[0,3,5,6],[5,0,2,3],[5,6,0,1],[2,5,4,0]]',
   toolTab:14, toolKey:'floydWarshall'},
  {id:'gg7',year:'Winter 2023',algo:'bfs',marks:4,title:'BFS — Winter 2023 (6 Nodes)',
   nodes:['A','B','C','D','E','F'],
   edges:[{a:0,b:1},{a:0,b:2},{a:1,b:3},{a:1,b:4},{a:2,b:4},{a:3,b:5},{a:4,b:5}],
   positions:[{x:200,y:80},{x:100,y:200},{x:300,y:200},{x:50,y:330},{x:250,y:330},{x:150,y:460}],
   desc:'BFS from A: A→B→C→D→E→F. Tree: A-B, A-C, B-D, B-E, D-F',
   toolTab:9, toolKey:'bfsDfs'},
  {id:'gg8',year:'Summer 2025',algo:'dfs',marks:7,title:'DFS — Summer 2025 (8 Nodes)',
   nodes:['C','G','A','B','D','E','F','H'],
   edges:[{a:0,b:1},{a:0,b:4},{a:1,b:2},{a:1,b:4},{a:2,b:3},{a:4,b:5},{a:5,b:6},{a:5,b:7}],
   positions:[{x:200,y:60},{x:100,y:180},{x:260,y:180},{x:350,y:280},{x:120,y:310},{x:200,y:400},{x:90,y:480},{x:300,y:480}],
   desc:'DFS from C: C,G,A,B,D,E,F,H. Shows complete DFS tree.',
   toolTab:9, toolKey:'bfsDfs'},
];

function filterGallery(type) {
  _galleryFilter=type;
  renderGallery();
}

function renderGallery() {
  var c=document.getElementById('graph-gallery-container');
  if(!c) return;
  var items=_galleryFilter==='all' ? GRAPH_GALLERY : GRAPH_GALLERY.filter(g=>g.algo===_galleryFilter);
  c.innerHTML='';
  items.forEach(function(g) {
    var card=document.createElement('div');
    card.className='gallery-card';
    var ACOLORS={prim:'#34d399',kruskal:'#a78bfa',dijkstra:'#60a5fa',bfs:'#fbbf24',dfs:'#fb923c',floyd:'#22d3ee'};
    var ac=ACOLORS[g.algo]||'#94a3b8';
    card.innerHTML=
      '<div class="gallery-card-title">'+g.title+'</div>'+
      '<div class="pyq-q-meta" style="margin-bottom:8px">'+
        '<span class="pyq-year-tag">'+g.year+'</span>'+
        '<span class="pyq-marks-tag">'+g.marks+' Marks</span>'+
        '<span style="font-size:10px;padding:2px 8px;border-radius:12px;background:rgba(0,0,0,0.3);color:'+ac+';border:1px solid '+ac+'40;font-family:JetBrains Mono,monospace;font-size:9px">'+g.algo.toUpperCase()+'</span>'+
      '</div>'+
      '<div style="font-size:11px;color:#94a3b8;line-height:1.55;margin-bottom:8px;font-family:JetBrains Mono,monospace">'+g.desc+'</div>'+
      '<button class="gallery-load-btn" onclick="galleryLoad(\''+g.id+'\')">▶ Load into Calculator</button>';
    c.appendChild(card);
  });
}

function galleryLoad(id) {
  var g=GRAPH_GALLERY.find(function(x){return x.id===id;});
  if(!g) return;
  try {
    if(g.algo==='prim'||g.algo==='kruskal') {
      mstNodes=g.positions.map(function(p,i){return{x:p.x,y:p.y,label:g.nodes[i],scale:1};});
      mstEdges=g.edges.map(function(e){return{a:e.a,b:e.b,w:e.w||1};});
      mstNodeState={}; mstEdgeState={};
      mstNodes.forEach(function(_,i){mstNodeState[i]='default';});
      mstEdges.forEach(function(_,i){mstEdgeState[i]='default';});
      clearLog('mst-steps-log');
      document.getElementById('mst-total-weight').textContent='';
      document.getElementById('mst-info').innerHTML='<b style="color:#34d399">GTU Graph Loaded!</b><br>Click Prim\'s MST or Kruskal\'s MST to solve.';
      setTimeout(function(){mstResizeCanvas();mstRedraw();},80);
      showTool(2);
      showToast('Loaded into MST Calculator ✅','success');
    } else if(g.algo==='floyd') {
      fwN=g.n||4;
      document.getElementById('fw-n').value=fwN;
      fwInputMatrix=g.matrix.map(function(r){return r.slice();});
      renderFWInputMatrix();
      fwReset();
      fwRenderMatrix(fwInputMatrix,-1,-1,-1,[]);
      document.getElementById('fw-iteration-label').textContent='D\u2070 \u2014 Initial Distance Matrix';
      showTool(14);
      showToast('Loaded into Floyd-Warshall ✅','success');
    } else if(g.algo==='bfs'||g.algo==='dfs') {
      loadGTUBFSGraph(g);
      showTool(9);
      showToast('Loaded into BFS/DFS ✅','success');
    }
  } catch(e) { showToast('Load error: '+e.message); }
}

// ═══════════════════════════════════════════════════════════
// TOOL 19: N-QUEENS BACKTRACKING
// ═══════════════════════════════════════════════════════════
var _nqBoard=[], _nqN=4, _nqAnimating=false, _nqSolutions=[];

function nqReset() {
  _nqAnimating=false;
  _nqN=parseInt(document.getElementById('nq-n').value)||4;
  _nqBoard=Array.from({length:_nqN},function(){return -1;});
  _nqSolutions=[];
  _nqRenderBoard(_nqBoard,-1,-1,false);
  document.getElementById('nq-solutions').innerHTML='';
  document.getElementById('nq-solution-count').textContent='';
  document.getElementById('nq-status').textContent='';
  document.getElementById('nq-steps').textContent='Ready. Press \u25b6 Animate Solve to start.';
}

function _nqRenderBoard(board,tryRow,tryCol,isAttack) {
  var n=board.length, sz=Math.min(50,Math.floor(320/n));
  var div=document.getElementById('nq-board');
  var html='<div class="nq-board-wrap">';
  for(var r=0;r<n;r++) {
    html+='<div class="nq-row">';
    for(var c=0;c<n;c++) {
      var base=(r+c)%2===0?'light':'dark';
      var extra='';
      if(board[r]===c) extra=' queen';
      else if(r===tryRow&&c===tryCol) extra=isAttack?' attack':' trying';
      html+='<div class="nq-cell '+base+extra+'" style="width:'+sz+'px;height:'+sz+'px">'+(board[r]===c?'\u265b':'')+'</div>';
    }
    html+='</div>';
  }
  html+='</div>';
  div.innerHTML=html;
}

function _nqIsSafe(board,row,col) {
  for(var r=0;r<row;r++) {
    if(board[r]===col) return false;
    if(Math.abs(board[r]-col)===Math.abs(r-row)) return false;
  }
  return true;
}

function _nqMiniBoard(sol) {
  var n=sol.length, sz=Math.min(16,Math.floor(80/n));
  var html='<div class="nq-mini-wrap">';
  for(var r=0;r<n;r++) {
    html+='<div class="nq-mini-row">';
    for(var c=0;c<n;c++) {
      var base=(r+c)%2===0?'light':'dark';
      html+='<div class="nq-mini-cell '+base+(sol[r]===c?' queen':'')+'" style="width:'+sz+'px;height:'+sz+'px">'+(sol[r]===c?'\u265b':'')+'</div>';
    }
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function _nqAddSol(solution) {
  _nqSolutions.push(solution.slice());
  var sols=document.getElementById('nq-solutions');
  var d=document.createElement('div');
  d.style.cssText='text-align:center;padding:8px;background:#0e1420;border:1px solid rgba(52,211,153,0.3);border-radius:8px;flex-shrink:0';
  d.innerHTML='<div style="font-size:9px;color:#34d399;font-family:Orbitron,monospace;margin-bottom:4px">Sol '+_nqSolutions.length+'</div>'+_nqMiniBoard(solution)+'<div style="font-size:9px;color:#64748b;margin-top:3px;font-family:JetBrains Mono">['+solution.join(',')+']</div>';
  sols.appendChild(d);
  document.getElementById('nq-solution-count').textContent=_nqSolutions.length+' solution'+ (_nqSolutions.length===1?'':'s')+' found';
}

async function nqSolve() {
  if(_nqAnimating) return;
  nqReset();
  _nqAnimating=true;
  var speed=parseInt(document.getElementById('nq-speed').value);
  var stepsDiv=document.getElementById('nq-steps');
  stepsDiv.textContent='';
  var board=Array.from({length:_nqN},function(){return -1;});

  async function solve(row) {
    if(!_nqAnimating) return;
    if(row===_nqN) {
      _nqAddSol(board);
      _nqRenderBoard(board,-1,-1,false);
      document.getElementById('nq-status').textContent='Solution '+_nqSolutions.length+': ['+board.join(',')+']';
      stepsDiv.innerHTML+='<span style="color:#34d399">\u2705 Solution '+_nqSolutions.length+': ['+board.join(',')+']</span>\n';
      stepsDiv.scrollTop=stepsDiv.scrollHeight;
      await sleep(speed*2);
      return;
    }
    for(var col=0;col<_nqN;col++) {
      if(!_nqAnimating) return;
      var safe=_nqIsSafe(board,row,col);
      board[row]=col;
      _nqRenderBoard(board,row,col,!safe);
      document.getElementById('nq-status').textContent='Row '+(row+1)+' Col '+(col+1)+': '+(safe?'Safe \u2713':'Conflict \u2717');
      stepsDiv.innerHTML+='<span style="color:'+(safe?'#93c5fd':'#f87171')+'">Row '+(row+1)+' Col '+(col+1)+': '+(safe?'\u2705':'\u274c')+'</span>\n';
      stepsDiv.scrollTop=stepsDiv.scrollHeight;
      await sleep(speed);
      if(safe) await solve(row+1);
      if(!_nqAnimating) return;
    }
    board[row]=-1;
    _nqRenderBoard(board,row,-1,false);
  }

  await solve(0);
  if(_nqAnimating) {
    _nqAnimating=false;
    showToast(_nqN+'-Queens: '+_nqSolutions.length+' solution(s) found! \u2705','success');
  }
}

function nqShowAll() {
  nqReset();
  _nqAnimating=false;
  var board=Array.from({length:_nqN},function(){return -1;});
  function all(row) {
    if(row===_nqN){_nqAddSol(board);return;}
    for(var c=0;c<_nqN;c++){
      if(_nqIsSafe(board,row,c)){board[row]=c;all(row+1);board[row]=-1;}
    }
  }
  all(0);
  if(_nqSolutions.length>0){
    _nqRenderBoard(_nqSolutions[0],-1,-1,false);
    document.getElementById('nq-status').textContent='Total: '+_nqSolutions.length+' solution(s) for N='+_nqN;
    document.getElementById('nq-steps').textContent='All '+_nqSolutions.length+' solutions displayed \u2192';
    showToast(_nqSolutions.length+' solutions for '+_nqN+'-Queens! \u2705','success');
  }
}

// ─── INIT ALL NEW TABS ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Patch showTool to lazy-init new panels
  var _origShow=window.showTool;
  if(_origShow) {
    window.showTool=function(idx){
      _origShow(idx);
      if(idx===16) buildCoverageAnalytics();
      if(idx===17) renderGallery();
      if(idx===18) { if(document.getElementById('nq-board')&&document.getElementById('nq-board').innerHTML==='') nqReset(); }
    };
  }
  // init N-Queens board on first load
  setTimeout(function(){
    if(document.getElementById('nq-board')) nqReset();
  },300);
});


// ═══════════════════════════════════════════════════════════════
// FEATURE #12: STEP COUNTER (floating overlay)
// ═══════════════════════════════════════════════════════════════
var _SC = { comps:0, swaps:0, steps:0, algo:'' };
function scReset(algoName) {
  _SC.comps=0; _SC.swaps=0; _SC.steps=0; _SC.algo=algoName||'';
  scUpdate();
  document.getElementById('step-counter-float').style.display='block';
}
function scAdd(comps,swaps,steps) {
  _SC.comps+=comps||0; _SC.swaps+=swaps||0; _SC.steps+=steps||0;
  scUpdate();
}
function scUpdate() {
  var c=document.getElementById('sc-comparisons');
  var s=document.getElementById('sc-swaps');
  var st=document.getElementById('sc-steps');
  var an=document.getElementById('sc-algo-name');
  if(c) c.textContent=_SC.comps;
  if(s) s.textContent=_SC.swaps;
  if(st) st.textContent=_SC.steps;
  if(an) an.textContent=_SC.algo;
}
function scHide() { var f=document.getElementById('step-counter-float'); if(f) f.style.display='none'; }

// ═══════════════════════════════════════════════════════════════
// FEATURE #7: ALGORITHM FAMILY TREE
// ═══════════════════════════════════════════════════════════════
var ALGO_TREE_DATA = [
  { paradigm:'Divide & Conquer', icon:'\u2702\ufe0f', color:'#60a5fa', border:'rgba(96,165,250,0.4)',
    desc:'Break problem into subproblems, solve recursively, combine. T(n)=aT(n/b)+f(n)',
    algos:[
      {name:'Merge Sort',   toolIdx:0,  algoVal:'merge'},
      {name:'Quick Sort',   toolIdx:6,  algoVal:null},
      {name:'Binary Search',toolIdx:4,  algoVal:null},
      {name:'Heap Sort',    toolIdx:0,  algoVal:'heap'},
    ]
  },
  { paradigm:'Greedy', icon:'\ud83d\udcb0', color:'#34d399', border:'rgba(52,211,153,0.4)',
    desc:'Locally optimal choice at each step. Needs greedy choice + optimal substructure.',
    algos:[
      {name:"Prim's MST",     toolIdx:2,  algoVal:null},
      {name:"Kruskal's MST",  toolIdx:2,  algoVal:null},
      {name:'Dijkstra SSSP',  toolIdx:13, algoVal:null},
      {name:'Frac Knapsack',  toolIdx:7,  algoVal:null},
      {name:'Activity Sel.',  toolIdx:8,  algoVal:null},
      {name:'Job Scheduling', toolIdx:12, algoVal:null},
    ]
  },
  { paradigm:'Dynamic Programming', icon:'\ud83d\udcca', color:'#a78bfa', border:'rgba(167,139,250,0.4)',
    desc:'Store & reuse subproblem solutions. Needs overlapping subproblems + optimal substructure.',
    algos:[
      {name:'0/1 Knapsack',    toolIdx:1,  algoVal:null},
      {name:'LCS',             toolIdx:3,  algoVal:null},
      {name:'Matrix Chain',    toolIdx:10, algoVal:null},
      {name:'Coin Change',     toolIdx:11, algoVal:null},
      {name:'Floyd-Warshall',  toolIdx:14, algoVal:null},
    ]
  },
  { paradigm:'Graph Algorithms', icon:'\ud83d\udd78\ufe0f', color:'#22d3ee', border:'rgba(34,211,238,0.4)',
    desc:'Explore vertices and edges. Basis for shortest paths, spanning trees, connectivity.',
    algos:[
      {name:'BFS',            toolIdx:9,  algoVal:null},
      {name:'DFS',            toolIdx:9,  algoVal:null},
      {name:'Dijkstra',       toolIdx:13, algoVal:null},
      {name:'MST Prim',       toolIdx:2,  algoVal:null},
      {name:'MST Kruskal',    toolIdx:2,  algoVal:null},
      {name:'Floyd-Warshall', toolIdx:14, algoVal:null},
    ]
  },
  { paradigm:'Backtracking', icon:'\ud83d\udd19', color:'#fb923c', border:'rgba(251,146,60,0.4)',
    desc:'Build candidates incrementally, abandon (backtrack) on constraint violation.',
    algos:[
      {name:'N-Queens',    toolIdx:18, algoVal:null},
      {name:'Subset Sum',  toolIdx:18, algoVal:null},
    ]
  },
  { paradigm:'String Matching', icon:'\ud83d\udd24', color:'#f472b6', border:'rgba(244,114,182,0.4)',
    desc:'Find pattern in text. Rabin-Karp uses rolling hash to find matches in O(n+m) average.',
    algos:[
      {name:'Rabin-Karp',  toolIdx:5, algoVal:null},
    ]
  },
  { paradigm:'Sorting Algorithms', icon:'\ud83d\udd22', color:'#fbbf24', border:'rgba(251,191,36,0.4)',
    desc:'Rearrange in sorted order. Foundation for many higher algorithms.',
    algos:[
      {name:'Bubble Sort',    toolIdx:0, algoVal:'bubble'},
      {name:'Selection Sort', toolIdx:0, algoVal:'selection'},
      {name:'Insertion Sort', toolIdx:0, algoVal:'insertion'},
      {name:'Merge Sort',     toolIdx:0, algoVal:'merge'},
      {name:'Heap Sort',      toolIdx:0, algoVal:'heap'},
      {name:'Counting Sort',  toolIdx:0, algoVal:'counting'},
      {name:'Bucket Sort',    toolIdx:0, algoVal:'bucket'},
    ]
  },
];

function buildAlgoTree() {
  var root=document.getElementById('algo-tree-root');
  if(!root||root.dataset.built) return;
  root.dataset.built='1';
  var html='';
  ALGO_TREE_DATA.forEach(function(p) {
    html+='<div class="tree-paradigm" style="border-color:'+p.border+'">';
    html+='<div class="tree-paradigm-title" style="color:'+p.color+'">'+p.icon+' '+p.paradigm+'</div>';
    html+='<div class="tree-paradigm-desc">'+p.desc+'</div>';
    html+='<div class="tree-nodes">';
    p.algos.forEach(function(a) {
      var av=a.algoVal||'';
      html+='<div class="tree-node" style="color:'+p.color+';border-color:'+p.border+'" onclick="treeNodeClick('+a.toolIdx+',\''+av+'\')">'+a.name+'</div>';
    });
    html+='</div></div>';
  });
  root.innerHTML=html;
}

function treeNodeClick(toolIdx, algoVal) {
  showTool(toolIdx);
  if(algoVal) {
    var sa=document.getElementById('sort-algo');
    if(sa) sa.value=algoVal;
  }
  showToast('Opened calculator \u2705','success');
}

// ═══════════════════════════════════════════════════════════════
// FEATURE #8: WHITEBOARD MODE
// ═══════════════════════════════════════════════════════════════
var _wbRunning=false, _wbCtx=null, _wbW=700, _wbH=420;

function wbInit() {
  var canvas=document.getElementById('wb-canvas');
  if(!canvas) return;
  _wbW=canvas.parentElement.clientWidth||700;
  canvas.width=_wbW; canvas.height=420; _wbH=420;
  _wbCtx=canvas.getContext('2d');
  wbClear();
}

function wbClear() {
  _wbRunning=false;
  if(!_wbCtx){wbInit();return;}
  _wbCtx.fillStyle='#1a2035';
  _wbCtx.fillRect(0,0,_wbW,_wbH);
  _wbCtx.font='13px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='rgba(255,255,255,0.15)';
  _wbCtx.textAlign='center';
  _wbCtx.fillText('Press \u25b6 Start to begin whiteboard walkthrough',_wbW/2,_wbH/2);
  _wbCtx.textAlign='left';
  document.getElementById('wb-step-label').textContent='';
}

function wbDrawBox(x,y,w,h,bg,border,text,textColor) {
  _wbCtx.fillStyle=bg||'rgba(59,130,246,0.2)';
  _wbCtx.strokeStyle=border||'#3b82f6';
  _wbCtx.lineWidth=1.5;
  _wbCtx.beginPath();
  if(_wbCtx.roundRect) _wbCtx.roundRect(x,y,w,h,6); else _wbCtx.rect(x,y,w,h);
  _wbCtx.fill(); _wbCtx.stroke();
  if(text!==undefined&&text!==null) {
    _wbCtx.font='12px "JetBrains Mono",monospace';
    _wbCtx.fillStyle=textColor||'#e2e8f0';
    _wbCtx.textAlign='center';
    _wbCtx.fillText(String(text),x+w/2,y+h/2+4);
    _wbCtx.textAlign='left';
  }
}

function wbDrawArray(arr,highlights,yOff,cellW) {
  var cw=cellW||Math.min(46,Math.floor((_wbW-20)/arr.length)-2);
  var totalW=arr.length*(cw+3)-3;
  var startX=Math.max(8,(_wbW-totalW)/2);
  _wbCtx.fillStyle='#1a2035';
  _wbCtx.fillRect(0,yOff-6,_wbW,54);
  arr.forEach(function(v,i) {
    var bg='rgba(30,41,59,0.9)', bd='#334155', tc='#e2e8f0';
    if(highlights) {
      if(highlights.pivot===i)    {bg='rgba(139,92,246,0.35)';bd='#a78bfa';tc='#c4b5fd';}
      if(highlights.comparing&&highlights.comparing.includes(i)){bg='rgba(251,191,36,0.25)';bd='#fbbf24';tc='#fde68a';}
      if(highlights.swapped&&highlights.swapped.includes(i))    {bg='rgba(239,68,68,0.25)';bd='#f87171';tc='#fca5a5';}
      if(highlights.sorted&&highlights.sorted.includes(i))      {bg='rgba(52,211,153,0.2)'; bd='#34d399';tc='#6ee7b7';}
    }
    wbDrawBox(startX+i*(cw+3),yOff,cw,40,bg,bd,v,tc);
  });
}

async function wbStart() {
  if(_wbRunning) return;
  if(!_wbCtx) wbInit();
  _wbRunning=true;
  var algo=document.getElementById('wb-algo').value;
  var rawInput=document.getElementById('wb-input').value.trim();
  var speed=parseInt(document.getElementById('wb-speed').value)||700;
  var setLabel=function(t){var el=document.getElementById('wb-step-label');if(el)el.textContent=t;};
  scReset('Whiteboard: '+algo);
  _wbCtx.fillStyle='#1a2035'; _wbCtx.fillRect(0,0,_wbW,_wbH);

  if(algo==='bubble'||algo==='selection'||algo==='insertion') {
    var arr=rawInput?rawInput.split(',').map(Number):[5,3,8,1,9,2,7,4];
    arr=arr.filter(function(x){return!isNaN(x);}).slice(0,14);
    await wbRunSimpleSort(arr,algo,speed,setLabel);
  } else if(algo==='merge') {
    var arr=rawInput?rawInput.split(',').map(Number):[38,27,43,3,9,82,10];
    arr=arr.filter(function(x){return!isNaN(x);}).slice(0,10);
    await wbRunMerge(arr,speed,setLabel);
  } else if(algo==='quick') {
    var arr=rawInput?rawInput.split(',').map(Number):[5,3,8,1,9,2,7];
    arr=arr.filter(function(x){return!isNaN(x);}).slice(0,10);
    await wbRunQuick(arr,speed,setLabel);
  } else if(algo==='knapsack') {
    await wbRunKnapsack(speed,setLabel);
  } else if(algo==='lcs') {
    await wbRunLCS(speed,setLabel);
  } else if(algo==='prim'||algo==='kruskal') {
    await wbRunMST(algo,speed,setLabel);
  } else if(algo==='bfs'||algo==='dfs') {
    await wbRunBFSDFS(algo,speed,setLabel);
  }
  _wbRunning=false;
}

async function wbRunSimpleSort(arr,type,speed,setLabel) {
  var a=[...arr], n=a.length, sorted=[];
  var title={'bubble':'Bubble Sort','selection':'Selection Sort','insertion':'Insertion Sort'};
  _wbCtx.font='bold 14px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#34d399';
  _wbCtx.fillText(title[type]+' \u2014 Step by Step',16,24);
  if(type==='bubble'){
    for(var i=0;i<n-1&&_wbRunning;i++){
      for(var j=0;j<n-1-i&&_wbRunning;j++){
        scAdd(1,0,1);
        wbDrawArray(a,{comparing:[j,j+1],sorted:sorted},40);
        setLabel('Comparing ['+j+']='+a[j]+' vs ['+(j+1)+']='+a[j+1]);
        await sleep(speed);
        if(a[j]>a[j+1]){var t=a[j];a[j]=a[j+1];a[j+1]=t;scAdd(0,1,0);
          wbDrawArray(a,{swapped:[j,j+1],sorted:sorted},40);
          setLabel('Swapped! Now '+a[j]+' < '+a[j+1]);
          await sleep(speed);
        }
      }
      sorted.unshift(n-1-i);
    }
  } else if(type==='selection'){
    for(var i=0;i<n-1&&_wbRunning;i++){
      var mi=i;
      for(var j=i+1;j<n;j++){scAdd(1,0,1);wbDrawArray(a,{comparing:[j,mi],sorted:sorted},40);setLabel('Pass '+(i+1)+': min='+a[mi]+' at '+mi+', check ['+j+']='+a[j]);await sleep(speed/2);if(a[j]<a[mi])mi=j;}
      if(mi!==i){var t=a[i];a[i]=a[mi];a[mi]=t;scAdd(0,1,0);}
      sorted.push(i);wbDrawArray(a,{sorted:sorted},40);setLabel('Placed min '+a[i]+' at index '+i+' \u2713');await sleep(speed);
    }
  } else if(type==='insertion'){
    sorted=[0];
    for(var i=1;i<n&&_wbRunning;i++){
      var key=a[i],j=i-1;
      setLabel('Key='+key+' at index '+i+'. Shifting larger elements right.');
      while(j>=0&&a[j]>key&&_wbRunning){scAdd(1,1,1);a[j+1]=a[j];j--;wbDrawArray(a,{comparing:[j+1],sorted:sorted},40);await sleep(speed/2);}
      a[j+1]=key;sorted.push(i);wbDrawArray(a,{sorted:sorted},40);setLabel('Inserted '+key+' at ['+(j+1)+']. \u2713');await sleep(speed);
    }
  }
  sorted=[...Array(n).keys()];
  wbDrawArray(a,{sorted:sorted},40);
  setLabel(title[type]+' complete! \u2705 Result: ['+a.join(', ')+']');
}

async function wbRunMerge(arr,speed,setLabel) {
  _wbCtx.font='bold 14px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#60a5fa';
  _wbCtx.fillText('Merge Sort \u2014 Divide & Conquer',16,24);
  var levels=[];
  function collectLevels(a,d){
    if(!levels[d]) levels[d]=[];
    levels[d].push([...a]);
    if(a.length>1){var m=Math.floor(a.length/2);collectLevels(a.slice(0,m),d+1);collectLevels(a.slice(m),d+1);}
  }
  collectLevels(arr,0);
  for(var d=0;d<Math.min(levels.length,5)&&_wbRunning;d++){
    var y=40+d*70;
    _wbCtx.fillStyle='#1a2035';_wbCtx.fillRect(0,y-18,_wbW,65);
    _wbCtx.font='11px "JetBrains Mono",monospace';
    _wbCtx.fillStyle='#94a3b8';
    _wbCtx.fillText('Level '+d+(d===0?' [Full Array]':d===levels.length-1?' [Single Elements]':' [Divided]'),8,y-4);
    var sx=10;
    levels[d].forEach(function(grp){
      var cw=Math.min(38,Math.floor((_wbW-20)/(arr.length+levels[d].length)));
      grp.forEach(function(v,i){wbDrawBox(sx+i*(cw+2),y,cw,32,'rgba(59,130,246,0.15)','#3b82f6',v,'#bfdbfe');});
      sx+=grp.length*(cw+2)+10;
    });
    setLabel('Level '+d+': '+levels[d].map(function(g){return'['+g.join(',')+']';}).join(' | '));
    scAdd(arr.length,0,1);
    await sleep(speed);
  }
  var sorted=[...arr].sort(function(a,b){return a-b;});
  _wbCtx.fillStyle='#1a2035';_wbCtx.fillRect(0,_wbH-55,_wbW,55);
  _wbCtx.font='bold 13px "JetBrains Mono",monospace';_wbCtx.fillStyle='#34d399';
  _wbCtx.fillText('Merged Result: ['+sorted.join(', ')+']',12,_wbH-30);
  setLabel('Merge Sort complete! \u2705 Result: ['+sorted.join(', ')+']');
}

async function wbRunQuick(arr,speed,setLabel) {
  _wbCtx.font='bold 14px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#a78bfa';
  _wbCtx.fillText('Quick Sort \u2014 Partition Steps',16,24);
  var a=[...arr], log=[];
  function partition(a,lo,hi){
    var p=a[hi],i=lo;
    for(var j=lo;j<hi;j++){if(a[j]<=p){var t=a[i];a[i]=a[j];a[j]=t;i++;}}
    var t=a[i];a[i]=a[hi];a[hi]=t;
    log.push({arr:[...a],lo:lo,hi:hi,pivot:i}); return i;
  }
  function qs(a,lo,hi){if(lo>=hi) return; var pi=partition(a,lo,hi); qs(a,lo,pi-1); qs(a,pi+1,hi);}
  qs(a,0,a.length-1);
  var maxShow=Math.min(log.length,5);
  for(var s=0;s<maxShow&&_wbRunning;s++){
    var e=log[s]; var y=40+s*72;
    _wbCtx.fillStyle='#1a2035';_wbCtx.fillRect(0,y-14,_wbW,66);
    _wbCtx.font='11px "JetBrains Mono",monospace';_wbCtx.fillStyle='#94a3b8';
    _wbCtx.fillText('Step '+(s+1)+': pivot='+e.arr[e.pivot]+' placed at idx '+e.pivot,8,y-1);
    var cw=Math.min(40,Math.floor((_wbW-16)/e.arr.length)-2);
    e.arr.forEach(function(v,i){
      var isP=i===e.pivot,inR=i>=e.lo&&i<=e.hi;
      wbDrawBox(8+i*(cw+2),y,cw,34,
        isP?'rgba(139,92,246,0.4)':inR?'rgba(59,130,246,0.15)':'rgba(15,23,42,0.5)',
        isP?'#a78bfa':inR?'#3b82f6':'#1e293b',v,isP?'#c4b5fd':inR?'#e2e8f0':'#475569');
    });
    scAdd(e.hi-e.lo,1,1);
    setLabel('Step '+(s+1)+': Pivot '+e.arr[e.pivot]+' at range ['+e.lo+'..'+e.hi+']');
    await sleep(speed);
  }
  setLabel('Quick Sort complete! \u2705 Result: ['+a.join(', ')+']');
}

async function wbRunKnapsack(speed,setLabel) {
  var W=6, items=[{w:2,v:6},{w:2,v:10},{w:3,v:12}], n=3;
  _wbCtx.font='bold 13px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#a78bfa';
  _wbCtx.fillText('0/1 Knapsack DP  (W='+W+', items=(w=2,v=6),(w=2,v=10),(w=3,v=12))',10,20);
  var dp=Array.from({length:n+1},function(){return Array(W+1).fill(0);});
  var cw=44,ch=34,sx=50,sy=35;
  for(var j=0;j<=W;j++) wbDrawBox(sx+j*cw,sy,cw,ch,'rgba(15,23,42,0.8)','#334155',j,'#64748b');
  for(var i=0;i<=n;i++) wbDrawBox(sx-46,sy+(i+1)*ch,46,ch,'rgba(15,23,42,0.8)','#334155',i===0?'i=0':'I'+i,'#64748b');
  for(var i=1;i<=n&&_wbRunning;i++){
    for(var j=0;j<=W&&_wbRunning;j++){
      dp[i][j]=dp[i-1][j];
      if(items[i-1].w<=j) dp[i][j]=Math.max(dp[i][j],dp[i-1][j-items[i-1].w]+items[i-1].v);
      var better=items[i-1].w<=j&&dp[i][j]>dp[i-1][j];
      wbDrawBox(sx+j*cw,sy+(i)*ch,cw,ch,
        better?'rgba(52,211,153,0.25)':'rgba(59,130,246,0.1)',
        better?'#34d399':'#3b82f6',dp[i][j],better?'#34d399':'#93c5fd');
      scAdd(1,0,1);
      setLabel('dp['+i+']['+j+']='+dp[i][j]+(better?' \u2190 TAKE (w='+items[i-1].w+',v='+items[i-1].v+')':''));
      await sleep(speed/4);
    }
  }
  _wbCtx.font='bold 13px "JetBrains Mono",monospace';_wbCtx.fillStyle='#34d399';
  _wbCtx.fillText('Max Profit = '+dp[n][W],sx,sy+(n+2)*ch+8);
  setLabel('Knapsack complete! Max Profit = '+dp[n][W]+' \u2705');
}

async function wbRunLCS(speed,setLabel) {
  var X='ABCBDAB', Y='BDCAB', m=X.length, n=Y.length;
  _wbCtx.font='bold 13px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#60a5fa';
  _wbCtx.fillText('LCS  X='+X+'  Y='+Y,10,20);
  var dp=Array.from({length:m+1},function(){return Array(n+1).fill(0);});
  var cw=32,ch=28,sx=50,sy=32;
  for(var j=0;j<=n;j++) wbDrawBox(sx+j*cw,sy,cw,ch,'rgba(15,23,42,0.7)','#334155',j===0?'':Y[j-1],'#f59e0b');
  for(var i=0;i<=m;i++) wbDrawBox(sx-cw,sy+i*ch,cw,ch,'rgba(15,23,42,0.7)','#334155',i===0?'':X[i-1],'#f59e0b');
  for(var i=1;i<=m&&_wbRunning;i++){
    for(var j=1;j<=n&&_wbRunning;j++){
      var match=X[i-1]===Y[j-1];
      dp[i][j]=match?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
      wbDrawBox(sx+j*cw,sy+i*ch,cw,ch,
        match?'rgba(52,211,153,0.3)':'rgba(59,130,246,0.1)',
        match?'#34d399':'#3b82f6',dp[i][j],match?'#34d399':'#93c5fd');
      scAdd(1,0,1);
      setLabel(match?'Match '+X[i-1]+'='+Y[j-1]+'  dp['+i+']['+j+']='+dp[i][j]:'dp['+i+']['+j+']=max('+dp[i-1][j]+','+dp[i][j-1]+')='+dp[i][j]);
      await sleep(speed/5);
    }
  }
  _wbCtx.font='bold 13px "JetBrains Mono",monospace';_wbCtx.fillStyle='#34d399';
  _wbCtx.fillText('LCS Length = '+dp[m][n],sx,sy+(m+2)*ch);
  setLabel('LCS complete! Length = '+dp[m][n]+' \u2705');
}

async function wbRunMST(type,speed,setLabel) {
  var nodes=[{x:160,y:80,l:'A'},{x:300,y:55,l:'B'},{x:450,y:90,l:'C'},{x:185,y:210,l:'D'},{x:370,y:210,l:'E'},{x:510,y:195,l:'F'}];
  var edges=[{a:0,b:1,w:4},{a:0,b:3,w:2},{a:1,b:2,w:3},{a:1,b:4,w:5},{a:2,b:5,w:1},{a:3,b:4,w:8},{a:4,b:5,w:6},{a:1,b:3,w:3}];
  _wbCtx.font='bold 14px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#34d399';
  _wbCtx.fillText((type==='prim'?"Prim's":"Kruskal's")+' MST \u2014 Walkthrough',14,22);
  function drawG(mstSet,curIdx){
    _wbCtx.fillStyle='#1a2035';_wbCtx.fillRect(0,32,_wbW,_wbH-32);
    edges.forEach(function(e,i){
      var isMST=mstSet.indexOf(i)>=0;
      _wbCtx.strokeStyle=isMST?'#34d399':i===curIdx?'#fbbf24':'#334155';
      _wbCtx.lineWidth=isMST?3:i===curIdx?2:1.2;
      _wbCtx.beginPath();_wbCtx.moveTo(nodes[e.a].x,nodes[e.a].y);_wbCtx.lineTo(nodes[e.b].x,nodes[e.b].y);_wbCtx.stroke();
      var mx=(nodes[e.a].x+nodes[e.b].x)/2,my=(nodes[e.a].y+nodes[e.b].y)/2;
      _wbCtx.font='bold 11px "JetBrains Mono",monospace';
      _wbCtx.fillStyle=isMST?'#34d399':i===curIdx?'#fbbf24':'#64748b';
      _wbCtx.textAlign='center';_wbCtx.fillText(e.w,mx,my-4);_wbCtx.textAlign='left';
    });
    nodes.forEach(function(n,i){
      _wbCtx.beginPath();_wbCtx.arc(n.x,n.y,14,0,Math.PI*2);
      _wbCtx.fillStyle='rgba(59,130,246,0.25)';_wbCtx.fill();
      _wbCtx.strokeStyle='#3b82f6';_wbCtx.lineWidth=2;_wbCtx.stroke();
      _wbCtx.font='bold 12px "JetBrains Mono",monospace';_wbCtx.fillStyle='#e2e8f0';
      _wbCtx.textAlign='center';_wbCtx.fillText(n.l,n.x,n.y+5);_wbCtx.textAlign='left';
    });
  }
  var mstSet=[];
  var sorted=edges.map(function(e,i){return{a:e.a,b:e.b,w:e.w,i:i};}).sort(function(a,b){return a.w-b.w;});
  drawG([],null); await sleep(speed);
  for(var s=0;s<sorted.length&&_wbRunning&&mstSet.length<nodes.length-1;s++){
    var e=sorted[s];
    setLabel('Edge '+nodes[e.a].l+'-'+nodes[e.b].l+' (w='+e.w+') \u2192 Adding to MST \u2713');
    drawG(mstSet,e.i); await sleep(speed);
    mstSet.push(e.i); scAdd(1,0,1);
    drawG(mstSet,-1); await sleep(speed);
  }
  var tw=mstSet.reduce(function(s,i){return s+edges[i].w;},0);
  setLabel('MST complete! Total weight = '+tw+' \u2705');
}

async function wbRunBFSDFS(type,speed,setLabel) {
  var nodes=[{x:(_wbW/2),y:65,l:'A'},{x:(_wbW/2)-130,y:175,l:'B'},{x:(_wbW/2)+130,y:175,l:'C'},{x:(_wbW/2)-210,y:295,l:'D'},{x:(_wbW/2)-60,y:295,l:'E'},{x:(_wbW/2)+80,y:295,l:'F'}];
  var adj=[[1,2],[0,3,4],[0,5],[1],[1],[2]];
  var edgeList=[];
  adj.forEach(function(nb,u){nb.forEach(function(v){if(v>u)edgeList.push({a:u,b:v});});});
  _wbCtx.font='bold 14px "JetBrains Mono",monospace';
  _wbCtx.fillStyle='#22d3ee';
  _wbCtx.fillText((type==='bfs'?'BFS \u2014 Breadth First Search':'DFS \u2014 Depth First Search'),14,22);
  var visited=[],order=[];
  function drawState(active,queue){
    _wbCtx.fillStyle='#1a2035';_wbCtx.fillRect(0,32,_wbW,_wbH-32);
    edgeList.forEach(function(e){_wbCtx.strokeStyle='#334155';_wbCtx.lineWidth=1.5;_wbCtx.beginPath();_wbCtx.moveTo(nodes[e.a].x,nodes[e.a].y);_wbCtx.lineTo(nodes[e.b].x,nodes[e.b].y);_wbCtx.stroke();});
    nodes.forEach(function(n,i){
      var isV=visited.indexOf(i)>=0,isA=i===active;
      _wbCtx.beginPath();_wbCtx.arc(n.x,n.y,16,0,Math.PI*2);
      _wbCtx.fillStyle=isA?'rgba(251,191,36,0.4)':isV?'rgba(52,211,153,0.3)':'rgba(30,41,59,0.9)';
      _wbCtx.fill();_wbCtx.strokeStyle=isA?'#fbbf24':isV?'#34d399':'#475569';_wbCtx.lineWidth=2;_wbCtx.stroke();
      _wbCtx.font='bold 13px "JetBrains Mono",monospace';_wbCtx.fillStyle='#f1f5f9';
      _wbCtx.textAlign='center';_wbCtx.fillText(n.l,n.x,n.y+5);_wbCtx.textAlign='left';
    });
    if(queue&&queue.length>0){_wbCtx.font='12px "JetBrains Mono",monospace';_wbCtx.fillStyle='#f59e0b';_wbCtx.fillText((type==='bfs'?'Queue: ':'Stack: ')+'['+queue.map(function(i){return nodes[i].l;}).join(',')+']',10,_wbH-40);}
    _wbCtx.font='bold 12px "JetBrains Mono",monospace';_wbCtx.fillStyle='#34d399';
    _wbCtx.fillText('Order: '+order.map(function(i){return nodes[i].l;}).join(' \u2192 '),10,_wbH-16);
  }
  if(type==='bfs'){
    var q=[0];
    while(q.length>0&&_wbRunning){
      var u=q.shift();
      if(visited.indexOf(u)>=0) continue;
      visited.push(u);order.push(u);scAdd(adj[u].length,0,1);
      drawState(u,q);setLabel('Visit '+nodes[u].l+'. Neighbors: '+adj[u].map(function(v){return nodes[v].l;}).join(','));
      await sleep(speed);
      adj[u].forEach(function(v){if(visited.indexOf(v)<0) q.push(v);});
    }
  } else {
    var stack=[0];
    while(stack.length>0&&_wbRunning){
      var u=stack.pop();
      if(visited.indexOf(u)>=0) continue;
      visited.push(u);order.push(u);scAdd(adj[u].length,0,1);
      drawState(u,stack);setLabel('Visit '+nodes[u].l+'. Push neighbors to stack.');
      await sleep(speed);
      for(var k=adj[u].length-1;k>=0;k--){if(visited.indexOf(adj[u][k])<0) stack.push(adj[u][k]);}
    }
  }
  drawState(-1,[]);
  setLabel((type==='bfs'?'BFS':'DFS')+' complete! Order: '+order.map(function(i){return nodes[i].l;}).join('\u2192')+' \u2705');
}

// ═══════════════════════════════════════════════════════════════
// FEATURE #13: CUSTOM GRAPH BUILDER
// ═══════════════════════════════════════════════════════════════
var _cgb={nodes:[],edges:[],mode:'node',dragging:null,edgeStart:null,canvas:null,ctx:null,w:700,h:380,directed:false};

function cgbInit(){
  var canvas=document.getElementById('cgb-canvas');
  if(!canvas||_cgb.ctx) return;
  _cgb.canvas=canvas;
  _cgb.w=canvas.parentElement.clientWidth||700;
  canvas.width=_cgb.w; canvas.height=380; _cgb.h=380;
  _cgb.ctx=canvas.getContext('2d');
  canvas.addEventListener('mousedown',cgbDown);
  canvas.addEventListener('mousemove',cgbMove);
  canvas.addEventListener('mouseup',cgbUp);
  canvas.addEventListener('touchstart',function(e){e.preventDefault();var t=e.touches[0];var r=canvas.getBoundingClientRect();cgbDown({offsetX:t.clientX-r.left,offsetY:t.clientY-r.top});},{passive:false});
  canvas.addEventListener('touchmove',function(e){e.preventDefault();var t=e.touches[0];var r=canvas.getBoundingClientRect();cgbMove({offsetX:t.clientX-r.left,offsetY:t.clientY-r.top});},{passive:false});
  canvas.addEventListener('touchend',function(e){e.preventDefault();cgbUp({});},{passive:false});
  cgbRedraw();
}

function cgbFindNode(x,y){for(var i=_cgb.nodes.length-1;i>=0;i--){if(Math.hypot(_cgb.nodes[i].x-x,_cgb.nodes[i].y-y)<=18)return i;}return -1;}

function cgbSetMode(m){
  _cgb.mode=m;_cgb.edgeStart=null;
  ['node','edge','del','move'].forEach(function(id){var b=document.getElementById('cgb-btn-'+id);if(b)b.classList.toggle('active',id===m);});
  var hints={node:'Click canvas to add a node',edge:'Click source node then destination node (will prompt for weight)',del:'Click node or edge to delete',move:'Drag nodes to reposition'};
  var hint=document.getElementById('cgb-hint');if(hint) hint.textContent='Mode: '+m+' \u2014 '+hints[m];
  cgbRedraw();
}

function cgbDown(e){
  var x=e.offsetX,y=e.offsetY;
  var di=document.getElementById('cgb-directed');
  _cgb.directed=di&&di.checked;
  if(_cgb.mode==='node'){
    if(cgbFindNode(x,y)<0){
      var letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var lbl=letters[_cgb.nodes.length%26]+(_cgb.nodes.length>=26?Math.floor(_cgb.nodes.length/26):'');
      _cgb.nodes.push({x:x,y:y,label:lbl});cgbRedraw();
    }
  } else if(_cgb.mode==='edge'){
    var idx=cgbFindNode(x,y);
    if(idx>=0){
      if(_cgb.edgeStart===null){_cgb.edgeStart=idx;var h=document.getElementById('cgb-hint');if(h)h.textContent='Now click destination (source: '+_cgb.nodes[idx].label+')';}
      else if(idx!==_cgb.edgeStart){
        var w=prompt('Edge weight (press OK for 1):');
        var wt=parseInt(w)||1;
        _cgb.edges.push({a:_cgb.edgeStart,b:idx,w:wt});_cgb.edgeStart=null;
        var h=document.getElementById('cgb-hint');if(h)h.textContent='Edge added! Click next source node.';
        cgbRedraw();
      }
    }
  } else if(_cgb.mode==='del'){
    var ni=cgbFindNode(x,y);
    if(ni>=0){
      _cgb.edges=_cgb.edges.filter(function(e){return e.a!==ni&&e.b!==ni;});
      _cgb.edges=_cgb.edges.map(function(e){return{a:e.a>ni?e.a-1:e.a,b:e.b>ni?e.b-1:e.b,w:e.w};});
      _cgb.nodes.splice(ni,1);cgbRedraw();return;
    }
    for(var i=0;i<_cgb.edges.length;i++){
      var e=_cgb.edges[i],na=_cgb.nodes[e.a],nb=_cgb.nodes[e.b];
      if(!na||!nb) continue;
      var dx=nb.x-na.x,dy=nb.y-na.y,len=Math.hypot(dx,dy)||1;
      var t=Math.max(0,Math.min(1,((x-na.x)*dx+(y-na.y)*dy)/(len*len)));
      if(Math.hypot(x-na.x-t*dx,y-na.y-t*dy)<10){_cgb.edges.splice(i,1);cgbRedraw();return;}
    }
  } else if(_cgb.mode==='move'){
    _cgb.dragging=cgbFindNode(x,y);
  }
}

function cgbMove(e){
  if(_cgb.mode==='move'&&_cgb.dragging!==null&&_cgb.dragging>=0){
    _cgb.nodes[_cgb.dragging].x=e.offsetX;_cgb.nodes[_cgb.dragging].y=e.offsetY;cgbRedraw();
  }
}

function cgbUp(e){if(_cgb.mode==='move')_cgb.dragging=null;}

function cgbClear(){_cgb.nodes=[];_cgb.edges=[];_cgb.edgeStart=null;cgbRedraw();}

function cgbRedraw(){
  if(!_cgb.ctx) return;
  var ctx=_cgb.ctx, w=_cgb.w, h=_cgb.h;
  ctx.fillStyle='#0a0e1a';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
  for(var gx=0;gx<w;gx+=40){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,h);ctx.stroke();}
  for(var gy=0;gy<h;gy+=40){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(w,gy);ctx.stroke();}
  _cgb.edges.forEach(function(e){
    var na=_cgb.nodes[e.a],nb=_cgb.nodes[e.b];if(!na||!nb) return;
    ctx.strokeStyle='rgba(34,211,238,0.7)';ctx.lineWidth=2;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb.x,nb.y);ctx.stroke();
    if(_cgb.directed){
      var ang=Math.atan2(nb.y-na.y,nb.x-na.x);
      var ax=nb.x-Math.cos(ang)*20,ay=nb.y-Math.sin(ang)*20;
      ctx.fillStyle='rgba(34,211,238,0.8)';ctx.beginPath();ctx.moveTo(ax,ay);
      ctx.lineTo(ax-9*Math.cos(ang-0.45),ay-9*Math.sin(ang-0.45));
      ctx.lineTo(ax-9*Math.cos(ang+0.45),ay-9*Math.sin(ang+0.45));
      ctx.closePath();ctx.fill();
    }
    var mx=(na.x+nb.x)/2,my=(na.y+nb.y)/2;
    ctx.fillStyle='#0a0e1a';ctx.beginPath();ctx.arc(mx,my,10,0,Math.PI*2);ctx.fill();
    ctx.font='bold 11px "JetBrains Mono",monospace';ctx.fillStyle='#22d3ee';ctx.textAlign='center';ctx.fillText(e.w,mx,my+4);ctx.textAlign='left';
  });
  ctx.setLineDash([]);
  if(_cgb.edgeStart!==null&&_cgb.nodes[_cgb.edgeStart]){
    var n=_cgb.nodes[_cgb.edgeStart];
    ctx.beginPath();ctx.arc(n.x,n.y,22,0,Math.PI*2);ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
  }
  _cgb.nodes.forEach(function(n,i){
    ctx.beginPath();ctx.arc(n.x,n.y,16,0,Math.PI*2);
    ctx.fillStyle='rgba(34,211,238,0.18)';ctx.fill();
    ctx.strokeStyle='#22d3ee';ctx.lineWidth=2;ctx.stroke();
    ctx.font='bold 12px "JetBrains Mono",monospace';ctx.fillStyle='#e2e8f0';ctx.textAlign='center';ctx.fillText(n.label,n.x,n.y+5);ctx.textAlign='left';
  });
  if(_cgb.nodes.length===0){
    ctx.font='14px "JetBrains Mono",monospace';ctx.fillStyle='rgba(255,255,255,0.12)';ctx.textAlign='center';
    ctx.fillText('Click anywhere on the canvas to add your first node',w/2,h/2);ctx.textAlign='left';
  }
}

function cgbExportTo(target){
  if(_cgb.nodes.length<2){showToast('Add at least 2 nodes first!');return;}
  var labels=_cgb.nodes.map(function(n){return n.label;});
  var edgesExp=_cgb.edges.map(function(e){return{a:e.a,b:e.b,w:e.w||1};});
  var positions=_cgb.nodes.map(function(n){return{x:n.x,y:n.y};});
  try{
    if(target==='mst'){
      mstNodes=positions.map(function(p,i){return{x:p.x,y:p.y,label:labels[i],scale:1};});
      mstEdges=edgesExp;mstNodeState={};mstEdgeState={};
      mstNodes.forEach(function(_,i){mstNodeState[i]='default';});
      mstEdges.forEach(function(_,i){mstEdgeState[i]='default';});
      clearLog('mst-steps-log');
      document.getElementById('mst-total-weight').textContent='';
      document.getElementById('mst-info').innerHTML='<b style="color:#34d399">Custom Graph Loaded!</b><br>'+labels.join(', ')+' \u2014 '+edgesExp.length+' edges';
      setTimeout(function(){mstResizeCanvas();mstRedraw();},80);
      showTool(2);showToast('Exported to MST \u2705','success');
    } else if(target==='dijkstra'){
      djkNodes=positions.map(function(p,i){return{x:p.x,y:p.y,label:labels[i],scale:1};});
      djkEdges=edgesExp;djkNodeState={};djkEdgeState={};
      djkNodes.forEach(function(_,i){djkNodeState[i]='default';});
      djkEdges.forEach(function(_,i){djkEdgeState[i]='default';});
      djkNodeDist={};djkNodePrev={};
      djkUpdateSourceSelect();
      setTimeout(function(){djkResizeCanvas();djkRedraw();},80);
      showTool(13);showToast('Exported to Dijkstra \u2705','success');
    } else if(target==='bfs'){
      loadGTUBFSGraph({nodes:labels,edges:edgesExp,positions:positions});
      showTool(9);showToast('Exported to BFS/DFS \u2705','success');
    } else if(target==='floyd'){
      var n=_cgb.nodes.length;
      fwN=n;
      var fw_input=document.getElementById('fw-n');if(fw_input)fw_input.value=n;
      fwInputMatrix=Array.from({length:n},function(_,i){
        return Array.from({length:n},function(_,j){
          if(i===j) return 0;
          var e=_cgb.edges.find(function(e){return e.a===i&&e.b===j;});
          return e?e.w:999;
        });
      });
      renderFWInputMatrix();fwReset();
      fwRenderMatrix(fwInputMatrix,-1,-1,-1,[]);
      showTool(14);showToast('Exported to Floyd-Warshall \u2705','success');
    }
  }catch(ex){showToast('Export error: '+ex.message);}
}

// ═══════════════════════════════════════════════════════════════
// FEATURE #11: EXAM NOTES BUILDER
// ═══════════════════════════════════════════════════════════════
var NOTES_TOPICS=[
  {key:'sorting',name:'Sorting Algorithms',icon:'\ud83d\udd22',color:'#fbbf24',
   content:'SORTING ALGORITHMS\n'+'\u2501'.repeat(34)+'\nBubble Sort:    Best O(n) | Avg O(n\u00b2) | Worst O(n\u00b2) | Space O(1) | Stable \u2713\nSelection Sort: All O(n\u00b2)           | Space O(1) | Stable \u2717\nInsertion Sort: Best O(n) | Avg O(n\u00b2) | Worst O(n\u00b2) | Space O(1) | Stable \u2713\nMerge Sort:     All O(n log n)         | Space O(n)  | Stable \u2713\nQuick Sort:     Best O(n log n) | Worst O(n\u00b2)   | Space O(log n)\nHeap Sort:      All O(n log n)         | Space O(1)  | Stable \u2717\nCounting Sort:  O(n+k)                 | Space O(k)  | Stable \u2713\n\nGTU TIP: Merge Sort every year. Know T(n)=2T(n/2)+n \u2192 O(n log n)'},
  {key:'knapsack',name:'0/1 Knapsack',icon:'\ud83d\udce6',color:'#a78bfa',
   content:'0/1 KNAPSACK (Dynamic Programming)\n'+'\u2501'.repeat(34)+'\nTime: O(nW)  Space: O(nW)\ndp[i][w] = max(dp[i-1][w], dp[i-1][w-wi]+vi) if wi\u2264w\n         = dp[i-1][w]                           if wi>w\nBuild (n+1)\u00d7(W+1) table row-by-row. Traceback for items.\nItems cannot be fractioned (0 or 1 each).\n\nGTU TIP: Asked in EVERY paper. Show full table + traceback.'},
  {key:'lcs',name:'LCS \u2014 Dynamic Prog.',icon:'\ud83d\udd24',color:'#60a5fa',
   content:'LONGEST COMMON SUBSEQUENCE\n'+'\u2501'.repeat(34)+'\nTime: O(mn)  Space: O(mn)\nIf X[i]=Y[j]: dp[i][j] = dp[i-1][j-1] + 1\nElse:         dp[i][j] = max(dp[i-1][j], dp[i][j-1])\nLCS = dp[m][n]. Traceback from dp[m][n] to find string.\n\nGTU TIP: Draw complete (m+1)\u00d7(n+1) table. Mark match cells.'},
  {key:'mcm',name:'Matrix Chain Mult.',icon:'\ud83d\udd17',color:'#34d399',
   content:'MATRIX CHAIN MULTIPLICATION\n'+'\u2501'.repeat(34)+'\nTime: O(n\u00b3)  Space: O(n\u00b2)\nm[i][j] = min over k: m[i][k]+m[k+1][j]+p[i-1]\u00d7p[k]\u00d7p[j]\nFill by chain length l=2,3,...,n\nm[1][n] = min scalar multiplications\n\nGTU TIP: Fill diagonal by diagonal. Show all l passes.'},
  {key:'mst',name:'MST Prim & Kruskal',icon:'\ud83d\udd78\ufe0f',color:'#22d3ee',
   content:"MST ALGORITHMS\n"+'\u2501'.repeat(34)+"\nPrim's (Greedy - grows one tree):\n  Start any vertex. Pick min edge to unvisited. O(V\u00b2)\nKruskal's (Greedy - Union-Find):\n  Sort edges by weight. Add if no cycle. O(E log E)\n\nBoth give same MST weight. |MST| = V-1 edges always.\nGTU TIP: BOTH asked every paper. Show table for Prim's."},
  {key:'dijkstra',name:"Dijkstra's SSSP",icon:'\ud83d\uddfa\ufe0f',color:'#f472b6',
   content:"DIJKSTRA'S SHORTEST PATH\n"+'\u2501'.repeat(34)+'\nTime: O(V\u00b2) or O(E log V)\n1. dist[src]=0, dist[rest]=\u221e\n2. Pick unvisited u with min dist\n3. Relax neighbors: if dist[u]+w<dist[v] \u2192 update dist[v]\n4. Mark u visited. Repeat.\n\n\u26a0\ufe0f Only for NON-NEGATIVE weights!\nGTU TIP: Show dist[] table updated each step.'},
  {key:'floyd',name:'Floyd-Warshall',icon:'\ud83d\udcca',color:'#fb923c',
   content:'FLOYD-WARSHALL\n'+'\u2501'.repeat(34)+'\nTime: O(V\u00b3)  Space: O(V\u00b2)\nD\u1d4f[i][j] = min(D\u1d4f\u207b\u00b9[i][j], D\u1d4f\u207b\u00b9[i][k]+D\u1d4f\u207b\u00b9[k][j])\nInit: D\u2070 = direct edge weights (\u221e if none, 0 diagonal)\nRun k=1 to V. Handles negative edges (not neg cycles).\n\nGTU TIP: Show D\u2070, D\u00b9, D\u00b2 ... D\u2b30 matrices step by step.'},
  {key:'bfsdfs',name:'BFS & DFS',icon:'\ud83c\udf10',color:'#34d399',
   content:'BFS & DFS TRAVERSAL\n'+'\u2501'.repeat(34)+'\nBFS: Uses QUEUE. Level-by-level. O(V+E)\n  Finds shortest path in unweighted graphs.\nDFS: Uses STACK/Recursion. Deep first. O(V+E)\n  Used for: cycle detection, topological sort, SCC.\n\nBFS Tree = shortest path tree\nDFS Tree: back/forward/cross edges possible\nGTU TIP: Draw traversal tree separately from original graph.'},
  {key:'nqueens',name:'N-Queens Backtracking',icon:'\u265f\ufe0f',color:'#f87171',
   content:'N-QUEENS BACKTRACKING\n'+'\u2501'.repeat(34)+'\nTime: O(N!)  Space: O(N)\nPlace queens row by row. Prune when:\n  Same column OR |row1-row2|=|col1-col2| (diagonal)\n4-Queens: 2 solutions: [2,4,1,3] and [3,1,4,2]\n8-Queens: 92 solutions\n\nGTU TIP: Draw STATE SPACE TREE. Mark pruned branches \u2717.'},
  {key:'coin',name:'Coin Change DP',icon:'\ud83e\ude99',color:'#fbbf24',
   content:'COIN CHANGE (Dynamic Programming)\n'+'\u2501'.repeat(34)+'\nTime: O(n\u00d7W)  Space: O(W)\ndp[0]=0, dp[1..W]=\u221e\ndp[w] = min over coins c\u2264w: dp[w-c]+1\n\nGreedy FAILS for some coin sets! DP is optimal.\nExample: {1,4,6} for 8 \u2192 Greedy: 6+1+1=3 coins, DP: 4+4=2\nGTU TIP: Show full dp[] array. Compare greedy vs DP!'},
  {key:'fknapsack',name:'Fractional Knapsack',icon:'\ud83d\udcb0',color:'#34d399',
   content:'FRACTIONAL KNAPSACK (Greedy)\n'+'\u2501'.repeat(34)+'\nTime: O(n log n)  Space: O(1)\n1. Compute value/weight ratio for each item\n2. Sort by ratio descending\n3. Take items greedily; fractionate last item if needed\n\nFractions allowed \u2192 Greedy is OPTIMAL (unlike 0/1 Knapsack)\nGTU TIP: Show ratio table. Calculate profit step-by-step.'},
  {key:'complexity',name:'Complexity Notations',icon:'\ud83d\udcd0',color:'#60a5fa',
   content:'ASYMPTOTIC NOTATIONS\n'+'\u2501'.repeat(34)+'\nO (Big-Oh):    Upper bound  f\u2264c\u00b7g for n>n\u2080\n\u03a9 (Big-Omega): Lower bound  f\u2265c\u00b7g for n>n\u2080\n\u0398 (Big-Theta): Tight bound  c\u2081g \u2264 f \u2264 c\u2082g\n\nMaster Theorem: T(n)=aT(n/b)+f(n)\nCase 1: f=O(n^(log_b a - \u03b5)) \u2192 T=\u0398(n^log_b a)\nCase 2: f=\u0398(n^log_b a) \u2192 T=\u0398(n^log_b a \u00b7 log n)\nCase 3: f=\u03a9(n^(log_b a + \u03b5)) \u2192 T=\u0398(f(n))\n\nGrowth: O(1)<O(log n)<O(n)<O(n log n)<O(n\u00b2)<O(2\u207f)<O(n!)'},
];

function buildNotesGrid(){
  var grid=document.getElementById('notes-topic-grid');
  if(!grid||grid.dataset.built) return;
  grid.dataset.built='1';
  NOTES_TOPICS.forEach(function(t){
    var card=document.createElement('div');
    card.className='notes-topic-card';
    card.id='notes-card-'+t.key;
    card.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:18px">'+t.icon+'</span>'+'<span style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;color:'+t.color+'">'+t.name+'</span></div>'+'<div style="font-size:9px;color:#64748b;font-family:JetBrains Mono,monospace">Click to toggle selection</div>';
    card.onclick=function(){notesToggle(t.key);};
    grid.appendChild(card);
  });
}

function notesToggle(key){
  var c=document.getElementById('notes-card-'+key);
  if(c) c.classList.toggle('selected');
}

function notesSelectAll(state){
  NOTES_TOPICS.forEach(function(t){
    var c=document.getElementById('notes-card-'+t.key);
    if(c){if(state)c.classList.add('selected');else c.classList.remove('selected');}
  });
}

function notesBuild(){
  var selected=NOTES_TOPICS.filter(function(t){
    var c=document.getElementById('notes-card-'+t.key);
    return c&&c.classList.contains('selected');
  });
  if(selected.length===0){showToast('Select at least one topic first!');return;}
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ADA Exam Notes \u2014 KUBERNAMA</title><style>';
  html+='*{box-sizing:border-box}body{font-family:"Courier New",monospace;background:#fff;color:#111;margin:16px 20px;font-size:11.5px;line-height:1.75}';
  html+='h1{font-size:15px;text-align:center;border-bottom:2px double #333;padding-bottom:8px;margin-bottom:14px}';
  html+='.topic{margin-bottom:14px;padding:10px 14px;border:1px solid #bbb;border-radius:4px;page-break-inside:avoid}';
  html+='.t-title{font-size:13px;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:3px}';
  html+='pre{white-space:pre-wrap;font-size:11px;margin:0;font-family:"Courier New",monospace}';
  html+='footer{text-align:center;margin-top:18px;font-size:10px;color:#777;border-top:1px solid #ddd;padding-top:8px}';
  html+='@media print{.topic{page-break-inside:avoid}footer{position:fixed;bottom:0;left:0;right:0;background:#fff}}';
  html+='</style></head><body>';
  html+='<h1>\u26a1 ADA Algorithm Lab \u2014 GTU 3150703 Exam Notes<br><small style="font-size:10px;font-weight:normal">'+selected.length+' Topics \u00b7 '+new Date().toLocaleDateString()+'</small></h1>';
  selected.forEach(function(t){
    html+='<div class="topic"><div class="t-title">'+t.icon+' '+t.name+'</div><pre>'+t.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre></div>';
  });
  html+='<footer>\u00a9 KUBERNAMA WEB SERVICES \u00b7 ADA Algorithm Lab \u00b7 GTU 3150703</footer>';
  html+='</body></html>';
  var w=window.open('','_blank','width=820,height=720,scrollbars=yes');
  if(w){w.document.write(html);w.document.close();setTimeout(function(){w.print();},700);}
  showToast('Notes ready! Use Ctrl+P to print. \u2705','success');
}

// ═══════════════════════════════════════════════════════════════
// FEATURE #6: STEP INSPECTOR
// ═══════════════════════════════════════════════════════════════
var _siSteps=[], _siCurrent=0;

function siCapture(){
  var sourceKey=document.getElementById('si-source').value;
  var logMap={sort:'sort-steps-log',mst:'mst-steps-log',bfs:'bfs-steps-log',dijkstra:'djk-steps-log',fw:'fw-steps-log'};
  var logId=logMap[sourceKey];
  var div=document.getElementById(logId);
  if(!div){showToast('Run the algorithm first, then capture!');return;}
  var texts=[];
  var items=div.querySelectorAll('[class*="step"],[class*="log"],[class*="item"],li,p,div>span');
  if(items.length>0){
    items.forEach(function(el){var t=el.textContent.trim();if(t&&t.length>2)texts.push(t);});
  }
  if(texts.length===0){
    texts=div.innerText.split('\n').filter(function(l){return l.trim().length>2;});
  }
  if(texts.length===0){showToast('No steps found. Run an algorithm first!');return;}
  _siSteps=texts; _siCurrent=0;
  siRender();
  showToast('Captured '+texts.length+' steps \u2705','success');
}

function siRender(){
  var list=document.getElementById('si-steps-list');
  var detail=document.getElementById('si-detail');
  var prog=document.getElementById('si-progress');
  if(!_siSteps.length){if(detail)detail.innerHTML='No steps captured yet. Run an algorithm then click Capture.';return;}
  if(prog) prog.textContent=(_siCurrent+1)+' / '+_siSteps.length;
  if(detail) detail.innerHTML='<div style="color:#a78bfa;font-size:10px;font-family:Orbitron,monospace;margin-bottom:6px">STEP '+(_siCurrent+1)+' OF '+_siSteps.length+'</div><div style="font-size:13px;line-height:1.85">'+_siSteps[_siCurrent]+'</div>';
  if(!list) return;
  list.innerHTML='';
  _siSteps.forEach(function(step,i){
    var d=document.createElement('div');
    d.className='si-step'+(i===_siCurrent?' active':'');
    d.textContent=(i+1)+'. '+step.slice(0,120)+(step.length>120?'...':'');
    (function(idx){d.onclick=function(){_siCurrent=idx;siRender();};})(i);
    list.appendChild(d);
  });
  var active=list.querySelector('.si-step.active');
  if(active) active.scrollIntoView({block:'nearest',behavior:'smooth'});
}

function siPrev(){if(_siCurrent>0){_siCurrent--;siRender();}}
function siNext(){if(_siCurrent<_siSteps.length-1){_siCurrent++;siRender();}}

// ═══════════════════════════════════════════════════════════════
// FEATURE #15: SHARE MY SOLUTION
// ═══════════════════════════════════════════════════════════════
function shareCurrentSolution(){
  var state={};
  function g(id){var el=document.getElementById(id);return el?el.value:'';}
  state.sa=g('sort-algo'); state.sc=g('sort-custom');
  state.kc=g('ks-capacity');
  state.lx=g('lcs-x'); state.ly=g('lcs-y');
  state.ba=g('bs-array'); state.bt=g('bs-target');
  state.qi=g('qs-input');
  state.rt=g('rk-text'); state.rp=g('rk-pattern');
  state.mi=g('mcm-input');
  state.ci=g('cc-coins'); state.ca=g('cc-amount');
  state.fi=g('fk-capacity');
  state.fn=g('fw-n');
  state.nn=g('nq-n');
  var tabs=document.querySelectorAll('.tab[aria-selected="true"]');
  if(tabs.length>0) state.tab=tabs[0].getAttribute('onclick')||'';
  try{
    var enc=btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    var url=location.href.split('?')[0]+'?ada='+enc;
    var inp=document.getElementById('share-url-input');
    if(inp) inp.value=url;
    var modal=document.getElementById('share-modal');
    var overlay=document.getElementById('share-modal-overlay');
    if(modal) modal.style.display='block';
    if(overlay) overlay.style.display='block';
  }catch(e){showToast('Share error: '+e.message);}
}

function copyShareUrl(){
  var input=document.getElementById('share-url-input');
  if(!input) return;
  input.select();
  try{navigator.clipboard.writeText(input.value).then(function(){showToast('Link copied! \ud83d\udd17','success');});}
  catch(e){try{document.execCommand('copy');showToast('Link copied! \ud83d\udd17','success');}catch(e2){}}
  closeShareModal();
}

function closeShareModal(){
  var m=document.getElementById('share-modal');var o=document.getElementById('share-modal-overlay');
  if(m) m.style.display='none';if(o) o.style.display='none';
}

function shareLoadFromURL(){
  try{
    var params=new URLSearchParams(location.search);
    var ada=params.get('ada');
    if(!ada) return;
    var state=JSON.parse(decodeURIComponent(escape(atob(ada))));
    function s(id,v){var el=document.getElementById(id);if(el&&v!==undefined&&v!==null&&v!=='')el.value=v;}
    s('sort-algo',state.sa);s('sort-custom',state.sc);s('ks-capacity',state.kc);
    s('lcs-x',state.lx);s('lcs-y',state.ly);s('bs-array',state.ba);s('bs-target',state.bt);
    s('qs-input',state.qi);s('rk-text',state.rt);s('rk-pattern',state.rp);
    s('mcm-input',state.mi);s('cc-coins',state.ci);s('cc-amount',state.ca);
    s('fk-capacity',state.fi);s('fw-n',state.fn);s('nq-n',state.nn);
    if(state.tab){try{var fn=new Function(state.tab);fn();}catch(e){}}
    showToast('Shared solution loaded! \u2705','success');
  }catch(e){}
}

// ═══════════════════════════════════════════════════════════════
// PATCH showTool FOR NEW TABS
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',function(){
  var _prev2=window.showTool;
  if(_prev2){
    window.showTool=function(idx){
      _prev2(idx);
      if(idx===16) buildCoverageAnalytics();
      if(idx===17) renderGallery();
      if(idx===18){if(document.getElementById('nq-board')&&document.getElementById('nq-board').innerHTML==='')nqReset();}
      if(idx===19) buildAlgoTree();
      if(idx===20){setTimeout(wbInit,60);}
      if(idx===21){setTimeout(cgbInit,60);}
      if(idx===22) buildNotesGrid();
    };
  }
  setTimeout(function(){if(document.getElementById('nq-board'))nqReset();},300);
  shareLoadFromURL();
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){var t=document.getElementById('tool-23');if(t&&t.style.display!=='none')siPrev();}
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){var t=document.getElementById('tool-23');if(t&&t.style.display!=='none')siNext();}
  });
});
