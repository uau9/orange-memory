// 橙子高考背诵助手 —— 前端渲染逻辑
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
  function saveDone(map) { localStorage.setItem(doneKey, JSON.stringify(map)); }
  let doneMap = loadDone();

  // === 倒计时 ===
  function renderCountdown() {
    const now = new Date();
    const days = Math.ceil((GAOKAO_DATE - now) / 86400000);
    const el = document.getElementById("countdown");
    el.textContent = days > 0 ? `距离 2027 高考还有 ${days} 天` : "高考进行中，加油！";
  }

  // === 标签 ===
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

  // === 弹窗 ===
  const overlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  function openModal(cardData) {
    modalTitle.textContent = cardData.知识点 || "";
    let html = "";

    // 标签
    if (cardData.tag) {
      html += `<div class="section"><span style="display:inline-block;font-size:12px;color:var(--orange);background:var(--orange-soft);padding:2px 10px;border-radius:6px;">${cardData.tag}</span></div>`;
    }

    // 核心内容
    html += `<div class="section"><h4>核心内容</h4><p>${cardData.核心内容 || "暂无"}</p></div>`;

    // 详情（原文/解析/对比等扩展内容）
    if (cardData.详情) {
      html += `<div class="section"><h4>背诵详情</h4><p>${cardData.详情}</p></div>`;
    }

    // 名句
    if (cardData.名句) {
      html += `<div class="section"><h4>重点名句</h4><p>${cardData.名句}</p></div>`;
    }

    // 易错
    if (cardData.易错) {
      html += `<div class="section"><h4>易错/易混</h4><p>${cardData.易错}</p></div>`;
    }

    // 记忆技巧
    if (cardData.记忆技巧) {
      html += `<div class="section"><h4>记忆技巧</h4><p>${cardData.记忆技巧}</p></div>`;
    }

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

  // === 卡片 ===
  function renderCards() {
    const box = document.getElementById("cards");
    const q = (document.getElementById("search").value || "").trim().toLowerCase();
    const list = (subjects[active] || []).filter((c) => {
      if (!q) return true;
      return [c.知识点, c.核心内容, c.易错, c.记忆技巧, c.详情, c.tag]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = '<div class="empty">暂无匹配内容</div>';
    }
    list.forEach((c, i) => {
      const id = active + "#" + i;
      const isDone = !!doneMap[id];
      const card = document.createElement("div");
      card.className = "card" + (isDone ? " done" : "");
      const hasDetail = !!(c.详情 || c.名句);
      card.innerHTML = `
        <span class="tag">${c.tag || ""}</span>
        <h3>${c.知识点}</h3>
        <div class="row"><b>核心内容：</b>${(c.核心内容 || "").slice(0, 60)}${(c.核心内容 || "").length > 60 ? "…" : ""}</div>
        ${hasDetail ? '<div class="detail-hint">点击查看详情</div>' : ""}
        <div class="mark ${isDone ? "on" : ""}" data-id="${id}" title="${isDone ? "已背" : "未背"}（右键切换）">${isDone ? "✓" : "○"}</div>`;

      // 单击 → 弹窗
      card.addEventListener("click", function (e) {
        if (e.target.classList.contains("mark")) return;
        openModal(c);
      });

      // 右键 → 切换背诵
      const markEl = card.querySelector(".mark");
      markEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (doneMap[id]) delete doneMap[id]; else doneMap[id] = 1;
        saveDone(doneMap);
        renderCards();
        renderProgress();
      });

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

  // 全局阻止右键默认菜单（仅在卡片区域，且仅在 mark 上）
  document.addEventListener("contextmenu", function (e) {
    if (e.target.classList.contains("mark")) e.preventDefault();
  });

  renderCountdown();
  renderTabs();
  renderCards();
  setInterval(renderCountdown, 60000);
})();
