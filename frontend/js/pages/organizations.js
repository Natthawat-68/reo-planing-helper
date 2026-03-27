

function renderOrganizations() {
  const content = document.getElementById('pageContent');

  content.innerHTML = `
    <div class="page">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-800">การบริหารจัดการหน่วยงาน</h1>
          <p class="text-gray-500 mt-2">เพิ่ม แก้ไข และบริหารจัดการข้อมูลหน่วยงานในระบบ</p>
        </div>
        <button onclick="openOrgModal()" class="btn btn-outline gap-2 whitespace-nowrap">
          <i class="fas fa-plus-circle"></i>
          <span class="hidden sm:inline">เพิ่มหน่วยงาน</span>
          <span class="sm:hidden">เพิ่ม</span>
        </button>
      </div>

      <div class="stat-card">
        <div class="overflow-x-auto">
          <table class="table w-full table-zebra">
            <thead>
              <tr>
                <th class="min-w-[200px]">ชื่อหน่วยงาน</th>
                <th class="min-w-[120px] whitespace-nowrap">จังหวัด</th>
                <th class="whitespace-nowrap">สถานะ</th>
                <th class="whitespace-nowrap">โครงการ</th>
                <th class="text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${DB.orgs.map(org => {
                const projectCount = DB.projects.filter(p => p.orgId === org.id).length;
                return `
                  <tr>
                    <td>
                      <div>
                        <div class="font-semibold">${org.name}</div>
                      </div>
                    </td>
                    <td>
                      <span class="text-sm text-gray-700 whitespace-nowrap">${org.province || '—'}</span>
                    </td>
                    <td>
                      <span class="text-sm whitespace-nowrap flex items-center gap-1.5">
                        <i class="fas fa-${org.active ? 'check-circle' : 'times-circle'} ${org.active ? 'text-green-600' : 'text-red-600'}" style="font-size: 0.875rem;"></i>
                        <span class="${org.active ? 'text-green-600' : 'text-red-600'} font-medium">${org.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                      </span>
                    </td>
                    <td>
                      <span class="text-sm text-gray-700 whitespace-nowrap font-medium">
                        ${projectCount} รายการ
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-1.5 justify-end">
                        <button class="btn btn-sm btn-ghost whitespace-nowrap text-gray-700 hover:text-gray-900 hover:bg-gray-100" onclick="editOrg('${org.id}')" title="แก้ไข">
                          <i class="fas fa-edit text-xs"></i>
                          <span class="hidden sm:inline ml-1.5 text-xs">แก้ไข</span>
                        </button>
                        <button class="btn btn-sm btn-ghost whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50" onclick="deleteOrg('${org.id}')" title="ลบ">
                          <i class="fas fa-trash text-xs"></i>
                          <span class="hidden sm:inline ml-1.5 text-xs">ลบ</span>
                        </button>
                        <button class="btn btn-sm btn-ghost whitespace-nowrap ${org.active ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}" 
                                onclick="toggleOrgStatus('${org.id}')" title="${org.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}">
                          <i class="fas fa-${org.active ? 'ban' : 'check'} text-xs"></i>
                          <span class="hidden sm:inline ml-1.5 text-xs">${org.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderOrganizationsView() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="page">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-800">บัญชีรายชื่อหน่วยงาน</h1>
          <p class="text-gray-500 mt-2">ตรวจสอบรายชื่อหน่วยงานทั้งหมดในระบบ (สำหรับเรียกดูข้อมูล)</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="overflow-x-auto">
          <table class="table w-full table-zebra">
            <thead>
              <tr>
                <th class="min-w-[200px]">ชื่อหน่วยงาน</th>
                <th class="min-w-[120px] whitespace-nowrap">จังหวัด</th>
                <th class="whitespace-nowrap">สถานะ</th>
                <th class="whitespace-nowrap">โครงการ</th>
              </tr>
            </thead>
            <tbody>
              ${DB.orgs.map(org => {
                const projectCount = DB.projects.filter(p => p.orgId === org.id).length;
                return `
                  <tr>
                    <td>
                      <div class="font-semibold">${org.name}</div>
                    </td>
                    <td>
                      <span class="text-sm text-gray-600 whitespace-nowrap">${org.province || '—'}</span>
                    </td>
                    <td>
                      <span class="text-sm whitespace-nowrap flex items-center gap-1">
                        <i class="fas fa-${org.active ? 'check-circle' : 'times-circle'} ${org.active ? 'text-green-600' : 'text-red-600'}"></i>
                        <span class="${org.active ? 'text-green-600' : 'text-red-600'}">${org.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                      </span>
                    </td>
                    <td>
                      <span class="text-sm text-gray-600 whitespace-nowrap">
                        ${projectCount} รายการ
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function openOrgModal(orgId = null) {
  const org = orgId ? DB.orgs.find(o => o.id === orgId) : null;
  const provinceOptions = allProvincesForSelect();

  const { value: formValues } = await Swal.fire({
    title: org ? 'แก้ไขหน่วยงาน' : 'เพิ่มหน่วยงานใหม่',
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-medium mb-2">ชื่อหน่วยงาน</label>
          <input id="swal-name" class="input input-bordered w-full" 
                 value="${org ? org.name : ''}" placeholder="ระบุชื่อหน่วยงาน">
        </div>
        <div class="relative">
          <label class="block text-sm font-medium mb-2">จังหวัด</label>
          <div class="flex gap-2">
            <div class="flex-1 relative">
              <input 
                type="text" 
                id="swal-province" 
                class="input input-bordered w-full pr-10" 
                value="${org?.province || ''}" 
                placeholder="ระบุจังหวัด"
                autocomplete="off"
              >
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i class="fas fa-map-marker-alt text-gray-400"></i>
              </div>
            </div>
            <button 
              type="button" 
              id="swal-province-btn" 
              class="btn btn-outline btn-md whitespace-nowrap shrink-0 px-4"
            >
              <i class="fas fa-chevron-down mr-1 text-xs"></i>
              เลือก
            </button>
          </div>
          <div id="province-dropdown" class="hidden absolute z-50 mt-1 left-0 right-0 bg-white shadow-xl rounded-lg border border-gray-200 max-h-64 overflow-hidden" style="min-width: 200px;">
            <div class="p-2 border-b bg-gray-50 sticky top-0">
              <input 
                type="text" 
                id="province-search" 
                class="input input-bordered input-sm w-full" 
                placeholder="ค้นหาจังหวัด..."
              >
            </div>
            <div id="province-list" class="overflow-y-auto max-h-48">
              ${provinceOptions.map(p => `
                <div 
                  class="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm transition-colors province-option ${org?.province === p ? 'bg-blue-100 font-medium text-blue-700' : ''}" 
                  data-province="${p.replace(/"/g, '&quot;')}"
                >
                  ${p}
                </div>
              `).join('')}
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1.5">กรอกโดยตรง หรือกดปุ่มเลือกเพื่อค้นหาจากรายการ</p>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563eb',
    didOpen: () => {
      const btn = document.getElementById('swal-province-btn');
      const dropdown = document.getElementById('province-dropdown');
      const searchInput = document.getElementById('province-search');
      const provinceInput = document.getElementById('swal-province');

      // Toggle dropdown
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown?.classList.contains('hidden');
        // Close all dropdowns
        document.querySelectorAll('.province-dropdown-panel').forEach(d => d.classList.add('hidden'));
        
        if (isHidden && dropdown) {
          dropdown.classList.remove('hidden');
          dropdown.classList.add('province-dropdown-panel');
          searchInput?.focus();
        }
      });

      // Filter provinces
      searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.province-option').forEach(opt => {
          const text = opt.textContent.toLowerCase();
          opt.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
      });

      // Select province
      document.querySelectorAll('.province-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const province = opt.dataset.province;
          if (provinceInput) provinceInput.value = province;
          document.querySelectorAll('.province-option').forEach(o => {
            o.classList.remove('bg-blue-100', 'font-medium', 'text-blue-700');
          });
          opt.classList.add('bg-blue-100', 'font-medium', 'text-blue-700');
          if (dropdown) dropdown.classList.add('hidden');
        });
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && !btn?.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
    },
    preConfirm: () => {
      const name = document.getElementById('swal-name').value.trim();
      const province = document.getElementById('swal-province')?.value?.trim() || '';
      if (!name) {
        Swal.showValidationMessage('กรุณาระบุชื่อหน่วยงาน');
        return false;
      }
      if (!province) {
        Swal.showValidationMessage('กรุณาระบุจังหวัด');
        return false;
      }
      return { name, province };
    }
  });

  if (formValues) {
    try {
      if (org) {
        await api.updateOrg(org.id, { name: formValues.name, province: formValues.province });
        showSuccess('อัปเดตสำเร็จ', 'ข้อมูลหน่วยงานถูกอัปเดตแล้ว');
      } else {
        await api.createOrg({ name: formValues.name, province: formValues.province });
        initLogin();
        showSuccess('เพิ่มสำเร็จ', 'หน่วยงานใหม่ถูกเพิ่มแล้ว');
      }
      await refreshFromApi();
    } catch (e) {
      showError('เกิดข้อผิดพลาด', e.message);
      return;
    }
    renderOrganizations();
  }
}

function editOrg(orgId) {
  openOrgModal(orgId);
}

async function toggleOrgStatus(orgId) {
  const org = DB.orgs.find(o => o.id === orgId);
  const action = org.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน';

  const ok = await confirm(
    `${action}หน่วยงาน`,
    `ต้องการ${action} "${org.name}" ใช่หรือไม่?`,
    action
  );

  if (ok) {
    try {
      await api.updateOrg(orgId, { active: !org.active });
      await refreshFromApi();
      initLogin();
      showSuccess(`${action}สำเร็จ`, `หน่วยงาน ${org.name} ถูก${action}แล้ว`);
    } catch (e) {
      showError('เกิดข้อผิดพลาด', e.message);
      return;
    }
    renderOrganizations();
  }
}

async function deleteOrg(orgId) {
  if (session?.role !== 'admin') return;
  const org = DB.orgs.find(o => o.id === orgId);
  if (!org) return;

  const projectCount = DB.projects.filter(p => p.orgId === orgId).length;

  if (projectCount > 0) {
    showError('ไม่สามารถลบได้', 'กรุณาลบโครงการที่เกี่ยวข้องก่อน');
    return;
  }

  const ok = await Swal.fire({
    title: 'ลบหน่วยงาน',
    html: `<p>ต้องการลบหน่วยงาน <strong>${org.name}</strong> ใช่หรือไม่?</p><p class="text-sm text-red-600 mt-2">การลบไม่สามารถย้อนกลับได้</p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#d33'
  });

  if (!ok.isConfirmed) return;

  try {
    await api.deleteOrg(orgId);
    await refreshFromApi();
    showSuccess('ลบสำเร็จ', 'หน่วยงานถูกลบแล้ว');
    renderOrganizations();
  } catch (e) {
    showError('เกิดข้อผิดพลาด', e.message);
  }
}
