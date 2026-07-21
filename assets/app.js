// 橙子高考背诵助手 —— 三层导航渲染逻辑
(function () {
  const GAOKAO_DATE = new Date("2027-06-07T09:00:00+08:00");
  const subjects = window.SUBJECTS || {};

  // 英语拆分合并：将两个子键合并为 "英语"，并移除子键的 Tab 入口
  (function mergeEnglish() {
    var eng = [];
    if (subjects["英语词组518"]) { eng = eng.concat(subjects["英语词组518"]); delete subjects["英语词组518"]; }
    if (subjects["英语熟词273"]) { eng = eng.concat(subjects["英语熟词273"]); delete subjects["英语熟词273"]; }
    if (eng.length) subjects["英语"] = eng;
  })();

  const subjectNames = Object.keys(subjects);
  let active = subjectNames[0];

  let l2 = null; // 二级目录（tag/level2）
  let l3 = null; // 三级目录（level3/知识点）
  const doneKey = "orange-done-cards";

  function loadDone() {
    try { return JSON.parse(localStorage.getItem(doneKey) || "{}"); }
    catch (e) { return {}; }
  }
  function saveDone(map) { localStorage.setItem(doneKey, JSON.stringify(map)); }
  let doneMap = loadDone();

  // 获取当前上下文下的卡片
  function getCards() {
    const all = subjects[active] || [];
    const q = (document.getElementById("search").value || "").trim().toLowerCase();
    let list = all;
    if (l2 !== null) list = list.filter(c => (c.level2 || c.tag) === l2);
    if (l3 !== null) list = list.filter(c => (c.level3 || c.知识点) === l3);
    if (q) {
      list = list.filter(c => [c.知识点, c.核心内容, c.易错, c.记忆技巧, c.详情, c.tag, c.level2, c.level3]
        .filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return list;
  }

  // 获取唯一二级目录
  function getL2Items() {
    const s = new Set();
    (subjects[active] || []).forEach(c => s.add(c.level2 || c.tag));
    return [...s].filter(Boolean);
  }

  // 获取当前二级下的唯一三级目录
  function getL3Items() {
    const s = new Set();
    (subjects[active] || []).forEach(c => {
      if ((c.level2 || c.tag) === l2) s.add(c.level3 || c.知识点);
    });
    return [...s].filter(Boolean);
  }

  // 生成唯一 ID
  function cardId(card, idx) {
    return active + "#" + (l2 || "") + "#" + (l3 || "") + "#" + idx;
  }

  // === 倒计时 ===
  function renderCountdown() {
    const now = new Date();
    const days = Math.ceil((GAOKAO_DATE - now) / 86400000);
    document.getElementById("countdown").textContent = days > 0 ? `剩余：${days} 天` : "高考进行中，加油！";
  }

  // === 标签 ===
  function renderTabs() {
    const box = document.getElementById("tabs");
    box.innerHTML = "";
    subjectNames.forEach((name) => {
      const b = document.createElement("button");
      b.className = "tab" + (name === active ? " active" : "");
      b.textContent = name;
      b.onclick = () => { active = name; l2 = null; l3 = null; renderTabs(); renderContent(); };
      box.appendChild(b);
    });
  }

  // === 弹窗 ===（不变）
  const overlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  function openModal(cardData) {
    modalTitle.textContent = cardData.知识点 || "";
    let html = "";
    if (cardData.tag) html += `<div class="section"><span style="display:inline-block;font-size:12px;color:var(--orange);background:var(--orange-soft);padding:2px 10px;border-radius:6px;">${cardData.tag}</span></div>`;
    html += `<div class="section"><h4>核心内容</h4><p>${cardData.核心内容 || "暂无"}</p></div>`;
    if (cardData.详情) html += `<div class="section"><h4>背诵详情</h4><p>${cardData.详情}</p></div>`;
    if (cardData.名句) html += `<div class="section"><h4>重点名句</h4><p>${cardData.名句}</p></div>`;
    if (cardData.易错) html += `<div class="section"><h4>易错/易混</h4><p>${cardData.易错}</p></div>`;
    if (cardData.记忆技巧) html += `<div class="section"><h4>记忆技巧</h4><p>${cardData.记忆技巧}</p></div>`;
    modalBody.innerHTML = html;
    overlay.classList.add("show");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("show");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
  overlay.addEventListener("click", closeModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
  });

  // === 面包屑导航 ===
  const breadcrumb = document.getElementById("breadcrumb");

  // === 主渲染 ===
  function renderContent() {
    const box = document.getElementById("cards");
    box.innerHTML = "";
    const cards = getCards();
    const bread = document.getElementById("breadcrumb");

    // 先渲染面包屑（三级目录名称显示）
    let pathHtml = "";
    if (l2 !== null) {
      pathHtml += `<span class="crumb-link" data-action="l2">${l2}</span>`;
      if (l3 !== null) {
        pathHtml += ` <span class="crumb-sep">›</span> <span class="crumb-link" data-action="l3">${l3}</span>`;
      }
    }
    bread.innerHTML = pathHtml;

    // 如果没有任何目录被选中，显示二级目录
    if (l2 === null) {
      const items = getL2Items();
      if (!items.length) { box.innerHTML = '<div class="empty">暂无内容</div>'; return; }
      items.forEach(item => {
        const div = document.createElement("div");
        div.className = "folder-card";
        div.innerHTML = `<div class="folder-icon">📁</div><div class="folder-name">${item}</div>
          <div class="folder-count">${(subjects[active] || []).filter(c => (c.level2 || c.tag) === item).length} 项</div>`;
        div.onclick = () => { l2 = item; l3 = null; renderContent(); renderTabs(); };
        box.appendChild(div);
      });
      return;
    }

    // 二级已选，显示三级目录
    if (l3 === null) {
      const items = getL3Items();
      if (!items.length) { box.innerHTML = '<div class="empty">暂无内容</div>'; return; }
      items.forEach(item => {
        const div = document.createElement("div");
        div.className = "folder-card";
        const count = getCards().filter(c => (c.level3 || c.知识点) === item).length;
        div.innerHTML = `<div class="folder-icon">📄</div><div class="folder-name">${item}</div>
          <div class="folder-count">${count} 项</div>`;
        div.onclick = () => { l3 = item; renderContent(); renderTabs(); };
        box.appendChild(div);
      });
      return;
    }

    // 三级已选，显示卡片
    if (!cards.length) { box.innerHTML = '<div class="empty">暂无匹配内容</div>'; return; }
    cards.forEach((c, i) => {
      const id = cardId(c, i);
      const isDone = !!doneMap[id];
      const card = document.createElement("div");
      card.className = "card" + (isDone ? " done" : "");
      const hasDetail = !!(c.详情 || c.名句);
      card.innerHTML = `
        <h3>${c.知识点}</h3>
        <div class="row"><b>核心内容：</b>${(c.核心内容 || "").slice(0, 80)}${(c.核心内容 || "").length > 80 ? "…" : ""}</div>
        ${hasDetail ? '<div class="detail-hint">点击查看详情</div>' : ""}
        <div class="mark ${isDone ? "on" : ""}" data-id="${id}" title="${isDone ? "已背" : "未背"}（右键切换）">${isDone ? "✓" : "○"}</div>`;
      card.addEventListener("click", function (e) {
        if (e.target.classList.contains("mark")) return;
        openModal(c);
      });
      const markEl = card.querySelector(".mark");
      markEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (doneMap[id]) delete doneMap[id]; else doneMap[id] = 1;
        saveDone(doneMap);
        renderContent();
        renderProgress();
      });
      box.appendChild(card);
    });
    renderProgress();
  }

  // 面包屑点击事件（委托）
  document.getElementById("breadcrumb").addEventListener("click", function (e) {
    const link = e.target.closest(".crumb-link");
    if (!link) return;
    const action = link.dataset.action;
    if (action === "l2") { l3 = null; renderContent(); renderTabs(); }
  });

  function renderProgress() {
    const all = subjects[active] || [];
    const total = all.length;
    const done = Object.keys(doneMap).length;
    document.getElementById("progress").textContent = total ? `已背 ${done} / ${total}` : "";
  }

  document.getElementById("search").addEventListener("input", renderContent);
  document.addEventListener("contextmenu", function (e) {
    if (e.target.classList.contains("mark")) e.preventDefault();
  });

  renderCountdown();
  renderTabs();
  renderContent();
  setInterval(renderCountdown, 60000);
})();
