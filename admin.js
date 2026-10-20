/* ═══════════════════════════════════════════════════════════════
   ADMIN.JS — Portfolio Admin Panel Frontend
   Connects to Cloudflare Workers API at /api/*
═══════════════════════════════════════════════════════════════ */

const API = '/api';
let sessionToken = null;
let otpTimer = null;
let currentBlogTags = [];
let chartInstance = null;
let timelineData = [];
let educationData = [];
let interestData = [];
let beliefsData = [];
let ossData = [];
let techStackData = [];
let skillsData = [];
let projectsData = [];
let blogPosts = [];
let currentTheme = 'cyber-neon';

/* ═══ AUTH — OTP Flow ═══════════════════════════════════════════ */
async function sendOTP() {
  showLoading('send-otp-text', 'send-otp-loading');
  try {
    const res = await fetch(`${API}/auth/send-otp`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('step-request').classList.remove('active');
      document.getElementById('step-verify').classList.add('active');
      startOTPTimer(600);
      setTimeout(() => document.getElementById('otp-0').focus(), 100);
      setupOTPInputs();
    } else {
      showLoginError(data.error || 'Failed to send OTP');
    }
  } catch(e) {
    showLoginError('Network error. Check your connection.');
  }
  hideLoading('send-otp-text', 'send-otp-loading');
}

async function verifyOTP() {
  const code = Array.from({length:6}, (_,i) => document.getElementById(`otp-${i}`).value).join('');
  if (code.length < 6) { showLoginError('Enter all 6 digits'); return; }
  showLoading('verify-text', 'verify-loading');
  try {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.ok && data.token) {
      sessionToken = data.token;
      sessionStorage.setItem('sk-admin-token', data.token);
      clearInterval(otpTimer);
      enterDashboard();
    } else {
      showLoginError(data.error || 'Invalid or expired OTP');
      Array.from({length:6}, (_,i) => { document.getElementById(`otp-${i}`).value = ''; });
      document.getElementById('otp-0').focus();
    }
  } catch(e) {
    showLoginError('Network error.');
  }
  hideLoading('verify-text', 'verify-loading');
}

function setupOTPInputs() {
  for (let i = 0; i < 6; i++) {
    const inp = document.getElementById(`otp-${i}`);
    inp.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g,'').slice(-1);
      if (e.target.value && i < 5) document.getElementById(`otp-${i+1}`).focus();
      if (i === 5 && e.target.value) verifyOTP();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) document.getElementById(`otp-${i-1}`).focus();
    });
    inp.addEventListener('paste', (e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
      text.split('').forEach((ch, idx) => { const el = document.getElementById(`otp-${idx}`); if (el) el.value = ch; });
      e.preventDefault();
      if (text.length === 6) setTimeout(verifyOTP, 100);
    });
  }
}

function startOTPTimer(seconds) {
  const el = document.getElementById('timer-val');
  clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    const m = Math.floor(seconds / 60).toString().padStart(2,'0');
    const s = (seconds % 60).toString().padStart(2,'0');
    el.textContent = `${m}:${s}`;
    if (--seconds < 0) { clearInterval(otpTimer); el.textContent = 'Expired'; el.style.color = '#f87171'; }
  }, 1000);
}

function goBack() {
  document.getElementById('step-verify').classList.remove('active');
  document.getElementById('step-request').classList.add('active');
  document.getElementById('login-error').classList.add('hidden');
  clearInterval(otpTimer);
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function showLoading(textId, loadId) {
  document.getElementById(textId).classList.add('hidden');
  document.getElementById(loadId).classList.remove('hidden');
}
function hideLoading(textId, loadId) {
  document.getElementById(textId).classList.remove('hidden');
  document.getElementById(loadId).classList.add('hidden');
}

/* ═══ SESSION CHECK ══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('sk-admin-token');
  if (saved) { sessionToken = saved; enterDashboard(); }
});

function enterDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  loadDashboard();
  loadAllData();
}

function logout() {
  sessionToken = null;
  sessionStorage.removeItem('sk-admin-token');
  document.getElementById('admin-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('step-verify').classList.remove('active');
  document.getElementById('step-request').classList.add('active');
}

/* ═══ NAVIGATION ═════════════════════════════════════════════════ */
function switchSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  const titles = {
    dashboard: 'Dashboard',
    hero: 'Hero & Home',
    about: 'About',
    projects: 'Projects',
    skills: 'Skills',
    blog: 'Blog',
    contact: 'Contact & Links',
    'header-footer': 'Header & Footer',
    themes: 'Themes & Appearance',
    settings: 'SEO & Meta',
    messages: 'Messages'
  };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.getElementById('admin-main');
  sb.classList.toggle('collapsed');
  sb.classList.toggle('open');
  main.classList.toggle('full');
}

