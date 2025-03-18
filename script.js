// DOMContentLoaded イベントで初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期表示：12行生成
    initializeTable(12);
  
    // 12行追加ボタンのクリックイベント
    document.getElementById('addRowsBtn').addEventListener('click', function() {
      addRows(12);
    });
  
    // 計算ボタンのクリックイベント
    document.getElementById('calcBtn').addEventListener('click', calculateDays);
  });
  
  /**
   * 新しい行を作成する
   * ※A, B, D, E列は編集可能に設定
   * @returns {HTMLElement} 新規作成した tr 要素
   */
  function createRow() {
    const row = document.createElement('tr');
  
    // 全6セル作成
    for (let i = 0; i < 6; i++) {
      const cell = document.createElement('td');
      // A列, B列, D列, E列（インデックス: 0, 1, 3, 4）は編集可能にする
      if (i === 0 || i === 1 || i === 3 || i === 4) {
        cell.contentEditable = "true";
      }
      row.appendChild(cell);
    }
    return row;
  }
  
  /**
   * 指定行数分の初期行をテーブルに生成する
   * @param {number} count - 作成する行数
   */
  function initializeTable(count) {
    const tbody = document.getElementById("table-body");
    for (let i = 0; i < count; i++) {
      tbody.appendChild(createRow());
    }
  }
  
  /**
   * 指定行数分の行をテーブルに追加する
   * @param {number} count - 追加する行数
   */
  function addRows(count) {
    const tbody = document.getElementById("table-body");
    for (let i = 0; i < count; i++) {
      tbody.appendChild(createRow());
    }
  }
  
  /**
   * 日付文字列が有効かどうかをチェックする
   * @param {string} dateString - 日付文字列
   * @returns {boolean} 有効なら true、無効なら false
   */
  function isValidDate(dateString) {
    const timestamp = Date.parse(dateString);
    return !isNaN(timestamp);
  }
  
  /**
   * 各行のA, B列およびD, E列の日付差（日数）を計算し、C列とF列に反映する
   */
  function calculateDays() {
    const tbody = document.getElementById("table-body");
    const rows = tbody.rows;
    const errorRows = [];
  
    // 各行ごとに計算処理
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells;
      // 前回のエラー表示をリセット
      cells[2].classList.remove("error");
      cells[5].classList.remove("error");
  
      // 各セルの値（空白除去）
      const cellA = cells[0].innerText.trim();
      const cellB = cells[1].innerText.trim();
      const cellD = cells[3].innerText.trim();
      const cellE = cells[4].innerText.trim();
  
      let resultC = "エラー";
      let resultF = "エラー";
  
      // A列とB列の計算（終了日―開始日＋1）
      if (isValidDate(cellA) && isValidDate(cellB)) {
        const dateA = new Date(cellA);
        const dateB = new Date(cellB);
        resultC = Math.floor((dateB - dateA) / (1000 * 60 * 60 * 24)) + 1;
      }
  
      // D列とE列の計算（終了日―開始日＋1）
      if (isValidDate(cellD) && isValidDate(cellE)) {
        const dateD = new Date(cellD);
        const dateE = new Date(cellE);
        resultF = Math.floor((dateE - dateD) / (1000 * 60 * 60 * 24)) + 1;
      }
  
      // 計算結果を各セルに反映
      cells[2].innerText = resultC;
      cells[5].innerText = resultF;
  
      // エラーがある行はエラー表示
      if (resultC === "エラー" || resultF === "エラー") {
        errorRows.push(i + 1);
        if (resultC === "エラー") cells[2].classList.add("error");
        if (resultF === "エラー") cells[5].classList.add("error");
      }
    }
  
    if (errorRows.length > 0) {
      alert("一部のデータにエラーがあります。\nエラー行: " + errorRows.join(", "));
    } else {
      alert("日数計算が完了しました");
    }
  }
  