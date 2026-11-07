
/*
 * Week 10 - 網站操作行為偵測
 * tracker.js
 *
 * 功能：
 * 1. 開始 / 停止紀錄
 * 2. 記錄使用者操作事件
 * 3. 使用 sessionStorage 暫存
 * 4. 自動記錄頁面可見停留時間
 * 5. 查看、清除及匯出 JSON
 *
 * 不連接 Django API 或 Neon 資料庫
 */

(function () {
  "use strict";

  const STORAGE_KEY = "week10_events";
  const SESSION_KEY = "week10_session_id";
  const ENABLED_KEY = "week10_enabled";
  const SEQ_KEY = "week10_seq";

  // 判斷目前是哪個頁面
  function getPageId() {
    const path = window.location.pathname;

    if (path.includes("publications")) {
      return "publications";
    }

    if (path.includes("projects")) {
      return "projects";
    }

    return "home";
  }

  // 產生測試識別碼
  function generateId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return Date.now().toString(36) +
      Math.random().toString(36).slice(2);
  }

  // 取得本次測試 ID
  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);

    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }

    return id;
  }

  // 讀取操作紀錄
  function read() {
    try {
      const events = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(events) ? events : [];
    } catch (error) {
      console.warn("操作紀錄讀取失敗", error);
      return [];
    }
  }

  // 是否正在紀錄
  function isEnabled() {
    return sessionStorage.getItem(ENABLED_KEY) === "true";
  }

  // 頁面可見時間計時器
  let visibleStartedAt = null;

  // 開始計算頁面可見時間
  function startVisibleTimer() {
    if (
      isEnabled() &&
      document.visibilityState === "visible" &&
      visibleStartedAt === null
    ) {
      visibleStartedAt = Date.now();
    }
  }

  // 結束本次可見時間並記錄
  function flushVisibleTime(reason) {
    if (visibleStartedAt === null) {
      return;
    }

    const visibleMs = Math.max(
      0,
      Date.now() - visibleStartedAt
    );

    visibleStartedAt = null;

    // 避免記錄 0 毫秒的無效事件
    if (visibleMs <= 0) {
      return;
    }

    track("page_duration", "page", {
      visible_ms: visibleMs,
      reason: reason
    });
  }

  // 開始紀錄
  function start() {
    getSessionId();
    sessionStorage.setItem(ENABLED_KEY, "true");

    startVisibleTimer();

    console.log("操作紀錄已開始");
  }

  // 停止紀錄
  function stop() {
    // 必須先儲存停留時間，再關閉追蹤
    flushVisibleTime("stop");

    sessionStorage.setItem(ENABLED_KEY, "false");

    console.log("操作紀錄已停止");
  }

  // 記錄一次事件
  function track(eventType, targetId, data = {}) {
    if (!isEnabled()) {
      return;
    }

    // 只允許儲存指定欄位，避免記錄敏感資料
    const allowedFields = [
      "result_count",
      "keyword_length",
      "year",
      "type",
      "chart_type",
      "selected_year",
      "selected_type",
      "selected_chart",
      "selected_funding",
      "visible_ms",
      "reason"
    ];

    const safeData = {};

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          safeData[key] = value;
        }
      }
    }

    const events = read();

    const seq =
      Number(sessionStorage.getItem(SEQ_KEY) || 0) + 1;

    const event = {
      event_id: generateId(),
      session_id: getSessionId(),
      seq: seq,
      event_type: eventType,
      page_id: getPageId(),
      target_id: targetId,
      occurred_at: new Date().toISOString(),
      ui_version: "week10-v1",
      test_phase: "self_test",
      data: safeData
    };

    events.push(event);

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(events)
      );

      sessionStorage.setItem(
        SEQ_KEY,
        String(seq)
      );

      console.log("已記錄事件：", event);
    } catch (error) {
      console.warn("操作紀錄儲存失敗", error);
    }
  }

  // 清除本課的紀錄
  function reset() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SEQ_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    // 清除後重新計算目前頁面的停留時間
    visibleStartedAt = null;
    startVisibleTimer();

    console.log("操作紀錄已清除");
  }

  // 匯出 JSON
  function exportJSON() {
    // 匯出前先保存目前累積的可見時間
    flushVisibleTime("export");

    const events = read();

    const json = JSON.stringify(events, null, 2);

    const blob = new Blob([json], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "week10_events.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    // 匯出後繼續計算停留時間
    startVisibleTimer();
  }

  // 使用者切換瀏覽器分頁
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flushVisibleTime("hidden");
    } else {
      startVisibleTimer();
    }
  });

  // 使用者離開目前頁面
  window.addEventListener("pagehide", function () {
    flushVisibleTime("pagehide");
  });

  // 返回快取頁面時恢復計時
  window.addEventListener("pageshow", function () {
    startVisibleTimer();
  });

  // 提供其他 JavaScript 使用
  window.UITracker = {
    start,
    stop,
    isEnabled,
    track,
    read,
    reset,
    exportJSON
  };

  // 如果上一頁已經啟動追蹤，繼續計時
  startVisibleTimer();

  console.log("Week 10 tracker.js 已載入");
})();
