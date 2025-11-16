// lib/jobs.ts

export type JobWorkType = "Remote" | "Hybrid" | "On-site";
export type JobType = "Full-time" | "Contract";
export type JobSeniority = "Junior" | "Mid-level" | "Senior" | "Lead";

export type Job = {
  slug: string;
  title: string;
  employerName: string;
  employerInitials: string; // for avatar if no logo yet
  location: string;
  workType: JobWorkType;
  type: JobType;
  department: string;
  seniority: JobSeniority;
  salaryRange?: string;
  postedAt: string;
  highlight?: string;

  // Detail-page fields
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave?: string[];
  benefits?: string[];
  hiringProcess?: string[];
};

export const jobs: Job[] = [
  {
    slug: "senior-product-manager-fintech",
    title: "Senior Product Manager – Fintech Platform",
    employerName: "Confidential Fintech (Africa)",
    employerInitials: "CF",
    location: "Lagos / Remote-friendly",
    workType: "Hybrid",
    type: "Full-time",
    department: "Product",
    seniority: "Senior",
    salaryRange: "$50,000 – $75,000 / year (guidance)",
    postedAt: "Posted 3 days ago",
    highlight: "Own roadmap for core payments & lending experiences.",
    summary:
      "You’ll lead the strategy, discovery and rollout of payments and lending products serving consumers and SMEs across multiple African markets. You’ll work closely with engineering, design and operations to move the needle on activation, retention and transaction volume.",
    responsibilities: [
      "Own the product strategy and roadmap for payments & lending experiences across web and mobile.",
      "Run discovery with customers, internal stakeholders and data to identify high-leverage problems.",
      "Write clear PRDs and partner tightly with engineering and design on delivery.",
      "Define and track success metrics (adoption, revenue, conversion, NPS) for your areas.",
      "Collaborate with compliance, risk and operations to ship safely in regulated environments.",
    ],
    requirements: [
      "4+ years in product management, including experience in fintech or financial services.",
      "Proven track record shipping transactional products (payments, wallets, lending, etc.).",
      "Strong comfort with data: funnels, cohorts, basic SQL or analytics tools.",
      "Ability to work with distributed teams and communicate clearly with non-technical stakeholders.",
      "Excellent written communication; you can simplify complexity into simple narratives.",
    ],
    niceToHave: [
      "Experience working on products for African or emerging markets.",
      "Prior exposure to card schemes, PSPs or switching infrastructure.",
    ],
    benefits: [
      "Competitive salary and performance-linked bonus.",
      "Hybrid work with flexibility for remote days.",
      "High-impact scope across multiple markets and product lines.",
    ],
    hiringProcess: [
      "Introductory conversation with Resourcin (context, fit, salary, timelines).",
      "Hiring manager interview focused on product craft and collaboration.",
      "Case or product challenge with presentation to a small panel.",
      "Founder / leadership conversation, followed by references and offer.",
    ],
  },
  {
    slug: "backend-engineer-payments",
    title: "Backend Engineer – Payments & Wallets",
    employerName: "Growth-stage Paytech",
    employerInitials: "GP",
    location: "Remote (Africa)",
    workType: "Remote",
    type: "Full-time",
    department: "Engineering",
    seniority: "Mid-level",
    salaryRange: "₦1.5m – ₦2.3m / month (guidance)",
    postedAt: "Posted 1 week ago",
    highlight: "Node.js / TypeScript, high-volume APIs, distributed systems.",
    summary:
      "You’ll join a small backend team building and scaling payment APIs, ledgers and wallet services that process high-volume transactions across Africa.",
    responsibilities: [
      "Design, implement and maintain backend services for payments, wallets and reconciliation.",
      "Write clean, well-tested code in Node.js / TypeScript (or similar backend stack).",
      "Collaborate with product and frontend teams to design clear, stable APIs.",
      "Contribute to observability: logs, metrics and alerts for critical services.",
      "Participate in code reviews and improve engineering standards and practices.",
    ],
    requirements: [
      "3+ years of backend engineering experience in a product environment.",
      "Strong experience with Node.js / TypeScript or similar backend stack.",
      "Experience designing and consuming RESTful APIs.",
      "Comfortable working with relational databases (e.g. Postgres, MySQL).",
      "Good understanding of security, reliability and performance considerations.",
    ],
    niceToHave: [
      "Experience in fintech, payments, wallets or financial services.",
      "Exposure to message queues or event-driven architectures.",
    ],
    benefits: [
      "Competitive pay indexed to experience and market.",
      "Remote-first team across African time zones.",
      "Opportunity to work on high-volume, mission-critical systems.",
    ],
    hiringProcess: [
      "Screening conversation with Resourcin.",
      "Technical interview (systems thinking, API design, debugging).",
      "Practical exercise or pair-programming session.",
      "Culture / team fit conversation and offer.",
    ],
  },
  {
    slug: "people-ops-lead-multi-country",
    title: "People Operations Lead – Multi-country",
    employerName: "Tech & Services Group",
    employerInitials: "TS",
    location: "Lagos (Hybrid)",
    workType: "Hybrid",
    type: "Full-time",
    department: "People & Operations",
    seniority: "Lead",
    salaryRange: "₦1.2m – ₦1.8m / month (guidance)",
    postedAt: "Posted 2 weeks ago",
    highlight:
      "Own people ops, policies and reporting across multiple subsidiaries.",
    summary:
      "You’ll be the operational backbone for a group of tech and services businesses, owning people operations, policies and reporting across multiple entities.",
    responsibilities: [
      "Own people operations processes (onboarding, offboarding, changes, documentation).",
      "Support HR leads and leaders across subsidiaries with policies and implementation.",
      "Work with finance on headcount, people-cost and reporting for leadership and board.",
      "Implement HR tools, data hygiene and simple workflows that actually get used.",
      "Coach managers on basic people practices and escalations.",
    ],
    requirements: [
      "5+ years in HR / People Operations with multi-entity or group experience.",
      "Strong process orientation and comfort with spreadsheets / HRIS tools.",
      "Clear written communication and ability to write policies that humans can read.",
      "Experience working closely with finance on headcount and people-cost reporting.",
      "Comfortable working in a fast-moving, sometimes ambiguous environment.",
    ],
    niceToHave: [
      "Experience in tech, fintech or professional services environments.",
      "Worked in or with HR consulting or shared-services setups.",
    ],
    benefits: [
      "Broad group-wide scope with direct visibility to leadership.",
      "Hybrid work pattern and flexible working norms.",
      "Room to build and improve systems, not just maintain legacy ones.",
    ],
    hiringProcess: [
      "Initial conversation with Resourcin on context and fit.",
      "Panel interview with People / Ops leadership.",
      "Practical exercise (e.g. policy or people-ops case).",
      "Conversation with group leadership and offer.",
    ],
  },
  {
    slug: "enterprise-sales-manager-b2b-saas",
    title: "Enterprise Sales Manager – B2B SaaS",
    employerName: "B2B SaaS / Infrastructure",
    employerInitials: "SI",
    location: "Lagos / Nairobi",
    workType: "On-site",
    type: "Full-time",
    department: "Sales & Growth",
    seniority: "Senior",
    salaryRange: "$40,000 – $60,000 / year (base) + commissions",
    postedAt: "Posted 2 weeks ago",
    highlight:
      "Own pipeline from prospecting to closing bank / telco / logistics logos.",
    summary:
      "You’ll own a targeted list of banks, telcos, logistics and enterprise accounts, driving full-cycle sales for an infrastructure-style SaaS product.",
    responsibilities: [
      "Own a named set of enterprise accounts and a clear revenue target.",
      "Prospect, qualify, run demos and manage complex sales cycles.",
      "Work with product and leadership to refine value propositions and pricing.",
      "Maintain accurate pipeline and forecasting in a CRM.",
      "Collaborate with customer success to ensure smooth handover and expansion.",
    ],
    requirements: [
      "4+ years in B2B sales, with at least 2 years selling to enterprise accounts.",
      "Proven track record of hitting or exceeding annual targets.",
      "Experience selling SaaS, infrastructure or complex solutions.",
      "Strong executive-level communication and storytelling skills.",
      "Comfort working across multiple markets and stakeholder types.",
    ],
    niceToHave: [
      "Existing relationships in banks, telcos or large enterprise accounts.",
      "Experience working with channel / partnership distribution.",
    ],
    benefits: [
      "Competitive base salary plus uncapped commissions.",
      "Cross-market exposure and strategic accounts.",
      "Ability to influence go-to-market and packaging.",
    ],
    hiringProcess: [
      "Intro with Resourcin to understand your deals and numbers.",
      "Sales leadership interview with deal deep-dives.",
      "Panel presentation (pipeline plan or territory strategy).",
      "Founder / leadership conversation and offer.",
    ],
  },
  {
    slug: "senior-data-analyst-product-ops",
    title: "Senior Data Analyst – Product & Operations",
    employerName: "Digital Financial Services",
    employerInitials: "DF",
    location: "Hybrid – Lagos",
    workType: "Hybrid",
    type: "Full-time",
    department: "Data",
    seniority: "Senior",
    salaryRange: "₦900k – ₦1.5m / month (guidance)",
    postedAt: "Posted 3 weeks ago",
    highlight:
      "Turn product & ops data into dashboards leaders actually use to decide.",
    summary:
      "You’ll partner with product and operations leaders to turn messy product and operational data into dashboards, analyses and decisions that move revenue and efficiency.",
    responsibilities: [
      "Build and maintain dashboards for product, growth and operations teams.",
      "Work with stakeholders to define metrics, KPIs and data definitions.",
      "Dig into funnels, cohorts and operational data to generate insights.",
      "Support experiments / A/B tests with design and measurement.",
      "Promote data literacy and good data habits across the organisation.",
    ],
    requirements: [
      "4+ years in data analytics, ideally in tech or financial services.",
      "Strong SQL and comfort with BI tools (e.g. Power BI, Looker, Metabase).",
      "Experience structuring ambiguous data questions into clear analyses.",
      "Ability to communicate insights to non-data stakeholders.",
      "Comfort working with imperfect data and iterating towards better quality.",
    ],
    niceToHave: [
      "Experience with dbt or modern data stack tooling.",
      "Exposure to experimentation, churn analysis or credit risk analysis.",
    ],
    benefits: [
      "High visibility across product and operations.",
      "Hybrid work and flexible structure.",
      "Opportunity to influence how data is used across the business.",
    ],
    hiringProcess: [
      "Screening conversation with Resourcin.",
      "Technical interview (SQL, case walkthroughs).",
      "Take-home or live analytics exercise.",
      "Stakeholder conversations and offer.",
    ],
  },
  {
    slug: "customer-success-lead-enterprise",
    title: "Customer Success Lead – Enterprise Accounts",
    employerName: "Vertical SaaS",
    employerInitials: "VS",
    location: "Remote / Hybrid",
    workType: "Remote",
    type: "Full-time",
    department: "Customer Success",
    seniority: "Lead",
    salaryRange: "Competitive, plus performance bonus",
    postedAt: "Posted 1 month ago",
    highlight: "Own retention and expansion for a portfolio of enterprise clients.",
    summary:
      "You’ll lead the success function for a set of enterprise customers, owning onboarding, adoption, retention and expansion outcomes.",
    responsibilities: [
      "Own a book of enterprise customers and their health, adoption and expansion.",
      "Run onboarding, QBRs and value-focused check-ins with decision-makers.",
      "Work with product to surface feedback and inform roadmap.",
      "Partner with sales on renewals and upsell opportunities.",
      "Build simple playbooks and processes for scale.",
    ],
    requirements: [
      "4+ years in customer success, account management or related roles.",
      "Experience working with enterprise customers in a SaaS environment.",
      "Strong stakeholder management and expectation-setting skills.",
      "Comfortable running structured meetings with senior stakeholders.",
      "Good grasp of product usage metrics and health indicators.",
    ],
    niceToHave: [
      "Experience in vertical SaaS (fintech, logistics, healthcare, etc.).",
      "Background in support or implementation before moving into CS.",
    ],
    benefits: [
      "Ownership of strategy for a key customer segment.",
      "Flexible / remote-friendly work environment.",
      "Exposure to product and go-to-market decisions.",
    ],
    hiringProcess: [
      "Intro conversation with Resourcin.",
      "CS leadership interview focused on strategy and stakeholder examples.",
      "Practical exercise or customer narrative presentation.",
      "Final conversation with leadership and offer.",
    ],
  },
];

export function getJobBySlug(slug: string): Job | undefined {
  return jobs.find((job) => job.slug === slug);
}
