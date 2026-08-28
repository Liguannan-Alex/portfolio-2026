(function () {
  "use strict";

  const data = window.__HENGDIAN_PAGES_DEMO__;
  if (!data || !Array.isArray(data.projects)) {
    document.querySelector("#project-results").innerHTML = '<p class="empty-state">演示数据未能加载，请刷新页面。</p>';
    return;
  }

  const sourceLayers = [
    { name: "官方备案", count: 4 },
    { name: "平台片单", count: 6 },
    { name: "制作公司", count: 3 },
    { name: "行业自媒体", count: 8 },
    { name: "组讯通告", count: 6 },
    { name: "社交平台", count: 9 },
    { name: "基地本地", count: 9 },
    { name: "数据节展", count: 3 },
  ];

  const state = { query: "", verification: "all", production: "all", sort: "latest", view: "cards" };
  const results = document.querySelector("#project-results");
  const summary = document.querySelector("#result-summary");
  const emptyState = document.querySelector("#empty-state");
  const backdrop = document.querySelector("#drawer-backdrop");
  const evidenceDrawer = document.querySelector("#evidence-drawer");
  const libraryDrawer = document.querySelector("#library-drawer");
  let returnFocus = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[char]);
  }

  function displayDate(value) {
    if (!value) return "待人工核验";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date).replaceAll("/", "-");
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  }

  function evidenceCounts(project) {
    return project.evidence.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, { official: 0, production: 0 });
  }

  function projectNextStep(project) {
    if (project.filing) return "核对同名备案的主体、版本与招商价值";
    return "更新片场状态，并继续查找备案或平台证据";
  }

  function projectCard(project, index) {
    const filing = project.filing;
    const filingApplicant = filing?.filingApplicant || "待业务确认";
    const filingLabel = filing ? "找到同名备案，待核对主体" : "当前资料中暂未找到备案";
    const counts = evidenceCounts(project);
    const evidenceLabel = filing
      ? `备案 ${counts.official} · 片场 ${counts.production}`
      : `片场 ${counts.production} · 备案待补`;
    return `
      <article class="project-card ${filing ? "cross-project" : "single-project"}">
        <div class="card-top">
          <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="status-badge ${filing ? "filing" : "tracking"}">${filing ? "双来源待核" : "片场线索待补备案"}</span>
        </div>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="card-stage">${escapeHtml(project.stage)}</p>
        <div class="evidence-structure" aria-label="证据结构">${escapeHtml(evidenceLabel)}</div>
        <dl class="project-facts">
          <div><dt>横店关联</dt><dd>${escapeHtml(project.hengdianStatus)}</dd></div>
          <div><dt>备案申报机构</dt><dd>${escapeHtml(filingApplicant)}</dd></div>
          <div><dt>备案核验</dt><dd>${escapeHtml(filingLabel)}</dd></div>
          <div><dt>招商优先级</dt><dd class="pending">待业务确认</dd></div>
          <div><dt>下一步</dt><dd>${escapeHtml(projectNextStep(project))}</dd></div>
        </dl>
        <div class="card-footer">
          <span>${project.evidence.length} 条依据 · 最新 ${displayDate(project.latestEvidenceAt)}</span>
          <button class="evidence-button" type="button" data-project-id="${escapeHtml(project.id)}">查看依据</button>
        </div>
      </article>`;
  }

  function filteredProjects() {
    const query = state.query.trim().toLocaleLowerCase("zh-CN");
    const filtered = data.projects.filter((project) => {
      const searchable = [project.name, project.filing?.filingApplicant, project.filing?.reference]
        .filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
      if (query && !searchable.includes(query)) return false;
      if (state.verification === "cross" && !project.filing) return false;
      if (state.verification === "single" && project.filing) return false;
      const productionDates = project.evidence.filter((item) => item.category === "production").map((item) => item.publishedAt);
      if (state.production === "recent" && !productionDates.some((date) => date === "2026-08-25")) return false;
      if (state.production === "earlier" && !productionDates.some((date) => date === "2026-08-18")) return false;
      return true;
    });

    return filtered.sort((left, right) => {
      if (state.sort === "name") return left.name.localeCompare(right.name, "zh-CN");
      if (state.sort === "evidence") return right.evidence.length - left.evidence.length || left.name.localeCompare(right.name, "zh-CN");
      const verificationPriority = Number(Boolean(right.filing)) - Number(Boolean(left.filing));
      if (verificationPriority !== 0) return verificationPriority;
      const evidenceDatePriority = String(right.latestEvidenceAt).localeCompare(String(left.latestEvidenceAt));
      if (evidenceDatePriority !== 0) return evidenceDatePriority;
      return right.evidence.length - left.evidence.length || left.name.localeCompare(right.name, "zh-CN");
    });
  }

  function render() {
    const projects = filteredProjects();
    results.className = `project-results ${state.view}`;
    results.innerHTML = projects.map(projectCard).join("");
    summary.textContent = `当前显示 ${projects.length} / ${data.projects.length} 个项目候选`;
    emptyState.hidden = projects.length !== 0;
    results.hidden = projects.length === 0;
  }

  function renderLeadershipOverview() {
    const allEvidence = data.projects.flatMap((project) => project.evidence);
    const officialCount = allEvidence.filter((item) => item.category === "official").length;
    const productionEvidence = allEvidence.filter((item) => item.category === "production");
    const productionCount = productionEvidence.length;
    const dualCount = data.projects.filter((project) => Boolean(project.filing)).length;
    const singleCount = data.projects.length - dualCount;
    const recentCount = productionEvidence.filter((item) => item.publishedAt === "2026-08-25").length;
    const earlierCount = productionEvidence.filter((item) => item.publishedAt === "2026-08-18").length;
    const crossPercent = Math.round((dualCount / data.projects.length) * 100);

    setText("#snapshot-date", displayDate(data.evidenceThrough));
    setText("#metric-projects", data.projects.length);
    setText("#metric-filings", dualCount);
    setText("#metric-evidence", allEvidence.length);
    setText("#metric-official", officialCount);
    setText("#metric-production", productionCount);
    setText("#metric-sources", data.catalog.sourceCount);
    setText("#metric-companies", data.catalog.companyCount);
    setText("#cross-rate", `${dualCount} / ${data.projects.length} · ${crossPercent}%`);
    setText("#dual-count", dualCount);
    setText("#single-count", singleCount);
    setText("#review-evidence-count", productionCount);
    setText("#recent-evidence-count", recentCount);
    setText("#earlier-evidence-count", earlierCount);
    setText("#task-identity", `${dualCount} 个`);
    setText("#task-filing", `${singleCount} 个`);
    setText("#task-source-review", `${productionCount} 条`);

    const progressBar = document.querySelector("#verification-bar");
    if (progressBar) progressBar.style.width = `${crossPercent}%`;
    const progress = document.querySelector('.progress-rail[role="progressbar"]');
    if (progress) progress.setAttribute("aria-valuenow", String(crossPercent));

    const maxLayerCount = Math.max(...sourceLayers.map((layer) => layer.count));
    const layerChart = document.querySelector("#layer-chart");
    if (layerChart) {
      layerChart.innerHTML = sourceLayers.map((layer) => `
        <div class="layer-row">
          <div><span>${escapeHtml(layer.name)}</span><strong>${layer.count}</strong></div>
          <div class="layer-rail"><span style="width:${Math.round((layer.count / maxLayerCount) * 100)}%"></span></div>
        </div>`).join("");
    }
  }

  function evidenceItem(item) {
    const official = item.category === "official";
    return `
      <article class="evidence-item">
        <div class="evidence-meta">
          <span class="evidence-kind ${official ? "official" : ""}">${official ? "国家公开记录" : "片场公开动态"}</span>
          <span class="evidence-date">${escapeHtml(item.reviewStatus)}</span>
          <span class="evidence-date">证据日期 ${displayDate(item.publishedAt)}</span>
        </div>
        <h4>${escapeHtml(item.sourceName)}</h4>
        <p>${official ? "国家公开页面中存在同名备案记录。" : "公开片场动态中出现该项目名称；该条信息待回到原账号复核。"}</p>
        <p class="evidence-scope"><b>可证明范围：</b>${escapeHtml(item.scope)}</p>
        <a class="source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">打开公开来源 ↗</a>
      </article>`;
  }

  function openEvidence(projectId, trigger) {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return;
    returnFocus = trigger;
    document.querySelector("#drawer-title").textContent = `${project.name} · 证据依据`;
    const filingText = project.filing
      ? `${project.filing.conclusion}；候选编号：${project.filing.reference}`
      : "当前资料中暂未找到备案证据；这不等于项目未备案。";
    const counts = evidenceCounts(project);
    document.querySelector("#drawer-content").innerHTML = `
      <section class="drawer-summary">
        <div class="drawer-status-row"><span class="status-badge ${project.filing ? "filing" : "tracking"}">${project.filing ? "双来源待核" : "片场线索待补备案"}</span><span>备案 ${counts.official} · 片场 ${counts.production}</span></div>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(filingText)}</p>
      </section>
      <h3 class="drawer-section-title">公开依据（${project.evidence.length}）</h3>
      ${project.evidence.map(evidenceItem).join("")}`;
    openDrawer(evidenceDrawer);
  }

  function renderLibrary() {
    document.querySelector("#library-content").innerHTML = `
      <p class="library-intro">正式底库来自业务确认的名单；白色预填内容只作为系统建议，黄色业务字段在未确认时继续显示“待业务确认”。本演示不展示联系人、私域信息或账号数据。</p>
      <div class="library-stats">
        <div class="library-stat"><strong>${data.catalog.sourceCount}</strong><span>固定信源</span></div>
        <div class="library-stat"><strong>${sourceLayers.length}</strong><span>信源分类</span></div>
        <div class="library-stat"><strong>${data.catalog.companyCount}</strong><span>公司底库</span></div>
      </div>
      <h3 class="drawer-section-title">信源分类（仅展示聚合数量）</h3>
      <ul class="layer-list">${sourceLayers.map((layer) => `<li><span>${escapeHtml(layer.name)}</span><strong>${layer.count}</strong></li>`).join("")}</ul>
      <h3 class="drawer-section-title">公司业务字段</h3>
      <div class="company-cloud"><span>合作历史 · 待确认</span><span>联系人掌握 · 待确认</span><span>业务优先级 · 待确认</span><span>负责人 · 待确认</span></div>
      <h3 class="drawer-section-title">演示公开边界</h3>
      <p class="library-intro">公开页展示结构、数量和工作方法，不公开公司名单、信源明细、跟进信息或账号数据。完整底库需在带登录和权限控制的正式系统中使用。</p>`;
  }

  function openDrawer(drawer) {
    evidenceDrawer.hidden = drawer !== evidenceDrawer;
    libraryDrawer.hidden = drawer !== libraryDrawer;
    backdrop.hidden = false;
    drawer.hidden = false;
    document.body.classList.add("drawer-open");
    drawer.querySelector("button")?.focus();
  }

  function closeDrawers() {
    evidenceDrawer.hidden = true;
    libraryDrawer.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
    returnFocus?.focus();
    returnFocus = null;
  }

  function keepFocusInsideOpenDrawer(event) {
    if (event.key !== "Tab" || backdrop.hidden) return;
    const drawer = evidenceDrawer.hidden ? libraryDrawer : evidenceDrawer;
    const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function resetFilters() {
    state.query = "";
    state.verification = "all";
    state.production = "all";
    state.sort = "latest";
    document.querySelector("#search").value = "";
    document.querySelector("#evidence-filter").value = "all";
    document.querySelector("#production-filter").value = "all";
    document.querySelector("#sort").value = "latest";
    render();
  }

  document.querySelector("#search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
  document.querySelector("#evidence-filter").addEventListener("change", (event) => { state.verification = event.target.value; render(); });
  document.querySelector("#production-filter").addEventListener("change", (event) => { state.production = event.target.value; render(); });
  document.querySelector("#sort").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });
  results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-id]");
    if (button) openEvidence(button.dataset.projectId, button);
  });
  [document.querySelector("#open-library"), document.querySelector("#open-library-secondary")].filter(Boolean).forEach((button) => {
    button.addEventListener("click", (event) => {
      returnFocus = event.currentTarget;
      renderLibrary();
      openDrawer(libraryDrawer);
    });
  });
  document.querySelector("#close-drawer").addEventListener("click", closeDrawers);
  document.querySelector("#close-library").addEventListener("click", closeDrawers);
  backdrop.addEventListener("click", closeDrawers);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) closeDrawers();
    keepFocusInsideOpenDrawer(event);
  });

  renderLeadershipOverview();
  render();
})();
