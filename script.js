/**
 * ページ読み込み完了時の初期化処理
 */
document.addEventListener('DOMContentLoaded', () => {
  // 初期表示：12行を生成
  initializeTable(12);

  // 12行追加ボタン
  document.getElementById('addRowsBtn').addEventListener('click', () => {
    addRows(12);
  });

  // 計算ボタン
  document.getElementById('calcBtn').addEventListener('click', calculateDays);
});

/**
 * 指定行数の初期行をテーブルに生成する
 * @param {number} count - 生成する行数
 */
function initializeTable(count) {
  const tbody = document.getElementById('table-body');
  for (let i = 0; i < count; i++) {
    tbody.appendChild(createRow());
  }
}

/**
 * 指定行数だけ行を追加する
 * @param {number} count - 追加する行数
 */
function addRows(count) {
  const tbody = document.getElementById('table-body');
  for (let i = 0; i < count; i++) {
    tbody.appendChild(createRow());
  }
}

/**
 * 新しい行(tr)を生成し、必要なイベントを付与して返す
 * @returns {HTMLTableRowElement} 作成した行
 */
function createRow() {
  const row = document.createElement('tr');
  
  // 6列 (A, B, C, D, E, F)
  for (let colIndex = 0; colIndex < 6; colIndex++) {
    const cell = document.createElement('td');
    
    // A, B, D, E列（colIndex = 0,1,3,4）を編集可能にする
    if ([0, 1, 3, 4].includes(colIndex)) {
      cell.contentEditable = 'true';
      // 複数セルペーストをカスタム処理するためのイベントを付与
      cell.addEventListener('paste', handlePaste);
    }
    
    row.appendChild(cell);
  }
  
  return row;
}

/**
 * 「貼り付け」時に複数セルを自動分割して貼り付けるためのイベントハンドラ
 * @param {ClipboardEvent} e
 */
function handlePaste(e) {
  // クリップボードのテキストデータを取得
  const clipboardText = e.clipboardData?.getData('text/plain') || '';

  // 改行やタブが含まれない（＝単セルの可能性）なら、デフォルトの貼り付けでもOK
  // しかし、一部ブラウザではHTMLとして貼り付いてしまうので、明示的に制御する方が安全です。
  const hasMultiCells =
    clipboardText.includes('\t') || clipboardText.includes('\n');

  if (!hasMultiCells) {
    // 単一セル分の貼り付けなら、デフォルト処理をさせたい場合はコメントアウトを外す
    // return; // ← これを有効にすると、単一セルの場合はデフォルトで貼り付ける
  }
  
  // デフォルトの貼り付け動作を無効化（contenteditable に生のテキストが入るのを防ぐ）
  e.preventDefault();
  
  // 行ごとに分割
  const lines = clipboardText.split(/\r\n|\r|\n/).filter(line => line !== '');
  
  // このセルの属する行・列を取得
  // <tr>要素のインデックス（tbody内で何行目か）
  const currentRowIndex = Array.prototype.indexOf.call(
    this.parentNode.parentNode.children,  // tbody.children
    this.parentNode
  );
  // <td>要素のインデックス（その行で何列目か）
  const currentColIndex = Array.prototype.indexOf.call(
    this.parentNode.children,
    this
  );
  
  const tableBody = document.getElementById('table-body');
  
  // 貼り付けデータを行・列に分割して表へ配置
  lines.forEach((line, lineOffset) => {
    const cols = line.split('\t');
    
    // 行が足りなければ追加
    const targetRowIndex = currentRowIndex + lineOffset;
    while (targetRowIndex >= tableBody.rows.length) {
      // 足りないぶんだけ行を増やす
      addRows(1);
    }
    const targetRow = tableBody.rows[targetRowIndex];
    
    cols.forEach((colValue, colOffset) => {
      const targetColIndex = currentColIndex + colOffset;
      
      // 列が6を超える場合は貼り付け対象外 (A〜F列まで)
      if (targetColIndex >= 6) return;
      
      // 対象セルを取得
      const targetCell = targetRow.cells[targetColIndex];
      
      // そのセルが contentEditable かどうかチェック（C列/F列は結果用セル）
      if (targetCell.contentEditable === 'true') {
        targetCell.innerText = colValue;
      }
    });
  });
}

/**
 * 日付が有効かどうかをチェック
 * @param {string} dateString - 日付文字列
 * @returns {boolean} 有効なら true
 */
function isValidDate(dateString) {
  const timestamp = Date.parse(dateString);
  return !isNaN(timestamp);
}

/**
 * A, B列（開始日1, 終了日1）、D, E列（開始日2, 終了日2）の日付差を計算し、C列・F列に反映
 */
function calculateDays() {
  const tbody = document.getElementById('table-body');
  const rows = tbody.rows;
  const errorRows = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    
    // 前回のエラー表示をリセット
    cells[2].classList.remove('error');
    cells[5].classList.remove('error');

    // 各セルの値（空白除去）
    const cellA = cells[0].innerText.trim(); // A列
    const cellB = cells[1].innerText.trim(); // B列
    const cellD = cells[3].innerText.trim(); // D列
    const cellE = cells[4].innerText.trim(); // E列

    let resultC = 'エラー';
    let resultF = 'エラー';

    // A列, B列の計算（終了日 - 開始日 + 1）
    if (isValidDate(cellA) && isValidDate(cellB)) {
      const dateA = new Date(cellA);
      const dateB = new Date(cellB);
      resultC = Math.floor((dateB - dateA) / (1000 * 60 * 60 * 24)) + 1;
    }

    // D列, E列の計算（終了日 - 開始日 + 1）
    if (isValidDate(cellD) && isValidDate(cellE)) {
      const dateD = new Date(cellD);
      const dateE = new Date(cellE);
      resultF = Math.floor((dateE - dateD) / (1000 * 60 * 60 * 24)) + 1;
    }

    // 結果を反映
    cells[2].innerText = resultC; // C列
    cells[5].innerText = resultF; // F列

    // エラーがある行は記録＆セルを赤色表示
    if (resultC === 'エラー' || resultF === 'エラー') {
      errorRows.push(i + 1);
      if (resultC === 'エラー') cells[2].classList.add('error');
      if (resultF === 'エラー') cells[5].classList.add('error');
    }
  }

  if (errorRows.length > 0) {
    alert('一部のデータにエラーがあります。\nエラー行: ' + errorRows.join(', '));
  } else {
    alert('日数計算が完了しました');
  }
}
