let selectedCells = new Set();
let isDragging = false;
let startCell = null;

// 初期化処理（DOMContentLoadedを使わずに実行）
initializeTable(12);

const addRowsBtn = document.getElementById('addRowsBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const fillBtn = document.getElementById('fillSubsequentRowsBtn');

addRowsBtn?.addEventListener('click', () => addRows(12));
// document.getElementById('calcBtn')?.addEventListener('click', calculateDays); // ボタンが存在しないため無効化
copyBtn?.addEventListener('click', copySelectedCells);
clearBtn?.addEventListener('click', clearAll);

const firstRow = document.getElementById('table-body').rows[0];
if (firstRow) {
  for (let i = 0; i < 6; i++) {
    if ([0, 1, 3, 4].includes(i)) {
      firstRow.cells[i].addEventListener('input', () => {
        fillBtn.disabled = false;
      });
    }
  }
}

function initializeTable(count) {
  const tbody = document.getElementById('table-body');
  for (let i = 0; i < count; i++) tbody.appendChild(createRow());
}

function addRows(count) {
  const tbody = document.getElementById('table-body');
  for (let i = 0; i < count; i++) tbody.appendChild(createRow());
}

function createRow() {
  const row = document.createElement('tr');
  for (let i = 0; i < 6; i++) {
    const cell = document.createElement('td');
    if ([0, 1, 3, 4].includes(i)) {
      cell.contentEditable = 'true';
      cell.addEventListener('paste', handlePaste);
    }
    cell.addEventListener('mousedown', startDragging);
    cell.addEventListener('mouseover', drag);
    cell.addEventListener('mouseup', stopDragging);
    cell.addEventListener('contextmenu', handleContextMenu);
    row.appendChild(cell);
  }
  return row;
}

function calculateDays() {
  const tbody = document.getElementById('table-body');
  const rows = tbody.rows;
  const errorRows = [];
  const payType = document.getElementById('payType').value;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    const [startA, endA, resultC, startD, endD, resultF] = cells;

    resultC.classList.remove('error');
    resultF.classList.remove('error');

    const a = startA.innerText.trim();
    const b = endA.innerText.trim();
    const d = startD.innerText.trim();
    const e = endD.innerText.trim();

    let cVal = 'エラー', fVal = 'エラー';
    if (isValidDate(a) && isValidDate(b)) {
      cVal = calcDays(a, b, payType);
    }
    if (isValidDate(d) && isValidDate(e)) {
      const diffDays = Math.floor((new Date(e) - new Date(d)) / 86400000) + 1;
      fVal = diffDays;
    }

    resultC.innerText = cVal;
    resultF.innerText = fVal;

    if (cVal === 'エラー') resultC.classList.add('error');
    if (fVal === 'エラー') resultF.classList.add('error');
    if (cVal === 'エラー' || fVal === 'エラー') errorRows.push(i + 1);
  }

  copyBtn.disabled = false; // 修正：常にコピーできるように変更
}

