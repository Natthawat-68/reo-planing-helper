
let charts = {};

/* ── State ── */
let activeProvince = "";       // "" = ทุกจังหวัด
let provinceOptions = [];      // [{value, label}]

async function renderDashboard() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="page flex items-center justify-center min-h-[200px]"><span class="loading loading-spinner loading-lg text-primary"></span></div>';

  try {
    provinceOptions = await api.getDashboardProvinceOptions();
  } catch {
    provinceOptions = [];
  }

  await loadAndRenderDashboard();
}

async function loadAndRenderDashboard() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="page flex items-center justify-center min-h-[200px]"><span class="loading loading-spinner loading-lg text-primary"></span></div>';

  // ส่ง province params - "" = ทุกจังหวัด, "__unspecified__" = ไม่ระบุ
  const params = activeProvince !== "" ? { province: activeProvince } : {};

  let totalProjects = 0, totalBudget = 0, totalOrgs = 0;
  let byOrgItems = [], bySdgItems = [], byProvinceItems = [];

  try {
    const [summary, byOrg, bySdg, byProvince] = await Promise.all([
      api.getDashboardSummary(params),
      api.getDashboardByOrg(params),
      api.getDashboardBySdg(params),
      api.getDashboardByProvince(),
    ]);
    totalProjects = summary.totalProjects ?? 0;
    totalBudget = summary.totalBudget ?? 0;
    totalOrgs = summary.totalOrgs ?? 0;
    byOrgItems = byOrg;
    bySdgItems = bySdg;
    byProvinceItems = byProvince;
  } catch (e) {
    content.innerHTML = `<div class="page"><div class="alert alert-error">${e.message || 'โหลดข้อมูลไม่สำเร็จ'}</div></div>`;
    return;
  }

  window._dashboardByOrg = byOrgItems;
  window._dashboardBySdg = bySdgItems;
  window._dashboardByProvince = byProvinceItems;

  const provinceSelectHtml = `
    <select id="dash-province-select" class="select select-bordered select-sm w-auto min-w-[180px]" onchange="onDashboardProvinceChange(this.value)">
      <option value="">ทั้งหมด</option>
      ${provinceOptions.filter(p => p.value && p.value !== "__unspecified__" && p.value !== "ไม่ระบุ").map(p => `<option value="${String(p.value).replace(/"/g, '&quot;')}" ${activeProvince === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
    </select>
  `;

  // Province section - แสดงเฉพาะเมื่อไม่ได้เลือกจังหวัด
  const isProvinceSelected = activeProvince && activeProvince !== "";
  
  // Build province items based on filter
  let displayByProvinceItems = byProvinceItems;
  if (isProvinceSelected) {
    displayByProvinceItems = byProvinceItems.filter(item => 
      (item.province || '') === activeProvince
    );
  }
  
  // แสดงส่วนภาพรวมรายจังหวัดเฉพาะเมื่อไม่ได้เลือกจังหวัด
  const provinceSectionHtml = !isProvinceSelected && displayByProvinceItems.length > 0 ? `
    <!-- ภาพรวมรายจังหวัด -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-map-marked-alt text-blue-600"></i>
          ${isProvinceSelected ? `ข้อมูลจังหวัด${activeProvince !== '__unspecified__' ? ` ${activeProvince}` : ' (ไม่ระบุ)'}` : 'ภาพรวมรายจังหวัด'}
        </h2>
        <span class="badge badge-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
          <i class="fas fa-map-pin text-xs mr-1"></i>${displayByProvinceItems.length} จังหวัด
        </span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Province Bar Chart -->
        <div class="stat-card lg:col-span-2 card-hover">
          <h3 class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="fas fa-chart-bar text-blue-500"></i>
            ${isProvinceSelected ? 'จำนวนโครงการ & งบประมาณ' : 'จำนวนโครงการ & งบประมาณรายจังหวัด'}
          </h3>
          <div class="chart-container" style="height: 280px;">
            <canvas id="chartProvinceOverview"></canvas>
          </div>
        </div>
        <!-- Top Province Stats -->
        <div class="stat-card card-hover">
          <h3 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-md bg-orange-100 text-orange-500 shrink-0">
              <i class="fas fa-medal text-sm"></i>
            </span>
            ${isProvinceSelected ? 'สถิติจังหวัดนี้' : 'จังหวัดที่มีโครงการมากที่สุด'}
          </h3>
          <div id="topProvinces" class="space-y-3"></div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">รวมทั้งหมด</span>
              <span class="font-bold text-gray-700">${isProvinceSelected ? (displayByProvinceItems.reduce((sum, p) => sum + (p.count || 0), 0)) : totalProjects} โครงการ</span>
            </div>
            <div class="flex items-center justify-between text-sm mt-1">
              <span class="text-gray-500">งบประมาณรวม</span>
              <span class="font-bold text-gray-700">${formatMoney(isProvinceSelected ? (displayByProvinceItems.reduce((sum, p) => sum + (p.budget || 0), 0)) : totalBudget)} ฿</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Province Table -->
      <div class="stat-card mt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-700 flex items-center gap-2">
            <i class="fas fa-list text-green-600"></i>
            ${isProvinceSelected ? 'รายละเอียดจังหวัดนี้' : 'รายละเอียดทุกจังหวัด'}
          </h3>
          ${!isProvinceSelected ? `
          <div class="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
            <i class="fas fa-hand-pointer"></i>
            <span>คลิกแถวเพื่อดูรายละเอียด</span>
          </div>
          ` : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="min-w-[150px] font-semibold text-gray-700">
                  <span class="flex items-center gap-1">
                    <i class="fas fa-map-pin text-blue-500 text-xs"></i> จังหวัด
                  </span>
                </th>
                <th class="text-right whitespace-nowrap font-semibold text-gray-700">หน่วยงาน</th>
                <th class="text-right whitespace-nowrap font-semibold text-gray-700">โครงการ</th>
                <th class="text-right whitespace-nowrap font-semibold text-gray-700">งบประมาณ (บาท)</th>
                <th class="text-center whitespace-nowrap hidden lg:table-cell font-semibold text-gray-700">SDG หลัก</th>
              </tr>
            </thead>
            <tbody id="tableByProvince"></tbody>
          </table>
        </div>
      </div>
    </div>
  ` : '';

  content.innerHTML = `
    <div class="page">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-800">ภาพรวมการดำเนินงาน</h1>
          ${activeProvince && activeProvince !== "" ? `
          <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <a href="#" onclick="event.preventDefault(); onDashboardProvinceChange('')" class="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
              <i class="fas fa-home"></i> หน้าแรก
            </a>
            <i class="fas fa-chevron-right text-xs text-gray-400"></i>
            <span class="text-gray-700 font-medium">${activeProvince === "__unspecified__" ? "ไม่ระบุจังหวัด" : activeProvince}</span>
          </div>
          ` : `
          <p class="text-gray-500 mt-2">รายงานสรุปข้อมูลโครงการและหน่วยงานรายสถาบัน</p>
          `}
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          ${provinceSelectHtml}
          <button onclick="exportCSV()" class="btn btn-outline gap-2 whitespace-nowrap">
            <i class="fas fa-download"></i>
            <span class="hidden sm:inline">ส่งออกรายงาน (CSV)</span>
            <span class="sm:hidden">ส่งออก</span>
          </button>
        </div>
      </div>

      <!-- Active Province Filter Banner -->
      ${activeProvince && activeProvince !== "" ? `
      <div class="mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-5 py-3 shadow-sm">
        <div class="w-10 h-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
          <i class="fas fa-map-marked-alt text-blue-600 text-lg"></i>
        </div>
        <div class="flex-1">
          <p class="text-xs text-blue-500 font-medium uppercase tracking-wide">กรองข้อมูลตามจังหวัด</p>
          <p class="text-blue-900 font-semibold text-lg leading-tight">${activeProvince === "__unspecified__" ? "ไม่ระบุจังหวัด" : activeProvince}</p>
        </div>
        <button onclick="onDashboardProvinceChange('')" class="ml-auto btn btn-sm btn-outline btn-primary gap-1.5 shadow-sm">
          <i class="fas fa-times"></i>
          ดูทั้งหมด
        </button>
      </div>
      ` : ''}

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- โครงการทั้งหมด -->
        <div class="stat-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">โครงการทั้งหมด</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">${totalProjects}</p>
              <p class="text-sm text-gray-500 mt-1">รายการ</p>
            </div>
            <div class="w-14 h-14 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
              <i class="fas fa-project-diagram"></i>
            </div>
          </div>
        </div>

        <!-- งบประมาณรวม -->
        <div class="stat-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">งบประมาณรวม</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">${formatMoney(totalBudget)}</p>
              <p class="text-sm text-gray-500 mt-1">บาท</p>
            </div>
            <div class="w-14 h-14 shrink-0 rounded-xl bg-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
              <i class="fas fa-coins"></i>
            </div>
          </div>
        </div>

        <!-- หน่วยงาน -->
        <div class="stat-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">หน่วยงาน</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">${totalOrgs}</p>
              <p class="text-sm text-gray-500 mt-1">หน่วยงานที่ใช้งาน</p>
            </div>
            <div class="w-14 h-14 shrink-0 rounded-xl bg-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
              <i class="fas fa-building"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Province Detail Section (shown when province is selected) -->
      ${activeProvince !== "" ? `
      <div class="mb-8">
        <div class="stat-card mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
              <i class="fas fa-map-marked-alt text-blue-600 text-lg"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                ข้อมูลใน${activeProvince === "__unspecified__" ? "โครงการไม่ระบุจังหวัด" : "จังหวัด " + activeProvince}
              </h2>
              <p class="text-sm text-gray-500">รายการโครงการในขอบเขตนี้</p>
            </div>
            <button onclick="onDashboardProvinceChange('')" class="ml-auto btn btn-sm btn-outline btn-primary gap-1.5">
              <i class="fas fa-times"></i>
              ยกเลิกการกรอง
            </button>
          </div>
        </div>

        <!-- Projects in Province -->
        <div class="stat-card mb-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-list-check text-blue-600"></i>
            รายชื่อโครงการ
            <span class="badge badge-primary badge-outline ml-2" id="provinceProjectCount">-</span>
          </h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
              <thead>
                <tr class="bg-gray-50">
                  <th class="min-w-[250px] font-semibold text-gray-700">ชื่อโครงการ</th>
                  <th class="min-w-[150px] font-semibold text-gray-700">หน่วยงาน</th>
                  <th class="text-right whitespace-nowrap font-semibold text-gray-700">งบประมาณ</th>
                  <th class="whitespace-nowrap font-semibold text-gray-700">SDG Targets</th>
                </tr>
              </thead>
              <tbody id="provinceProjectsTable"></tbody>
            </table>
          </div>
        </div>

        <!-- SDG Usage in Province -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="stat-card">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-bullseye text-green-600"></i>
              SDG ที่ใช้ในจังหวัดนี้
            </h3>
            <div id="provinceSdgList" class="space-y-2"></div>
          </div>
          <div class="stat-card">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-chart-pie text-purple-600"></i>
              สัดส่วน SDG
            </h3>
            <div class="chart-container" style="height: 220px;">
              <canvas id="chartProvinceSdg"></canvas>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Province Section (always visible) -->
      ${provinceSectionHtml}

      <!-- SDG Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- กราฟ SDG ที่ใช้มากที่สุด -->
        <div class="stat-card card-hover">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-trophy text-amber-500"></i>
            เป้าหมาย SDG ยอดนิยม
            ${activeProvince && activeProvince !== "" ? `<span class="text-sm font-normal text-gray-500">(${activeProvince === "__unspecified__" ? "ไม่ระบุ" : activeProvince})</span>` : ''}
          </h3>
          <div class="chart-container" style="height: 180px;">
            <canvas id="chartSdgTop"></canvas>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-center">
              <span class="text-xs text-gray-500 block">SDG ที่ใช้มากที่สุด</span>
              <span class="text-xl font-bold text-blue-600" id="kpiSdgTop">-</span>
            </p>
          </div>
        </div>

        <!-- กราฟจำนวน SDG ต่อโครงการ -->
        <div class="stat-card card-hover">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-layer-group text-indigo-500"></i>
            โครงการตามจำนวนเป้าหมาย
            ${activeProvince && activeProvince !== "" ? `<span class="text-sm font-normal text-gray-500">(${activeProvince === "__unspecified__" ? "ไม่ระบุ" : activeProvince})</span>` : ''}
          </h3>
          <div class="chart-container" style="height: 180px;">
            <canvas id="chartSdgMulti"></canvas>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-center">
              <span class="text-xs text-gray-500 block">โครงการหลายเป้าหมาย</span>
              <span class="text-xl font-bold text-indigo-600" id="kpiMultiPct">-</span>
            </p>
          </div>
        </div>

        <!-- กราฟการกระจายตามหมวดหมู่ -->
        <div class="stat-card card-hover">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-shapes text-teal-500"></i>
            การกระจายตามหมวดหมู่ SDG 4
            ${activeProvince && activeProvince !== "" ? `<span class="text-sm font-normal text-gray-500">(${activeProvince === "__unspecified__" ? "ไม่ระบุ" : activeProvince})</span>` : ''}
          </h3>
          <div class="chart-container" style="height: 180px;">
            <canvas id="chartSdgGroups"></canvas>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-center">
              <span class="text-xs text-gray-500 block">หมวดหมู่ที่ใช้มากสุด</span>
              <span class="text-xl font-bold text-teal-600" id="kpiTopGroup">-</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ตารางสรุปตามหน่วยงาน -->
        <div class="stat-card">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-building text-orange-500"></i>
            สรุปตามหน่วยงาน
            ${activeProvince && activeProvince !== "" ? `<span class="text-sm font-normal text-gray-500">(${activeProvince === "__unspecified__" ? "ไม่ระบุ" : activeProvince})</span>` : ''}
          </h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th class="min-w-[150px]">หน่วยงาน</th>
                  <th class="text-right whitespace-nowrap">โครงการ</th>
                  <th class="text-right whitespace-nowrap">งบประมาณ</th>
                </tr>
              </thead>
              <tbody id="tableByOrg">
              </tbody>
            </table>
          </div>
        </div>

        <!-- ตารางสรุปตาม SDG -->
        <div class="stat-card">
          <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-bullseye text-green-500"></i>
            สรุปตาม SDG Target
            ${activeProvince && activeProvince !== "" ? `<span class="text-sm font-normal text-gray-500">(${activeProvince === "__unspecified__" ? "ไม่ระบุ" : activeProvince})</span>` : ''}
          </h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th class="min-w-[150px]">SDG</th>
                  <th class="text-right whitespace-nowrap">จำนวนโครงการ</th>
                </tr>
              </thead>
              <tbody id="tableBySdg">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  renderDashboardData();
  renderProvinceSection();
  renderProvinceDetailSection();
  scheduleDashboardCharts();
}

function onDashboardProvinceChange(value) {
  // ถ้าเลือก "ไม่ระบุ" ให้ใช้ค่าว่างในการ filter
  activeProvince = value === "__unspecified__" ? "" : value;
  loadAndRenderDashboard();
}

function renderProvinceSection() {
  // ข้ามถ้าเลือกจังหวัดเฉพาะ (มี provinceSectionHtml เป็น empty แล้ว)
  if (activeProvince && activeProvince !== "") return;
  
  const allItems = window._dashboardByProvince || [];
  const province = activeProvince;
  
  // Filter items based on selected province
  const items = province
    ? allItems.filter(item => (item.province || '') === province)
    : allItems;
  
  const byOrgItems = window._dashboardByOrg || [];
  const bySdgItems = window._dashboardBySdg || [];

  /* ── Top provinces cards ── */
  const topEl = document.getElementById('topProvinces');
  if (topEl) {
    const sorted = [...items].sort((a, b) => b.projectCount - a.projectCount);
    const rankStyles = [
      {
        wrap: 'bg-amber-50/90 border border-amber-100/80 border-l-[5px] border-l-amber-400',
        iconWrap: 'shadow-sm',
        icon: 'fa-crown text-orange-500 text-lg',
      },
      {
        wrap: 'bg-slate-100/80 border border-slate-200/90 border-l-[5px] border-l-slate-400',
        iconWrap: 'shadow-sm',
        icon: 'fa-medal text-slate-400 text-lg',
      },
      {
        wrap: 'bg-orange-50/70 border border-orange-100 border-l-[5px] border-l-orange-400',
        iconWrap: 'shadow-sm',
        icon: 'fa-medal text-orange-500 text-lg',
      },
    ];
    topEl.innerHTML = sorted.slice(0, 3).map((item, i) => {
      const m = rankStyles[i] || {
        wrap: 'bg-gray-50 border border-gray-200 border-l-[5px] border-l-gray-300',
        iconWrap: 'shadow-sm',
        icon: 'fa-star text-gray-400',
      };
      const budgetLabel = (item.budget || 0).toLocaleString('th-TH');
      return `
        <div class="flex items-center gap-3 pl-2 pr-3 py-3 rounded-xl ${m.wrap} hover:shadow-sm transition-shadow cursor-default">
          <div class="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center ${m.iconWrap}">
            <i class="fas ${m.icon}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 truncate">${item.province}</p>
            <p class="text-xs text-gray-500 mt-0.5">${item.projectCount} โครงการ</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-bold text-emerald-600">${budgetLabel}</p>
            <p class="text-xs text-gray-500 mt-0.5">บาท</p>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Province table ── */
  const tableEl = document.getElementById('tableByProvince');
  if (tableEl) {
    tableEl.innerHTML = items
      .sort((a, b) => b.projectCount - a.projectCount)
      .map(item => {
        const topSdg = item.topSdg;
        const sdgMeta = SDG_TARGETS.find(t => t.id === topSdg);
        const sdgDisplay = topSdg && sdgMeta
          ? `<span class="badge badge-sm" style="background:${sdgMeta.color}; color: white;"><i class="fas fa-chart-pie text-xs mr-1"></i>${topSdg}</span>`
          : `<span class="badge badge-sm bg-gray-100 text-gray-400 border border-gray-200"><i class="fas fa-minus text-xs mr-1"></i>-</span>`;
        const isSelected = activeProvince && activeProvince !== "";
        return `
          <tr class="${activeProvince === item.province ? 'bg-blue-50 font-semibold' : ''} hover:bg-blue-50/50 transition-colors ${!isSelected ? 'cursor-pointer' : ''}"
              onclick="${!isSelected ? `onDashboardProvinceChange('${String(item.province).replace(/'/g, "\\'")}')` : ''}">
            <td>
              <button onclick="${!isSelected ? `event.stopPropagation(); onDashboardProvinceChange('${String(item.province).replace(/'/g, "\\'")}')` : ''}"
                      class="text-left flex items-center gap-2 hover:text-blue-600 transition-colors ${activeProvince === item.province ? 'text-blue-700 font-semibold' : 'text-gray-800'}">
                <i class="fas fa-map-pin text-blue-500 text-xs"></i>
                ${item.province}
              </button>
            </td>
            <td class="text-right">${item.orgCount ?? 0}</td>
            <td class="text-right font-medium">${item.projectCount ?? 0}</td>
            <td class="text-right">${formatMoney(item.budget)} ฿</td>
            <td class="text-center hidden lg:table-cell">
              ${sdgDisplay}
            </td>
          </tr>
        `;
      }).join('');
  }

  /* ── Province overview bar chart ── */
  requestAnimationFrame(() => {
    const ctx = document.getElementById('chartProvinceOverview');
    if (!ctx) return;

    if (charts['chartProvinceOverview']) {
      charts['chartProvinceOverview'].destroy();
      charts['chartProvinceOverview'] = null;
    }

    const sorted = [...items].sort((a, b) => b.projectCount - a.projectCount);
    const chartItems = sorted;
    const labels = chartItems.map(i => i.province);
    const projectValues = chartItems.map(i => i.projectCount);
    const budgetValues = chartItems.map(i => Math.round(i.budget || 0));

    if (labels.length === 0) return;

    const maxProjCount = Math.max(1, ...projectValues);
    const projAxisIntegers = maxProjCount <= 40;

    charts['chartProvinceOverview'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'จำนวนโครงการ',
            data: projectValues,
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'งบประมาณ',
            data: budgetValues,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: 'rgba(5, 150, 105, 1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return ` ${ctx.parsed.y} โครงการ`;
                return ` งบประมาณ ${ctx.parsed.y.toLocaleString('th-TH')} บาท`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false },
          },
          y: {
            position: 'left',
            ticks: {
              font: { size: 11 },
              ...(projAxisIntegers
                ? {
                    stepSize: 1,
                    precision: 0,
                    callback: (v) => (Number.isInteger(v) ? v : null),
                  }
                : {}),
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
            beginAtZero: true,
            ...(projAxisIntegers ? { max: maxProjCount } : { suggestedMax: maxProjCount }),
            title: { display: true, text: 'โครงการ', font: { size: 11 } },
          },
          y2: {
            position: 'right',
            ticks: { font: { size: 11 }, callback: (v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v },
            grid: { display: false },
            beginAtZero: true,
            title: { display: true, text: 'งบ (บาท)', font: { size: 11 } },
          },
        },
      },
    });
  });
}

