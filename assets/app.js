// 橙子高考背诵助手 —— 前端渲染逻辑（无构建步骤，纯静态）
(function () {
  const GAOKAO_DATE = new Date("2027-06-07T09:00:00+08:00");
  const subjects = window.SUBJECTS || {};
  const subjectNames = Object.keys(subjects);
  let active = subjectNames[0];
  const doneKey = "orange-done-cards";

  function loadDone() {
    try { return JSON.parse(localStorage.getItem(doneKey) || "{}"); }
    catch (e) { return {}; }
  }
  function saveDone(map) {
    localStorage.setItem(doneKey, JSON.stringify(map));
  }
  let doneMap = loadDone();

  // 倒计时
  function renderCountdown() {
    const now = new Date();
    const days = Math.ceil((GAOKAO_DATE - now) / 86400000);
    const el = document.getElementById("countdown");
    el.textContent = days > 0 ? `距离 2027 高考还有 ${days} 天` : "高考进行中，加油！";
  }

  // 标签
  function renderTabs() {
    const box = document.getElementById("tabs");
    box.innerHTML = "";
    subjectNames.forEach((name) => {
      const b = document.createElement("button");
      b.className = "tab" + (name === active ? " active" : "");
      b.textContent = name;
      b.onclick = () => { active = name; renderTabs(); renderCards(); };
      box.appendChild(b);
    });
  }

  // 卡片
  function renderCards() {
    const box = document.getElementById("cards");
    const q = (document.getElementById("search").value || "").trim().toLowerCase();
    const list = (subjects[active] || []).filter((c) => {
      if (!q) return true;
      return [c.知识点, c.核心内容, c.易错, c.记忆技巧, c.tag]
        .join(" ").toLowerCase().includes(q);
    });
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = '<div class="empty">暂无内容。请用对应科目的 expert agent 梳理后填充。</div>';
    }
    list.forEach((c, i) => {
      const id = active + "#" + i;
      const isDone = !!doneMap[id];
      const card = document.createElement("div");
      card.className = "card" + (isDone ? " done" : "");
      card.innerHTML = `
        <span class="tag">${c.tag || ""}</span>
        <h3>${c.知识点}</h3>
        <div class="row"><b>核心内容：</b>${c.核心内容 || ""}</div>
        <div class="row"><b>易错/易混：</b>${c.易错 || "—"}</div>
        <div class="row"><b>记忆技巧：</b>${c.记忆技巧 || "—"}</div>
        <div class="mark ${isDone ? "on" : ""}" data-id="${id}">${isDone ? "✓ 已背" : "○ 标记已背"}</div>`;
      card.querySelector(".mark").onclick = function () {
        if (doneMap[id]) delete doneMap[id]; else doneMap[id] = 1;
        saveDone(doneMap);
        renderCards(); renderProgress();
      };
      box.appendChild(card);
    });
    renderProgress();
  }

  function renderProgress() {
    const total = subjectNames.reduce((s, n) => s + (subjects[n] || []).length, 0);
    const done = Object.keys(doneMap).length;
    document.getElementById("progress").textContent =
      total ? `已背 ${done} / ${total}` : "";
  }

  document.getElementById("search").addEventListener("input", renderCards);
  renderCountdown();
  renderTabs();
  renderCards();
  setInterval(renderCountdown, 60000);
})();
