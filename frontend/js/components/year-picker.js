// ==================== Year Picker Component ====================
function openYearPicker(inputId, callback) {
  closeYearPicker();

  const input = document.getElementById(inputId);
  if (!input) return;

  const hiddenInput = document.getElementById(inputId + 'Value');
  const currentYear = hiddenInput ? Number(hiddenInput.value) : null;

  const picker = document.createElement('div');
  picker.className = 'year-picker-dropdown';
  picker.id = 'yearPickerDropdown';

  const startYear = 2500;
  const endYear = 3000;
  let currentViewYear = currentYear || new Date().getFullYear() + 543;
  if (currentViewYear < startYear) currentViewYear = startYear;
  if (currentViewYear > endYear) currentViewYear = endYear;

  function renderYearPicker(year) {
    const years = [];
    const start = year - 4;
    const end = year + 4;

    for (let y = start; y <= end; y++) {
      years.push(y);
    }

    picker.innerHTML = `
      <div class="year-picker-header">
        <span class="year-picker-nav" onclick="event.stopPropagation(); navigateYearPicker(${year - 9});">‹‹</span>
        <span class="font-semibold">${year}</span>
        <span class="year-picker-nav" onclick="event.stopPropagation(); navigateYearPicker(${year + 9});">››</span>
      </div>
      <div class="year-picker-grid">
        ${years.map(y => `
          <div class="year-picker-item ${y === currentYear ? 'selected' : ''}" 
               onclick="event.stopPropagation(); selectYear(${y}, '${inputId}', ${callback ? 'true' : 'false'});">
            ${y}
          </div>
        `).join('')}
      </div>
    `;

    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(picker);
  }

  picker.dataset.viewYear = currentViewYear;

  window.navigateYearPicker = function(newYear) {
    picker.dataset.viewYear = newYear;
    renderYearPicker(newYear);
  };

  window.selectYear = function(year, id, hasCallback) {
    const yearInput = document.getElementById(id);
    const yearValueInput = document.getElementById(id + 'Value');

    if (yearInput) yearInput.value = year;
    if (yearValueInput) yearValueInput.value = year;

    closeYearPicker();

    if (hasCallback && callback) {
      callback();
    }
  };

  renderYearPicker(currentViewYear);

  picker.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  setTimeout(() => {
    const closeHandler = function(e) {
      if (!picker.contains(e.target) && e.target !== input && !input.contains(e.target)) {
        closeYearPicker();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

function closeYearPicker() {
  const picker = document.getElementById('yearPickerDropdown');
  if (picker) {
    picker.remove();
  }
  delete window.navigateYearPicker;
  delete window.selectYear;
}
