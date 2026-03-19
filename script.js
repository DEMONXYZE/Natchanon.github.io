/* ================================================================
   Portfolio — Natchanon Montrekul Na Ayutthaya
   script.js — all logic and Supabase integration
================================================================ */

// ─── SUPABASE CONFIG ───
const SB_URL = 'https://ffdzalffwhbpfllwojhz.supabase.co';
const SB_KEY = 'sb_publishable_t6T5EyPmAtTv-l8ouA_fHw_O6YQ3KBm';

async function sbGet(table) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?select=*&order=updated_at.desc.nullslast&limit=1`, {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

async function sbUpsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

// ─── STATE ───
let profile = {};
let projects = [];
let tasks    = [];
let avatar   = '';
let taskFilter = 'all';
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc = s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// show/hide loading overlay
function showLoading(msg) {
  let el = document.getElementById('sb-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sb-loading';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-family:var(--sans);color:#fff;font-size:14px;backdrop-filter:blur(2px)';
    el.innerHTML = `<div style="width:32px;height:32px;border:3px solid rgba(255,255,255,.3);border-top-color:#FF6B35;border-radius:50%;animation:spin 0.8s linear infinite"></div><span id="sb-loading-msg"></span>`;
    document.body.appendChild(el);
    const style = document.createElement('style');
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }
  document.getElementById('sb-loading-msg').textContent = msg || 'กำลังโหลด...';
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('sb-loading');
  if (el) el.style.display = 'none';
}

function showToast(msg, ok=true) {
  let el = document.getElementById('sb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sb-toast';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:10px;font-family:var(--sans);font-size:13px;font-weight:500;opacity:0;transition:opacity .3s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = ok ? '#52C97A' : '#ff5e5e';
  el.style.color = '#fff';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 2500);
}

// ─── SAVE TO SUPABASE ───
async function saveAll() {
  // always save to localStorage as backup
  localStorage.setItem('pf-profile', JSON.stringify(profile));
  localStorage.setItem('pf-projects', JSON.stringify(projects));
  localStorage.setItem('pf-tasks', JSON.stringify(tasks));
  if(avatar) localStorage.setItem('pf-avatar', avatar);

  // save to Supabase
  try {
    await sbUpsert('portfolio_data', {
      id: 1,
      profile_json: JSON.stringify(profile),
      projects_json: JSON.stringify(projects),
      tasks_json: JSON.stringify(tasks),
      avatar_data: avatar || null,
      updated_at: new Date().toISOString()
    });
  } catch(e) {
    console.warn('Supabase save failed:', e);
  }
}

// ─── LOAD FROM SUPABASE ───
async function loadFromSupabase() {
  showLoading('กำลังโหลดข้อมูล...');
  try {
    const row = await sbGet('portfolio_data');
    if (row) {
      profile  = JSON.parse(row.profile_json  || '{}');
      projects = JSON.parse(row.projects_json || '[]');
      tasks    = JSON.parse(row.tasks_json    || '[]');
      avatar   = row.avatar_data || '';
      // sync to localStorage
      localStorage.setItem('pf-profile',  row.profile_json  || '{}');
      localStorage.setItem('pf-projects', row.projects_json || '[]');
      localStorage.setItem('pf-tasks',    row.tasks_json    || '[]');
      if(avatar) localStorage.setItem('pf-avatar', avatar);
    } else {
      // no cloud data yet — try localStorage
      profile  = JSON.parse(localStorage.getItem('pf-profile')  || '{}');
      projects = JSON.parse(localStorage.getItem('pf-projects') || '[]');
      tasks    = JSON.parse(localStorage.getItem('pf-tasks')    || '[]');
      avatar   = localStorage.getItem('pf-avatar') || '';
      // only inject sample data when truly nothing exists anywhere
      if(!projects.length && !tasks.length) _injectSampleData();
    }
  } catch(e) {
    console.warn('Supabase load failed, using localStorage:', e);
    profile  = JSON.parse(localStorage.getItem('pf-profile')  || '{}');
    projects = JSON.parse(localStorage.getItem('pf-projects') || '[]');
    tasks    = JSON.parse(localStorage.getItem('pf-tasks')    || '[]');
    avatar   = localStorage.getItem('pf-avatar') || '';
    if(!projects.length && !tasks.length) _injectSampleData();
  }
  hideLoading();
}

function _injectSampleData(){
  const d=o=>{const x=new Date;x.setDate(x.getDate()+o);return x.toISOString().split('T')[0]};
  projects=[
    {id:uid(),name:'Smart Campus App',desc:'Mobile app ช่วยนักศึกษาตรวจสอบตาราง, ข่าว และห้องว่างภายในมหาวิทยาลัย',emoji:'🏫',color:'orange',tech:'React Native, Node.js, MongoDB',github:'#',demo:'#',status:'wip'},
    {id:uid(),name:'Algo Visualizer',desc:'Web app สำหรับ visualize sorting & graph algorithms แบบ step-by-step',emoji:'🔬',color:'teal',tech:'JavaScript, D3.js, HTML/CSS',github:'#',demo:'#',status:'completed'},
    {id:uid(),name:'Budget Tracker CLI',desc:'Command-line tool สำหรับบันทึกรายรับ-รายจ่าย พร้อม export CSV',emoji:'💰',color:'green',tech:'Python, SQLite',github:'#',demo:'',status:'completed'},
  ];
  tasks=[
    {id:uid(),name:'Data Structures HW#3',sub:'CS301',priority:'High',deadline:d(2),status:'In Progress',created:Date.now()-3000},
    {id:uid(),name:'OS Lab — Process Scheduling',sub:'CS402',priority:'High',deadline:d(3),status:'Todo',created:Date.now()-2000},
    {id:uid(),name:'Senior Project Report',sub:'Senior Project',priority:'Medium',deadline:d(10),status:'In Progress',created:Date.now()-1000},
    {id:uid(),name:'Network Lab Report',sub:'CS501',priority:'Low',deadline:d(14),status:'Todo',created:Date.now()-500},
  ];
  saveAll();
}

const sunSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
const moonBigSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
const sunBigSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

// ─── THEME ───
const html = document.documentElement;
let theme = localStorage.getItem('pf-theme')||'light';
html.setAttribute('data-theme', theme);
function toggleTheme(){
  theme = theme==='light'?'dark':'light';
  html.setAttribute('data-theme', theme);
  localStorage.setItem('pf-theme', theme);
  const icon = document.getElementById('theme-icon');
  const lbl  = document.getElementById('theme-lbl');
  const tb   = document.getElementById('topbar-theme-btn');
  if(theme==='dark'){
    icon.innerHTML=moonSVG; lbl.textContent='Dark mode';
    if(tb) tb.innerHTML=sunBigSVG;
  } else {
    icon.innerHTML=sunSVG; lbl.textContent='Light mode';
    if(tb) tb.innerHTML=moonBigSVG;
  }
}
// init icon
(()=>{
  const icon=document.getElementById('theme-icon');
  const lbl=document.getElementById('theme-lbl');
  const tb=document.getElementById('topbar-theme-btn');
  if(theme==='dark'){
    icon.innerHTML=moonSVG; lbl.textContent='Dark mode';
    if(tb) tb.innerHTML=sunBigSVG;
  } else {
    icon.innerHTML=sunSVG; lbl.textContent='Light mode';
  }
})();

// ─── NAVIGATION ───
function goto(sec, el){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  document.getElementById('sec-'+sec).classList.add('active');
  if(el) el.classList.add('active');
  const titles={profile:'Profile',projects:'Projects',tasks:'My Tasks',about:'About Me'};
  document.getElementById('topbar-title').textContent=titles[sec]||sec;
  closeSidebar();
  if(sec==='tasks') renderTasks();
}

// ─── SIDEBAR MOBILE ───
function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const ham=document.getElementById('ham');
  const ov=document.getElementById('mob-overlay');
  sb.classList.toggle('open'); ham.classList.toggle('open'); ov.classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('ham').classList.remove('open');
  document.getElementById('mob-overlay').classList.remove('open');
}

// ─── AVATAR ───
function handleAvatar(input){
  const f=input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{ avatar=e.target.result; applyAvatar(); saveAll(); };
  r.readAsDataURL(f);
}
function initials(name){ return (name||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?'; }
function applyAvatar(){
  const ph1=document.getElementById('av-ph');
  const img1=document.getElementById('av-img-sb');
  const ph2=document.getElementById('hero-av-ph');
  const img2=document.getElementById('av-img-hero');
  const ini=initials(profile.name||'?');
  if(avatar){
    img1.src=avatar; img1.style.display='block'; ph1.style.display='none';
    img2.src=avatar; img2.style.display='block'; ph2.style.display='none';
  } else {
    ph1.textContent=ini; ph1.style.display='block'; img1.style.display='none';
    ph2.textContent=ini; ph2.style.display='block'; img2.style.display='none';
  }
}

// ─── PROFILE ───
function openEditProfile(){
  const p=profile;
  document.getElementById('pf-name').value=p.name||'';
  document.getElementById('pf-year').value=p.year||'3';
  document.getElementById('pf-status').value=p.status||'open to work';
  document.getElementById('pf-school').value=p.school||'';
  document.getElementById('pf-faculty').value=p.faculty||'';
  document.getElementById('pf-bio').value=p.bio||'';
  document.getElementById('pf-skills').value=p.skills||'Python, JavaScript, React, Docker';
  document.getElementById('pf-github').value=p.github||'';
  document.getElementById('pf-linkedin').value=p.linkedin||'';
  document.getElementById('pf-ig').value=p.ig||'';
  document.getElementById('pf-fb').value=p.fb||'';
  document.getElementById('pf-line').value=p.line||'';
  document.getElementById('pf-email').value=p.email||'';
  document.getElementById('prof-ov').classList.add('open');
}
function closeEditProfile(){ document.getElementById('prof-ov').classList.remove('open'); }
function closeProfIfOut(e){ if(e.target===document.getElementById('prof-ov')) closeEditProfile(); }

function saveProfile(){
  profile={
    name:   document.getElementById('pf-name').value.trim(),
    year:   document.getElementById('pf-year').value,
    status: document.getElementById('pf-status').value,
    school: document.getElementById('pf-school').value.trim(),
    faculty:document.getElementById('pf-faculty').value.trim(),
    bio:    document.getElementById('pf-bio').value.trim(),
    skills: document.getElementById('pf-skills').value.trim(),
    github: document.getElementById('pf-github').value.trim(),
    linkedin:document.getElementById('pf-linkedin').value.trim(),
    ig:     document.getElementById('pf-ig').value.trim(),
    fb:     document.getElementById('pf-fb').value.trim(),
    line:   document.getElementById('pf-line').value.trim(),
    email:  document.getElementById('pf-email').value.trim(),
  };
  saveAll().then(()=>showToast('✓ บันทึกแล้ว — ทุกคนจะเห็นข้อมูลใหม่')); applyProfile(); closeEditProfile();
}

function applyProfile(){
  const p=profile;
  const name=p.name||'Your Name';
  document.getElementById('sb-name').textContent=name;
  document.getElementById('sb-role').textContent=`CE Year ${p.year||'3'} · ${p.school||'University'}`;
  document.getElementById('sb-badge').textContent=p.status||'open to work';
  document.getElementById('hero-name').textContent=name;
  document.getElementById('hero-role').innerHTML=`Computer Engineering · <strong>Year ${p.year||'3'}</strong>`;
  if(p.bio) document.getElementById('hero-bio').textContent=p.bio;
  if(p.skills){
    const tags=p.skills.split(',').map(s=>s.trim()).filter(Boolean);
    document.getElementById('hero-chips').innerHTML=tags.map((t,i)=>`<span class="chip${i<2?' hl':''}">${esc(t)}</span>`).join('');
    document.getElementById('ab-skills').innerHTML=tags.map(t=>`<span class="sk-chip">${esc(t)}</span>`).join('');
  }
  // about
  if(p.school)  document.getElementById('ab-school').textContent=p.school;
  if(p.faculty) document.getElementById('ab-faculty').textContent=p.faculty;
  document.getElementById('ab-year').textContent=`ปี ${p.year||'3'} · ${p.school||'University'}`;
  // links
  if(p.github){
    ['link-gh','hs-gh'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=p.github;});
    if(document.getElementById('c-github')) document.getElementById('c-github').href=p.github;
    if(document.getElementById('c-github-text')) document.getElementById('c-github-text').textContent=p.github.replace('https://github.com/','@');
  }
  if(p.linkedin){
    ['link-li','hs-li'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=p.linkedin;});
    if(document.getElementById('c-linkedin')) document.getElementById('c-linkedin').href=p.linkedin;
    if(document.getElementById('c-linkedin-text')) document.getElementById('c-linkedin-text').textContent='LinkedIn';
  }
  if(p.ig){
    ['link-ig','hs-ig'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=p.ig;});
  }
  if(p.fb){
    ['link-fb','hs-fb'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=p.fb;});
  }
  if(p.line){
    const lineUrl='https://line.me/ti/p/'+encodeURIComponent(p.line);
    ['link-line','hs-line'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=lineUrl;});
  }
  if(p.email){
    ['link-mail','hs-mail'].forEach(id=>{const el=document.getElementById(id);if(el)el.href='mailto:'+p.email;});
    if(document.getElementById('c-email')) document.getElementById('c-email').href='mailto:'+p.email;
    if(document.getElementById('c-email-text')) document.getElementById('c-email-text').textContent=p.email;
  }
  // stats
  document.getElementById('pst-year').textContent=p.year||'3';
  document.getElementById('pst-proj').textContent=projects.length;
  document.getElementById('pst-done').textContent=tasks.filter(t=>t.status==='Done').length;
  applyAvatar();
}

// ─── PROJECTS ───
const colors = {
  orange:'linear-gradient(135deg,#FF6B35,#FFB347)',
  teal:  'linear-gradient(135deg,#2EC4B6,#80FFDB)',
  blue:  'linear-gradient(135deg,#4FACFE,#00F2FE)',
  pink:  'linear-gradient(135deg,#F77FBE,#F9A8D4)',
  green: 'linear-gradient(135deg,#52C97A,#A3E635)',
};
const projIcons = {
  orange: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  teal:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,
  blue:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  pink:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  green:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};
const statusBadge = {
  completed: {bg:'rgba(82,201,122,.12)',c:'#52C97A',t:'Completed'},
  wip:       {bg:'rgba(255,179,71,.12)',c:'#FFB347',t:'In Progress'},
  concept:   {bg:'rgba(79,172,254,.12)',c:'#4FACFE',t:'Concept'},
};
const statusDot = {
  completed: '#52C97A',
  wip:       '#FFB347',
  concept:   '#4FACFE',
};

function renderProjects(){
  const grid=document.getElementById('proj-grid');
  let html='';
  projects.forEach(p=>{
    const sb=statusBadge[p.status]||statusBadge.completed;
    const icon=projIcons[p.color]||projIcons.orange;
    const techs=(p.tech||'').split(',').map(t=>t.trim()).filter(Boolean);
    html+=`
    <div class="proj-card">
      <div class="proj-thumb" style="background:${colors[p.color]||colors.orange}">
        <div class="proj-thumb-grid"></div>
        <div class="proj-icon-wrap">${icon}</div>
      </div>
      <div class="proj-body">
        <div class="proj-tags">
          <span style="background:${sb.bg};color:${sb.c};display:inline-flex;align-items:center;gap:4px" class="proj-tag">
            <span style="width:5px;height:5px;border-radius:50%;background:${sb.c};display:inline-block;flex-shrink:0"></span>
            ${sb.t}
          </span>
          ${techs.slice(0,3).map(t=>`<span class="proj-tag" style="background:var(--bg3);color:var(--text2)">${esc(t)}</span>`).join('')}
        </div>
        <div class="proj-title">${esc(p.name)}</div>
        <div class="proj-desc">${esc(p.desc||'—')}</div>
        <div class="proj-footer">
          <div class="proj-links">
            ${p.github?`<a class="proj-link" href="${esc(p.github)}" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.57v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013.01-.4c1.02 0 2.05.14 3.01.4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.68.82.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Code
            </a>`:''}
            ${p.demo?`<a class="proj-link" href="${esc(p.demo)}" target="_blank">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Demo
            </a>`:''}
          </div>
          <div style="display:flex;gap:4px">
            <button class="task-act" onclick="editProject('${p.id}')" style="color:var(--text2)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="task-act" onclick="delProject('${p.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  });
  html+=`<button class="add-proj-btn" onclick="openProjModal()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Add Project</span>
  </button>`;
  grid.innerHTML=html;
  document.getElementById('nav-proj-count').textContent=projects.length;
  document.getElementById('pst-proj').textContent=projects.length;
}

