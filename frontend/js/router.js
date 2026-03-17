// ==================== Router ====================
let currentPage = 'dashboard';

function renderMenu() {
  const menu = document.getElementById('mainMenu');
  const items = [];

  if (session.role === 'admin') {
    items.push(
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'organizations', icon: 'fa-building', label: 'จัดการหน่วยงาน' },
      { id: 'users', icon: 'fa-key', label: 'ตั้งค่า PIN หน่วยงาน' },
      { id: 'projects', icon: 'fa-tasks', label: 'จัดการโครงการ' },
      { id: 'audit-log', icon: 'fa-list-alt', label: 'Audit Log' }
    );
  } else {
    items.push(
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'projects-all', icon: 'fa-globe', label: 'โครงการทั้งหมด' },
      { id: 'projects', icon: 'fa-tasks', label: 'จัดการโครงการ' },
      { id: 'organizations-view', icon: 'fa-building', label: 'หน่วยงานทั้งหมด' }
    );
  }

  menu.innerHTML = items.map(item => `
    <li class="${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
      <a>
        <i class="fas ${item.icon}"></i>
        ${item.label}
      </a>
    </li>
  `).join('');

  menu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const page = li.getAttribute('data-page');
      navigateTo(page);
      const sidebarToggle = document.getElementById('sidebar-toggle');
      if (sidebarToggle && window.innerWidth < 1024) {
        sidebarToggle.checked = false;
      }
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  renderMenu();

  const content = document.getElementById('pageContent');

  switch(page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'organizations':
      renderOrganizations();
      break;
    case 'organizations-view':
      renderOrganizationsView();
      break;
    case 'users':
      renderUsers();
      break;
    case 'projects-all':
      renderProjectsAll();
      break;
    case 'projects':
      renderProjects();
      break;
    case 'new-project':
      renderProjects();
      break;
    case 'audit-log':
      renderAuditLog();
      break;
    default:
      render404();
  }
}

function render404() {
  currentPage = '404';
  const content = document.getElementById('pageContent');
  if (!content) return;
  content.innerHTML = `
    <div class="page flex flex-col items-center justify-center min-h-[60vh]">
      <div class="text-center max-w-md">
        <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
          <i class="fas fa-exclamation-triangle text-5xl"></i>
        </div>
        <h1 class="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p class="text-xl text-gray-600 mb-2">ไม่พบหน้านี้</p>
        <p class="text-gray-500 text-sm mb-8">หน้าที่คุณค้นหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่จริง</p>
        <button onclick="navigateTo('dashboard')" class="btn btn-primary gap-2 bg-blue-600 hover:bg-blue-700 border-0">
          <i class="fas fa-home"></i>
          กลับไป Dashboard
        </button>
      </div>
    </div>
  `;
}
