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

  // === 工具 ===
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
  function updateBackupHint() { document.getElementById("btnExport").title = "备份背诵进度（" + Object.keys(doneMap).length + " 条）"; }
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

  document.getElementById("importFile").onchange = function (e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (data.doneMap && typeof data.doneMap === "object") {
          if (confirm("将从备份恢复 " + Object.keys(data.doneMap).length + " 条记录，是否覆盖当前进度？")) {
            doneMap = data.doneMap;
            saveDone(doneMap);
            renderContent();
            alert("恢复完成！已加载 " + Object.keys(doneMap).length + " 条记录。");
          }
        } else alert("备份文件格式无效。");
      } catch (ex) { alert("文件解析失败：" + ex.message); }
    };
    reader.readAsText(file);
    this.value = "";
  };

  // === 挖空测试 ===
  function toggleCloze(on) {
    clozeMode = on;
    clozeReveals = {};
    document.getElementById("clozeBar").style.display = on ? "flex" : "none";
    document.getElementById("btnCloze").classList.toggle("active", on);
    renderContent();
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
      b.onclick = function () { active = name; l2 = null; l3 = null; if (clozeMode) toggleCloze(false); renderTabs(); renderContent(); };
      box.appendChild(b);
    });
  }

  // === HTML 转义 ===
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // === 挖空处理：对中文内容做挖空 ===
  function clozeContent(text, cardIdx) {
    if (!clozeMode || !text) return esc(text);
    // 把中文连续片段按长度挖空约40%
    var hashSeed = cardIdx;
    var blankIdx = 0;
    var html = "";
    var i = 0;
    while (i < text.length) {
      // 匹配一段中文
      var m = /[\u4e00-\u9fff]{2,}/.exec(text.substring(i));
      if (!m) { html += esc(text[i]); i++; continue; }
      // 找到这段中文
      var startInText = i + m.index;
      var seg = m[0];
      html += esc(text.substring(i, startInText));
      // 决定是否挖空
      var hash = (hashSeed * 31 + blankIdx * 7 + startInText) % 100;
      if (hash < 50) {
        var key = cardIdx + "-" + blankIdx;
        var revealed = clozeReveals[key];
        html += '<span class="cloze-blank' + (revealed ? ' revealed' : '') + '" data-cloze-key="' + key + '" title="点击揭晓">' + (revealed ? esc(seg) : "●●●") + '</span>';
        clozeReveals[key] = !!revealed;
        blankIdx++;
      } else {
        html += esc(seg);
      }
      i = startInText + seg.length;
    }
    return html;
  }

  // === 卡片渲染（全部内容内联，不再弹窗） ===
  function renderContent() {
    var box = document.getElementById("cards");
    box.innerHTML = "";
    box.className = clozeMode ? "cards cards-cloze" : "cards";
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
        div.innerHTML = '<div class="folder-icon">📁</div><div class="folder-name">' + esc(item) + '</div><div class="folder-count">' + count + ' 项</div>';
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
        div.innerHTML = '<div class="folder-icon">📄</div><div class="folder-name">' + esc(item) + '</div><div class="folder-count">' + cnt3 + ' 项</div>';
        div.onclick = function () { l3 = item; renderContent(); renderTabs(); };
        box.appendChild(div);
      });
      return;
    }

    // 卡片（内联完整内容）
    if (!cards.length) { box.innerHTML = '<div class="empty">暂无匹配内容</div>'; return; }
    cards.forEach(function (c, i) {
      var id = cardId(c, i);
      var isDone = !!doneMap[id];
      var card = document.createElement("div");
      card.className = "card card-full" + (isDone ? " done" : "") + (clozeMode ? " cloze" : "");
      var html = '<h3>' + esc(c.知识点) + '</h3>';
      if (c.tag) html += '<div class="card-tag">' + esc(c.tag) + '</div>';
      // 核心内容
      if (c.核心内容) html += '<div class="card-section"><div class="card-label">核心内容</div><div class="card-body">' + clozeContent(c.核心内容, i * 100 + 1) + '</div></div>';
      // 详情（原文/解析/对比等）
      if (c.详情) html += '<div class="card-section"><div class="card-label">背诵详情</div><div class="card-body">' + clozeContent(c.详情, i * 100 + 2) + '</div></div>';
      // 名句
      if (c.名句) html += '<div class="card-section"><div class="card-label">重点名句</div><div class="card-body">' + clozeContent(c.名句, i * 100 + 3) + '</div></div>';
      // 易错
      if (c.易错) html += '<div class="card-section"><div class="card-label">易错/易混</div><div class="card-body">' + esc(c.易错) + '</div></div>';
      // 记忆技巧
      if (c.记忆技巧) html += '<div class="card-section"><div class="card-label">记忆技巧</div><div class="card-body">' + esc(c.记忆技巧) + '</div></div>';
      // 已背标记
      html += '<div class="mark ' + (isDone ? "on" : "") + '" data-id="' + id + '" title="' + (isDone ? "已背" : "未背") + '（右键切换）">' + (isDone ? "✓" : "○") + '</div>';

      card.innerHTML = html;

      // 右键切换已背
      card.querySelector(".mark").addEventListener("contextmenu", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (doneMap[id]) delete doneMap[id]; else doneMap[id] = 1;
        saveDone(doneMap);
        renderContent();
        renderProgress();
      });

      box.appendChild(card);
    });

    // 挖空点击揭晓
    if (clozeMode) {
      box.onclick = function (e) {
        var blank = e.target.closest(".cloze-blank");
        if (!blank) return;
        var key = blank.dataset.clozeKey;
        if (key) {
          clozeReveals[key] = true;
          renderContent();
          updateClozeStats();
        }
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