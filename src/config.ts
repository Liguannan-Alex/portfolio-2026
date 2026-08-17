// ============================================================
// Site Configuration
// ============================================================

export interface SiteConfig {
  language: string;
  brandName: string;
}

export const siteConfig: SiteConfig = {
  language: "zh-CN",
  brandName: "李冠南 / π",
};

// ============================================================
// Navigation
// ============================================================

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  links: NavLink[];
  ctaText: string;
}

export const navigationConfig: NavigationConfig = {
  links: [
    { label: "能力 Expertise", href: "#curriculum" },
    { label: "理念 Vision", href: "#cinematic" },
    { label: "项目 Archive", href: "#alumni" },
    { label: "AI 课 Teaching", href: "/teaching/" },
    { label: "联系 Contact", href: "#footer" },
  ],
  ctaText: "联系我 Contact",
};

// ============================================================
// Hero
// ============================================================

export interface HeroConfig {
  title: string;
  subtitleLine1: string;
  subtitleLine2: string;
  ctaText: string;
}

export const heroConfig: HeroConfig = {
  title: "李冠南 LI GUANNAN",
  subtitleLine1: "产品经理 × 生成式 AI × 影视数字化 —— 在中国影视之都横店，把「想法」一路落成「上架」。",
  subtitleLine2: "7 年影视 · 产品 · AI 跨界，400+ 影城协同落地经验。",
  ctaText: "看看项目 View Work",
};

// ============================================================
// Capabilities (Curriculum section)
// ============================================================

export interface CapabilityItem {
  title: string;
  slug: string;
  description: string;
  image: string;
}

export interface CapabilitiesConfig {
  sectionLabel: string;
  items: CapabilityItem[];
}

export const capabilitiesConfig: CapabilitiesConfig = {
  sectionLabel: "核心能力 EXPERTISE",
  items: [
    {
      title: "业务推进 Execution",
      slug: "execution",
      description:
      "跨部门沟通、资源整合、供应商协同、项目跟进——在影院 / 文旅多部门协作的节奏里，把事从会议室推进到落地。Cross-team coordination, resource integration and on-the-ground delivery across 400+ cinemas.",
      image: "/images/cap-exec.jpg",
    },
    {
      title: "产品 × 数字化 Product",
      slug: "product-digital",
      description:
        "需求拆解、流程梳理、字段设计、原型沟通、业务数据分析——把模糊的业务诉求翻译成清晰的产品方案。Translating fuzzy business needs into shipped products: requirements, prototypes, data and iteration.",
      image: "/images/cap-product.jpg",
    },
    {
      title: "AI 与工具应用 AI & Agents",
      slug: "ai-application",
      description:
        "生成式大模型落地、Prompt Engineering、Agent 自动化、知识库与文案数据辅助——让 AI 真正接入排片、营销、客服这些真实业务。Making LLMs actually work in real business: prompts, agents, knowledge bases and automation.",
      image: "/images/cap-ai.jpg",
    },
    {
      title: "运营与增长 Growth",
      slug: "growth-content",
      description:
        "用户增长、直播运营、短视频资源对接、活动策划与复盘——单场直播 GMV 峰值 200 万元+的实战手感。Growth, livestream commerce and content: single-session GMV peak over ¥2M across 400+ cinema campaigns.",
      image: "/images/cap-growth.jpg",
    },
  ],
};

// ============================================================
// Capability Detail (sub-pages)
// ============================================================