function renderProvinceDetailSection() {
  // ไม่แสดงถ้าเป็น "ทุกจังหวัด" (activeProvince === "")
  if (activeProvince === "") return;

  const province = activeProvince === "__unspecified__" ? "" : activeProvince;
  const projects = DB?.projects || [];
  const byOrgItems = window._dashboardByOrg || [];

  // กรองโครงการตามจังหวัด (รวม "ไม่ระบุ" ที่ province ว่าง)
  const provProjects = projects.filter(p => {
    const org = DB?.orgs?.find(o => o.id === p.orgId);
    const projProv = (p.province || '').trim();
    const orgProv = (org?.province || '').trim();
    if (province === "") {
      // "ไม่ระบุ" - กรองเฉพาะ province ว่าง
      return projProv === "" || (projProv === "" && orgProv === "");
    }
    return projProv === province || orgProv === province;
  });

  // กรอง byOrgItems ตามจังหวัด
  const provOrgItems = byOrgItems.filter(item => {
    const org = DB?.orgs?.find(o => o.id === item.orgId);
    const orgProv = (org?.province || '').trim();
    return orgProv === activeProvince;
  });

  // แสดงรายชื่อโครงการ
  const projTableEl = document.getElementById('provinceProjectsTable');
  if (projTableEl) {
    if (provProjects.length === 0) {
      projTableEl.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-gray-500">
            <i class="fas fa-inbox text-4xl mb-2 block opacity-50"></i>
            ไม่พบโครงการในจังหวัดนี้
          </td>
        </tr>
      `;
    } else {
      projTableEl.innerHTML = provProjects.map(p => {
        const org = DB?.orgs?.find(o => o.id === p.orgId);
        const sdgBadges = (p.sdg || []).map(sdg => {
          const meta = SDG_TARGETS.find(t => t.id === sdg);
          return `<span class="badge badge-xs" style="background:${meta?.color || '#94a3b8'}; color: white;">${sdg}</span>`;
        }).join(' ');
        return `
          <tr class="hover:bg-blue-50/50 transition-colors">
            <td class="font-medium text-gray-800">${p.title || '-'}</td>
            <td class="text-gray-600">${org?.name || '-'}</td>
            <td class="text-right">${formatMoney(p.budget)} ฿</td>
            <td>${sdgBadges || '<span class="text-gray-400 text-xs">-</span>'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // นับ SDG ที่ใช้ในจังหวัด
  const sdgCount = {};
  provProjects.forEach(p => {
    (p.sdg || []).forEach(code => {
      sdgCount[code] = (sdgCount[code] || 0) + 1;
    });
  });

  const sdgSorted = Object.entries(sdgCount).sort((a, b) => b[1] - a[1]);

  // แสดงรายการ SDG
  const sdgListEl = document.getElementById('provinceSdgList');
  if (sdgListEl) {
    if (sdgSorted.length === 0) {
      sdgListEl.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-chart-pie text-3xl mb-2 block opacity-50"></i>
          ไม่มีข้อมูล SDG
        </div>
      `;
    } else {
      sdgListEl.innerHTML = sdgSorted.slice(0, 8).map(([code, count]) => {
        const meta = SDG_TARGETS.find(t => t.id === code);
        return `
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="badge badge-sm" style="background:${meta?.color || '#94a3b8'}; color: white; min-width: 50px;">${code}</span>
            <span class="flex-1 text-sm text-gray-700">${meta?.label || '-'}</span>
            <span class="text-sm font-semibold text-gray-800">${count} โครงการ</span>
          </div>
        `;
      }).join('');
    }
  }

  // วาดกราฟ SDG
  const chartCtx = document.getElementById('chartProvinceSdg');
  if (chartCtx) {
    if (charts['chartProvinceSdg']) {
      charts['chartProvinceSdg'].destroy();
      charts['chartProvinceSdg'] = null;
    }

    const labels = sdgSorted.slice(0, 6).map(([code]) => {
      const meta = SDG_TARGETS.find(t => t.id === code);
      return `${code} ${meta?.label || ''}`;
    });
    const values = sdgSorted.slice(0, 6).map(([, v]) => v);
    const colors = sdgSorted.slice(0, 6).map(([code]) => {
      const meta = SDG_TARGETS.find(t => t.id === code);
      return meta?.color || '#94a3b8';
    });

    if (values.length > 0) {
      charts['chartProvinceSdg'] = new Chart(chartCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                  return `${context.label}: ${context.parsed} โครงการ (${pct}%)`;
                }
              }
            }
          },
          cutout: '55%'
        }
      });
    }
  }

  // Update count badge
  const countEl = document.getElementById('provinceProjectCount');
  if (countEl) countEl.textContent = provProjects.length;
}

function scheduleDashboardCharts() {
  const tryRender = (attempt = 0) => {
    const chartReady = typeof window.Chart === 'function';
    const canvasReady = !!document.getElementById('chartSdgTop');
    const pageVisible = !document.getElementById('mainApp')?.classList.contains('hidden');

    if (!chartReady || !canvasReady || !pageVisible) {
      if (attempt < 30) return setTimeout(() => tryRender(attempt + 1), 100);
      return;
    }

    renderDashboardCharts();

    requestAnimationFrame(() => {
      try {
        Object.values(charts || {}).forEach(c => {
          if (c && typeof c.resize === 'function') c.resize();
        });
      } catch { }
    });
  };

  requestAnimationFrame(() => setTimeout(() => tryRender(0), 0));
}

function renderDashboardData() {
  const projects = DB.projects || [];
  const province = activeProvince;
  
  // Filter by province
  const filteredProjects = province
    ? projects.filter(p => (p.province || '') === province)
    : projects;
  
  // Filter org data by province
  const byOrgData = province
    ? (window._dashboardByOrg || []).filter(item => {
        // ใช้ item.province จาก API (ซึ่งมาจาก province ของโครงการ) ไม่ใช่ org.province
        return (item.province || '') === province;
      })
    : (window._dashboardByOrg || []);
  
  const tableByOrg = document.getElementById('tableByOrg');
  if (tableByOrg) {
    if (byOrgData.length === 0) {
      tableByOrg.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">-</td></tr>`;
    } else {
      tableByOrg.innerHTML = byOrgData
        .map(item => `
          <tr>
            <td class="font-medium">${item.orgName || getOrgName(item.orgId)}</td>
            <td class="text-right">${item.projectCount ?? item.count ?? 0}</td>
            <td class="text-right">${formatMoney(item.budget)} ฿</td>
          </tr>
        `).join('');
    }
  }

  // Filter SDG data by province
  const sdgCount = {};
  filteredProjects.forEach(p => {
    (p.sdg || []).forEach(code => {
      sdgCount[code] = (sdgCount[code] || 0) + 1;
    });
  });
  const bySdgData = Object.entries(sdgCount)
    .sort((a, b) => b[1] - a[1])
    .map(([sdg, count]) => ({ sdg, projectCount: count }));

  const tableBySdg = document.getElementById('tableBySdg');
  if (tableBySdg) {
    if (bySdgData.length === 0) {
      tableBySdg.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-gray-500">-</td></tr>`;
    } else {
      tableBySdg.innerHTML = bySdgData
        .map(item => {
          const t = SDG_TARGETS.find(x => x.id === item.sdg);
          const colors = t ? getSoftBadgeColors(t.color) : { bg: '#94a3b8', text: '#fff' };
          return `
          <tr>
            <td>
              <span class="badge badge-sm" style="background: ${colors.bg}; color: ${colors.text};">
                ${item.sdg}
              </span>
            </td>
            <td class="text-right">${item.projectCount ?? item.count ?? 0}</td>
          </tr>
        `}).join('');
    }
  }
}

function renderDashboardCharts() {
  const projects = DB.projects || [];
  const province = activeProvince;
  
  // Filter by province
  const filtered = province
    ? projects.filter(p => (p.province || '') === province)
    : projects;

  const sdgCount = {};
  filtered.forEach(p => {
    (p.sdg || []).forEach(code => {
      sdgCount[code] = (sdgCount[code] || 0) + 1;
    });
  });

  const sdgSorted = Object.entries(sdgCount).sort((a, b) => b[1] - a[1]);

  const topN = 5;
  const top = sdgSorted.slice(0, topN);

  const sdgLabels = top.map(([code]) => {
    const meta = SDG_TARGETS.find(t => t.id === code);
    return meta ? `${code} - ${meta.label}` : code;
  });
  const sdgValues = top.map(([, v]) => v);

  createDoughnutChart('chartSdgTop', { labels: sdgLabels, values: sdgValues }, ['#2563eb', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#94a3b8']);

  const top1 = sdgSorted[0];
  const top1Label = top1 ? top1[0] : '-';
  const top1Count = top1 ? top1[1] : 0;
  const kpiSdgTop = document.getElementById('kpiSdgTop');
  if (kpiSdgTop) kpiSdgTop.textContent = top1 ? `${top1Label} (${top1Count})` : '-';

  let single = 0, multi = 0, none = 0;
  filtered.forEach(p => {
    const n = (p.sdg || []).length;
    if (n === 0) none++;
    else if (n === 1) single++;
    else multi++;
  });
  createDoughnutChart(
    'chartSdgMulti',
    { labels: ['1 เป้าหมาย', 'หลายเป้าหมาย', 'ไม่ระบุ'], values: [single, multi, none] },
    ['#16a34a', '#2563eb', '#94a3b8']
  );

  const kpiMultiPct = document.getElementById('kpiMultiPct');
  if (kpiMultiPct) {
    const denom = Math.max(1, single + multi + none);
    const pct = Math.round((multi / denom) * 100);
    kpiMultiPct.textContent = `${pct}%`;
  }

  const groups = [
    { id: 'access', label: 'คุณภาพการศึกษาในทุกระดับ', codes: new Set(['4.1', '4.2', '4.3']) },
    { id: 'skills', label: 'ทักษะ/อาชีพ', codes: new Set(['4.4']) },
    { id: 'equity', label: 'ความเสมอภาค/กลุ่มเปราะบาง', codes: new Set(['4.5']) },
    { id: 'literacy', label: 'ทักษะพื้นฐาน/พลเมืองโลก', codes: new Set(['4.6', '4.7']) },
    { id: 'enablers', label: 'ระบบสนับสนุน (สถานศึกษา/ครู)', codes: new Set(['4.a', '4.c']) },
    { id: 'scholarships', label: 'ทุนการศึกษา', codes: new Set(['4.b']) },
  ];

  const groupCount = {};
  groups.forEach(g => groupCount[g.id] = 0);
  let unclassified = 0;
  filtered.forEach(p => {
    (p.sdg || []).forEach(code => {
      const g = groups.find(x => x.codes.has(code));
      if (g) groupCount[g.id]++;
      else unclassified++;
    });
  });

  const groupPairs = groups.map(g => [g, groupCount[g.id]]).filter(([, v]) => v > 0);
  if (unclassified > 0) groupPairs.push([{ id: 'other', label: 'อื่นๆ' }, unclassified]);

  const groupLabels = groupPairs.map(([g]) => g.label);
  const groupValues = groupPairs.map(([, v]) => v);
  createDoughnutChart('chartSdgGroups', { labels: groupLabels, values: groupValues }, ['#2563eb', '#16a34a', '#f59e0b', '#3b82f6', '#eab308', '#ef4444', '#94a3b8']);

  const topGroup = groupPairs.sort((a, b) => b[1] - a[1])[0];
  const kpiTopGroup = document.getElementById('kpiTopGroup');
  if (kpiTopGroup) kpiTopGroup.textContent = topGroup ? `${topGroup[0].label} (${topGroup[1]})` : '-';
}

function createDoughnutChart(canvasId, data, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

function exportCSV() {
  const projects = (DB?.projects || []).slice();

  const sanitizeCell = (v) =>
    String(v ?? '')
      .replace(/\r?\n/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/"/g, '""')
      .trim();

  const durationOf = (p) => {
    const parts = [p.startDate, p.endDate].filter(Boolean);
    return parts.join(' - ');
  };

  const imageCountOf = (p) => String((p.images || []).length);

  const COLUMNS = [
    { id: 'org', label: 'หน่วยงานหลัก', defaultSelected: true, get: (p) => getOrgName(p.orgId) },
    { id: 'title', label: 'ชื่อโครงการ', defaultSelected: true, get: (p) => p.title ?? '' },
    { id: 'province', label: 'จังหวัด', defaultSelected: true, get: (p) => p.province ?? '' },
    { id: 'budget', label: 'งบประมาณ (บาท)', defaultSelected: true, get: (p) => p.budget ?? '' },
    { id: 'objective', label: 'วัตถุประสงค์ของโครงการ', defaultSelected: true, get: (p) => p.objective ?? '' },
    { id: 'duration', label: 'ระยะเวลาในการดำเนินงาน', defaultSelected: true, get: (p) => durationOf(p) },
    { id: 'policy', label: 'ข้อเสนอแนะเชิงนโยบาย', defaultSelected: true, get: (p) => p.policy ?? '' },
    { id: 'owner', label: 'ผู้รับผิดชอบ', defaultSelected: true, get: (p) => p.owner ?? '' },
    { id: 'sdg', label: 'SDG targets', defaultSelected: true, get: (p) => (p.sdg || []).join(', ') },
    { id: 'imageCount', label: 'จำนวนรูป', defaultSelected: true, get: (p) => imageCountOf(p) },
    { id: 'year', label: 'ปีงบประมาณ', defaultSelected: false, get: (p) => p.year ?? '' },
    { id: 'startDate', label: 'วันเริ่ม', defaultSelected: false, get: (p) => p.startDate ?? '' },
    { id: 'endDate', label: 'วันสิ้นสุด', defaultSelected: false, get: (p) => p.endDate ?? '' },
    { id: 'createdAt', label: 'วันที่สร้าง', defaultSelected: false, get: (p) => p.createdAt ? new Date(p.createdAt).toLocaleDateString('th-TH') : '' },
    { id: 'updatedAt', label: 'วันที่แก้ไขล่าสุด', defaultSelected: false, get: (p) => p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('th-TH') : '' },
    { id: 'updatedBy', label: 'ผู้แก้ไขล่าสุด', defaultSelected: false, get: (p) => p.updatedBy ?? '' },
    { id: 'id', label: 'ID', defaultSelected: false, get: (p) => p.id ?? '' },
  ];

  const buildExports = (selectedColIds, selectedProjectIds) => {
    const selectedCols = COLUMNS.filter(c => selectedColIds.includes(c.id));
    const header = selectedCols.map(c => c.label);
    const chosenProjects = selectedProjectIds?.length
      ? projects.filter(p => selectedProjectIds.includes(p.id))
      : projects;
    const rows = chosenProjects.map(p => selectedCols.map(c => c.get(p)));
    const csvEscape = (v) => `"${sanitizeCell(String(v ?? ''))}"`;
    const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
    return { header, rows, csv, selectedColIds, selectedProjectIds, rowCount: chosenProjects.length };
  };

  const defaultSelectedColIds = COLUMNS.filter(c => c.defaultSelected).map(c => c.id);
  const defaultSelectedProjectIds = projects.map(p => p.id);
  let lastExport = buildExports(defaultSelectedColIds, defaultSelectedProjectIds);

  const countLabel = `รวม ${projects.length} โครงการ (ทุกหน่วยงาน)`;

  Swal.fire({
    title: 'ส่งออกข้อมูลโครงการ',
    html: `
      <div class="text-left space-y-4">
        <p class="text-sm text-gray-600">${countLabel} กรุณาเลือกโครงการและคอลัมน์ที่ต้องการส่งออก</p>

        <!-- เลือกโครงการ -->
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div class="flex flex-wrap gap-2 items-center justify-between mb-2">
            <span class="font-semibold text-gray-700">เลือกโครงการ</span>
            <div class="flex gap-2">
              <button type="button" id="btnExportAllRows" class="btn btn-xs btn-outline btn-ghost">เลือกทั้งหมด</button>
              <button type="button" id="btnExportNoRows" class="btn btn-xs btn-outline btn-ghost">ไม่เลือกเลย</button>
            </div>
          </div>
          <input id="exportProjectSearch" class="input input-bordered input-sm w-full" placeholder="ค้นหาโครงการ" />
          <div id="exportProjects" class="mt-3 max-h-44 overflow-auto border border-gray-200 rounded-lg bg-white p-2 space-y-1"></div>
          <p class="text-xs text-gray-500 mt-2">ค่าเริ่มต้น: ส่งออกทุกโครงการ</p>
        </div>

        <!-- เลือกคอลัมน์ -->
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div class="flex flex-wrap gap-2 items-center justify-between mb-2">
            <span class="font-semibold text-gray-700">เลือกคอลัมน์</span>
            <div class="flex gap-2">
              <button type="button" id="btnExportAllCols" class="btn btn-xs btn-outline btn-ghost">เลือกทั้งหมด</button>
              <button type="button" id="btnExportNoCols" class="btn btn-xs btn-outline btn-ghost">ไม่เลือกเลย</button>
              <button type="button" id="btnExportResetCols" class="btn btn-xs btn-outline btn-ghost">รีเซ็ตค่าเริ่มต้น</button>
            </div>
          </div>
          <div id="exportCols" class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3"></div>
          <p class="text-xs text-gray-500 mt-2">ค่าเริ่มต้น: คอลัมน์ตามแบบฟอร์มมาตรฐาน</p>
        </div>

        <button type="button" id="btnDownloadCsv" class="btn btn-primary w-full sm:w-auto gap-2">
          <i class="fas fa-file-csv"></i>
          ดาวน์โหลดไฟล์ CSV
        </button>
        <p class="text-xs text-gray-500">หมายเหตุ: ข้อมูลรูปภาพจะแสดงเป็นจำนวนรูปที่แนบในระบบ ไม่ส่งออกไฟล์รูปภาพ | วันที่แสดงในรูปแบบ ว/ด/ป</p>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    width: '560px',

    didOpen: () => {
      const colsWrap = document.getElementById('exportCols');
      if (colsWrap) {
        colsWrap.innerHTML = COLUMNS.map(c => `
          <label class="flex items-start gap-2 cursor-pointer hover:bg-base-200/50 rounded p-1 -m-1">
            <input type="checkbox" class="checkbox checkbox-sm mt-0.5" data-col="${c.id}" ${c.defaultSelected ? 'checked' : ''}/>
            <span class="text-sm">${c.label}</span>
          </label>
        `).join('');
      }

      const projWrap = document.getElementById('exportProjects');
      let selectedPids = new Set(projects.map(p => p.id));

      const renderProjectList = (q = '') => {
        if (!projWrap) return;

        const existing = document.querySelectorAll('#exportProjects input[type="checkbox"][data-pid]');
        if (existing.length > 0) {
          selectedPids = new Set(
            Array.from(existing).filter(el => el.checked).map(el => el.getAttribute('data-pid'))
          );
        }

        const query = (q || '').trim().toLowerCase();
        const filtered = projects.filter(p => {
          const title = String(p.title || '').toLowerCase();
          const org = String(getOrgName(p.orgId) || '').toLowerCase();
          return !query || title.includes(query) || org.includes(query);
        });

        if (filtered.length === 0) {
          projWrap.innerHTML = '<div class="text-sm text-gray-500 p-2">ไม่พบโครงการ</div>';
          return;
        }

        projWrap.innerHTML = filtered.map(p => {
          const orgName = getOrgName(p.orgId);
          const checked = selectedPids.has(p.id);
          return `
            <label class="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 block">
              <input type="checkbox" class="checkbox checkbox-sm mt-0.5" data-pid="${p.id}" ${checked ? 'checked' : ''} />
              <span class="text-sm flex-1 min-w-0">
                <span class="font-medium block truncate">${(p.title || '-').replace(/</g, '&lt;')}</span>
                <span class="text-xs text-gray-500">${(orgName || '-').replace(/</g, '&lt;')}</span>
              </span>
            </label>
          `;
        }).join('');
      };
      renderProjectList('');

      const getSelectedColIds = () =>
        Array.from(document.querySelectorAll('#exportCols input[type="checkbox"][data-col]'))
          .filter(el => el.checked)
          .map(el => el.getAttribute('data-col'));
      const getSelectedProjectIds = () =>
        Array.from(document.querySelectorAll('#exportProjects input[type="checkbox"][data-pid]'))
          .filter(el => el.checked)
          .map(el => el.getAttribute('data-pid'));

      const updatePreview = () => {
        const selectedColIds = getSelectedColIds();
        const selectedProjectIds = getSelectedProjectIds();
        if (!selectedColIds.length || !selectedProjectIds.length) {
          lastExport = { csv: '', selectedColIds, selectedProjectIds };
          return;
        }
        lastExport = buildExports(selectedColIds, selectedProjectIds);
      };

      document.getElementById('exportCols')?.addEventListener('change', updatePreview);
      document.getElementById('exportProjects')?.addEventListener('change', updatePreview);
      document.getElementById('exportProjectSearch')?.addEventListener('input', (e) => {
        renderProjectList(e.target.value);
        updatePreview();
      });

      document.getElementById('btnExportAllCols')?.addEventListener('click', () => {
        document.querySelectorAll('#exportCols input[type="checkbox"][data-col]').forEach(el => { el.checked = true; });
        updatePreview();
      });
      document.getElementById('btnExportNoCols')?.addEventListener('click', () => {
        document.querySelectorAll('#exportCols input[type="checkbox"][data-col]').forEach(el => { el.checked = false; });
        updatePreview();
      });
      document.getElementById('btnExportResetCols')?.addEventListener('click', () => {
        document.querySelectorAll('#exportCols input[type="checkbox"][data-col]').forEach(el => {
          const col = COLUMNS.find(c => c.id === el.getAttribute('data-col'));
          el.checked = !!col?.defaultSelected;
        });
        updatePreview();
      });

      document.getElementById('btnExportAllRows')?.addEventListener('click', () => {
        document.querySelectorAll('#exportProjects input[type="checkbox"][data-pid]').forEach(el => { el.checked = true; });
        updatePreview();
      });
      document.getElementById('btnExportNoRows')?.addEventListener('click', () => {
        document.querySelectorAll('#exportProjects input[type="checkbox"][data-pid]').forEach(el => { el.checked = false; });
        updatePreview();
      });

      document.getElementById('btnDownloadCsv')?.addEventListener('click', () => {
        if (!lastExport?.rows?.length || !lastExport?.header?.length) {
          showWarning('ไม่สามารถดาวน์โหลดได้', 'กรุณาเลือกอย่างน้อย 1 โครงการ และ 1 คอลัมน์');
          return;
        }
        const csvContent = lastExport.csv || '';
        if (!csvContent) {
          showError('ไม่สามารถส่งออกข้อมูลได้', 'ไม่มีข้อมูลที่จะส่งออก');
          return;
        }

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sdg4_projects_export.csv';
        a.click();
        URL.revokeObjectURL(a.href);
        showSuccess('ดาวน์โหลดสำเร็จ', 'ไฟล์ CSV ถูกดาวน์โหลดแล้ว');
      });
    },
  });
}
