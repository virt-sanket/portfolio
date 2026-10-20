const fs = require('fs');
const path = require('path');

const DEFAULT_HERO = {
  name: "Sanket Kandel",
  eyebrow: "Available for work",
  bio: "I craft beautiful, scalable web applications that live at the intersection of stunning design and rock-solid engineering. Passionate about open source, cloud infrastructure, and creating experiences that matter.",
  status: "Open to work",
  typewriterWords: [
    "Software Developer",
    "MSc CS Student @ York St John",
    "Cloud Systems Architect",
    "Python • GCP • Supabase • Atlas"
  ],
  stats: {
    years: "5+",
    projects: "40+",
    stars: "3k+",
    clients: "12+"
  }
};

const DEFAULT_ABOUT = {
  bio: [
    "I'm Sanket Kandel, a Software Developer currently pursuing an MSc in Computer Science at York St John University (United Kingdom) — engineering high-impact products across cloud infrastructure, distributed backends, and modern web systems.",
    "With 5+ years of hands-on experience, I design and ship systems using Python, Google Cloud Platform (GCP), Supabase, and MongoDB Atlas. I care deeply about performance, clean code architecture, and high reliability.",
    "When I'm not writing code, you'll find me analyzing systems research papers, contributing to open-source tools, trekking mountain trails, or experimenting with autonomous AI agents."
  ],
  currentFocus: "MSc CS • Cloud & AI",
  timeline: [
    {
      date: "2024 – Present",
      role: "Senior Full-Stack Engineer",
      company: "Independent / Freelance",
      desc: "Architecting cloud-native applications and AI-driven workflows for international clients across US, Europe, and Asia. Leading architecture and full-stack delivery."
    },
    {
      date: "2022 – 2024",
      role: "Full-Stack Developer",
      company: "Apex Digital Solutions",
      desc: "Built and scaled multi-tenant SaaS products using React, Next.js, Node.js, and AWS. Improved core API response times by 40% and reduced cloud infrastructure costs."
    },
    {
      date: "2020 – 2022",
      role: "Frontend Engineer",
      company: "WebSphere Tech",
      desc: "Developed responsive, accessible, high-performance web interfaces for 20+ client projects. Established company-wide component library and design system."
    }
  ],
  education: [
    {
      degree: "MSc in Computer Science",
      school: "York St John University, UK",
      year: "2026 – Present",
      icon: "fa-solid fa-graduation-cap"
    },
    {
      degree: "B.Sc. in Computer Science & Information Technology",
      school: "Tribhuvan University",
      year: "2018 – 2022",
      icon: "fa-solid fa-user-graduate"
    },
    {
      degree: "AWS Certified Solutions Architect",
      school: "Amazon Web Services",
      year: "2023",
      icon: "fa-brands fa-aws"
    },
    {
      degree: "Certified Kubernetes Administrator (CKA)",
      school: "Cloud Native Computing Foundation",
      year: "2024",
      icon: "fa-solid fa-cloud"
    }
  ],
  interests: [
    { label: "Himalayan Trekking", icon: "fa-solid fa-mountain" },
    { label: "Open Source", icon: "fa-brands fa-github" },
    { label: "Generative AI", icon: "fa-solid fa-brain" },
    { label: "Cloud Systems", icon: "fa-solid fa-server" },
    { label: "Specialty Coffee", icon: "fa-solid fa-mug-hot" },
    { label: "Photography", icon: "fa-solid fa-camera" }
  ]
};