export interface CapabilityDetailData {
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export interface CapabilityDetailConfig {
  sectionLabel: string;
  backLinkText: string;
  prevLabel: string;
  nextLabel: string;
  notFoundText: string;
  capabilities: Record<string, CapabilityDetailData>;
}

export const capabilityDetailConfig: CapabilityDetailConfig = {
  sectionLabel: "能力详情 DETAIL",
  backLinkText: "← 返回首页 Back Home",
  prevLabel: "上一个 Prev",
  nextLabel: "下一个 Next",
  notFoundText: "页面不存在 Page Not Found",
  capabilities: {
    execution: {
      title: "业务推进 Execution",
      subtitle: "把事从会议室推进到落地。",
      paragraphs: [
        "2020 年 9 月加入横店影视股份有限公司以来，我先后深入大客户合作、横店文旅线上平台搭建、短视频与直播运营、数字化转型调研、文旅卡、IP 衍生品等业务线。长期承担需求梳理、方案整理、跨部门沟通、执行推进、数据复盘与工具落地——是那条把「想法」拽过所有审批和协同环节、最后按在地上变成「上架」的线。",
        "最有代表性的是《大圣归来》卡牌项目：从 IP 版权沟通、卡牌设计、生产量产到上架协同全链路推进，2025 年初落地全国 400+ 影城。再往前，统筹 400+ 直营影院直播项目时，我负责资源对接、影院协同、直播执行与数据复盘，单场 GMV 峰值做到 200 万元+。",
        "我的方法论很朴素：会议纪要不过夜、问题台账常更新、阶段汇报让所有人知道下一步。Big launches are just a hundred small follow-ups done on time.",
      ],
    },
    "product-digital": {
      title: "产品 × 数字化 Product & Digital",
      subtitle: "把模糊的诉求，翻译成清晰的方案。",
      paragraphs: [
        "在盈亚科技担任股掌柜 App 产品经理期间，我负责 K 线智能标注、行情预警等功能的需求与迭代。为了解决反馈堆积的问题，我自己动手搭了一套 FastAPI + MySQL 的用户反馈聚类系统，归集反馈辅助优先级判断——迭代周期从 2 周压缩到 4 天，功能上线后产品月活提升约 30%。",
        "在横店，我参与了文旅线上平台 0–1 的策划、搭建、上线与传播；2023 年牵头和参与华为、阿里、腾讯、360 等头部企业的数字化转型走访调研，整理输出多份转型方案，并同步推进文旅卡项目，支持董事会与高层汇报。",
        "工具与语言上，Office / PPT / Excel 是日常，Figma、Notion / Obsidian 是第二大脑，Python、Docker、Git 是下班后的玩具。需求拆解、流程梳理、字段设计、原型沟通、业务数据分析——这条链路我都能接得住。",
      ],
    },
    "ai-application": {
      title: "AI 与工具应用 AI & Agents",
      subtitle: "让 AI 真正接入业务，而不只是演示。",
      paragraphs: [
        "2025 年起，我系统投入生成式大模型应用研究：Prompt Engineering、Agent 自动化、知识库搭建，并围绕排片、营销、客服、资料整理、流程辅助等真实业务场景做工具评估与落地可能性梳理。目标从来不是「做一个炫技的 Demo」，而是让一线同事每天少加一小时班。",
        "工作之外，我把这套能力做成了实实在在的生意：Openclaw AI 落地安装服务，帮个人和团队跨过「AI 想用但装不起来」的那道门槛，从环境部署到工具跑通一对一带上手。2026 年 3 月服务 30+ 客户，净收入 ¥4000+——本质上卖的不是安装，是帮客户跨过 AI 认知差。",
        "GitHub 上还有我写的代码：用 AI 做关键词导航的工具、专治「既要又要还要」的不可能三角决策助手、以及一条给别人也能用的哈佛 CS 自学路径。Code is how I think out loud.",
      ],
    },
    "growth-content": {
      title: "运营与增长 Growth & Content",
      subtitle: "流量是手艺，转化是科学。",
      paragraphs: [
        "我的运营手感是在字节跳动·巨量引擎直营中心练出来的：负责抖音信息流广告优化，用 OCPM / CPA 等投放模式服务中小企业客户。期间提出的冷启动 Topic Pool 机制推动了相关业务 DAU 提升，也让我真正理解了推荐机制与商业化之间的齿轮如何咬合。",
        "2022 年在横店，我对接抖音资源、统筹 400+ 直营影院的直播带货项目：内容策划、资源协同、执行把控、数据复盘一手包，单场 GMV 最高做到 200 万元+。同阶段还负责短视频资源对接、市场调研、宣传材料与活动执行。",
        "如今这些经验沉淀在公众号「π·冠南」里：AI × 认知 × 影视数字化的思考与实践，把工作里踩过的坑、想通的事写出来。Growth is a craft; conversion is a science; writing is how I keep both honest.",
      ],
    },
  },
};

// ============================================================
// Architecture (CinematicVision section)
// ============================================================

export interface ArchitectureConfig {
  sectionLabel: string;
  videoPath: string;
  title: string;
  description: string;
}

export const architectureConfig: ArchitectureConfig = {
  sectionLabel: "工作理念 PHILOSOPHY",
  videoPath: "/videos/arch-loop.mp4",
  title: "把影视业务、产品方法与 AI，拧成一股绳。",
  description:
    "我见过太多停在 PPT 里的好想法，也见过太多能跑却没人用的工具。所以我给自己定的标准是：既能拆需求、画原型，也能拉资源、推动上线；既研究大模型的能力边界，也关心一线同事明天上班好不好用。想法不值钱，落成「上架」才算数。Ideas are cheap — shipped is everything. Understand the model's limits, but care more about whether it works for the people using it tomorrow morning.",
};

// ============================================================
// Research (AlumniArchives section)
// ============================================================

export interface ResearchProject {
  title: string;
  year: string;
  discipline: string;
  image: string;
}

export interface ResearchConfig {
  sectionLabel: string;
  projects: ResearchProject[];
}

export const researchConfig: ResearchConfig = {
  sectionLabel: "代表项目 SELECTED WORKS",
  projects: [
    { title: "《大圣归来》卡牌 IP 衍生", year: "2025", discipline: "IP 商业化 · 400+ 影城上架", image: "/images/p-card.jpg" },
    { title: "Openclaw AI 落地服务", year: "2026", discipline: "副业 · 30+ 客户", image: "/images/p-openclaw.jpg" },
    { title: "400+ 影院直播项目", year: "2022", discipline: "直播电商 · GMV 200万+", image: "/images/p-live.jpg" },
    { title: "横店文旅线上平台", year: "2022", discipline: "0–1 平台建设", image: "/images/p-platform.jpg" },
    { title: "数字化转型调研", year: "2023", discipline: "战略方案输出", image: "/images/p-research.jpg" },
    { title: "爆米花大作战", year: "2024", discipline: "C++ 体感游戏", image: "/images/p-popcorn.jpg" },
    { title: "重生之我在横店当群演", year: "2024", discipline: "TypeScript 叙事游戏", image: "/images/p-hengdian.jpg" },
    { title: "公众号「π·冠南」", year: "至今", discipline: "AI × 认知 × 影视写作", image: "/images/p-pi.jpg" },
  ],
};

// ============================================================
// Footer
// ============================================================

export interface FooterLinkColumn {
  title: string;
  links: string[];
}

export interface FooterBottomLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  heading: string;
  columns: FooterLinkColumn[];
  copyright: string;
  bottomLinks: FooterBottomLink[];
}

export const footerConfig: FooterConfig = {
  heading: "有想法、有机会，随时找我。",
  columns: [
    {
      title: "找到我 Find Me",
      links: ["GitHub · liguannan-alex", "公众号 · π·冠南", "原主页 · liguannan-alex.github.io", "坐标 · 浙江横店"],
    },
    {
      title: "站内导航 Navigate",
      links: ["能力 Expertise", "理念 Vision", "项目 Archive", "返回顶部 Top"],
    },
  ],
  copyright: "© 2026 李冠南 LI GUANNAN / π. 保留所有权利 All rights reserved.",
  bottomLinks: [
    { label: "聊聊影视数字化、AI 落地或产品", href: "#footer" },
    { label: "AI 教学中心 Teaching", href: "/teaching/" },
    { label: "返回顶部 Back to Top", href: "#hero" },
  ],
};
