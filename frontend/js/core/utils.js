

function randomId(prefix) {
  return prefix + '-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function formatMoney(n) {

  return Number(n || 0).toLocaleString('th-TH');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  

  const d = new Date(dateStr + 'T00:00:00');
  

  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getOrgName(orgId) {

  if (orgId === 'admin') return 'Admin';
  

  const org = DB?.orgs?.find(o => o.id === orgId);
  return org ? org.name : '-';
}

function getOrgProvince(orgId) {
  const org = DB?.orgs?.find(o => o.id === orgId);
  return org?.province ? org.province : '';
}

function projectProvinceLabel(p) {
  if (p?.province) return p.province;
  return getOrgProvince(p?.orgId);
}

function uniqueProvincesFromOrgs() {
  const set = new Set();
  (DB?.orgs || []).forEach(o => {
    if (o.province && String(o.province).trim()) set.add(o.province.trim());
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'th'));
}

function uniqueProvincesFromProjects() {
  const set = new Set();
  (DB?.projects || []).forEach(p => {
    const province = p?.province || getOrgProvince(p?.orgId);
    if (province && String(province).trim()) set.add(String(province).trim());
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'th'));
}

/**
 * รายชื่อจังหวัดสำหรับ dropdown เลือกในฟอร์ม
 * รวมจาก 2 แหล่ง: (1) จังหวัดที่มีใน org ของระบบ + (2) list 77 จังหวัดมาตรฐาน
 * จังหวัดที่มีในระบบจะถูกเรียงไว้บนสุด
 */
function allProvincesForSelect() {
  const dynamicSet = new Set();
  (DB?.orgs || []).forEach(o => {
    if (o.province && String(o.province).trim()) dynamicSet.add(o.province.trim());
  });
  const dynamic = [...dynamicSet].sort((a, b) => a.localeCompare(b, 'th'));

  const staticFiltered = (THAI_PROVINCES || []).filter(p => !dynamicSet.has(p));
  return [...dynamic, ...staticFiltered];
}

/** หลีกเลี่ยง datalist ใน SweetAlert (เมนู native หลุดตำแหน่ง/ธีม) — overlay เลือกจังหวัด (ไม่ใช้ Swal ซ้ำ เพราะจะปิด modal หลัก) */
function openThaiProvincePicker(inputId) {
  const input = document.getElementById(inputId);
  if (!input || typeof THAI_PROVINCES === 'undefined') return;

  const existing = document.getElementById('thai-province-picker-overlay');
  if (existing) existing.remove();

  const fillList = (container, query, onPick) => {
    const q = (query || '').trim().toLowerCase();
    const list = THAI_PROVINCES.filter((name) => !q || name.toLowerCase().includes(q));
    container.replaceChildren();
    if (list.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-sm text-gray-500 py-4 text-center';
      p.textContent = 'ไม่พบรายการที่ตรงกับการค้นหา';
      container.appendChild(p);
      return;
    }
    list.forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'w-full text-left px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors';
      btn.textContent = name;
      btn.addEventListener('click', () => onPick(name));
      container.appendChild(btn);
    });
  };

  const overlay = document.createElement('div');
  overlay.id = 'thai-province-picker-overlay';
  overlay.className = 'fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/40';
  overlay.setAttribute('role', 'dialog');
  overlay.innerHTML = `
    <div class="bg-base-100 rounded-xl shadow-2xl border border-base-300 w-full max-w-md max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <h3 class="font-semibold text-gray-800">เลือกจังหวัด</h3>
        <button type="button" class="btn btn-sm btn-ghost btn-circle" aria-label="ปิด" data-close-picker>
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="p-4 overflow-hidden flex flex-col flex-1 min-h-0">
        <input type="search" id="province-picker-search" class="input input-bordered w-full mb-2" placeholder="ค้นหา..." autocomplete="off">
        <div id="province-picker-list" class="flex-1 min-h-0 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-1 space-y-0.5"></div>
        <p class="text-xs text-gray-500 mt-2">หรือปิดแล้วพิมพ์ในช่องจังหวัดเองได้</p>
      </div>
    </div>
  `;

  const close = () => overlay.remove();

  const onPick = (name) => {
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('[data-close-picker]')?.addEventListener('click', close);

  document.body.appendChild(overlay);

  const search = overlay.querySelector('#province-picker-search');
  const listEl = overlay.querySelector('#province-picker-list');
  const run = () => fillList(listEl, search?.value || '', onPick);
  search?.addEventListener('input', run);
  run();
  setTimeout(() => search?.focus(), 50);
}

function getDisplayNameFromUsername(username) {
  if (!username) return '-';
  if (username === 'admin') return 'Admin';

  if (username.startsWith('mgr-')) {

    const user = DB?.users?.find(u => u.username === username && u.orgId);
    if (user && user.orgId) {

      return getOrgName(user.orgId);
    }
  }

  return username;
}

function getCurrentUser() {

  if (!session?.userId) return null;
  

  return (DB?.users || []).find(u => u.id === session.userId) || null;
}

function getCurrentUsername() {
  const u = getCurrentUser();
  return u?.username || (session?.role === 'admin' ? 'admin' : 'unknown');
}

function canEdit(project) {

  if (!session) return false;
  

  if (session.role === 'admin') return true;
  

  if (session.role === 'manager') return project?.orgId === session.orgId;
  
  return false;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {

    const reader = new FileReader();
    

    reader.onload = () => resolve(reader.result);
    

    reader.onerror = reject;
    

    reader.readAsDataURL(file);
  });
}