const DEFAULT_SKILLS = {
  groups: [
    {
      name: "Frontend",
      skills: [
        { name: "React / Next.js", level: 95 },
        { name: "TypeScript", level: 90 },
        { name: "CSS / Animations", level: 88 },
        { name: "Vue / Nuxt", level: 72 },
        { name: "React Native", level: 78 }
      ]
    },
    {
      name: "Backend",
      skills: [
        { name: "Node.js / Express", level: 92 },
        { name: "Python / FastAPI", level: 85 },
        { name: "GraphQL", level: 80 },
        { name: "PostgreSQL / Prisma", level: 88 },
        { name: "Redis / Caching", level: 76 }
      ]
    },
    {
      name: "Cloud & DevOps",
      skills: [
        { name: "AWS (EC2, S3, Lambda, RDS)", level: 87 },
        { name: "Docker / Kubernetes", level: 82 },
        { name: "Terraform / IaC", level: 78 },
        { name: "GitHub Actions / CI/CD", level: 90 },
        { name: "Cloudflare / CDN", level: 75 }
      ]
    },
    {
      name: "AI & Data",
      skills: [
        { name: "OpenAI / LLM APIs", level: 83 },
        { name: "LangChain / RAG", level: 70 },
        { name: "Vector Databases", level: 68 },
        { name: "Data Viz (D3.js, Recharts)", level: 85 },
        { name: "Machine Learning basics", level: 60 }
      ]
    }
  ]
};

const DEFAULT_CONTACT = {
  email: "info@sanketkandel.com.np",
  phone: "+977 9840505190",
  location: "Gaindakot, Nepal • York, UK",
  availability: "Available for select projects & research",
  cvUrl: "/api/public/file/cv",
  socials: {
    github: "https://github.com/virt-sanket",
    linkedin: "https://linkedin.com/in/sanketkandel",
    twitter: "https://x.com/tweet-sanket",
    instagram: ""
  }
};

const DEFAULT_SETTINGS = {
  seoTitle: "Sanket Kandel | Software Developer & MSc Computer Science Student",
  seoDesc: "Explore Sanket Kandel's portfolio — distributed backends, Python, Google Cloud, Supabase, and MongoDB Atlas.",
  seoKeywords: "software developer, msc computer science, york st john university, python, gcp, supabase, mongodb atlas, cloud architect",
  ogImage: "assets/og-image.png",
  seoDesc: "Explore Sanket Kandel's full portfolio — web apps, AI tools, open-source libraries, and cloud infrastructure solutions.",
  seoKeywords: "full-stack developer, react, next.js, node.js, cloud architect, aws, nepal",
  ogImage: "assets/avatar.jpg",
  footerTagline: "Building tomorrow's web, today.",
  footerCopy: "Crafted with passion by Sanket Kandel · © 2026",
  hireBtnText: "Hire Me",
  hireBtnLink: "contact.html"
};

