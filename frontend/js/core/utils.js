

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