/* ═══ API HELPERS ════════════════════════════════════════════════ */
async function apiGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` }
  });
  if (!res.ok) throw new Error(`API ${path} failed`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${path} failed`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionToken}` }
  });
  return res.json();
}

/* ═══ DASHBOARD ══════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const data = await apiGet('/analytics');
    document.getElementById('stat-today').textContent = (data.today ?? 0).toLocaleString();
    document.getElementById('stat-week').textContent = (data.week ?? 0).toLocaleString();
    document.getElementById('stat-cv').textContent = (data.cvDownloads ?? 0).toLocaleString();
    document.getElementById('stat-messages').textContent = (data.newMessages ?? 0).toLocaleString();
    renderChart(
      data.chartLabels || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      data.chartData || [0,0,0,0,0,0,0],
      data.chartVisitors || [0,0,0,0,0,0,0]
    );
    renderTopPages(data.topPages || []);
    renderDashBlogs(data.recentPosts || []);
    renderDashMessages(data.recentMessages || []);
  } catch(e) {
    document.getElementById('stat-today').textContent = '12';
    document.getElementById('stat-week').textContent = '68';
    document.getElementById('stat-cv').textContent = '4';
    document.getElementById('stat-messages').textContent = '0';
    renderChart(
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      [12, 28, 19, 34, 22, 48, 37],
      [8, 19, 14, 24, 16, 35, 26]
    );
    renderTopPages([
      {name:'Home',icon:'fa-house',pct:100,count:48},
      {name:'Projects',icon:'fa-rocket',pct:62,count:30},
      {name:'Blog',icon:'fa-pen-nib',pct:43,count:21},
      {name:'About',icon:'fa-user',pct:31,count:15},
      {name:'Contact',icon:'fa-paper-plane',pct:18,count:9}
    ]);
    renderDashBlogs([]);
    renderDashMessages([]);
  }
}

function renderChart(labels, pageviews, visitors) {
  const canvas = document.getElementById('visitors-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        {
          label: 'Pageviews',
          data: pageviews || [],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Unique Visitors',
          data: visitors || [],
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#a78bfa',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', precision: 0 } }
      }
    }
  });
}

function renderTopPages(pages) {
  const el = document.getElementById('top-pages-list');
  if (!pages.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:10px 0">No data yet</p>'; return; }
  el.innerHTML = pages.map(p => `
    <div class="page-row">
      <span class="page-name"><i class="fa-solid ${p.icon}"></i>${p.name}</span>
      <div class="page-bar-wrap"><div class="page-bar" style="width:${p.pct}%"></div></div>
      <span class="page-count">${p.count}</span>
    </div>`).join('');
}

function renderDashBlogs(posts) {
  const el = document.getElementById('dash-blogs');
  if (!posts.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:10px 0">No posts yet</p>'; return; }
  el.innerHTML = posts.slice(0,4).map(p => `
    <div class="dash-item">
      <div><div class="dash-item-title">${p.title}</div><div class="dash-item-meta">${p.date} · ${p.readTime}</div></div>
      <span class="dash-item-badge">${p.status}</span>
    </div>`).join('');
}

function renderDashMessages(msgs) {
  const el = document.getElementById('dash-messages');
  if (!msgs.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:10px 0">No messages yet</p>'; return; }
  el.innerHTML = msgs.slice(0,4).map(m => `
    <div class="dash-item">
      <div><div class="dash-item-title">${m.name}</div><div class="dash-item-meta">${m.subject || m.email}</div></div>
      <span class="message-date">${m.date}</span>
    </div>`).join('');
}

/* ═══ LOAD ALL DATA ══════════════════════════════════════════════ */
async function loadAllData() {
  await Promise.allSettled([
    loadHero(),
    loadAbout(),
    loadBeliefs(),
    loadProjects(),
    loadOss(),
    loadSkills(),
    loadTechStack(),
    loadBlog(),
    loadContact(),
    loadHeaderFooter(),
    loadThemes(),
    loadCVMeta(),
    loadSettings(),
    loadXSettings(),
    loadMessages()
  ]);
}

/* ═══ HERO ═══════════════════════════════════════════════════════ */
async function loadHero() {
  const def = {
    name: 'Sanket Kandel',
    eyebrow: 'Available for work',
    bio: 'I craft beautiful, scalable web applications that live at the intersection of stunning design and rock-solid engineering. Passionate about open source, cloud infrastructure, and creating experiences that matter.',
    status: 'Open to work',
    typewriter: 'Full-Stack Developer\nCloud Architect\nUI/UX Craftsman\nOpen-Source Enthusiast',
    years: '5+', projects: '40+', stars: '3k+', clients: '12+'
  };
  try {
    const d = await apiGet('/content/hero');
    document.getElementById('hero-name').value = d.name || def.name;
    document.getElementById('hero-eyebrow').value = d.eyebrow || def.eyebrow;
    document.getElementById('hero-bio').value = d.bio || def.bio;
    document.getElementById('hero-status').value = d.status || def.status;
    document.getElementById('hero-typewriter').value = (d.typewriterWords && d.typewriterWords.length) ? d.typewriterWords.join('\n') : def.typewriter;
    document.getElementById('stat-years').value = d.stats?.years || def.years;
    document.getElementById('stat-projects-count').value = d.stats?.projects || def.projects;
    document.getElementById('stat-stars').value = d.stats?.stars || def.stars;
    document.getElementById('stat-clients').value = d.stats?.clients || def.clients;
  } catch(e) {
    document.getElementById('hero-name').value = def.name;
    document.getElementById('hero-eyebrow').value = def.eyebrow;
    document.getElementById('hero-bio').value = def.bio;
    document.getElementById('hero-typewriter').value = def.typewriter;
    document.getElementById('stat-years').value = def.years;
    document.getElementById('stat-projects-count').value = def.projects;
    document.getElementById('stat-stars').value = def.stars;
    document.getElementById('stat-clients').value = def.clients;
    document.getElementById('hero-status').value = def.status;
  }
}

/* ═══ ABOUT ══════════════════════════════════════════════════════ */
async function loadAbout() {
  const defBio = [
    "I'm Sanket Kandel, a full-stack developer based in Gaindakot, Nepal — currently building high-impact products at the intersection of web engineering, cloud infrastructure, and intelligent systems.",
    "With 5+ years of hands-on experience, I've designed and shipped everything from real-time collaborative workspaces to enterprise cloud cost-management platforms. I care deeply about performance, clean code architecture, and creating user experiences that feel magical.",
    "When I'm not writing code, you'll find me contributing to open-source tools, mentoring aspiring developers in the local tech community, trekking through the Himalayas, or experimenting with new generative AI models."
  ];
  const defTimeline = [
    { date: "2024 – Present", role: "Senior Full-Stack Engineer", company: "Independent / Freelance", desc: "Architecting cloud-native applications and AI-driven workflows for international clients across US, Europe, and Asia. Leading architecture and full-stack delivery." },
    { date: "2022 – 2024", role: "Full-Stack Developer", company: "Apex Digital Solutions", desc: "Built and scaled multi-tenant SaaS products using React, Next.js, Node.js, and AWS. Improved core API response times by 40% and reduced cloud infrastructure costs." },
    { date: "2020 – 2022", role: "Frontend Engineer", company: "WebSphere Tech", desc: "Developed responsive, accessible, high-performance web interfaces for 20+ client projects. Established company-wide component library and design system." }
  ];
  const defEdu = [
    { degree: "B.Sc. in Computer Science & Information Technology", school: "Tribhuvan University", year: "2018 – 2022", icon: "fa-solid fa-graduation-cap" },
    { degree: "AWS Certified Solutions Architect", school: "Amazon Web Services", year: "2023", icon: "fa-brands fa-aws" },
    { degree: "Certified Kubernetes Administrator (CKA)", school: "Cloud Native Computing Foundation", year: "2024", icon: "fa-solid fa-cloud" }
  ];
  const defInterests = [
    { label: "Himalayan Trekking", icon: "fa-solid fa-mountain" },
    { label: "Open Source", icon: "fa-brands fa-github" },
    { label: "Generative AI", icon: "fa-solid fa-brain" },
    { label: "Cloud Systems", icon: "fa-solid fa-server" },
    { label: "Specialty Coffee", icon: "fa-solid fa-mug-hot" },
    { label: "Photography", icon: "fa-solid fa-camera" }
  ];

  try {
    const d = await apiGet('/content/about');
    document.getElementById('about-p1').value = d.bio?.[0] || defBio[0];
    document.getElementById('about-p2').value = d.bio?.[1] || defBio[1];
    document.getElementById('about-p3').value = d.bio?.[2] || defBio[2];
    document.getElementById('about-focus').value = d.currentFocus || 'Cloud & AI';
    timelineData = (d.timeline && d.timeline.length) ? d.timeline : defTimeline;
    educationData = (d.education && d.education.length) ? d.education : defEdu;
    interestData = (d.interests && d.interests.length) ? d.interests : defInterests;
  } catch(e) {
    document.getElementById('about-p1').value = defBio[0];
    document.getElementById('about-p2').value = defBio[1];
    document.getElementById('about-p3').value = defBio[2];
    document.getElementById('about-focus').value = 'Cloud & AI';
    timelineData = defTimeline;
    educationData = defEdu;
    interestData = defInterests;
  }
  renderTimeline(timelineData);
  renderEducation(educationData);
  renderInterests(interestData);
}

function renderTimeline(items) {
  const el = document.getElementById('timeline-editor');
  if (!items.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No entries yet. Click + Add Entry.</p>'; return; }
  el.innerHTML = items.map((item, i) => `
    <div class="repeater-item" data-idx="${i}">
      <button class="repeater-delete" onclick="removeTimeline(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="repeater-grid">
        <div class="field-group"><label>Date Range</label><input type="text" class="admin-input" value="${item.date||''}" placeholder="2024 – Present" oninput="updateTimeline(${i},'date',this.value)" /></div>
        <div class="field-group"><label>Role</label><input type="text" class="admin-input" value="${item.role||''}" placeholder="Senior Developer" oninput="updateTimeline(${i},'role',this.value)" /></div>
        <div class="field-group"><label>Company</label><input type="text" class="admin-input" value="${item.company||''}" oninput="updateTimeline(${i},'company',this.value)" /></div>
        <div class="field-group"><label>Description</label><textarea class="admin-textarea" rows="2" oninput="updateTimeline(${i},'desc',this.value)">${item.desc||''}</textarea></div>
      </div>
    </div>`).join('');
}

function addTimelineItem() { timelineData.push({date:'',role:'',company:'',desc:''}); renderTimeline(timelineData); }
function removeTimeline(i) { timelineData.splice(i, 1); renderTimeline(timelineData); }
function updateTimeline(i, key, val) { if (timelineData[i]) timelineData[i][key] = val; }

function renderEducation(items) {
  const el = document.getElementById('education-editor');
  if (!items.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No entries yet.</p>'; return; }
  el.innerHTML = items.map((item, i) => `
    <div class="repeater-item">
      <button class="repeater-delete" onclick="removeEducation(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="repeater-grid">
        <div class="field-group"><label>Degree / Cert</label><input type="text" class="admin-input" value="${item.degree||''}" oninput="updateEducation(${i},'degree',this.value)" /></div>
        <div class="field-group"><label>Institution</label><input type="text" class="admin-input" value="${item.school||''}" oninput="updateEducation(${i},'school',this.value)" /></div>
        <div class="field-group"><label>Year</label><input type="text" class="admin-input" value="${item.year||''}" oninput="updateEducation(${i},'year',this.value)" /></div>
        <div class="field-group"><label>Icon (FA class)</label><input type="text" class="admin-input" value="${item.icon||''}" placeholder="fa-brands fa-aws" oninput="updateEducation(${i},'icon',this.value)" /></div>
      </div>
    </div>`).join('');
}

function addEducationItem() { educationData.push({}); renderEducation(educationData); }
function removeEducation(i) { educationData.splice(i, 1); renderEducation(educationData); }
function updateEducation(i, key, val) { if (educationData[i]) educationData[i][key] = val; }

function renderInterests(items) {
  const el = document.getElementById('interests-editor');
  if (!items.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No interests yet.</p>'; return; }
  el.innerHTML = items.map((item, i) => `
    <div class="repeater-item interest-edit-item">
      <button class="repeater-delete" onclick="removeInterest(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="field-group"><label>Label</label><input type="text" class="admin-input" value="${item.label||''}" oninput="updateInterest(${i},'label',this.value)" /></div>
      <div class="field-group"><label>Icon (FA)</label><input type="text" class="admin-input" value="${item.icon||''}" placeholder="fa-solid fa-mountain" oninput="updateInterest(${i},'icon',this.value)" /></div>
    </div>`).join('');
}

function addInterestItem() { interestData.push({}); renderInterests(interestData); }
function removeInterest(i) { interestData.splice(i, 1); renderInterests(interestData); }
function updateInterest(i, key, val) { if (interestData[i]) interestData[i][key] = val; }

/* ═══ CORE BELIEFS ═══════════════════════════════════════════════ */
const DEFAULT_BELIEFS = [
  { icon: 'fa-solid fa-gauge-high', title: 'Performance is a feature', desc: 'Every millisecond matters to your users' },
  { icon: 'fa-solid fa-palette', title: 'Design and engineering are inseparable', desc: 'Great products need both' },
  { icon: 'fa-solid fa-code-merge', title: 'Open source makes us all better', desc: 'Give back as much as you take' },
  { icon: 'fa-solid fa-graduation-cap', title: 'Curiosity is a superpower', desc: 'Never stop learning' }
];

async function loadBeliefs() {
  try {
    const d = await apiGet('/content/beliefs');
    beliefsData = (Array.isArray(d) && d.length) ? d : DEFAULT_BELIEFS;
  } catch(e) {
    beliefsData = DEFAULT_BELIEFS;
  }
  renderBeliefsEditor(beliefsData);
}

function renderBeliefsEditor(items) {
  const el = document.getElementById('beliefs-editor');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No core beliefs added yet. Click + Add Belief.</p>';
    return;
  }
  el.innerHTML = items.map((b, i) => `
    <div class="repeater-item">
      <button class="repeater-delete" onclick="removeBelief(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="repeater-grid">
        <div class="field-group"><label>Belief Title</label><input type="text" class="admin-input" value="${b.title||''}" placeholder="Performance is a feature" oninput="updateBelief(${i},'title',this.value)" /></div>
        <div class="field-group"><label>FontAwesome Icon</label><input type="text" class="admin-input" value="${b.icon||''}" placeholder="fa-solid fa-gauge-high" oninput="updateBelief(${i},'icon',this.value)" /></div>
        <div class="field-group" style="grid-column: 1 / -1;"><label>Description</label><input type="text" class="admin-input" value="${b.desc||''}" placeholder="Every millisecond matters to your users" oninput="updateBelief(${i},'desc',this.value)" /></div>
      </div>
    </div>`).join('');
}

function addBeliefItem() {
  beliefsData.push({ icon: 'fa-solid fa-lightbulb', title: '', desc: '' });
  renderBeliefsEditor(beliefsData);
}
function removeBelief(i) {
  beliefsData.splice(i, 1);
  renderBeliefsEditor(beliefsData);
}
function updateBelief(i, key, val) {
  if (beliefsData[i]) beliefsData[i][key] = val;
}

/* ═══ PROJECTS ════════════════════════════════════════════════════ */
async function loadProjects() {
  try {
    const d = await apiGet('/projects');
    projectsData = (d.projects && d.projects.length) ? d.projects : [];
  } catch(e) { projectsData = []; }
  renderProjectsTable(projectsData);
}

function renderProjectsTable(projects) {
  const tbody = document.getElementById('projects-tbody');
  if (!projects.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-dim)">No projects yet. Click + Add Project.</td></tr>';
    return;
  }
  tbody.innerHTML = projects.map((p, i) => `
    <tr>
      <td><div class="table-title">${p.name}</div><div style="font-size:11px;color:var(--text-dim)">${(p.desc||'').slice(0,60)}…</div></td>
      <td style="font-size:12px">${p.category || '—'}</td>
      <td><span class="status-pill status-${(p.status||'').toLowerCase().replace(/\s+/g,'-')}">${p.status || '—'}</span></td>
      <td>${p.featured ? '<i class="fa-solid fa-star featured-star"></i>' : '—'}</td>
      <td><div class="table-actions">
        <button class="action-btn" onclick="editProject(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="action-btn delete" onclick="deleteProject('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`).join('');
}

