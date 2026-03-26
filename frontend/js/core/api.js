

const API_BASE = window.API_BASE || (
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
    ? 'http://localhost:5000/api'
    : '/api'
);

const fetchOpts = (method, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  return opts;
};

const api = {

  
  
  async me() {
    const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) return null;
    return data;
  },

  
  async login(orgId, pin) {
    const r = await fetch(`${API_BASE}/auth/login`, fetchOpts('POST', { orgId, pin }));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
    return data;
  },

  
  async logout() {
    await fetch(`${API_BASE}/auth/logout`, fetchOpts('POST'));
  },

  
  async getOrgsPublic() {
    const r = await fetch(`${API_BASE}/orgs/public`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) return [];
    return data.items || [];
  },

  
  async getFullData() {
    const r = await fetch(`${API_BASE}/data/full`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลดข้อมูลไม่ได้');
    return data;
  },

  
  async createOrg(name) {
    const r = await fetch(`${API_BASE}/orgs`, fetchOpts('POST', { name }));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'เพิ่มหน่วยงานไม่สำเร็จ');
    return data.item;
  },

  
  async updateOrg(orgId, body) {
    const r = await fetch(`${API_BASE}/orgs/${orgId}`, fetchOpts('PUT', body));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'อัปเดตไม่สำเร็จ');
    return data.item;
  },

  
  async deleteOrg(orgId) {
    const r = await fetch(`${API_BASE}/orgs/${orgId}`, fetchOpts('DELETE'));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
  },

  
  async setOrgPin(orgId, pin) {
    const r = await fetch(`${API_BASE}/orgs/${orgId}/pin`, fetchOpts('PUT', { pin }));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'ตั้ง PIN ไม่สำเร็จ');
  },

  
  async createProject(body) {
    const r = await fetch(`${API_BASE}/projects`, fetchOpts('POST', body));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'สร้างโครงการไม่สำเร็จ');
    return data.item;
  },

  
  async updateProject(projectId, body) {
    const r = await fetch(`${API_BASE}/projects/${projectId}`, fetchOpts('PUT', body));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'อัปเดตไม่สำเร็จ');
    return data.item;
  },

  
  async deleteProject(projectId) {
    const r = await fetch(`${API_BASE}/projects/${projectId}`, fetchOpts('DELETE'));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
  },

  
  async uploadProjectImages(projectId, images) {
    const r = await fetch(`${API_BASE}/projects/${projectId}/images`, fetchOpts('POST', { images }));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'อัปโหลดรูปไม่สำเร็จ');
    return data.item;
  },

  
  async deleteProjectImage(projectId, imageId) {
    const r = await fetch(`${API_BASE}/projects/${projectId}/images/${imageId}`, fetchOpts('DELETE'));
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'ลบรูปไม่สำเร็จ');
    return data.item;
  },

  
  async getDashboardSummary() {
    const r = await fetch(`${API_BASE}/dashboard/summary`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลดสรุปไม่สำเร็จ');
    return data;
  },

  
  async getDashboardByOrg() {
    const r = await fetch(`${API_BASE}/dashboard/by-org`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลดข้อมูลตามหน่วยงานไม่สำเร็จ');
    return data.items || [];
  },

  
  async getDashboardBySdg() {
    const r = await fetch(`${API_BASE}/dashboard/by-sdg`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลดข้อมูลตาม SDG ไม่สำเร็จ');
    return data.items || [];
  },

  
  async getAuditLogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${API_BASE}/audit-logs${qs ? '?' + qs : ''}`;
    const r = await fetch(url, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลด Audit Log ไม่สำเร็จ');
    return data.items || [];
  },

  
  async listUsers() {
    const r = await fetch(`${API_BASE}/users/`, { credentials: 'include' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ');
    return data.items || [];
  },

  
  async downloadExportCsv(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${API_BASE}/projects/export${qs ? '?' + qs : ''}`;
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) {
      const text = await r.text();
      let msg = 'ดาวน์โหลดไม่สำเร็จ';
      try { const d = JSON.parse(text); msg = d.message || msg; } catch (_) {}
      throw new Error(msg);
    }

    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sdg4_projects_export.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

async function refreshFromApi() {
  const full = await api.getFullData();
  window.DB = { orgs: full.orgs, users: full.users, projects: full.projects, audit: full.audit };
}

window.api = api;
window.refreshFromApi = refreshFromApi;
