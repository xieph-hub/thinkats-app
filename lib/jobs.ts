// lib/jobs.ts

export type Job = {
  id: string;
  title: string;
  slug: string;
  location: string;
  type: string;
  company: string;
  department: string;
  summary: string;
  description: string;
};

export const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Product Manager (Fintech)",
    slug: "senior-product-manager-fintech",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
    company: "Resourcin Client – Fintech",
    department: "Product",
    summary:
      "Lead product strategy and execution for a high-growth fintech client, working closely with engineering, design, and commercial teams.",
    description: `
As Senior Product Manager, you will own the end-to-end lifecycle for a portfolio of fintech products – from discovery and strategy, through delivery and continuous iteration.

You will work closely with engineering, design, data, and commercial teams to:

• Define product vision, strategy, and roadmap for your domain
• Prioritise initiatives using data, user feedback, and business impact
• Translate customer problems into clear product requirements and user stories
• Partner with engineering to deliver high-quality features on time
• Collaborate with sales and marketing to drive adoption and revenue growth
• Monitor product performance and continuously improve with experiments and insights

Ideal for someone who has led B2B or B2C fintech products, is comfortable with ambiguity, and can balance technical depth with commercial outcomes.
    `.trim(),
  },
  {
    id: "2",
    title: "Business Development Manager",
    slug: "business-development-manager",
    location: "Lagos, Nigeria",
    type: "Full-time",
    company: "Resourcin Client – B2B Services",
    department: "Sales & Business Development",
    summary:
      "Drive new business acquisition, manage key accounts, and build strategic partnerships to accelerate revenue growth.",
    description: `
As Business Development Manager, you will be responsible for building and growing a strong pipeline of B2B clients.

Key expectations:

• Identify, qualify, and close new business opportunities
• Own the full sales cycle from prospecting to negotiation and deal closure
• Build and nurture long-term relationships with decision-makers
• Work closely with delivery and operations teams to ensure smooth handover
• Report on pipeline, forecasts, and performance to leadership
• Represent the brand at client meetings, events, and industry forums

This role suits a commercially minded self-starter who is comfortable with targets, can open doors at senior levels, and understands how to structure win–win deals.
    `.trim(),
  },
  {
    id: "3",
    title: "HR Generalist",
    slug: "hr-generalist",
    location: "Remote (Nigeria)",
    type: "Contract",
    company: "Resourcin Human Capital Advisors",
    department: "People & HR",
    summary:
      "Support recruitment, onboarding, employee relations, and HR operations across multiple client accounts.",
    description: `
As HR Generalist, you will support day-to-day HR operations for Resourcin and selected client accounts.

You will:

• Coordinate recruitment alongside senior consultants
• Support onboarding, documentation, and HR administration
• Maintain employee records and update HR systems
• Assist with policy implementation and compliance
• Support performance management and employee engagement activities
• Serve as a first point of contact for basic HR queries

Perfect for someone with solid HR operations experience who enjoys structure, detail, and supporting multiple stakeholders in a fast-paced environment.
    `.trim(),
  },
];

chore: add shared jobs data