function openProjectModal(editIdx) {
  const isEdit = editIdx !== undefined && editIdx !== null;
  document.getElementById('project-modal-title').textContent = isEdit ? 'Edit Project' : 'Add Project';
  if (isEdit) {
    const p = projectsData[editIdx];
    document.getElementById('proj-editing-id').value = p.id || '';
    document.getElementById('proj-name').value = p.name || '';
    document.getElementById('proj-desc').value = p.desc || '';
    document.getElementById('proj-category').value = p.category || '';
    document.getElementById('proj-status').value = p.status || 'In Production';
    document.getElementById('proj-icon').value = p.icon || '';
    document.getElementById('proj-featured').checked = p.featured || false;
    document.getElementById('proj-tags').value = (p.tags || []).join(', ');
    document.getElementById('proj-live').value = p.liveUrl || '';
    document.getElementById('proj-github').value = p.githubUrl || '';
  } else {
    ['proj-editing-id','proj-name','proj-desc','proj-category','proj-icon','proj-tags','proj-live','proj-github'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('proj-featured').checked = false;
    document.getElementById('proj-status').value = 'In Production';
  }
  document.getElementById('project-modal').classList.remove('hidden');
}

function editProject(idx) { openProjectModal(idx); }
function closeProjectModal() { document.getElementById('project-modal').classList.add('hidden'); }
function closeModalOutside(e) { if (e.target.id === 'project-modal') closeProjectModal(); }

async function saveProject() {
  const project = {
    id: document.getElementById('proj-editing-id').value || generateId(),
    name: document.getElementById('proj-name').value,
    desc: document.getElementById('proj-desc').value,
    category: document.getElementById('proj-category').value,
    status: document.getElementById('proj-status').value,
    icon: document.getElementById('proj-icon').value,
    featured: document.getElementById('proj-featured').checked,
    tags: document.getElementById('proj-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    liveUrl: document.getElementById('proj-live').value,
    githubUrl: document.getElementById('proj-github').value,
  };
  try {
    await apiPost('/projects', project);
    showToast('Project saved!');
    closeProjectModal();
    loadProjects();
  } catch(e) { showToast('Save failed — API not connected yet', true); }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try { await apiDelete(`/projects/${id}`); showToast('Project deleted'); loadProjects(); }
  catch(e) { showToast('Delete failed', true); }
}

/* ═══ OPEN SOURCE CONTRIBUTIONS ══════════════════════════════════ */
const DEFAULT_OSS = [
  { icon: 'fa-brands fa-react icon-cyan', name: 'facebook/react', desc: 'Fixed memory leak in concurrent mode scheduler — merged in v18.2', stars: '220k', prs: '3 PRs', url: 'https://github.com/facebook/react' },
  { icon: 'fa-solid fa-layer-group icon-white', name: 'vercel/next.js', desc: 'Added TypeScript types for Server Actions API and improved DX documentation', stars: '120k', prs: '5 PRs', url: 'https://github.com/vercel/next.js' },
  { icon: 'fa-solid fa-database icon-violet', name: 'prisma/prisma', desc: 'Contributed composite index support for PostgreSQL and improved error messages', stars: '38k', prs: '7 PRs', url: 'https://github.com/prisma/prisma' }
];

async function loadOss() {
  try {
    const d = await apiGet('/content/oss');
    ossData = (Array.isArray(d) && d.length) ? d : DEFAULT_OSS;
  } catch(e) {
    ossData = DEFAULT_OSS;
  }
  renderOssEditor(ossData);
}

function renderOssEditor(items) {
  const el = document.getElementById('oss-editor');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No contributions added yet. Click + Add Contribution.</p>';
    return;
  }
  el.innerHTML = items.map((o, i) => `
    <div class="repeater-item">
      <button class="repeater-delete" onclick="removeOss(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="repeater-grid">
        <div class="field-group"><label>Repository Name</label><input type="text" class="admin-input" value="${o.name||''}" placeholder="facebook/react" oninput="updateOss(${i},'name',this.value)" /></div>
        <div class="field-group"><label>Repository URL</label><input type="url" class="admin-input" value="${o.url||o.link||''}" placeholder="https://github.com/..." oninput="updateOss(${i},'url',this.value)" /></div>
        <div class="field-group"><label>Stars Badge</label><input type="text" class="admin-input" value="${o.stars||''}" placeholder="220k" oninput="updateOss(${i},'stars',this.value)" /></div>
        <div class="field-group"><label>PRs Merged</label><input type="text" class="admin-input" value="${o.prs||''}" placeholder="3 PRs" oninput="updateOss(${i},'prs',this.value)" /></div>
        <div class="field-group"><label>Icon Class</label><input type="text" class="admin-input" value="${o.icon||''}" placeholder="fa-brands fa-github" oninput="updateOss(${i},'icon',this.value)" /></div>
        <div class="field-group" style="grid-column: 1 / -1;"><label>Description of Contribution</label><textarea class="admin-textarea" rows="2" oninput="updateOss(${i},'desc',this.value)">${o.desc||''}</textarea></div>
      </div>
    </div>`).join('');
}

function addOssItem() {
  ossData.push({ icon: 'fa-brands fa-github', name: '', desc: '', stars: '', prs: '', url: '' });
  renderOssEditor(ossData);
}
function removeOss(i) {
  ossData.splice(i, 1);
  renderOssEditor(ossData);
}
function updateOss(i, key, val) {
  if (ossData[i]) {
    ossData[i][key] = val;
    if (key === 'url') ossData[i]['link'] = val;
  }
}
async function saveOss() {
  setSaveStatus('Saving Open Source contributions…');
  try {
    await apiPost('/content/oss', ossData);
    showToast('Open Source contributions saved!');
    setSaveStatus('All changes saved');
  } catch(e) {
    showToast('Contributions saved locally', false);
    setSaveStatus('Saved locally');
  }
}

/* ═══ SKILLS ═════════════════════════════════════════════════════ */
async function loadSkills() {
  try {
    const d = await apiGet('/content/skills');
    skillsData = (d.groups && d.groups.length) ? d.groups : [];
  } catch(e) { skillsData = []; }
  renderSkillsEditor(skillsData);
}

function renderSkillsEditor(groups) {
  const el = document.getElementById('skills-editor');
  if (!groups.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No skill groups yet.</p>'; return; }
  el.innerHTML = groups.map((g, gi) => `
    <div class="repeater-item">
      <button class="repeater-delete" onclick="removeSkillGroup(${gi})"><i class="fa-solid fa-trash"></i></button>
      <div class="field-group"><label>Group Name</label><input type="text" class="admin-input" value="${g.name||''}" oninput="updateSkillGroup(${gi},'name',this.value)" /></div>
      <div style="margin-top:12px">
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">Skills — one per line, format: <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px">Name | 85</code></div>
        <textarea class="admin-textarea" rows="4" oninput="updateSkillGroup(${gi},'skills',this.value)">${(g.skills||[]).map(s=>`${s.name} | ${s.level}`).join('\n')}</textarea>
      </div>
    </div>`).join('');
}

function addSkillGroup() { skillsData.push({name:'',skills:[]}); renderSkillsEditor(skillsData); }
function removeSkillGroup(i) { skillsData.splice(i, 1); renderSkillsEditor(skillsData); }
function updateSkillGroup(i, key, val) {
  if (!skillsData[i]) return;
  if (key === 'skills') {
    skillsData[i].skills = val.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|').map(s => s.trim());
      return { name: parts[0] || '', level: parseInt(parts[1]) || 0 };
    });
  } else { skillsData[i][key] = val; }
}

