

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

function showSuccess(title, text = '') {
  Toast.fire({ icon: 'success', title, text });
}

function showError(title, text = '') {
  Toast.fire({ icon: 'error', title, text });
}

function showInfo(title, text = '') {
  Toast.fire({ icon: 'info', title, text });
}

function showWarning(title, text = '') {
  Toast.fire({ icon: 'warning', title, text });
}

function getSoftBadgeColors(hexColor) {

  if (!hexColor || hexColor === '#ccc') {
    return { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)' };
  }

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const bgR = Math.round(r * 0.15 + 255 * 0.85);
  const bgG = Math.round(g * 0.15 + 255 * 0.85);
  const bgB = Math.round(b * 0.15 + 255 * 0.85);
  const bgColor = `rgb(${bgR}, ${bgG}, ${bgB})`;

  const textR = Math.round(r * 0.6);
  const textG = Math.round(g * 0.6);
  const textB = Math.round(b * 0.6);
  const textColor = `rgb(${textR}, ${textG}, ${textB})`;

  return { bg: bgColor, text: textColor };
}

async function confirm(title, text, confirmText = 'ยืนยัน') {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#d33',
  });
  

  return result.isConfirmed;
}
