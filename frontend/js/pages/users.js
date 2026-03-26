

function renderUsers() {
  const content = document.getElementById('pageContent');
  if (session?.role !== 'admin') {
    content.innerHTML = '<div class="page"><div class="stat-card"><div class="alert alert-error"><i class="fas fa-ban"></i><span>เฉพาะผู้ดูแลระบบเท่านั้น</span></div></div></div>';
    return;
  }

  const orgs = (DB.orgs || []).slice();

  content.innerHTML = `
    <div class="page">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-800">การจัดการรหัส PIN หน่วยงาน</h1>
          <p class="text-gray-500 mt-2">สำหรับการยืนยันตัวตนเพื่อเข้าสู่ระบบแยกตามรายหน่วยงาน (รหัส PIN 6 หลัก)</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="overflow-x-auto">
          <table class="table w-full table-zebra">
            <thead>
              <tr>
                <th class="min-w-[200px]">หน่วยงาน</th>
                <th class="whitespace-nowrap">สถานะ</th>
                <th class="whitespace-nowrap min-w-[150px]">PIN</th>
                <th class="text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${orgs.map(org => `
                <tr>
                  <td class="font-medium">${org.name}</td>
                  <td>
                    <span class="text-sm whitespace-nowrap flex items-center gap-1.5">
                      <i class="fas fa-${org.active ? 'check-circle' : 'times-circle'} ${org.active ? 'text-green-600' : 'text-red-600'}" style="font-size: 0.875rem;"></i>
                      <span class="${org.active ? 'text-green-600' : 'text-red-600'} font-medium">${org.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-mono tracking-widest text-gray-700 pin-mask" data-pin="${org.pin}">••••••</span>
                      <button class="btn btn-xs btn-ghost text-gray-400 hover:text-gray-600" onclick="window.toggleTablePin(this)">
                        <i class="fas fa-eye text-xs"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-1.5 justify-end">
                      <button class="btn btn-sm btn-ghost whitespace-nowrap text-gray-700 hover:text-gray-900 hover:bg-gray-100" onclick="setOrgPin('${org.id}')" title="ตั้งค่าหรือรีเซ็ต PIN">
                        <i class="fas fa-key text-xs"></i> <span class="hidden sm:inline ml-1.5 text-xs">ตั้งค่า/รีเซ็ต PIN</span><span class="sm:hidden text-xs">PIN</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.toggleTablePin = function(btn) {
  const container = btn.parentElement;
  const pinMask = container.querySelector('.pin-mask');
  const icon = btn.querySelector('i');
  const actualPin = pinMask.getAttribute('data-pin');
  
  if (pinMask.textContent === '••••••') {
    pinMask.textContent = actualPin;
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    pinMask.textContent = '••••••';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
};

async function setOrgPin(orgId) {
  if (session?.role !== 'admin') return;
  const org = (DB.orgs || []).find(o => o.id === orgId);
  if (!org) return;

  const { value: pin } = await Swal.fire({
    title: 'ตั้งค่าหรือรีเซ็ต PIN หน่วยงาน',
    html: `
      <div class="text-left space-y-2">
        <p>หน่วยงาน: <strong>${org.name}</strong></p>
        <div class="relative mt-3">
          <input id="swal-orgpin" class="input input-bordered w-full pr-10" type="password"
                 placeholder="ระบุรหัส PIN ใหม่ (6 หลัก)" maxlength="6" inputmode="numeric">
          <button type="button" onclick="const i=document.getElementById('swal-orgpin'); const ic=document.getElementById('swal-pin-icon'); if(i.type==='password'){i.type='text';ic.className='fas fa-eye-slash text-gray-500';}else{i.type='password';ic.className='fas fa-eye text-gray-500';}" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <i class="fas fa-eye text-gray-500" id="swal-pin-icon"></i>
          </button>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563eb',
    preConfirm: () => {
      const p = document.getElementById('swal-orgpin').value.trim();
      if (!/^\d{6}$/.test(p)) {
        Swal.showValidationMessage('PIN ต้องเป็นตัวเลข 6 หลัก');
        return false;
      }
      return p;
    }
  });

  if (pin) {
    try {
      await api.setOrgPin(orgId, pin);
      await refreshFromApi();
      showSuccess('บันทึกสำเร็จ', 'PIN หน่วยงานถูกอัปเดตแล้ว');
    } catch (e) {
      showError('เกิดข้อผิดพลาด', e.message);
      return;
    }
    renderUsers();
  }
}