function openProjModal(id){
  document.getElementById('proj-eid').value='';
  document.getElementById('pj-name').value='';
  document.getElementById('pj-desc').value='';
  document.getElementById('pj-emoji').value='🚀';
  document.getElementById('pj-color').value='orange';
  document.getElementById('pj-tech').value='';
  document.getElementById('pj-github').value='';
  document.getElementById('pj-demo').value='';
  document.getElementById('pj-status').value='completed';
  document.getElementById('proj-m-title').textContent='Add Project';
  if(id){
    const p=projects.find(x=>x.id===id); if(!p) return;
    document.getElementById('proj-eid').value=id;
    document.getElementById('pj-name').value=p.name;
    document.getElementById('pj-desc').value=p.desc||'';
    document.getElementById('pj-emoji').value=p.emoji||'🚀';
    document.getElementById('pj-color').value=p.color||'orange';
    document.getElementById('pj-tech').value=p.tech||'';
    document.getElementById('pj-github').value=p.github||'';
    document.getElementById('pj-demo').value=p.demo||'';
    document.getElementById('pj-status').value=p.status||'completed';
    document.getElementById('proj-m-title').textContent='Edit Project';
  }
  document.getElementById('proj-ov').classList.add('open');
  setTimeout(()=>document.getElementById('pj-name').focus(),80);
}
function editProject(id){ openProjModal(id); }
function closeProjModal(){ document.getElementById('proj-ov').classList.remove('open'); }
function closeProjIfOut(e){ if(e.target===document.getElementById('proj-ov')) closeProjModal(); }
function delProject(id){
  if(!confirm('ลบโปรเจกต์นี้?')) return;
  projects=projects.filter(x=>x.id!==id); saveAll(); renderProjects();
}
function saveProject(){
  const name=document.getElementById('pj-name').value.trim();
  if(!name){ document.getElementById('pj-name').focus(); return; }
  const id=document.getElementById('proj-eid').value;
  const p={
    id:id||uid(), name,
    desc:   document.getElementById('pj-desc').value.trim(),
    emoji:  document.getElementById('pj-emoji').value.trim()||'🚀',
    color:  document.getElementById('pj-color').value,
    tech:   document.getElementById('pj-tech').value.trim(),
    github: document.getElementById('pj-github').value.trim(),
    demo:   document.getElementById('pj-demo').value.trim(),
    status: document.getElementById('pj-status').value,
  };
  if(id){ const i=projects.findIndex(x=>x.id===id); if(i>-1) projects[i]=p; }
  else projects.unshift(p);
  saveAll().then(()=>showToast('✓ บันทึก Project แล้ว')); closeProjModal(); renderProjects();
}

