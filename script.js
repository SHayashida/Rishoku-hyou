let selectedCells = new Set();
let isDragging = false;
let dragStartCell = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeTable(12);
  document.getElementById('addRowsBtn').addEventListener('click', () => addRows(12));
  document.getElementById('calcBtn').addEventListener('click', calculateDays);
  document.getElementById('copyBtn').addEventListener('click', copySelectedCells);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // Add input event listeners to first row cells
  const firstRow = document.getElementById('table-body').rows[0];
  for (let i = 0; i < 6; i++) {
    if ([0,1,3,4].includes(i)) {
      firstRow.cells[i].addEventListener('input', () => {
        // Enable the fillSubsequentRows button when first row is modified
        document.getElementById('fillSubsequentRowsBtn').disabled = false;
      });
    }
  }
});

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
    if ([0,1,3,4].includes(i)) {
      cell.contentEditable = 'true';
      cell.addEventListener('paste', handlePaste);
      
      // Add drag and drop event listeners
      cell.addEventListener('mousedown', handleDragStart);
      cell.addEventListener('mouseover', handleDragOver);
      cell.addEventListener('mouseup', handleDragEnd);
    }
    cell.addEventListener('click', toggleCellSelection);
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
      // ⑪の計算は常に終了日から開始日を引いて1を加える
      const diffDays = Math.floor((new Date(e) - new Date(d)) / 86400000) + 1;
      fVal = diffDays;
    }

    resultC.innerText = cVal;
    resultF.innerText = fVal;

    if (cVal === 'エラー') resultC.classList.add('error');
    if (fVal === 'エラー') resultF.classList.add('error');
    if (cVal === 'エラー' || fVal === 'エラー') errorRows.push(i + 1);
  }

  if (errorRows.length) {
    alert(`エラー行: ${errorRows.join(', ')}`);
  }
  document.getElementById('copyBtn').disabled = errorRows.length > 0;
}

function calcDays(startStr, endStr, payType) {
  const s = new Date(startStr), e = new Date(endStr);
  if (e < s) return 'エラー';
  
  // 日付の差分を計算（終了日を含むため+1）
  const diffDays = Math.floor((e - s) / 86400000) + 1;
  
  // 賃金形態に応じて日数を計算
  if (payType === 'monthly') {
    // 完全月給制の場合、その月の日数を返す
    return daysInMonth(s);
  } else if (payType === 'daily' || payType === 'hourly') {
    // 日給月給制または時給制の場合、実際の日数を返す
    return diffDays;
  }
  return 'エラー';
}

function daysInMonth(date) {
  // 指定された月の最終日を取得
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
  
  // Set dates for the first row only
  const firstRow = tbody.rows[0];
  firstRow.cells[0].innerText = first;
  firstRow.cells[1].innerText = last;
  firstRow.cells[3].innerText = first;
  firstRow.cells[4].innerText = last;

  // Enable the fillSubsequentRows button
  document.getElementById('fillSubsequentRowsBtn').disabled = false;
}