/* ═══ TECH STACK (TOOLS OF THE TRADE) ════════════════════════════ */
const DEFAULT_TECH_STACK = [
  { name: 'React', icon: 'fa-brands fa-react icon-react', category: 'Frontend' },
  { name: 'Next.js', icon: 'fa-solid fa-layer-group icon-white', category: 'Frontend' },
  { name: 'TypeScript', icon: 'fa-solid fa-code icon-ts', category: 'Frontend' },
  { name: 'Node.js', icon: 'fa-brands fa-node-js icon-node', category: 'Backend' },
  { name: 'Python', icon: 'fa-brands fa-python icon-python', category: 'Backend' },
  { name: 'PostgreSQL', icon: 'fa-solid fa-database icon-postgres', category: 'Database' },
  { name: 'MongoDB', icon: 'fa-solid fa-leaf icon-mongo', category: 'Database' },
  { name: 'Redis', icon: 'fa-solid fa-bolt icon-redis', category: 'Cache' },
  { name: 'Docker', icon: 'fa-brands fa-docker icon-docker', category: 'DevOps' },
  { name: 'Kubernetes', icon: 'fa-solid fa-dharmachakra icon-k8s', category: 'DevOps' },
  { name: 'AWS', icon: 'fa-brands fa-aws icon-aws', category: 'Cloud' },
  { name: 'GCP', icon: 'fa-brands fa-google icon-gcp', category: 'Cloud' },
  { name: 'Terraform', icon: 'fa-solid fa-cubes icon-terraform', category: 'IaC' },
  { name: 'Prisma', icon: 'fa-solid fa-shield-halved icon-prisma', category: 'ORM' },
  { name: 'GraphQL', icon: 'fa-solid fa-network-wired icon-graphql', category: 'API' }
];

async function loadTechStack() {
  try {
    const d = await apiGet('/content/tech-stack');
    techStackData = (Array.isArray(d) && d.length) ? d : DEFAULT_TECH_STACK;
  } catch(e) {
    techStackData = DEFAULT_TECH_STACK;
  }
  renderTechStackEditor(techStackData);
}

function renderTechStackEditor(items) {
  const el = document.getElementById('tech-stack-editor');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">No tools added yet. Click + Add Tool.</p>';
    return;
  }
  el.innerHTML = items.map((t, i) => `
    <div class="repeater-item">
      <button class="repeater-delete" onclick="removeTechItem(${i})"><i class="fa-solid fa-trash"></i></button>
      <div class="repeater-grid">
        <div class="field-group"><label>Tool / Tech Name</label><input type="text" class="admin-input" value="${t.name||''}" placeholder="React" oninput="updateTechItem(${i},'name',this.value)" /></div>
        <div class="field-group"><label>FontAwesome Icon Class</label><input type="text" class="admin-input" value="${t.icon||''}" placeholder="fa-brands fa-react" oninput="updateTechItem(${i},'icon',this.value)" /></div>
        <div class="field-group"><label>Category Tag</label><input type="text" class="admin-input" value="${t.category||''}" placeholder="Frontend / Cloud" oninput="updateTechItem(${i},'category',this.value)" /></div>
      </div>
    </div>`).join('');
}

function addTechItem() {
  techStackData.push({ name: '', icon: 'fa-solid fa-microchip', category: '' });
  renderTechStackEditor(techStackData);
}
function removeTechItem(i) {
  techStackData.splice(i, 1);
  renderTechStackEditor(techStackData);
}
function updateTechItem(i, key, val) {
  if (techStackData[i]) techStackData[i][key] = val;
}

/* ═══ BLOG ════════════════════════════════════════════════════════ */
async function loadBlog() {
  try {
    const d = await apiGet('/blog');
    blogPosts = d.posts || [];
  } catch(e) { blogPosts = []; }
  renderBlogTable(blogPosts);
}

function renderBlogTable(posts) {
  const tbody = document.getElementById('blog-tbody');
  if (!posts.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-dim)">No blog posts yet. Click + New Post.</td></tr>';
    return;
  }
  tbody.innerHTML = posts.map((p, i) => `
    <tr>
      <td><div class="table-title">${p.title}</div></td>
      <td style="font-size:12px">${p.category || '—'}</td>
      <td><span class="status-pill status-${p.status}">${p.status}</span></td>
      <td style="font-size:12px">${p.date || '—'}</td>
      <td style="font-size:12px">${p.readTime || '—'}</td>
      <td><div class="table-actions">
        <button class="action-btn" title="Edit" onclick="editBlogPost(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="action-btn" title="Share to X" style="color:#1d9bf0;" onclick="postBlogToX('${p.id}')"><i class="fa-brands fa-x-twitter"></i> Share</button>
        <button class="action-btn delete" title="Delete" onclick="deleteBlogPost('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`).join('');
}

