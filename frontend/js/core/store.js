// ==================== Data Store ====================
// ใช้ API 100% — ข้อมูลทั้งหมดมาจาก Backend, ไม่ใช้ localStorage/seed demo

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migrateSession(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.userId) return s;

  if (s.role === 'admin') {
    const adminUser = (DB?.users || []).find(u => u.role === 'admin' && u.active !== false);
    return adminUser ? { role: 'admin', userId: adminUser.id } : null;
  }
  if (s.role === 'manager' && s.orgId) {
    const mgr = (DB?.users || []).find(u => u.role === 'manager' && u.orgId === s.orgId && u.active !== false);
    return mgr ? { role: 'manager', userId: mgr.id, orgId: mgr.orgId } : null;
  }
  return null;
}

function saveSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Initialize store — ใช้ API 100% ข้อมูลมาจาก Backend
window.DB = { orgs: [], users: [], projects: [], audit: [] };
window.session = null;
