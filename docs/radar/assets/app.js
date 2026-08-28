(function () {
  "use strict";

  const data = window.__HENGDIAN_PAGES_DEMO__;
  const catalog = window.__HENGDIAN_SOURCE_CATALOG__ || { sources: [], companies: [] };
  if (!data || !Array.isArray(data.projects)) {
    const failedResults = document.querySelector("#project-results");
    if (failedResults) failedResults.innerHTML = '<p class="empty-state">演示数据未能加载，请刷新页面。</p>';
    return;
  }

  const sources = Array.isArray(catalog.sources) ? catalog.sources : [];
  const companies = Array.isArray(catalog.companies) ? catalog.companies : [];
  const sourceLayers = Array.from(sources.reduce((layers, source) => {
    const layer = source.layer || "其他来源";
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer).push(source);
    return layers;
  }, new Map()), ([name, items]) => ({ name, count: items.length, items }));

  const sourceModeMeta = {
    direct: { label: "公开直达", className: "public" },
    search: { label: "公开搜索", className: "public" },
    login_required: { label: "需登录或订阅", className: "login" },
    manual_check: { label: "人工核验", className: "manual" },
    relationship_check: { label: "人脉核验", className: "relationship" },
  };

  const evidenceCategoryMeta = {
    official: { label: "国家公开记录", className: "official", description: "国家公开页面中存在同名备案记录。" },
    production: { label: "片场公开动态", className: "production", description: "公开片场动态中出现该项目名称；该条信息待回到原账号复核。" },
    platform: { label: "平台公开信息", className: "platform", description: "平台公开页面中出现该项目信息。" },
    company: { label: "公司公开披露", className: "company", description: "制作公司公开信息中出现该项目。" },
    media: { label: "媒体公开信息", className: "media", description: "媒体公开报道中出现该项目。" },
    social: { label: "社交公开线索", className: "social", description: "社交平台公开内容中出现该项目，仍需交叉核验。" },
  };

  const state = { query: "", verification: "all", production: "all", sort: "latest", view: "cards" };
  const libraryState = { tab: "sources", query: "", layer: "all" };
  const projectSourceState = { query: "", layer: "all" };
  const results = document.querySelector("#project-results");
  const summary = document.querySelector("#result-summary");
  const emptyState = document.querySelector("#empty-state");
  const backdrop = document.querySelector("#drawer-backdrop");
  const evidenceDrawer = document.querySelector("#evidence-drawer");
  const libraryDrawer = document.querySelector("#library-drawer");
  const drawerContent = document.querySelector("#drawer-content");
  const libraryContent = document.querySelector("#library-content");
  let returnFocus = null;
  let activeEvidenceProject = null;

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

  function safeExternalUrl(value) {
    if (!value) return "";
    try {
      const parsed = new URL(String(value));
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
      return parsed.href;
    } catch (_error) {
      return "";
    }
  }

  function sourceEntryUrl(source, projectName, endpoint) {
    const entry = endpoint || source?.entry || {};
    const encodedProjectName = encodeURIComponent(projectName);
    const candidate = entry.urlTemplate
      ? String(entry.urlTemplate).replaceAll("{query}", encodedProjectName)
      : entry.url;
    return safeExternalUrl(candidate);
  }

  function publicBusinessValue() {
    return "待业务确认";
  }

  function evidenceCounts(project) {
    return project.evidence.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, { official: 0, social: 0 });
  }

  function projectNextStep(project) {
    if (project.filing) return "核对同名备案的主体、版本与招商价值";
    if ((project.leadRecords || []).length > 0) return "定位对应原帖，并继续查找备案或平台依据";
    return "交叉核验第三方线索，并继续查找备案或平台依据";
  }

  function projectCard(project, index) {
    const filing = project.filing;
    const filingApplicant = filing?.filingApplicant || "待业务确认";
    const filingLabel = filing ? "找到同名备案，待核对主体" : "当前资料中暂未找到备案";
    const counts = evidenceCounts(project);
    const leadCount = (project.leadRecords || []).length;
    const evidenceLabel = project.evidence.length > 0
      ? `已取得 ${project.evidence.length} 条依据 · 备案 ${counts.official} · 第三方线索 ${counts.social}`
      : `尚未取得可追溯原文 · ${leadCount} 条待定位线索`;
    const statusLabel = filing ? "备案候选待核" : project.evidence.length > 0 ? "第三方线索待核" : "原帖待定位";
    const cardEvidenceSummary = `${project.evidence.length} 条依据${leadCount ? ` · ${leadCount} 条待定位线索` : ""}`;
    return `
      <article class="project-card ${filing ? "cross-project" : "single-project"}">
        <div class="card-top">
          <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="status-badge ${filing ? "filing" : "tracking"}">${statusLabel}</span>
        </div>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="card-stage">${escapeHtml(project.stage)}</p>
        <div class="evidence-structure" aria-label="证据结构">${escapeHtml(evidenceLabel)} · ${sources.length || data.catalog.sourceCount} 个入口可继续核验</div>
        <dl class="project-facts">
          <div><dt>横店关联</dt><dd>${escapeHtml(project.hengdianStatus)}</dd></div>
          <div><dt>备案申报机构</dt><dd>${escapeHtml(filingApplicant)}</dd></div>
          <div><dt>备案核验</dt><dd>${escapeHtml(filingLabel)}</dd></div>
          <div><dt>招商优先级</dt><dd class="pending">待业务确认</dd></div>
          <div><dt>下一步</dt><dd>${escapeHtml(projectNextStep(project))}</dd></div>
        </dl>
        <div class="card-footer">
          <span>${cardEvidenceSummary}${project.latestEvidenceAt ? ` · 最新 ${displayDate(project.latestEvidenceAt)}` : ""}</span>
          <button class="evidence-button" type="button" data-project-id="${escapeHtml(project.id)}">查看完整证据链</button>
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
      const signalDates = project.evidence.filter((item) => item.category === "social").map((item) => item.publishedAt)
        .concat((project.leadRecords || []).map((item) => item.observedAt));
      if (state.production === "recent" && !signalDates.some((date) => date === "2026-08-25")) return false;
      if (state.production === "earlier" && !signalDates.some((date) => date === "2026-08-21")) return false;
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
    const allLeadRecords = data.projects.flatMap((project) => project.leadRecords || []);
    const originalMaterialCount = data.originalMaterialCount
      || new Set(allEvidence.map((item) => safeExternalUrl(item.url)).filter(Boolean)).size;
    const officialCount = allEvidence.filter((item) => item.category === "official").length;
    const socialEvidence = allEvidence.filter((item) => item.category === "social");
    const socialCount = socialEvidence.length;
    const dualCount = data.projects.filter((project) => Boolean(project.filing)).length;
    const singleCount = data.projects.length - dualCount;
    const recentCount = allLeadRecords.filter((item) => item.observedAt === "2026-08-25").length;
    const earlierCount = socialEvidence.filter((item) => item.publishedAt === "2026-08-21").length;
    const reviewCount = socialCount + allLeadRecords.length;
    const crossPercent = Math.round((dualCount / data.projects.length) * 100);

    setText("#snapshot-date", displayDate(data.snapshotThrough || data.evidenceThrough));
    setText("#metric-projects", data.projects.length);
    setText("#metric-filings", dualCount);
    setText("#metric-evidence", allEvidence.length);
    setText("#metric-originals", originalMaterialCount);
    setText("#metric-official", officialCount);
    setText("#metric-production", socialCount);
    setText("#metric-sources", sources.length || catalog.sourceCount || data.catalog.sourceCount);
    setText("#metric-companies", companies.length || catalog.companyCount || data.catalog.companyCount);
    setText("#cross-rate", `${dualCount} / ${data.projects.length} · ${crossPercent}%`);
    setText("#dual-count", dualCount);
    setText("#single-count", singleCount);
    setText("#review-evidence-count", reviewCount);
    setText("#recent-evidence-count", recentCount);
    setText("#earlier-evidence-count", earlierCount);
    setText("#task-identity", `${dualCount} 个`);
    setText("#task-filing", `${singleCount} 个`);
    setText("#task-source-review", `${reviewCount} 条`);

    const progressBar = document.querySelector("#verification-bar");
    if (progressBar) progressBar.style.width = `${crossPercent}%`;
    const progress = document.querySelector('.progress-rail[role="progressbar"]');
    if (progress) progress.setAttribute("aria-valuenow", String(crossPercent));

    const maxLayerCount = Math.max(1, ...sourceLayers.map((layer) => layer.count));
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
    const meta = evidenceCategoryMeta[item.category] || {
      label: "其他公开依据", className: "other", description: "公开来源中出现该项目信息，需按标注范围使用。",
    };
    const sourceUrl = safeExternalUrl(item.url);
    const sourceAction = sourceUrl
      ? `<a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">打开这条原始依据 ↗</a>`
      : '<span class="source-link unavailable">原始链接待核验</span>';
    return `
      <article class="evidence-item">
        <div class="evidence-meta">
          <span class="evidence-kind ${escapeHtml(meta.className)}">${escapeHtml(meta.label)}</span>
          <span class="evidence-date">${escapeHtml(item.reviewStatus)}</span>
          <span class="evidence-date">证据日期 ${displayDate(item.publishedAt)}</span>
        </div>
        <h4>${escapeHtml(item.title || item.sourceName)}</h4>
        <p><b>来源：</b>${escapeHtml(item.sourceName)}</p>
        <p>${escapeHtml(meta.description)}</p>
        <p class="evidence-scope"><b>可证明范围：</b>${escapeHtml(item.scope)}</p>
        ${sourceAction}
      </article>`;
  }

  function leadRecordItem(item) {
    const sourceUrl = safeExternalUrl(item.url);
    return `
      <article class="evidence-item lead-record-item">
        <div class="evidence-meta">
          <span class="evidence-kind pending">待定位原帖</span>
          <span class="evidence-date">记录日 ${displayDate(item.observedAt)}</span>
        </div>
        <h4>${escapeHtml(item.title || "账号线索待复核")}</h4>
        <p><b>来源账号：</b>${escapeHtml(item.sourceName)}</p>
        <p class="evidence-scope"><b>边界：</b>${escapeHtml(item.scope)}</p>
        ${sourceUrl ? `<a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">打开来源账号（非原帖）↗</a>` : '<span class="source-link unavailable">来源账号入口待补</span>'}
      </article>`;
  }

  function sourceLinks(source, projectName) {
    const entry = source.entry || {};
    const endpointList = Array.isArray(entry.endpoints) && entry.endpoints.length > 0 ? entry.endpoints : [entry];
    const links = endpointList.map((endpoint) => {
      const url = sourceEntryUrl(source, projectName, endpoint);
      if (!url) return "";
      const label = endpoint.label || entry.label || "打开核验入口";
      return `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`;
    }).filter(Boolean);
    if (links.length > 0) return `<div class="source-actions">${links.join("")}</div>`;

    const fallback = entry.mode === "relationship_check"
      ? "该来源需线下或内部关系核验，公开页面不展示联系人及私域内容。"
      : "该来源需要人工查看或补充入口，暂不提供未经核验的跳转链接。";
    return `<div class="source-action-note"><strong>${escapeHtml(entry.label || "登记核验任务")}</strong><span>${escapeHtml(entry.guidance || fallback)}</span></div>`;
  }

  function renderSourceCard(source, projectName = "") {
    const suggestion = source.systemSuggestion || {};
    const entry = source.entry || {};
    const mode = sourceModeMeta[entry.mode] || { label: "入口待确认", className: "manual" };
    const queryName = projectName || source.name;
    const businessFields = ["在用状态", "实际提前量", "可靠度", "覆盖剧组类型", "获取方式", "主要用途", "负责人（内部字段）", "使用心得与坑"];
    return `
      <details class="source-card" data-source-id="${escapeHtml(source.id)}">
        <summary>
          <span class="source-order">${String(source.order).padStart(2, "0")}</span>
          <span class="source-summary-copy"><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.layer)}</small></span>
          <span class="source-mode ${escapeHtml(mode.className)}">${escapeHtml(mode.label)}</span>
        </summary>
        <div class="source-card-body">
          <div class="source-suggestion">
            <span class="field-origin">系统建议</span>
            <p><b>它给什么：</b>${escapeHtml(suggestion.provides || "待补充")}</p>
            <p><b>预判提前量：</b>${escapeHtml(suggestion.expectedLeadTime || "待补充")}</p>
          </div>
          <dl class="source-business-fields">
            ${businessFields.map((label) => `
              <div><dt>${escapeHtml(label)}</dt><dd class="pending">${escapeHtml(publicBusinessValue())}</dd></div>`).join("")}
          </dl>
          <div class="source-entry-guidance">
            <b>核验方式：</b>${escapeHtml(entry.guidance || "入口与核验方式待补充。")}
          </div>
          ${sourceLinks(source, queryName)}
        </div>
      </details>`;
  }

  function filteredSources(query, layer) {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    return sources.filter((source) => {
      if (layer !== "all" && source.layer !== layer) return false;
      if (!normalized) return true;
      const searchable = [
        source.name,
        source.layer,
        source.systemSuggestion?.provides,
        source.systemSuggestion?.expectedLeadTime,
        source.entry?.label,
        source.entry?.guidance,
      ].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
      return searchable.includes(normalized);
    });
  }

  function renderSourceGroups(items, projectName) {
    if (items.length === 0) {
      return '<div class="source-empty"><strong>没有符合当前条件的核验入口</strong><span>可以清空搜索词或切换信源层级。</span></div>';
    }
    return sourceLayers.map((layer) => {
      const layerItems = items.filter((source) => source.layer === layer.name);
      if (layerItems.length === 0) return "";
      return `
        <section class="source-layer-section">
          <div class="source-layer-heading"><h4>${escapeHtml(layer.name)}</h4><span>${layerItems.length} 个入口</span></div>
          <div class="source-card-list">${layerItems.map((source) => renderSourceCard(source, projectName)).join("")}</div>
        </section>`;
    }).join("");
  }

  function layerOptions(selected) {
    return [`<option value="all"${selected === "all" ? " selected" : ""}>全部 8 类</option>`]
      .concat(sourceLayers.map((layer) => `<option value="${escapeHtml(layer.name)}"${selected === layer.name ? " selected" : ""}>${escapeHtml(layer.name)}（${layer.count}）</option>`))
      .join("");
  }

  function renderProjectSourceResults() {
    if (!activeEvidenceProject) return;
    const target = drawerContent.querySelector("#project-source-results");
    const count = drawerContent.querySelector("#project-source-count");
    if (!target) return;
    const visibleSources = filteredSources(projectSourceState.query, projectSourceState.layer);
    if (count) count.textContent = `当前显示 ${visibleSources.length} / ${sources.length} 个核验入口`;
    target.innerHTML = renderSourceGroups(visibleSources, activeEvidenceProject.name);
  }

  function openEvidence(projectId, trigger) {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return;
    returnFocus = trigger;
    activeEvidenceProject = project;
    projectSourceState.query = "";
    projectSourceState.layer = "all";
    document.querySelector("#drawer-title").textContent = `${project.name} · 证据与核验任务`;
    const filingText = project.filing
      ? `${project.filing.conclusion}；候选编号：${project.filing.reference}`
      : "当前资料中暂未找到备案证据；这不等于项目未备案。";
    const counts = evidenceCounts(project);
    const leadRecords = project.leadRecords || [];
    drawerContent.innerHTML = `
      <section class="drawer-summary">
        <div class="drawer-status-row"><span class="status-badge ${project.filing ? "filing" : "tracking"}">${project.filing ? "备案候选待核" : "公开线索待核"}</span><span>备案 ${counts.official} · 第三方线索 ${counts.social} · 待定位 ${leadRecords.length}</span></div>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(filingText)}</p>
      </section>
      <section class="evidence-section" aria-labelledby="acquired-evidence-title">
        <div class="drawer-section-heading"><div><p class="eyebrow">项目原文与记录</p><h3 id="acquired-evidence-title">已取得依据</h3></div><strong>${project.evidence.length} 条</strong></div>
        ${project.evidence.length > 0
    ? project.evidence.map(evidenceItem).join("")
    : '<div class="source-empty"><strong>尚未取得可追溯原文</strong><span>此状态不代表项目不存在。</span></div>'}
      </section>
      ${leadRecords.length > 0 ? `
      <section class="lead-record-section" aria-labelledby="lead-record-title">
        <div class="drawer-section-heading"><div><p class="eyebrow">不计入项目依据</p><h3 id="lead-record-title">待定位原帖</h3></div><strong>${leadRecords.length} 条</strong></div>
        <p class="verification-boundary"><b>这里只记录来源账号入口。</b> 对应项目原帖尚未定位，因此不能作为“已取得依据”。</p>
        ${leadRecords.map(leadRecordItem).join("")}
      </section>` : ""}
      <section class="verification-section" aria-labelledby="verification-network-title">
        <div class="drawer-section-heading"><div><p class="eyebrow">48 个固定信源核验网络</p><h3 id="verification-network-title">继续交叉核验</h3></div><strong>${sources.length} 个入口</strong></div>
        <p class="verification-boundary"><b>可核验入口，不计入项目依据。</b> 支持站内搜索的入口会自动带入“${escapeHtml(project.name)}”；其他入口打开官网或转为登录、人工、人脉核验任务。</p>
        <div class="source-directory-controls">
          <label><span>搜索信源</span><input id="project-source-search" type="search" value="" placeholder="平台、公众号、备案或片场"></label>
          <label><span>信源层级</span><select id="project-source-layer">${layerOptions("all")}</select></label>
        </div>
        <p class="source-result-count" id="project-source-count">当前显示 ${sources.length} / ${sources.length} 个核验入口</p>
        <div id="project-source-results">${renderSourceGroups(sources, project.name)}</div>
      </section>`;
    openDrawer(evidenceDrawer);
  }

  function renderCompanyCard(company) {
    const entryUrl = sourceEntryUrl({ entry: company.entry }, company.name);
    const aliases = Array.isArray(company.aliases) && company.aliases.length > 0
      ? company.aliases.join("、")
      : "暂无公开别名";
    const confirmationState = "待业务确认";
    return `
      <article class="company-card">
        <div class="company-card-heading"><span class="source-order">${String(company.order).padStart(2, "0")}</span><h4>${escapeHtml(company.name)}</h4></div>
        <p><b>公开别名：</b>${escapeHtml(aliases)}</p>
        <p><b>系统预填观察（待核验）：</b>${escapeHtml(company.publicObservation || "待补充")}</p>
        <div class="source-suggestion"><span class="field-origin">系统建议</span><p>${escapeHtml(company.systemSuggestion || "待补充")}</p></div>
        <div class="company-confirmation-state"><span>业务字段</span><strong>${escapeHtml(confirmationState)}</strong></div>
        <p class="public-boundary">公开版不展示联系人、合作史和内部优先级。</p>
        ${entryUrl ? `<a class="source-link" href="${escapeHtml(entryUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(company.entry?.label || "搜索公司公开动态")} ↗</a>` : ""}
      </article>`;
  }

  function filteredCompanies(query) {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return companies;
    return companies.filter((company) => [
      company.name,
      ...(Array.isArray(company.aliases) ? company.aliases : []),
      company.publicObservation,
      company.systemSuggestion,
    ].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN").includes(normalized));
  }

  function renderLibraryResults() {
    const target = libraryContent.querySelector("#library-results");
    const count = libraryContent.querySelector("#library-result-count");
    if (!target) return;
    if (libraryState.tab === "companies") {
      const visibleCompanies = filteredCompanies(libraryState.query);
      if (count) count.textContent = `当前显示 ${visibleCompanies.length} / ${companies.length} 家公司`;
      target.innerHTML = visibleCompanies.length > 0
        ? `<div class="company-card-list">${visibleCompanies.map(renderCompanyCard).join("")}</div>`
        : '<div class="source-empty"><strong>没有符合当前条件的公司</strong><span>可以清空搜索词后重试。</span></div>';
      return;
    }
    const visibleSources = filteredSources(libraryState.query, libraryState.layer);
    if (count) count.textContent = `当前显示 ${visibleSources.length} / ${sources.length} 个信源`;
    target.innerHTML = renderSourceGroups(visibleSources, "");
  }

  function renderLibrary() {
    const sourceTab = libraryState.tab === "sources";
    libraryContent.innerHTML = `
      <p class="library-intro">48 个信源名称、层级与预填建议，以及 27 家公司名称来自业务提供的底库。公开版对公司建议作中性化呈现；所有业务确认字段统一隐藏为“待业务确认”。核验入口不等于已取得项目依据。</p>
      <div class="library-stats">
        <div class="library-stat"><strong>${sources.length}</strong><span>固定信源</span></div>
        <div class="library-stat"><strong>${sourceLayers.length}</strong><span>信源分类</span></div>
        <div class="library-stat"><strong>${companies.length}</strong><span>公司底库</span></div>
      </div>
      <div class="library-tabs" role="tablist" aria-label="切换底库类型">
        <button type="button" role="tab" data-library-tab="sources" aria-selected="${sourceTab}" class="${sourceTab ? "active" : ""}">信源核验库（${sources.length}）</button>
        <button type="button" role="tab" data-library-tab="companies" aria-selected="${!sourceTab}" class="${!sourceTab ? "active" : ""}">公司公开库（${companies.length}）</button>
      </div>
      <div class="source-directory-controls ${sourceTab ? "" : "company-controls"}">
        <label><span>${sourceTab ? "搜索信源" : "搜索公司"}</span><input id="library-search" type="search" value="${escapeHtml(libraryState.query)}" placeholder="${sourceTab ? "名称、层级、用途或核验方式" : "公司名、别名或公开观察"}"></label>
        ${sourceTab ? `<label><span>信源层级</span><select id="library-layer">${layerOptions(libraryState.layer)}</select></label>` : ""}
      </div>
      <p class="source-result-count" id="library-result-count"></p>
      <div id="library-results"></div>
      <h3 class="drawer-section-title">公开演示边界</h3>
      <p class="library-intro">公开页面只展示信源名称、系统建议、待确认状态、公开核验入口和公司中性公开信息。公开版不展示联系人、合作史和内部优先级，也不展示私域内容、账号凭据或内部回执。</p>`;
    renderLibraryResults();
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
    activeEvidenceProject = null;
    returnFocus?.focus();
    returnFocus = null;
  }

  function keepFocusInsideOpenDrawer(event) {
    if (event.key !== "Tab" || backdrop.hidden) return;
    const drawer = evidenceDrawer.hidden ? libraryDrawer : evidenceDrawer;
    const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0);
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
  drawerContent.addEventListener("input", (event) => {
    if (event.target.id !== "project-source-search") return;
    projectSourceState.query = event.target.value;
    renderProjectSourceResults();
  });
  drawerContent.addEventListener("change", (event) => {
    if (event.target.id !== "project-source-layer") return;
    projectSourceState.layer = event.target.value;
    renderProjectSourceResults();
  });
  libraryContent.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-library-tab]");
    if (!tab) return;
    libraryState.tab = tab.dataset.libraryTab;
    libraryState.query = "";
    libraryState.layer = "all";
    renderLibrary();
    libraryContent.querySelector(`[data-library-tab="${libraryState.tab}"]`)?.focus();
  });
  libraryContent.addEventListener("input", (event) => {
    if (event.target.id !== "library-search") return;
    libraryState.query = event.target.value;
    renderLibraryResults();
  });
  libraryContent.addEventListener("change", (event) => {
    if (event.target.id !== "library-layer") return;
    libraryState.layer = event.target.value;
    renderLibraryResults();
  });
  [document.querySelector("#open-library"), document.querySelector("#open-library-secondary")].filter(Boolean).forEach((button) => {
    button.addEventListener("click", (event) => {
      returnFocus = event.currentTarget;
      libraryState.tab = "sources";
      libraryState.query = "";
      libraryState.layer = "all";
      renderLibrary();
      openDrawer(libraryDrawer);
    });
  });
  const companyLibraryButton = document.querySelector("#open-company-library");
  if (companyLibraryButton) {
    companyLibraryButton.addEventListener("click", (event) => {
      returnFocus = event.currentTarget;
      libraryState.tab = "companies";
      libraryState.query = "";
      libraryState.layer = "all";
      renderLibrary();
      openDrawer(libraryDrawer);
    });
  }
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