function calcDays(startStr, endStr, payType) {
  const s = new Date(startStr), e = new Date(endStr);
  if (e < s) return 'エラー';

  const diffDays = Math.floor((e - s) / 86400000) + 1;
  if (payType === 'monthly') {
    return daysInMonth(s);
  } else if (payType === 'daily' || payType === 'hourly') {
    return diffDays;
  }
  return 'エラー';
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isValidDate(str) {
  return !isNaN(Date.parse(str));
}

function insertMonthDates() {
  const val = document.getElementById('monthPicker').value;
  if (!val) return alert('月を選択してください');
  const [y, m] = val.split('-').map(Number);
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
  const tbody = document.getElementById('table-body');
  const firstRow = tbody.rows[0];

  firstRow.cells[0].innerText = first;
  firstRow.cells[1].innerText = last;
  firstRow.cells[3].innerText = first;
  firstRow.cells[4].innerText = last;

  fillBtn.disabled = false;
}

function fillSubsequentRows() {
  const tbody = document.getElementById('table-body');
  const firstRow = tbody.rows[0];
  const firstDate = firstRow.cells[0].innerText.trim();
  const firstEndDate = firstRow.cells[1].innerText.trim();
  const firstStartDate10 = firstRow.cells[3].innerText.trim();
  const firstEndDate10 = firstRow.cells[4].innerText.trim();

  if (!isValidDate(firstDate) || !isValidDate(firstEndDate) || !isValidDate(firstStartDate10) || !isValidDate(firstEndDate10)) {
    alert('1行目に有効な日付が入力されていません。');
    return;
  }

  const firstDateObj = new Date(firstDate);
  const firstStartDate10Obj = new Date(firstStartDate10);
  const startDay = firstDateObj.getDate();
  const startDay10 = firstStartDate10Obj.getDate();

  for (let i = 1; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const startDate = new Date(firstDateObj.getFullYear(), firstDateObj.getMonth() - i, startDay);
    const prevStartDate = new Date(firstDateObj.getFullYear(), firstDateObj.getMonth() - (i - 1), startDay);
    const endDate = new Date(prevStartDate);
    endDate.setDate(endDate.getDate() - 1);

    row.cells[0].innerText = formatDate(startDate);
    row.cells[1].innerText = formatDate(endDate);

    const startDate10 = new Date(firstStartDate10Obj.getFullYear(), firstStartDate10Obj.getMonth() - i, startDay10);
    const prevStartDate10 = new Date(firstStartDate10Obj.getFullYear(), firstStartDate10Obj.getMonth() - (i - 1), startDay10);
    const endDate10 = new Date(prevStartDate10);
    endDate10.setDate(endDate10.getDate() - 1);

    row.cells[3].innerText = formatDate(startDate10);
    row.cells[4].innerText = formatDate(endDate10);
  }

  calculateDays();
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toggleCellSelection(e) {
  const c = e.currentTarget;
  if (selectedCells.has(c)) {
    selectedCells.delete(c);
    c.classList.remove('selected');
  } else {
    selectedCells.add(c);
    c.classList.add('selected');
  }
}

function copySelectedCells() {
  const tbody = document.getElementById('table-body');
  const lines = [];

  console.log('コピー開始: 選択セル数 =', selectedCells.size);

  if (selectedCells.size > 0) {
    const selectedRows = new Set();
    selectedCells.forEach(cell => {
      selectedRows.add(cell.parentNode);
    });

    selectedRows.forEach(row => {
      const rowData = [];
      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];
        rowData.push(selectedCells.has(cell) ? cell.innerText : '');
      }
      lines.push(rowData.join('\t'));
    });
  } else {
    for (let row of tbody.rows) {
      const rowData = [];
      for (let cell of row.cells) {
        rowData.push(cell.innerText);
      }
      lines.push(rowData.join('\t'));
    }
  }

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => {
      alert(selectedCells.size > 0 ? '選択したセルをコピーしました。' : '表全体をコピーしました。');
    })
    .catch(err => {
      console.error('クリップボードコピー失敗:', err);
      const textArea = document.createElement('textarea');
      textArea.value = lines.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(selectedCells.size > 0 ? '選択したセルをコピーしました。' : '表全体をコピーしました。');
      } catch (err) {
        console.error('フォールバックコピー失敗:', err);
        alert('クリップボードへのコピーに失敗しました。');
      } finally {
        document.body.removeChild(textArea);
      }
    });
}

function handlePaste(e) {
  const text = e.clipboardData?.getData('text/plain') || '';
  const lines = text.split(/\r?\n/).filter(l => l);
  const rowIdx = [...this.parentNode.parentNode.children].indexOf(this.parentNode);
  const colIdx = [...this.parentNode.children].indexOf(this);
  const tbody = document.getElementById('table-body');
  lines.forEach((line, rOffset) => {
    const cols = line.split('\t');
    const r = rowIdx + rOffset;
    while (r >= tbody.rows.length) addRows(1);
    const target = tbody.rows[r];
    cols.forEach((val, cOffset) => {
      const c = colIdx + cOffset;
      if (c < 6 && target.cells[c].contentEditable === 'true') target.cells[c].innerText = val;
    });
  });
  e.preventDefault();
}

function clearAll() {
  const tbody = document.getElementById('table-body');
  for (let row of tbody.rows) {
    for (let cell of row.cells) {
      cell.innerText = '';
    }
  }

  document.getElementById('monthPicker').value = '';
  fillBtn.disabled = true;
  copyBtn.disabled = false;

  selectedCells.clear();
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  document.querySelectorAll('.error').forEach(cell => cell.classList.remove('error'));
}

function startDragging(e) {
  isDragging = true;
  startCell = e.currentTarget;
  selectedCells.clear();
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  toggleCellSelection(e);
}

function drag(e) {
  if (!isDragging) return;

  const currentCell = e.currentTarget;
  const startRow = startCell.parentNode;
  const currentRow = currentCell.parentNode;
  const tbody = document.getElementById('table-body');

  const startRowIndex = Array.from(tbody.rows).indexOf(startRow);
  const currentRowIndex = Array.from(tbody.rows).indexOf(currentRow);
  const startColIndex = Array.from(startRow.cells).indexOf(startCell);
  const currentColIndex = Array.from(currentRow.cells).indexOf(currentCell);

  const minRow = Math.min(startRowIndex, currentRowIndex);
  const maxRow = Math.max(startRowIndex, currentRowIndex);
  const minCol = Math.min(startColIndex, currentColIndex);
  const maxCol = Math.max(startColIndex, currentColIndex);

  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  selectedCells.clear();

  for (let i = minRow; i <= maxRow; i++) {
    for (let j = minCol; j <= maxCol; j++) {
      const cell = tbody.rows[i].cells[j];
      selectedCells.add(cell);
      cell.classList.add('selected');
    }
  }
}

function stopDragging() {
  isDragging = false;
  startCell = null;
}

function handleContextMenu(e) {
  e.preventDefault();
  if (selectedCells.size > 0) {
    copySelectedCells();
  }
}