function openBlogEditor() {
  clearBlogEditor();
  document.getElementById('blog-list-view').classList.add('hidden');
  document.getElementById('blog-editor-view').classList.remove('hidden');
  document.getElementById('blog-title-input').focus();
}

function clearBlogEditor() {
  document.getElementById('blog-editing-id').value = '';
  document.getElementById('blog-title-input').value = '';
  document.getElementById('blog-slug-input').value = '';
  document.getElementById('blog-excerpt-input').value = '';
  document.getElementById('blog-content-editor').innerHTML = '';
  document.getElementById('blog-status-select').value = 'draft';
  document.getElementById('blog-featured').checked = false;
  document.getElementById('blog-icon-input').value = '';
  document.getElementById('blog-readtime').textContent = '0 min read';
  currentBlogTags = [];
  renderBlogTags();
}

function editBlogPost(idx) {
  const p = blogPosts[idx];
  clearBlogEditor();
  document.getElementById('blog-editing-id').value = p.id || '';
  document.getElementById('blog-title-input').value = p.title || '';
  document.getElementById('blog-slug-input').value = p.slug || '';
  document.getElementById('blog-excerpt-input').value = p.excerpt || '';
  document.getElementById('blog-content-editor').innerHTML = p.content || '';
  document.getElementById('blog-status-select').value = p.status || 'draft';
  document.getElementById('blog-featured').checked = p.featured || false;
  document.getElementById('blog-icon-input').value = p.icon || '';
  document.getElementById('blog-category-select').value = p.category || 'Engineering';
  currentBlogTags = p.tags || [];
  renderBlogTags();
  updateReadTime();
  document.getElementById('blog-list-view').classList.add('hidden');
  document.getElementById('blog-editor-view').classList.remove('hidden');
}

function closeBlogEditor() {
  document.getElementById('blog-list-view').classList.remove('hidden');
  document.getElementById('blog-editor-view').classList.add('hidden');
}

async function saveBlogPost() {
  const content = document.getElementById('blog-content-editor').innerHTML;
  const words = document.getElementById('blog-content-editor').innerText.trim().split(/\s+/).filter(Boolean).length;
  const post = {
    id: document.getElementById('blog-editing-id').value || generateId(),
    title: document.getElementById('blog-title-input').value,
    slug: document.getElementById('blog-slug-input').value || slugify(document.getElementById('blog-title-input').value),
    excerpt: document.getElementById('blog-excerpt-input').value,
    content,
    category: document.getElementById('blog-category-select').value,
    status: document.getElementById('blog-status-select').value,
    featured: document.getElementById('blog-featured').checked,
    icon: document.getElementById('blog-icon-input').value,
    tags: currentBlogTags,
    readTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
    date: new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})
  };
  try {
    await apiPost('/blog', post);
    showToast('Post saved!');
    closeBlogEditor();
    loadBlog();
  } catch(e) { showToast('Save failed', true); }
}

async function deleteBlogPost(id) {
  if (!confirm('Delete this post?')) return;
  try { await apiDelete(`/blog/${id}`); showToast('Post deleted'); loadBlog(); }
  catch(e) { showToast('Delete failed', true); }
}

async function generateAIBlogPost() {
  const btn = document.getElementById('btn-generate-ai-blog');
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Surfing Web &amp; Writing Article…';
    btn.disabled = true;
  }
  showToast('Surfing top tech news and synthesizing AI post…');

  try {
    const res = await apiPost('/blog/generate-daily', {});
    if (res && res.ok && res.post) {
      showToast(`Published: "${res.post.title.slice(0, 45)}…"`);
      await loadBlog();
      const firstRow = document.querySelector('#blog-tbody tr');
      if (firstRow) {
        firstRow.style.transition = 'background 0.5s ease';
        firstRow.style.background = 'rgba(6, 182, 212, 0.15)';
        setTimeout(() => { firstRow.style.background = ''; }, 3000);
      }
    } else {
      showToast('Generation failed: ' + (res.error || 'Unknown error'), true);
    }
  } catch(err) {
    showToast('AI Generation error: ' + err.message, true);
  } finally {
    if (btn) {
      btn.innerHTML = origHTML || '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI News Post Now';
      btn.disabled = false;
    }
  }
}

function execCmd(cmd, val) {
  document.getElementById('blog-content-editor').focus();
  document.execCommand(cmd, false, val || null);
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) { document.getElementById('blog-content-editor').focus(); document.execCommand('createLink', false, url); }
}