function fillSubsequentRows() {
  const tbody = document.getElementById('table-body');
  const firstRow = tbody.rows[0];
  const firstDate = firstRow.cells[0].innerText.trim();
  const firstEndDate = firstRow.cells[1].innerText.trim();
  const firstStartDate10 = firstRow.cells[3].innerText.trim();
  const firstEndDate10 = firstRow.cells[4].innerText.trim();
  
  if (!isValidDate(firstDate) || !isValidDate(firstEndDate) || 
      !isValidDate(firstStartDate10) || !isValidDate(firstEndDate10)) {
    alert('1行目に有効な日付が入力されていません。');
    return;
  }

  const firstDateObj = new Date(firstDate);
  const firstEndDateObj = new Date(firstEndDate);
  const firstStartDate10Obj = new Date(firstStartDate10);
  
  // Get the day of the month from the first start date
  const startDay = firstDateObj.getDate();
  const startDay10 = firstStartDate10Obj.getDate();
  
  // Fill subsequent rows with previous months
  for (let i = 1; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    
    // Calculate start date (same day of month as first row, but previous month)
    const startDate = new Date(firstDateObj.getFullYear(), firstDateObj.getMonth() - i, startDay);
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    
    // Calculate end date (day before the previous row's start date)
    const prevStartDate = new Date(firstDateObj.getFullYear(), firstDateObj.getMonth() - (i-1), startDay);
    const endDate = new Date(prevStartDate);
    endDate.setDate(endDate.getDate() - 1);
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    // Set the dates for ⑧ column
    row.cells[0].innerText = startDateStr;
    row.cells[1].innerText = endDateStr;
    
    // Calculate dates for ⑩ column
    const startDate10 = new Date(firstStartDate10Obj.getFullYear(), firstStartDate10Obj.getMonth() - i, startDay10);
    const startDate10Str = `${startDate10.getFullYear()}-${String(startDate10.getMonth() + 1).padStart(2, '0')}-${String(startDate10.getDate()).padStart(2, '0')}`;
    
    // Calculate end date for ⑩ (day before the previous row's start date)
    const prevStartDate10 = new Date(firstStartDate10Obj.getFullYear(), firstStartDate10Obj.getMonth() - (i-1), startDay10);
    const endDate10 = new Date(prevStartDate10);
    endDate10.setDate(endDate10.getDate() - 1);
    const endDate10Str = `${endDate10.getFullYear()}-${String(endDate10.getMonth() + 1).padStart(2, '0')}-${String(endDate10.getDate()).padStart(2, '0')}`;
    
    // Set the dates for ⑩ column
    row.cells[3].innerText = startDate10Str;
    row.cells[4].innerText = endDate10Str;
  }

  // Automatically calculate after filling the rows
  calculateDays();
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

  // すべての行のデータを収集
  for (let row of tbody.rows) {
    const rowData = [];
    for (let cell of row.cells) {
      rowData.push(cell.innerText);
    }
    lines.push(rowData.join('\t'));
  }

  // クリップボードにコピー
  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => {
      alert('表全体をコピーしました。');
    })
    .catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
      // フォールバック: テキストエリアを使用した方法
      const textArea = document.createElement('textarea');
      textArea.value = lines.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        alert('表全体をコピーしました。');
      } catch (err) {
        console.error('フォールバックコピーも失敗しました:', err);
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
  const rows = tbody.rows;
  
  // Clear all cells
  for (let row of rows) {
    for (let cell of row.cells) {
      if (cell.contentEditable === 'true') {
        cell.innerText = '';
      } else {
        cell.innerText = '';
      }
    }
  }

  // Clear month picker
  document.getElementById('monthPicker').value = '';
  
  // Reset buttons
  document.getElementById('fillSubsequentRowsBtn').disabled = true;
  document.getElementById('copyBtn').disabled = true;
  
  // Clear selected cells
  selectedCells.clear();
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  
  // Clear error classes
  document.querySelectorAll('.error').forEach(cell => cell.classList.remove('error'));
}

function handleDragStart(e) {
  if (!e.currentTarget.contentEditable) return;
  
  isDragging = true;
  dragStartCell = e.currentTarget;
  e.currentTarget.classList.add('dragging');
  
  // Prevent text selection while dragging
  e.preventDefault();
}

function handleDragOver(e) {
  if (!isDragging || !e.currentTarget.contentEditable) return;
  
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragEnd(e) {
  if (!isDragging) return;
  
  isDragging = false;
  dragStartCell.classList.remove('dragging');
  
  if (e.currentTarget !== dragStartCell && e.currentTarget.contentEditable) {
    // Copy the content
    e.currentTarget.innerText = dragStartCell.innerText;
  }
  
  // Remove drag-over class from all cells
  document.querySelectorAll('.drag-over').forEach(cell => {
    cell.classList.remove('drag-over');
  });
  
  dragStartCell = null;
}