// ─── TASKS ───
const prioOrd={High:0,Medium:1,Low:2};
function dlInfo(dl){
  if(!dl) return {text:'',cls:''};
  const now=new Date(); now.setHours(0,0,0,0);
  const d=new Date(dl), diff=Math.ceil((d-now)/86400000);
  const fmt=d.toLocaleDateString('th-TH',{day:'2-digit',month:'short'});
  if(diff<0)  return {text:fmt+' (เลยกำหนด)',cls:'urg'};
  if(diff===0) return {text:'วันนี้!',cls:'urg'};
  if(diff<=3) return {text:`${fmt} (${diff} วัน)`,cls:'soon'};
  return {text:fmt,cls:''};
}
function setTaskFilter(btn){
  document.querySelectorAll('.t-pill').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on'); taskFilter=btn.dataset.s; renderTasks();
}
function renderTasks(){
  let list=tasks.filter(t=>taskFilter==='all'||t.status===taskFilter);
  list.sort((a,b)=>prioOrd[a.priority]-prioOrd[b.priority]);
  const cont=document.getElementById('task-list');
  if(!list.length){
    cont.innerHTML=`<div style="text-align:center;padding:48px 20px;color:var(--text3)">ยังไม่มีงาน 🎉<br><span style="font-size:12px">กด "+ Add Task" เพื่อเพิ่มงาน</span></div>`;
    return;
  }
  cont.innerHTML=list.map(t=>{
    const dl=dlInfo(t.deadline); const done=t.status==='Done';
    return `<div class="task-item${done?' done':''}">
      <div class="task-check${done?' checked':''}" onclick="toggleTask('${t.id}')">${done?'✓':''}</div>
      <div class="task-info">
        <div class="task-name" style="${done?'text-decoration:line-through':''}">${esc(t.name)}</div>
        <div class="task-meta">${esc(t.sub||'')}${dl.text?` · <span class="task-dl ${dl.cls}">${dl.text}</span>`:''}</div>
      </div>
      <div class="task-right">
        <span class="task-prio prio-${t.priority}">${t.priority}</span>
        <button class="task-act" onclick="openTaskModal('${t.id}')" style="color:var(--text2)">✎</button>
        <button class="task-act" onclick="delTask('${t.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('nav-task-count').textContent=tasks.filter(t=>t.status!=='Done').length;
  document.getElementById('pst-done').textContent=tasks.filter(t=>t.status==='Done').length;
}
function toggleTask(id){
  const t=tasks.find(x=>x.id===id); if(!t) return;
  t.status=t.status==='Done'?'Todo':'Done';
  saveAll(); renderTasks();
}
function delTask(id){ if(!confirm('ลบงานนี้?')) return; tasks=tasks.filter(x=>x.id!==id); saveAll(); renderTasks(); }

function openTaskModal(id){
  document.getElementById('task-eid').value='';
  document.getElementById('tk-name').value='';
  document.getElementById('tk-sub').value='';
  document.getElementById('tk-prio').value='Medium';
  document.getElementById('tk-dl').value='';
  document.getElementById('tk-stat').value='Todo';
  document.getElementById('task-m-title').textContent='Add Task';
  if(id){
    const t=tasks.find(x=>x.id===id); if(!t) return;
    document.getElementById('task-eid').value=id;
    document.getElementById('tk-name').value=t.name;
    document.getElementById('tk-sub').value=t.sub||'';
    document.getElementById('tk-prio').value=t.priority;
    document.getElementById('tk-dl').value=t.deadline||'';
    document.getElementById('tk-stat').value=t.status;
    document.getElementById('task-m-title').textContent='Edit Task';
  }
  document.getElementById('task-ov').classList.add('open');
  setTimeout(()=>document.getElementById('tk-name').focus(),80);
}
function closeTaskModal(){ document.getElementById('task-ov').classList.remove('open'); }
function closeTaskIfOut(e){ if(e.target===document.getElementById('task-ov')) closeTaskModal(); }
function saveTask(){
  const name=document.getElementById('tk-name').value.trim();
  if(!name){ document.getElementById('tk-name').focus(); return; }
  const id=document.getElementById('task-eid').value;
  const t={
    id:id||uid(), name,
    sub:      document.getElementById('tk-sub').value.trim(),
    priority: document.getElementById('tk-prio').value,
    deadline: document.getElementById('tk-dl').value,
    status:   document.getElementById('tk-stat').value,
    created: Date.now(),
  };
  if(id){ const i=tasks.findIndex(x=>x.id===id); if(i>-1) tasks[i]=t; }
  else tasks.unshift(t);
  saveAll().then(()=>showToast('✓ บันทึก Task แล้ว')); closeTaskModal(); renderTasks();
}

// ─── KEYBOARD ───
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeEditProfile(); closeProjModal(); closeTaskModal(); }
});

// ─── INIT ───
loadFromSupabase().then(() => {
  applyProfile();
  renderProjects();
  renderTasks();
});