const DEFAULT_PROJECTS = [
  {
    id: "proj-cloudportal",
    name: "CloudPortal",
    desc: "A multi-tenant SaaS infrastructure management platform with Terraform integration, cost analytics dashboards, and one-click deployments to AWS, GCP, and Azure. Serving 50+ enterprise clients.",
    category: "fullstack cloud",
    status: "In Production",
    icon: "fa-solid fa-cloud",
    featured: true,
    tags: ["Next.js 14", "Terraform", "AWS CDK", "PostgreSQL", "Prisma", "Redis"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-novadash",
    name: "NovaDash",
    desc: "Real-time analytics dashboard with live WebSocket data streams, interactive D3.js charts, and dark-mode glassmorphism UI — serving 10k+ daily active users.",
    category: "fullstack",
    status: "In Production",
    icon: "fa-solid fa-chart-line",
    featured: true,
    tags: ["React", "D3.js", "WebSocket", "Node.js", "MongoDB"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-aetherai",
    name: "AetherAI",
    desc: "AI-powered code review assistant that integrates with GitHub PRs, providing contextual, actionable feedback. Reduced average review time by 60% across 200+ repositories.",
    category: "ai",
    status: "In Production",
    icon: "fa-solid fa-robot",
    featured: true,
    tags: ["Python", "OpenAI GPT-4", "FastAPI", "Docker"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-glassui",
    name: "GlassUI",
    desc: "An open-source React component library implementing glassmorphism design patterns. 3.2k GitHub stars, 180 contributors, and used in 500+ projects worldwide.",
    category: "oss",
    status: "Active",
    icon: "fa-solid fa-wand-magic-sparkles",
    featured: false,
    tags: ["React", "TypeScript", "Storybook", "Rollup"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-synapse-chat",
    name: "Synapse Chat",
    desc: "Multi-model AI chat application supporting GPT-4, Claude, and Gemini with conversation history, file uploads, and team workspaces.",
    category: "ai fullstack",
    status: "In Production",
    icon: "fa-solid fa-comments",
    featured: false,
    tags: ["Next.js", "Vercel AI SDK", "Supabase", "Stripe"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-trailmap",
    name: "TrailMap",
    desc: "Cross-platform hiking trail discovery app for Nepal with offline maps, elevation profiles, and community-driven trail ratings. 8k+ downloads on iOS and Android.",
    category: "mobile",
    status: "Active",
    icon: "fa-solid fa-mobile-screen-button",
    featured: false,
    tags: ["React Native", "MapboxGL", "Expo", "Firebase"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-devflow",
    name: "DevFlow CLI",
    desc: "A developer productivity CLI that automates GitHub workflows, PR templates, semantic versioning, and deployment pipelines with a single command.",
    category: "cloud",
    status: "Active",
    icon: "fa-solid fa-terminal",
    featured: false,
    tags: ["Node.js", "Commander.js", "GitHub API", "Shell"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-storefront",
    name: "StoreFront",
    desc: "Headless e-commerce platform with Shopify integration, real-time inventory, and a blazing-fast storefront using Next.js and ISR. 3x faster than the previous store.",
    category: "fullstack",
    status: "In Production",
    icon: "fa-solid fa-cart-shopping",
    featured: false,
    tags: ["Next.js", "Shopify", "GraphQL", "Tailwind"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  },
  {
    id: "proj-envvault",
    name: "env-vault",
    desc: "Secure environment variable management for teams. Encrypts, versions, and syncs .env files across your team using AES-256 and zero-knowledge architecture.",
    category: "oss",
    status: "Active",
    icon: "fa-solid fa-vault",
    featured: false,
    tags: ["Node.js", "CLI", "Cryptography"],
    liveUrl: "#",
    githubUrl: "https://github.com/virt-sanket"
  }
];

const DEFAULT_BLOG = [
  {
    id: "post-saas-aws",
    title: "Building a Production-Ready Multi-Tenant SaaS on AWS in 2026",
    slug: "building-a-production-ready-multi-tenant-saas-on-aws-in-2026",
    category: "Cloud & DevOps",
    status: "published",
    featured: true,
    date: "Jul 15, 2026",
    createdAt: 1784073600000,
    readTime: "18 min read",
    icon: "fa-solid fa-cloud-arrow-up",
    tags: ["AWS", "Terraform", "SaaS", "Architecture"],
    excerpt: "A deep, no-holds-barred guide to architecting a multi-tenant SaaS product from scratch — covering database isolation strategies, Terraform modules, cost optimization, and zero-downtime deployments.",
    content: "<h2>Introduction</h2><p>Building a multi-tenant architecture on AWS requires careful planning across compute, storage, and networking layers...</p>"
  },
  {
    id: "post-rsc-depth",
    title: "React Server Components in Depth: What Changes, What Doesn't",
    slug: "react-server-components-in-depth-what-changes-what-doesnt",
    category: "Engineering",
    status: "published",
    featured: false,
    date: "Jul 8, 2026",
    createdAt: 1783468800000,
    readTime: "12 min read",
    icon: "fa-brands fa-react",
    tags: ["React", "Next.js", "Frontend"],
    excerpt: "A comprehensive look at React Server Components after 6 months of production use. Real performance numbers, gotchas, and patterns that actually work.",
    content: "<p>React Server Components shift the mental model of client-side web development...</p>"
  },
  {
    id: "post-rag-pipeline",
    title: "Building a RAG Pipeline That Actually Scales",
    slug: "building-a-rag-pipeline-that-actually-scales",
    category: "AI & ML",
    status: "published",
    featured: false,
    date: "Jun 28, 2026",
    createdAt: 1782604800000,
    readTime: "9 min read",
    icon: "fa-solid fa-microchip",
    tags: ["AI", "RAG", "LLM", "Python"],
    excerpt: "How I built a production Retrieval-Augmented Generation system that handles 10k+ queries per day without breaking the bank. Architecture, chunking strategies, and embeddings.",
    content: "<p>Retrieval-Augmented Generation (RAG) is easy to prototype and notoriously difficult to productionize...</p>"
  },
  {
    id: "post-k8s-primer",
    title: "Kubernetes for Full-Stack Developers: A Practical Primer",
    slug: "kubernetes-for-full-stack-developers-a-practical-primer",
    category: "Cloud & DevOps",
    status: "published",
    featured: false,
    date: "Jun 15, 2026",
    createdAt: 1781481600000,
    readTime: "15 min read",
    icon: "fa-brands fa-docker",
    tags: ["Kubernetes", "DevOps", "Docker"],
    excerpt: "Skip the theory — this guide shows you exactly how to deploy, scale, and monitor a full-stack application on Kubernetes using practical, production-tested patterns.",
    content: "<p>Most Kubernetes tutorials start with complex cluster management concepts that full-stack developers don't need day-to-day...</p>"
  },
  {
    id: "post-oss-career",
    title: "How Open Source Changed My Career (And Can Change Yours)",
    slug: "how-open-source-changed-my-career-and-can-change-yours",
    category: "Open Source",
    status: "published",
    featured: false,
    date: "Jun 3, 2026",
    createdAt: 1780444800000,
    readTime: "8 min read",
    icon: "fa-brands fa-github",
    tags: ["Career", "Open Source", "Community"],
    excerpt: "My journey from lurking in GitHub issues to maintaining libraries with 3k+ stars. Practical advice on how to get started and stay consistent.",
    content: "<p>When I first stared at the React repository issue tracker, every open issue seemed impossibly daunting...</p>"
  },
  {
    id: "post-aws-cost",
    title: "Cutting Our AWS Bill by 35%: A Post-Mortem",
    slug: "cutting-our-aws-bill-by-35-a-post-mortem",
    category: "Cloud & DevOps",
    status: "published",
    featured: false,
    date: "May 20, 2026",
    createdAt: 1779235200000,
    readTime: "11 min read",
    icon: "fa-solid fa-piggy-bank",
    tags: ["AWS", "Cost Optimization", "FinOps"],
    excerpt: "We were burning $14k/month on AWS. Here's the exact playbook we used to bring it down to $9k — Reserved Instances, right-sizing, caching, and architectural changes.",
    content: "<p>Cloud bills creep up quietly before exploding into boardroom discussions...</p>"
  },
  {
    id: "post-tech-lead",
    title: "From IC to Tech Lead: What Nobody Tells You",
    slug: "from-ic-to-tech-lead-what-nobody-tells-you",
    category: "Career",
    status: "published",
    featured: false,
    date: "May 5, 2026",
    createdAt: 1777939200000,
    readTime: "7 min read",
    icon: "fa-solid fa-users-gear",
    tags: ["Leadership", "Engineering", "Career"],
    excerpt: "Making the jump from individual contributor to tech lead is more about communication, trust-building, and systems thinking than it is about coding chops.",
    content: "<p>On your first day as a lead, you realize your calendar is no longer your own...</p>"
  }
];

const pairs = [
  { key: 'hero', value: JSON.stringify(DEFAULT_HERO) },
  { key: 'about', value: JSON.stringify(DEFAULT_ABOUT) },
  { key: 'skills', value: JSON.stringify(DEFAULT_SKILLS) },
  { key: 'contact', value: JSON.stringify(DEFAULT_CONTACT) },
  { key: 'settings', value: JSON.stringify(DEFAULT_SETTINGS) },
  { key: 'projects_index', value: JSON.stringify(DEFAULT_PROJECTS.map(p => p.id)) },
  { key: 'blog_index', value: JSON.stringify(DEFAULT_BLOG.map(b => b.id)) }
];

DEFAULT_PROJECTS.forEach(p => {
  pairs.push({ key: `projects:${p.id}`, value: JSON.stringify(p) });
});

DEFAULT_BLOG.forEach(b => {
  pairs.push({ key: `blog:${b.id}`, value: JSON.stringify(b) });
});

fs.writeFileSync(path.join(__dirname, 'seed-data.json'), JSON.stringify(pairs, null, 2), 'utf8');
console.log(`Generated seed-data.json with ${pairs.length} entries.`);
