// 橙子背诵 —— 主逻辑（三层导航 + 夜间模式 + 备份恢复 + 挖空测试）
(function () {
  const GAOKAO_DATE = new Date("2027-06-07T09:00:00+08:00");
  const subjects = window.SUBJECTS || {};

  // 英语拆分合并
  (function mergeEnglish() {
    var eng = [];
    if (subjects["英语词组518"]) { eng = eng.concat(subjects["英语词组518"]); delete subjects["英语词组518"]; }
    if (subjects["英语熟词273"]) { eng = eng.concat(subjects["英语熟词273"]); delete subjects["英语熟词273"]; }
    if (eng.length) subjects["英语"] = eng;
  })();

  const subjectNames = Object.keys(subjects);
  let active = subjectNames[0];
  let l2 = null, l3 = null;
  const doneKey = "orange-done-cards";
  let clozeMode = false;
  let clozeReveals = {};

  // === 工具函数 ===
  function loadDone() { try { return JSON.parse(localStorage.getItem(doneKey) || "{}"); } catch (e) { return {}; } }
  function saveDone(map) { localStorage.setItem(doneKey, JSON.stringify(map)); updateBackupHint(); }
  let doneMap = loadDone();

  function cardId(card, idx) { return active + "#" + (l2 || "") + "#" + (l3 || "") + "#" + idx; }
  function getCards() {
    const all = subjects[active] || [];
    const q = (document.getElementById("search").value || "").trim().toLowerCase();
    let list = all;
    if (l2 !== null) list = list.filter(c => (c.level2 || c.tag) === l2);
    if (l3 !== null) list = list.filter(c => (c.level3 || c.知识点) === l3);
    if (q) list = list.filter(c => [c.知识点, c.核心内容, c.易错, c.记忆技巧, c.详情, c.tag, c.level2, c.level3].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }
  function getL2Items() { const s = new Set(); (subjects[active] || []).forEach(c => s.add(c.level2 || c.tag)); return [...s].filter(Boolean); }
  function getL3Items() { const s = new Set(); (subjects[active] || []).forEach(c => { if ((c.level2 || c.tag) === l2) s.add(c.level3 || c.知识点); }); return [...s].filter(Boolean); }

  // === 夜间模式 ===
  function initDark() {
    if (localStorage.getItem("orange-dark") === "1") document.body.classList.add("dark");
    document.getElementById("btnDark").textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  }
  document.getElementById("btnDark").onclick = function () {
    var isDark = document.body.classList.toggle("dark");
    localStorage.setItem("orange-dark", isDark ? "1" : "0");
    this.textContent = isDark ? "☀️" : "🌙";
  };
  initDark();

  // === 备份 ===
  function updateBackupHint() {
    document.getElementById("btnExport").title = "备份背诵进度（" + Object.keys(doneMap).length + " 条记录）";
  }
  document.getElementById("btnExport").onclick = function () {
    var data = { doneMap: doneMap, dark: localStorage.getItem("orange-dark"), date: new Date().toISOString() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "橙子背诵-备份-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  updateBackupHint();

  // === 恢复 ===
  document.getElementById("importFile").onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (data.doneMap && typeof data.doneMap === "object") {
          if (confirm("将从备份恢复 " + Object.keys(data.doneMap).length + " 条背诵记录，是否覆盖当前进度？")) {
            doneMap = data.doneMap;
            saveDone(doneMap);
            renderContent();
            alert("恢复完成！已加载 " + Object.keys(doneMap).length + " 条记录。");
          }
        } else { alert("备份文件格式无效，未找到背诵记录。"); }
      } catch (ex) { alert("文件解析失败：" + ex.message); }
    };
    reader.readAsText(file);
    this.value = "";
  };

  // === 挖空测试模式 ===
  function toggleCloze(on) {
    clozeMode = on;
    clozeReveals = {};
    document.getElementById("clozeBar").style.display = on ? "flex" : "none";
    document.getElementById("btnCloze").classList.toggle("active", on);
    if (!on) renderContent();
  }
  document.getElementById("btnCloze").onclick = function () { toggleCloze(!clozeMode); };
  document.getElementById("btnClozeOff").onclick = function () { toggleCloze(false); };

  function updateClozeStats() {
    var total = 0, revealed = 0;
    for (var k in clozeReveals) { total++; if (clozeReveals[k]) revealed++; }
    document.getElementById("clozeStats").textContent = total ? "已揭晓 " + revealed + " / " + total : "";
  }

  // === 倒计时 ===
  function renderCountdown() {
    var days = Math.ceil((GAOKAO_DATE - new Date()) / 86400000);
    document.getElementById("countdown").textContent = days > 0 ? "剩余：" + days + " 天" : "高考进行中，加油！";
  }

  // === 标签 ===
  function renderTabs() {
    var box = document.getElementById("tabs");
    box.innerHTML = "";
    subjectNames.forEach(function (name) {
      var b = document.createElement("button");
      b.className = "tab" + (name === active ? " active" : "");
      b.textContent = name;
      b.onclick = function () { active = name; l2 = null; l3 = null; clozeMode = false; clozeReveals = {}; document.getElementById("clozeBar").style.display = "none"; document.getElementById("btnCloze").classList.remove("active"); renderTabs(); renderContent(); };
      box.appendChild(b);
    });
  }

  // === 弹窗 ===
  var overlay = document.getElementById("modalOverlay");
  var modal = document.getElementById("modal");
  var modalTitle = document.getElementById("modalTitle");
  var modalBody = document.getElementById("modalBody");
  function openModal(cardData) {
    modalTitle.textContent = cardData.知识点 || "";
    var html = "";
    if (cardData.tag) html += '<div class="section"><span style="display:inline-block;font-size:12px;color:var(--orange);background:var(--orange-soft);padding:2px 10px;border-radius:6px;">' + cardData.tag + '</span></div>';
    html += '<div class="section"><h4>核心内容</h4><p>' + (cardData.核心内容 || "暂无") + '</p></div>';
    if (cardData.详情) html += '<div class="section"><h4>背诵详情</h4><p>' + cardData.详情 + '</p></div>';
    if (cardData.名句) html += '<div class="section"><h4>重点名句</h4><p>' + cardData.名句 + '</p></div>';
    if (cardData.易错) html += '<div class="section"><h4>易错/易混</h4><p>' + cardData.易错 + '</p></div>';
    if (cardData.记忆技巧) html += '<div class="section"><h4>记忆技巧</h4><p>' + cardData.记忆技巧 + '</p></div>';
    modalBody.innerHTML = html;
    overlay.classList.add("show");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal() { overlay.classList.remove("show"); modal.classList.remove("show"); document.body.style.overflow = ""; }
  overlay.addEventListener("click", closeModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("show")) closeModal(); });

  // === 挖空：处理文本 ===
  function clozeText(text, cardIdx) {
    if (!clozeMode || !text) return text;
    // 把中文词组/翻译挖空（每次渲染随机选一部分）
    var parts = text.split(/([，。、；：\n|．])/);
    var result = "";
    var blankIdx = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.match(/^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+$/) && p.length >= 2) {
        // 随机决定是否挖空（约40%概率）
        var hash = (cardIdx * 31 + blankIdx * 7) % 100;
        if (hash < 40) {
          var key = cardIdx + "-" + blankIdx;
          var revealed = clozeReveals[key];
          result += '<span class="cloze-blank' + (revealed ? ' revealed' : '') + '" data-cloze-key="' + key + '">' + (revealed ? p : "●●●") + '</span>';
          blankIdx++;
        } else {
          result += p;
        }
      } else {
        result += p;
      }
    }
    return result;
  }

  // === 主渲染 ===
  function renderContent() {
    var box = document.getElementById("cards");
    box.innerHTML = "";
    var cards = getCards();
    var bread = document.getElementById("breadcrumb");
    bread.innerHTML = l2 !== null ? '<span class="crumb-link" data-action="l2">' + l2 + '</span>' + (l3 !== null ? ' <span class="crumb-sep">›</span> <span class="crumb-link" data-action="l3">' + l3 + '</span>' : "") : "";

    // 二级目录
    if (l2 === null) {
      var items = getL2Items();
      if (!items.length) { box.innerHTML = '<div class="empty">暂无内容</div>'; return; }
      items.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "folder-card";
        var count = (subjects[active] || []).filter(function (c) { return (c.level2 || c.tag) === item; }).length;
        div.innerHTML = '<div class="folder-icon">📁</div><div class="folder-name">' + item + '</div><div class="folder-count">' + count + ' 项</div>';
        div.onclick = function () { l2 = item; l3 = null; renderContent(); renderTabs(); };
        box.appendChild(div);
      });
      return;
    }

    // 三级目录
    if (l3 === null) {
      var items3 = getL3Items();
      if (!items3.length) { box.innerHTML = '<div class="empty">暂无内容</div>'; return; }
      items3.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "folder-card";
        var cnt3 = getCards().filter(function (c) { return (c.level3 || c.知识点) === item; }).length;
        div.innerHTML = '<div class="folder-icon">📄</div><div class="folder-name">' + item + '</div><div class="folder-count">' + cnt3 + ' 项</div>';
        div.onclick = function () { l3 = item; renderContent(); renderTabs(); };
        box.appendChild(div);
      });
      return;
    }

    // 卡片
    if (!cards.length) { box.innerHTML = '<div class="empty">暂无匹配内容</div>'; return; }
    cards.forEach(function (c, i) {
      var id = cardId(c, i);
      var isDone = !!doneMap[id];
      var card = document.createElement("div");
      card.className = "card" + (isDone ? " done" : "") + (clozeMode ? " cloze" : "");
      var hasDetail = !!(c.详情 || c.名句);
      var coreDisplay = clozeMode ? clozeText(c.核心内容 || "", i) : ((c.核心内容 || "").slice(0, 80) + ((c.核心内容 || "").length > 80 ? "…" : ""));
      card.innerHTML =
        '<h3>' + c.知识点 + '</h3>' +
        '<div class="row"><b>核心内容：</b>' + coreDisplay + '</div>' +
        (hasDetail ? '<div class="detail-hint">点击查看详情</div>' : "") +
        '<div class="mark ' + (isDone ? "on" : "") + '" data-id="' + id + '" title="' + (isDone ? "已背" : "未背") + '（右键切换）">' + (isDone ? "✓" : "○") + '</div>';

      card.addEventListener("click", function (e) {
        if (e.target.classList.contains("mark") || e.target.classList.contains("cloze-blank")) return;
        openModal(c);
      });

      var markEl = card.querySelector(".mark");
      markEl.addEventListener("contextmenu", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (doneMap[id]) delete doneMap[id]; else doneMap[id] = 1;
        saveDone(doneMap);
        renderContent();
        renderProgress();
      });

      box.appendChild(card);
    });

    // 挖空点击事件委托
    if (clozeMode) {
      box.onclick = function (e) {
        var blank = e.target.closest(".cloze-blank");
        if (!blank) return;
        var key = blank.dataset.clozeKey;
        if (key) { clozeReveals[key] = true; }
        renderContent();
        updateClozeStats();
      };
      updateClozeStats();
    }

    renderProgress();
  }

  // 面包屑点击
  document.getElementById("breadcrumb").addEventListener("click", function (e) {
    var link = e.target.closest(".crumb-link");
    if (!link) return;
    if (link.dataset.action === "l2") { l3 = null; renderContent(); renderTabs(); }
  });

  function renderProgress() {
    var all = subjects[active] || [];
    var done = Object.keys(doneMap).length;
    document.getElementById("progress").textContent = "已背 " + done + " / " + all.length;
  }

  document.getElementById("search").addEventListener("input", renderContent);
  document.addEventListener("contextmenu", function (e) { if (e.target.classList.contains("mark")) e.preventDefault(); });

  renderCountdown();
  renderTabs();
  renderContent();
  setInterval(renderCountdown, 60000);
})();
