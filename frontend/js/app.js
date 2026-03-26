

function syncNavHeight() {

  const nav = document.querySelector('.navbar-custom');
  if (!nav) return;

  const h = Math.max(56, nav.getBoundingClientRect().height || 0);

  document.documentElement.style.setProperty('--nav-h', `${Math.round(h)}px`);
}

function initApp() {

  document.getElementById('loginScreen').classList.add('hidden');
  

  document.getElementById('mainApp').classList.remove('hidden');

  syncNavHeight();
  

  window.addEventListener('resize', syncNavHeight);

  document.getElementById('userDisplay').textContent =
    session.role === 'admin'
       ? 'ผู้ดูแลระบบ'
       : `${getOrgName(session.orgId)}`;

  renderMenu();
  

  navigateTo('dashboard');
}

document.documentElement.setAttribute('data-theme', 'light');
try { localStorage.removeItem('sdg4_theme'); } catch {}

async function doInit() {
  try {

    const me = await api.me();
    

    if (me && me.session) {

      window.session = me.session;
      

      const full = await api.getFullData();
      

      window.DB = { 
        orgs: full.orgs, 
        users: full.users, 
        projects: full.projects, 
        audit: full.audit 
      };
      

      initApp();
      return;
    }
    

    const orgs = await api.getOrgsPublic();
    window.DB = { orgs: orgs || [], users: [], projects: [], audit: [] };
    
  } catch (e) {

    console.warn('API init failed, using login screen', e);
    

    window.DB = window.DB || { orgs: [], users: [], projects: [], audit: [] };
  }
  

  initLogin();
}

doInit();
