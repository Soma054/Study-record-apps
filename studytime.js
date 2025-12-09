const Touroku = document.getElementById("Touroku");
const studycontent = document.getElementById("studycontent");
const studytime = document.getElementById("studytime");
const contentlink = document.getElementById("contentlink");
const timelink = document.getElementById("timelink");
const totaltimehyozi = document.getElementById("totaltimehyozi");
let TotalTime = 0;
const consequence = document.getElementById("consequence");

// ========== IndexedDB 設定 ==========
const DB_NAME = "StudyRecordDB";
const DB_VERSION = 1;
const STORE_NAME = "records";

// データベースを開く
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

// 記録を追加
async function addRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 全ての記録を取得
async function getAllRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 記録を削除
async function deleteRecord(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========== 画面に記録を表示する関数 ==========
function displayRecord(record) {
  const element = document.createElement("p");
  const resultList = document.getElementById("resultList");
  element.classList.add("consequence");
  element.innerHTML = record.content + "<br>" + record.time + "時間";

  // 削除ボタン
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = '<i data-lucide="trash"></i>';
  deleteButton.classList.add("deleteButton");

  // 削除ボタンを押した時の処理
  deleteButton.addEventListener("click", async function () {
    await deleteRecord(record.id); // IndexedDBから削除
    element.remove();
    TotalTime -= Number(record.time);
    totaltimehyozi.textContent = "合計時間：" + TotalTime + "h/1000h";
  });

  element.appendChild(deleteButton);
  resultList.appendChild(element);

  // アイコン表示
  lucide.createIcons();
}

// ========== ページ読み込み時にデータを復元 ==========
async function loadRecords() {
  try {
    const records = await getAllRecords();
    TotalTime = 0; // リセット

    records.forEach((record) => {
      displayRecord(record);
      TotalTime += Number(record.time);
    });

    totaltimehyozi.textContent = "合計時間：" + TotalTime + "h/1000h";

    // ★ ここに追加！ ↓↓↓
    if (records.length > 0) {
      consequence.style.display = "none";
    }
    // ★ ここまで ↑↑↑
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error);
  }
}

// ページ読み込み時に実行
window.addEventListener("DOMContentLoaded", loadRecords);

// ========== 登録処理 ==========
async function handleSubmit() {
  // 入力値取得
  let time = studytime.value;
  let content = studycontent.value;

  if (!content || !time) {
    const error = document.getElementById("error");
    error.innerText = "error:学習内容または学習時間を入力してください";
    return;
  } else {
    error.innerText = "";
  }

  // IndexedDBに保存
  const record = {
    content: content,
    time: time,
    createdAt: new Date().toISOString(),
  };

  try {
    const id = await addRecord(record);
    record.id = id; // 保存後にIDを取得

    // 画面に表示
    displayRecord(record);

    // 合計時間計算
    TotalTime += Number(time);
    totaltimehyozi.textContent = "合計時間：" + TotalTime + "h/1000h";

    // プレビューを非表示
    consequence.style.display = "none";

    // 入力欄をクリア
    studycontent.value = "";
    studytime.value = "";
  } catch (error) {
    console.error("保存に失敗しました:", error);
  }
}

// ========== イベントリスナー ==========
Touroku.addEventListener("click", handleSubmit);

studytime.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    handleSubmit();
  }
});

studycontent.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    handleSubmit();
  }
});

studycontent.addEventListener("input", function () {
  let content = studycontent.value;
  contentlink.textContent = "入力されてる学習内容：" + content;
});

studytime.addEventListener("input", function () {
  let time = studytime.value;
  timelink.textContent = "入力されてる学習時間：" + time + "時間";
});