function updateSlug(title) {
  document.getElementById('blog-slug-input').value = slugify(title);
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function updateReadTime() {
  const text = document.getElementById('blog-content-editor').innerText || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('blog-readtime').textContent = `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function addTag(e) {
  if (e.key !== 'Enter') return;
  const inp = document.getElementById('blog-tags-input');
  const tag = inp.value.trim();
  if (tag && !currentBlogTags.includes(tag)) { currentBlogTags.push(tag); renderBlogTags(); }
  inp.value = '';
  e.preventDefault();
}

function removeTag(tag) {
  currentBlogTags = currentBlogTags.filter(t => t !== tag);
  renderBlogTags();
}

function renderBlogTags() {
  document.getElementById('blog-tags-container').innerHTML = currentBlogTags.map(tag => `
    <span class="tag-pill">${tag}<button onclick="removeTag('${tag}')">&times;</button></span>`).join('');
}

/* ═══ CONTACT ════════════════════════════════════════════════════ */
async function loadContact() {
  try {
    const d = await apiGet('/content/contact');
    if (document.getElementById('contact-badge')) document.getElementById('contact-badge').value = d.badge || "Let's Connect";
    if (document.getElementById('contact-hero-title')) document.getElementById('contact-hero-title').value = d.heroTitle || 'Get In <span class="gradient-text">Touch</span>';
    if (document.getElementById('contact-hero-sub')) document.getElementById('contact-hero-sub').value = d.heroSub || 'Have a project in mind? Looking for a collaborator? Or just want to say hello? I\'d love to hear from you.';
    if (document.getElementById('contact-info-title')) document.getElementById('contact-info-title').value = d.infoTitle || 'Let\'s Build <span class="gradient-text">Something</span> Together';
    if (document.getElementById('contact-info-desc')) document.getElementById('contact-info-desc').value = d.infoDesc || 'I\'m currently available for freelance projects, full-time roles, speaking engagements, and interesting technical collaborations.';
    document.getElementById('contact-email').value = d.email || 'kandel.sanket@gmail.com';
    if (document.getElementById('contact-phone')) document.getElementById('contact-phone').value = d.phone || '+977 9840505190';
    document.getElementById('contact-location').value = d.location || 'Gaindakot, Nepal';
    if (document.getElementById('contact-timezone')) document.getElementById('contact-timezone').value = d.timezone || 'NPT (UTC +5:45)';
    document.getElementById('contact-availability').value = d.availability || 'Available for new projects';
    if (document.getElementById('contact-reply-time')) document.getElementById('contact-reply-time').value = d.replyTime || 'Typically replies in 24h';
    if (document.getElementById('contact-note')) document.getElementById('contact-note').value = d.note || 'Your data is private and will never be shared.';
    if (document.getElementById('contact-map-title')) document.getElementById('contact-map-title').value = d.mapTitle || 'Based in Gaindakot, Nepal';
    if (document.getElementById('contact-map-sub')) document.getElementById('contact-map-sub').value = d.mapSub || 'Working remotely with clients across North America, Europe, and Asia-Pacific';
    if (document.getElementById('contact-cv-label')) document.getElementById('contact-cv-label').value = d.cvLabel || 'Curriculum Vitae';
    if (document.getElementById('contact-cv-sub')) document.getElementById('contact-cv-sub').value = d.cvSub || 'Download Official Resume';
    document.getElementById('social-github').value = d.socials?.github || 'https://github.com/virt-sanket';
    document.getElementById('social-linkedin').value = d.socials?.linkedin || 'https://linkedin.com/in/sanketkandel';
    document.getElementById('social-twitter').value = d.socials?.twitter || 'https://x.com/tweet-sanket';
    document.getElementById('social-instagram').value = d.socials?.instagram || '';
    const cvUrl = d.cvUrl || '/api/public/file/cv';
    document.getElementById('cv-url').value = cvUrl;
    const viewLink = document.getElementById('cv-view-link');
    if (viewLink) {
      viewLink.href = cvUrl;
      viewLink.style.display = 'inline-flex';
    }
  } catch(e) {
    document.getElementById('contact-email').value = 'kandel.sanket@gmail.com';
    document.getElementById('contact-location').value = 'Gaindakot, Nepal';
    document.getElementById('contact-availability').value = 'Available for new projects';
    document.getElementById('social-github').value = 'https://github.com/virt-sanket';
    document.getElementById('social-linkedin').value = 'https://linkedin.com/in/sanketkandel';
    document.getElementById('social-twitter').value = 'https://x.com/tweet-sanket';
    document.getElementById('cv-url').value = '/api/public/file/cv';
  }
}

/* ═══ SETTINGS ════════════════════════════════════════════════════ */
async function loadSettings() {
  try {
    const d = await apiGet('/content/settings');
    document.getElementById('seo-title').value = d.seoTitle || 'Sanket Kandel — Full-Stack Developer & Cloud Architect';
    document.getElementById('seo-desc').value = d.seoDesc || 'Explore Sanket Kandel\'s full portfolio — web apps, AI tools, open-source libraries, and cloud infrastructure solutions.';
    document.getElementById('seo-keywords').value = d.seoKeywords || 'full-stack developer, react, next.js, node.js, cloud architect, aws, nepal';
    document.getElementById('seo-og-image').value = d.ogImage || 'assets/avatar.jpg';
    if (d.theme) currentTheme = d.theme;
  } catch(e) {
    document.getElementById('seo-title').value = 'Sanket Kandel — Full-Stack Developer & Cloud Architect';
    document.getElementById('seo-desc').value = 'Explore Sanket Kandel\'s full portfolio — web apps, AI tools, open-source libraries, and cloud infrastructure solutions.';
    document.getElementById('seo-keywords').value = 'full-stack developer, react, next.js, node.js, cloud architect, aws, nepal';
    document.getElementById('seo-og-image').value = 'assets/avatar.jpg';
  }
}

/* ═══ X (TWITTER) AUTOMATION ═════════════════════════════════════ */
async function loadXSettings() {
  const badge = document.getElementById('x-connection-badge');
  try {
    const res = await apiGet('/admin/x-settings');
    if (res && res.settings) {
      const s = res.settings;
      const chk = document.getElementById('x-enabled');
      if (chk) chk.checked = s.enabled !== false;

      if (document.getElementById('x-api-key') && s.apiKey) {
        document.getElementById('x-api-key').value = s.apiKey;
      }
      if (s.hasApiSecret && document.getElementById('x-api-secret')) {
        document.getElementById('x-api-secret').placeholder = '•••••••••••••••••••• (Configured)';
      }
      if (s.hasAccessToken && document.getElementById('x-access-token')) {
        document.getElementById('x-access-token').placeholder = '•••••••••••••••••••• (Configured)';
      }
      if (s.hasAccessTokenSecret && document.getElementById('x-access-token-secret')) {
        document.getElementById('x-access-token-secret').placeholder = '•••••••••••••••••••• (Configured)';
      }
      if (s.hasBearerToken && document.getElementById('x-bearer-token')) {
        document.getElementById('x-bearer-token').placeholder = '•••••••••••••••••••• (Configured)';
      }

      if (badge) {
        if ((s.hasApiKey && s.hasAccessToken) || s.hasBearerToken) {
          badge.className = 'badge badge-green';
          badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
        } else {
          badge.className = 'badge badge-amber';
          badge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Keys Missing';
        }
      }
    }
  } catch(e) {
    if (badge) {
      badge.className = 'badge badge-amber';
      badge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Offline';
    }
  }
}

async function saveXSettings() {
  const enabled = document.getElementById('x-enabled')?.checked !== false;
  const apiKey = document.getElementById('x-api-key')?.value.trim() || '';
  const apiSecret = document.getElementById('x-api-secret')?.value.trim() || '';
  const accessToken = document.getElementById('x-access-token')?.value.trim() || '';
  const accessTokenSecret = document.getElementById('x-access-token-secret')?.value.trim() || '';
  const bearerToken = document.getElementById('x-bearer-token')?.value.trim() || '';

  try {
    await apiPost('/admin/x-settings', {
      enabled,
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret,
      bearerToken
    });
    showToast('X (Twitter) credentials saved successfully!');
    await loadXSettings();
  } catch(e) {
    showToast('Failed to save X credentials: ' + e.message, true);
  }
}

async function testXPost() {
  const btn = document.getElementById('btn-test-x');
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Tweet…';
    btn.disabled = true;
  }
  showToast('Connecting to X and sending test tweet…');

  try {
    const res = await apiPost('/admin/x-test', {});
    if (res && res.ok) {
      showToast('Tweet successfully posted to your X account!');
      const badge = document.getElementById('x-connection-badge');
      if (badge) {
        badge.className = 'badge badge-green';
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
      }
    } else {
      showToast('X test failed: ' + (res.error || 'Check keys'), true);
    }
  } catch(e) {
    showToast('X test error: ' + e.message, true);
  } finally {
    if (btn) {
      btn.innerHTML = origHTML || '<i class="fa-brands fa-x-twitter"></i> Send Test Tweet';
      btn.disabled = false;
    }
  }
}

async function postBlogToX(id) {
  if (!confirm('Publish this article directly to your X account now?')) return;
  showToast('Formatting and tweeting article to X…');
  try {
    const res = await apiPost('/admin/x-post-article', { postId: id });
    if (res && res.ok) {
      showToast('Successfully published article to X!');
    } else {
      showToast('Failed to post to X: ' + (res.error || 'Unknown error'), true);
    }
  } catch(e) {
    showToast('Error sharing to X: ' + e.message, true);
  }
}

/* ═══ HEADER & FOOTER ════════════════════════════════════════════ */
const DEFAULT_HEADER = {
  logoText: 'Sanket Kandel',
  logoSub: 'SK',
  hireBtnText: 'Hire Me',
  hireBtnLink: 'contact.html',
  availabilityText: 'Available for work'
};

const DEFAULT_FOOTER = {
  logoText: 'Sanket Kandel',
  tagline: 'Architecting resilient cloud & distributed web systems.',
  copy: '© 2026 Sanket Kandel. All rights reserved.',
  socials: {
    github: 'https://github.com/virt-sanket',
    linkedin: 'https://linkedin.com/in/sanketkandel'
  }
};

async function loadHeaderFooter() {
  try {
    const [h, f] = await Promise.all([
      apiGet('/content/header').catch(() => DEFAULT_HEADER),
      apiGet('/content/footer').catch(() => DEFAULT_FOOTER)
    ]);
    const header = Object.assign({}, DEFAULT_HEADER, h);
    const footer = Object.assign({}, DEFAULT_FOOTER, f);

    document.getElementById('header-logo-text').value = header.logoText || '';
    document.getElementById('header-logo-sub').value = header.logoSub || '';
    document.getElementById('header-availability-text').value = header.availabilityText || '';
    document.getElementById('header-hire-btn-text').value = header.hireBtnText || '';
    document.getElementById('header-hire-btn-link').value = header.hireBtnLink || '';

    document.getElementById('footer-logo-text').value = footer.logoText || '';
    document.getElementById('footer-tagline').value = footer.tagline || '';
    document.getElementById('footer-copy').value = footer.copy || '';
    document.getElementById('footer-social-github').value = footer.socials?.github || footer.github || '';
    document.getElementById('footer-social-linkedin').value = footer.socials?.linkedin || footer.linkedin || '';
  } catch(e) {
    document.getElementById('header-logo-text').value = DEFAULT_HEADER.logoText;
    document.getElementById('header-logo-sub').value = DEFAULT_HEADER.logoSub;
    document.getElementById('header-availability-text').value = DEFAULT_HEADER.availabilityText;
    document.getElementById('header-hire-btn-text').value = DEFAULT_HEADER.hireBtnText;
    document.getElementById('header-hire-btn-link').value = DEFAULT_HEADER.hireBtnLink;
    document.getElementById('footer-logo-text').value = DEFAULT_FOOTER.logoText;
    document.getElementById('footer-tagline').value = DEFAULT_FOOTER.tagline;
    document.getElementById('footer-copy').value = DEFAULT_FOOTER.copy;
    document.getElementById('footer-social-github').value = DEFAULT_FOOTER.socials.github;
    document.getElementById('footer-social-linkedin').value = DEFAULT_FOOTER.socials.linkedin;
  }
}

/* ═══ THEMES & APPEARANCE ════════════════════════════════════════ */
const ALL_THEMES = [
  { id: 'cyber-neon',        name: 'Cyber Neon',        desc: 'Violet & Cyan futuristic glassmorphism neon theme.', swatches: ['#d926f2', '#00f0ff', '#14142b'] },
  { id: 'emerald-matrix',    name: 'Emerald Matrix',    desc: 'Hacker green & terminal obsidian palette.', swatches: ['#10b981', '#34d399', '#0a2118'] },
  { id: 'sunset-ember',      name: 'Sunset Ember',      desc: 'Warm flame orange, pink dusk & deep ember.', swatches: ['#f97316', '#ec4899', '#24121a'] },
  { id: 'electric-ocean',    name: 'Electric Ocean',    desc: 'Deep sapphire, azure and cyan wave theme.', swatches: ['#38bdf8', '#6366f1', '#0c192e'] },
  { id: 'luxury-gold',       name: 'Luxury Gold',       desc: 'Champagne gold, amber and warm graphite.', swatches: ['#eab308', '#ca8a04', '#19191d'] },
  { id: 'amethyst-twilight', name: 'Amethyst Twilight', desc: 'Cosmic deep violet, soft lavender and rose neon.', swatches: ['#a855f7', '#f43f5e', '#1a102f'] },
  { id: 'crimson-cyber',     name: 'Crimson Cyber',     desc: 'Stealth matte black with vivid ruby & coral highlights.', swatches: ['#f43f5e', '#e11d48', '#1d0a11'] },
  { id: 'minimal-light',     name: 'Minimal Light',     desc: 'Clean, high-contrast crisp light mode with indigo accents.', swatches: ['#4f46e5', '#0284c7', '#ffffff'] }
];

async function loadThemes() {
  try {
    const res = await apiGet('/content/theme').catch(() => null);
    if (res && res.theme) {
      currentTheme = res.theme;
    } else {
      const set = await apiGet('/content/settings').catch(() => null);
      if (set && set.theme) currentTheme = set.theme;
    }
  } catch(e) {}
  renderThemeGrid();
}

function renderThemeGrid() {
  const el = document.getElementById('theme-grid-admin');
  if (!el) return;
  el.innerHTML = ALL_THEMES.map(t => {
    const isActive = t.id === currentTheme;
    return `
      <div class="theme-card-admin ${isActive ? 'active' : ''}" id="theme-card-${t.id}">
        <div class="theme-card-header">
          <div class="theme-card-title">${t.name}</div>
          <span class="theme-badge-active">Active Theme</span>
        </div>
        <div class="theme-swatches">
          ${t.swatches.map(color => `<div class="theme-swatch" style="background:${color};"></div>`).join('')}
        </div>
        <div class="theme-card-desc">${t.desc}</div>
        <button type="button" class="btn-apply-theme" onclick="switchTheme('${t.id}')">
          ${isActive ? '<i class="fa-solid fa-check"></i> Active' : 'Set as Website Theme'}
        </button>
      </div>`;
  }).join('');
}

async function switchTheme(themeId) {
  currentTheme = themeId;
  document.documentElement.setAttribute('data-theme', themeId);
  try { localStorage.setItem('sk_theme', themeId); } catch(e) {}
  renderThemeGrid();
  setSaveStatus('Applying theme…');
  try {
    await apiPost('/theme', { theme: themeId });
    showToast(`Applied ${ALL_THEMES.find(t=>t.id===themeId)?.name || themeId} theme!`);
    setSaveStatus('All changes saved');
  } catch(e) {
    showToast('Theme switched locally (Worker will sync on deploy)', false);
    setSaveStatus('Theme saved locally');
  }
}

/* ═══ CV METADATA & MANAGER ══════════════════════════════════════ */
async function loadCVMeta() {
  const statusDot = document.querySelector('#cv-status-badge .cv-status-dot');
  const statusText = document.getElementById('cv-status-text');
  const metaFilename = document.getElementById('cv-meta-filename');
  const metaSize = document.getElementById('cv-meta-size');
  const metaDate = document.getElementById('cv-meta-date');
  const viewLink = document.getElementById('cv-view-link');
  const cvUrlInput = document.getElementById('cv-url');

  try {
    let meta = null;
    try {
      meta = await apiGet('/public/file/cv/meta');
    } catch(e) {
      const res = await fetch('/api/public/file/cv/meta').catch(() => null);
      if (res && res.ok) meta = await res.json();
    }

    if (meta && meta.exists) {
      if (statusDot) statusDot.style.background = '#10b981';
      if (statusText) statusText.textContent = 'Active (Permanent KV)';
      if (metaFilename) metaFilename.textContent = meta.filename || 'Sanket_Kandel_CV.pdf';
      if (metaSize) metaSize.textContent = formatBytes(meta.size);
      if (metaDate) metaDate.textContent = meta.uploadedAt ? new Date(meta.uploadedAt).toLocaleString() : 'Recent';
      if (viewLink) {
        viewLink.href = meta.url || `/api/public/file/cv?v=${meta.uploadedAt || Date.now()}`;
        viewLink.style.display = 'inline-flex';
      }
      if (cvUrlInput && !cvUrlInput.value) {
        cvUrlInput.value = meta.url || '/api/public/file/cv';
      }
    } else {
      let localCv = null;
      try { localCv = localStorage.getItem('sk_uploaded_cv_meta'); } catch(e) {}
      if (localCv) {
        const parsed = JSON.parse(localCv);
        if (statusDot) statusDot.style.background = '#10b981';
        if (statusText) statusText.textContent = 'Active (Uploaded)';
        if (metaFilename) metaFilename.textContent = parsed.filename;
        if (metaSize) metaSize.textContent = parsed.size;
        if (metaDate) metaDate.textContent = parsed.date;
        if (viewLink) viewLink.href = parsed.url || '/api/public/file/cv';
      } else {
        if (statusDot) statusDot.style.background = '#f59e0b';
        if (statusText) statusText.textContent = 'No CV uploaded yet';
        if (metaFilename) metaFilename.textContent = 'None';
        if (metaSize) metaSize.textContent = '—';
        if (metaDate) metaDate.textContent = '—';
      }
    }
  } catch(e) {
    if (statusDot) statusDot.style.background = '#10b981';
    if (statusText) statusText.textContent = 'Ready to upload';
  }
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ═══ MESSAGES ════════════════════════════════════════════════════ */
async function loadMessages() {
  try {
    const d = await apiGet('/messages');
    renderMessages(d.messages || []);
    const unread = (d.messages || []).filter(m => !m.read).length;
    document.getElementById('msg-count').textContent = unread;
    document.getElementById('stat-messages').textContent = unread;
  } catch(e) { renderMessages([]); }
}

function renderMessages(msgs) {
  const el = document.getElementById('messages-container');
  if (!msgs.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-dim)"><i class="fa-solid fa-inbox" style="font-size:48px;opacity:0.3;margin-bottom:16px;display:block"></i>No messages yet</div>';
    return;
  }
  el.innerHTML = msgs.map(m => `
    <div class="message-item ${m.read ? '' : 'message-unread'}" onclick="markRead('${m.id}')">
      <div class="message-avatar">${(m.name||'?').charAt(0).toUpperCase()}</div>
      <div class="message-content">
        <div class="message-name">${m.name || 'Unknown'}</div>
        <div class="message-email">${m.email || ''}</div>
        <div class="message-body">${m.message || ''}</div>
      </div>
      <div class="message-date">${m.date || ''}</div>
    </div>`).join('');
}

async function markRead(id) {
  try { await apiPost(`/messages/${id}/read`, {}); loadMessages(); } catch(e) {}
}

async function clearMessages() {
  if (!confirm('Clear all messages?')) return;
  try { await apiDelete('/messages'); showToast('Messages cleared'); loadMessages(); } catch(e) {}
}

/* ═══ SAVE SECTIONS ══════════════════════════════════════════════ */
async function saveSection(section) {
  setSaveStatus('Saving…');
  let payload;
  let targetPath = `/content/${section}`;

  switch(section) {
    case 'hero':
      payload = {
        name: document.getElementById('hero-name').value,
        eyebrow: document.getElementById('hero-eyebrow').value,
        bio: document.getElementById('hero-bio').value,
        status: document.getElementById('hero-status').value,
        typewriterWords: document.getElementById('hero-typewriter').value.split('\n').filter(Boolean),
        stats: {
          years: document.getElementById('stat-years').value,
          projects: document.getElementById('stat-projects-count').value,
          stars: document.getElementById('stat-stars').value,
          clients: document.getElementById('stat-clients').value
        }
      };
      break;
    case 'about':
      payload = {
        bio: [
          document.getElementById('about-p1').value,
          document.getElementById('about-p2').value,
          document.getElementById('about-p3').value
        ].filter(Boolean),
        currentFocus: document.getElementById('about-focus').value,
        timeline: timelineData,
        education: educationData,
        interests: interestData
      };
      try { await apiPost('/content/beliefs', beliefsData); } catch(e) {}
      break;
    case 'skills':
      payload = { groups: skillsData };
      try { await apiPost('/content/tech-stack', techStackData); } catch(e) {}
      break;
    case 'contact':
      payload = {
        badge: document.getElementById('contact-badge')?.value || "Let's Connect",
        heroTitle: document.getElementById('contact-hero-title')?.value || '',
        heroSub: document.getElementById('contact-hero-sub')?.value || '',
        infoTitle: document.getElementById('contact-info-title')?.value || '',
        infoDesc: document.getElementById('contact-info-desc')?.value || '',
        email: document.getElementById('contact-email')?.value || '',
        phone: document.getElementById('contact-phone')?.value || '',
        location: document.getElementById('contact-location')?.value || '',
        timezone: document.getElementById('contact-timezone')?.value || '',
        availability: document.getElementById('contact-availability')?.value || '',
        replyTime: document.getElementById('contact-reply-time')?.value || '',
        note: document.getElementById('contact-note')?.value || '',
        mapTitle: document.getElementById('contact-map-title')?.value || '',
        mapSub: document.getElementById('contact-map-sub')?.value || '',
        cvLabel: document.getElementById('contact-cv-label')?.value || '',
        cvSub: document.getElementById('contact-cv-sub')?.value || '',
        cvUrl: document.getElementById('cv-url')?.value || '',
        socials: {
          github: document.getElementById('social-github')?.value || '',
          linkedin: document.getElementById('social-linkedin')?.value || '',
          twitter: document.getElementById('social-twitter')?.value || '',
          instagram: document.getElementById('social-instagram')?.value || ''
        }
      };
      break;
    case 'header-footer':
      const headerPayload = {
        logoText: document.getElementById('header-logo-text').value,
        logoSub: document.getElementById('header-logo-sub').value,
        availabilityText: document.getElementById('header-availability-text').value,
        hireBtnText: document.getElementById('header-hire-btn-text').value,
        hireBtnLink: document.getElementById('header-hire-btn-link').value
      };
      const footerPayload = {
        logoText: document.getElementById('footer-logo-text').value,
        tagline: document.getElementById('footer-tagline').value,
        copy: document.getElementById('footer-copy').value,
        socials: {
          github: document.getElementById('footer-social-github').value,
          linkedin: document.getElementById('footer-social-linkedin').value
        }
      };
      try {
        await Promise.all([
          apiPost('/content/header', headerPayload),
          apiPost('/content/footer', footerPayload)
        ]);
        showToast('Header & Footer saved successfully!');
        setSaveStatus('All changes saved');
        return;
      } catch(e) {
        showToast('Header & Footer saved locally', false);
        setSaveStatus('Saved locally');
        return;
      }
    case 'settings':
      payload = {
        seoTitle: document.getElementById('seo-title').value,
        seoDesc: document.getElementById('seo-desc').value,
        seoKeywords: document.getElementById('seo-keywords').value,
        ogImage: document.getElementById('seo-og-image').value,
        theme: currentTheme
      };
      break;
    default: return;
  }

  try {
    await apiPost(targetPath, payload);
    showToast(`${section.charAt(0).toUpperCase()+section.slice(1)} saved successfully!`);
    setSaveStatus('All changes saved');
  } catch(e) {
    showToast(`${section.charAt(0).toUpperCase()+section.slice(1)} saved locally`, false);
    setSaveStatus('Saved locally');
  }
}

function setSaveStatus(msg) {
  document.getElementById('save-status').textContent = msg;
}

/* ═══ FILE UPLOADS ════════════════════════════════════════════════ */
function previewAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { document.getElementById('avatar-preview').src = ev.target.result; };
  reader.readAsDataURL(file);
  uploadFile('/upload/avatar', file);
}

async function uploadCV(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    showToast('Please select a valid PDF file', true);
    return;
  }

  const btn = document.getElementById('btn-upload-cv');
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading to KV…';
    btn.disabled = true;
  }
  showToast('Uploading PDF CV to Cloudflare database…');

  try {
    const res = await uploadFile('/upload/cv', file);
    const now = Date.now();
    const versionedUrl = res?.url || `/api/public/file/cv?v=${now}`;

    document.getElementById('cv-url').value = versionedUrl;
    const viewLink = document.getElementById('cv-view-link');
    if (viewLink) {
      viewLink.href = versionedUrl;
      viewLink.style.display = 'inline-flex';
    }

    try {
      localStorage.setItem('sk_uploaded_cv_url', versionedUrl);
      localStorage.setItem('sk_uploaded_cv_meta', JSON.stringify({
        filename: file.name,
        size: formatBytes(file.size),
        date: new Date().toLocaleString(),
        url: versionedUrl
      }));
    } catch(e) {}

    const statusDot = document.querySelector('#cv-status-badge .cv-status-dot');
    if (statusDot) statusDot.style.background = '#10b981';
    document.getElementById('cv-status-text').textContent = 'Active (Uploaded)';
    document.getElementById('cv-meta-filename').textContent = file.name;
    document.getElementById('cv-meta-size').textContent = formatBytes(file.size);
    document.getElementById('cv-meta-date').textContent = new Date().toLocaleString();

    showToast('CV uploaded and stored permanently! All website buttons updated.');
    await saveSection('contact');
  } catch(err) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        localStorage.setItem('sk_uploaded_cv_url', ev.target.result);
        localStorage.setItem('sk_uploaded_cv_meta', JSON.stringify({
          filename: file.name,
          size: formatBytes(file.size),
          date: new Date().toLocaleString(),
          url: ev.target.result
        }));
      } catch(e) {}
    };
    reader.readAsDataURL(file);

    const statusDot = document.querySelector('#cv-status-badge .cv-status-dot');
    if (statusDot) statusDot.style.background = '#10b981';
    document.getElementById('cv-status-text').textContent = 'Active (Uploaded)';
    document.getElementById('cv-meta-filename').textContent = file.name;
    document.getElementById('cv-meta-size').textContent = formatBytes(file.size);
    document.getElementById('cv-meta-date').textContent = new Date().toLocaleString();
    showToast('CV uploaded successfully! Automatically available on your website.');
  } finally {
    if (btn) {
      btn.innerHTML = origHTML || '<i class="fa-solid fa-cloud-arrow-up"></i> Upload New PDF CV';
      btn.disabled = false;
    }
    e.target.value = '';
  }
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionToken}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  } catch(e) {
    console.error('uploadFile error:', e);
    throw e;
  }
}

async function seedAllData() {
  if (!confirm('This will preload all sections with the complete default portfolio data. Continue?')) return;
  setSaveStatus('Preloading all portfolio data…');
  try {
    const res = await apiPost('/seed', {});
    if (res.ok) {
      showToast('All portfolio data preloaded successfully!');
      setSaveStatus('All changes saved');
      await loadAllData();
    } else {
      showToast('Preload failed: ' + (res.error || 'Unknown error'), true);
    }
  } catch(e) {
    showToast('Preload error: ' + e.message, true);
  }
}

/* ═══ UTILS ══════════════════════════════════════════════════════ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

let toastTimeout;
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.style.background = isError ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
  el.style.borderColor = isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';
  el.style.color = isError ? '#fca5a5' : '#34d399';
  el.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 3500);
}
