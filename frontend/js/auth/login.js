

async function initLogin() {

  const select = document.getElementById('loginOrg');
  if (!select) return;
  

  select.innerHTML = '<option value="admin">ผู้ดูแลระบบ (Admin)</option>';

  (DB.orgs || []).filter(o => o.active !== false).forEach(org => {

    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = org.province ? `${org.name} (${org.province})` : org.name;
    select.appendChild(opt);
  });

  try {
    const last = localStorage.getItem('sdg4_last_org');

    if (last && select.querySelector(`option[value="${last}"]`)) {
      select.value = last;
    }
  } catch (_) {}

}

document.getElementById('loginBtn')?.addEventListener('click', async () => {

  const orgId = document.getElementById('loginOrg')?.value;
  const pin = document.getElementById('loginPin')?.value.trim();

  if (!/^\d{6}$/.test(pin || '')) {
    showWarning('PIN ไม่ถูกต้อง', 'กรุณาระบุรหัส PIN 6 หลัก');
    return;
  }

  try {

    const res = await api.login(orgId, pin);
    

    window.session = res.session;
    

    const full = await api.getFullData();
    window.DB = { 
      orgs: full.orgs, 
      users: full.users, 
      projects: full.projects, 
      audit: full.audit 
    };
    

    if (orgId !== 'admin') {
      try { localStorage.setItem('sdg4_last_org', orgId); } catch (_) {}
    }
    

    showSuccess(
      'เข้าสู่ระบบสำเร็จ', 
      orgId === 'admin' 
        ? 'ยินดีต้อนรับ' 
        : `หน่วยงาน: ${(DB.orgs || []).find(o => o.id === orgId)?.name || orgId}`
    );
    initApp();
    
  } catch (e) {

    showError('เข้าสู่ระบบไม่สำเร็จ', e.message || 'PIN ไม่ถูกต้อง');
  }
});

document.getElementById('loginPin')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('loginBtn').click();
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {

  const ok = await confirm('ออกจากระบบ', 'ต้องการออกจากระบบใช่ไหม?', 'ออกจากระบบ');
  
  if (ok) {

    try { await api.logout(); } catch (_) {}
    

    session = null;
    

    showInfo('ออกจากระบบแล้ว', 'ออกจากระบบสำเร็จ');
    

    location.reload();
  }
});

document.getElementById('toggleLoginPin')?.addEventListener('click', () => {
    const input = document.getElementById('loginPin');
    const icon = document.getElementById('loginPinIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});
