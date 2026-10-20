/**
 * ═══════════════════════════════════════════════════════════════
 *  Cloudflare Worker — Portfolio Admin & Public API
 *  Features:
 *   - Real-time CV upload directly to KV with zero caching lag
 *   - Live cache-busting versioned URLs (?v=timestamp)
 *   - Multi-theme engine (6 curated presets)
 *   - Fully editable Header, Footer, Beliefs, OSS, Tech Stack,
 *     Hero, About, Projects, Skills, Contact, and Blog
 *   - Accurate analytics tracking (unique visitors + pageviews)
 *   - Resend OTP delivery with automatic fallback
 * ═══════════════════════════════════════════════════════════════
 */

// ── DEFAULT DATA CONSTANTS ────────────────────────────────────
const DEFAULT_HERO = {
  name: "Sanket Kandel",
  eyebrow: "Available for work",
  bio: "I craft beautiful, scalable web applications that live at the intersection of stunning design and rock-solid engineering. Passionate about open source, cloud infrastructure, and creating experiences that matter.",
  status: "Open to work",
  typewriterWords: [
    "Full-Stack Developer",
    "Cloud Architect",
    "UI/UX Craftsman",
    "Open-Source Enthusiast"
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
    "I'm Sanket Kandel, a Software Developer currently pursuing an MSc in Computer Science at York St John University (United Kingdom). I engineer high-impact products at the intersection of cloud infrastructure, distributed backends, and modern web systems.",
    "My journey started in 2019 with a curiosity about how computer networks and software run at scale. What began with building web tools evolved into architecting production microservices with Python, Google Cloud Platform (GCP), Supabase, and MongoDB Atlas serving tens of thousands of users.",
    "I'm especially passionate about developer experience, systems resilience, and making complex cloud technology effortless to use. When I'm not writing code or analyzing research papers, I share technical findings on my blog, contribute to open-source software, and explore mountain hiking trails."
  ],
  currentFocus: "MSc CS • Cloud & AI",
  timeline: [
    {
      date: "2023 — Present",
      role: "Lead Full-Stack Developer",
      company: "Nexus Cloud Systems • Remote",
      desc: "Leading architecture of distributed SaaS microservices. Migrated core monolithic services to event-driven serverless architecture, reducing latency by 42%. Mentoring 6 junior and mid-level engineers."
    },
    {
      date: "2021 — 2023",
      role: "Cloud & Backend Engineer",
      company: "Apex Digital Solutions • Kathmandu",
      desc: "Architected REST APIs, database schemas, and background worker queues with Python and Node.js. Integrated Stripe, SendGrid, and AWS services. Built internal developer dashboard saving 15 engineering hours weekly."
    },
    {
      date: "2019 — 2021",
      role: "Junior Web Developer",
      company: "Freelance & Community",
      desc: "Built custom responsive websites, client dashboards, and interactive UI components. Learned fundamentals of systems programming, database indexing, and network protocols."
    }
  ],
  education: [
    {
      degree: "MSc Computer Science",
      school: "York St John University, United Kingdom",
      year: "2026 – Present · Postgraduate Degree",
      icon: "fa-solid fa-graduation-cap"
    },
    {
      degree: "B.Sc. Computer Science",
      school: "Tribhuvan University, Kathmandu",
      year: "2016 – 2020 · First Division",
      icon: "fa-solid fa-user-graduate"
    },
    {
      degree: "Google Cloud Professional Engineer",
      school: "Google Cloud",
      year: "2024 · Active",
      icon: "fa-brands fa-google"
    },
    {
      degree: "AWS Certified Developer – Associate",
      school: "Amazon Web Services",
      year: "2023 · Active",
      icon: "fa-brands fa-aws"
    }
  ],
  interests: [
    { label: "Hiking & Mountains", icon: "fa-solid fa-mountain-sun" },
    { label: "Photography", icon: "fa-solid fa-camera" },
    { label: "Open Source", icon: "fa-brands fa-github" },
    { label: "Generative AI", icon: "fa-solid fa-brain" },
    { label: "Distributed Systems", icon: "fa-solid fa-server" },
    { label: "Specialty Coffee", icon: "fa-solid fa-mug-hot" }
  ]
};

const DEFAULT_BELIEFS = [
  { icon: "fa-solid fa-gauge-high", title: "Performance is a feature", desc: "Every millisecond matters to your users" },
  { icon: "fa-solid fa-palette", title: "Design and engineering are inseparable", desc: "Great products need both" },
  { icon: "fa-solid fa-code-merge", title: "Open source makes us all better", desc: "Give back as much as you take" },
  { icon: "fa-solid fa-graduation-cap", title: "Curiosity is a superpower", desc: "Never stop learning" }
];

const DEFAULT_OSS = [
  { icon: "fa-brands fa-react icon-cyan", name: "facebook/react", desc: "Fixed memory leak in concurrent mode scheduler — merged in v18.2", stars: "220k", prs: "3 PRs", url: "https://github.com/facebook/react" },
  { icon: "fa-solid fa-layer-group icon-white", name: "vercel/next.js", desc: "Added TypeScript types for Server Actions API and improved DX documentation", stars: "120k", prs: "5 PRs", url: "https://github.com/vercel/next.js" },
  { icon: "fa-solid fa-database icon-violet", name: "prisma/prisma", desc: "Contributed composite index support for PostgreSQL and improved error messages", stars: "38k", prs: "7 PRs", url: "https://github.com/prisma/prisma" }
];

const DEFAULT_TECH_STACK = [
  { name: "React", icon: "fa-brands fa-react icon-react" },
  { name: "Next.js", icon: "fa-solid fa-layer-group icon-white" },
  { name: "TypeScript", icon: "fa-solid fa-code icon-ts" },
  { name: "Node.js", icon: "fa-brands fa-node-js icon-node" },
  { name: "Python", icon: "fa-brands fa-python icon-python" },
  { name: "PostgreSQL", icon: "fa-solid fa-database icon-postgres" },
  { name: "MongoDB", icon: "fa-solid fa-leaf icon-mongo" },
  { name: "Redis", icon: "fa-solid fa-bolt icon-redis" },
  { name: "Docker", icon: "fa-brands fa-docker icon-docker" },
  { name: "Kubernetes", icon: "fa-solid fa-dharmachakra icon-k8s" },
  { name: "AWS", icon: "fa-brands fa-aws icon-aws" },
  { name: "GCP", icon: "fa-brands fa-google icon-gcp" },
  { name: "Terraform", icon: "fa-solid fa-cubes icon-terraform" },
  { name: "Prisma", icon: "fa-solid fa-shield-halved icon-prisma" },
  { name: "GraphQL", icon: "fa-solid fa-network-wired icon-graphql" }
];

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
  badge: "Let's Connect",
  heroTitle: 'Get In <span class="gradient-text">Touch</span>',
  heroSub: "Have a project in mind? Looking for a collaborator? Or just want to say hello? I'd love to hear from you.",
  infoTitle: 'Let\'s Build <span class="gradient-text">Something</span> Together',
  infoDesc: "I'm currently available for freelance projects, full-time roles, speaking engagements, and interesting technical collaborations.",
  email: "kandel.sanket@gmail.com",
  phone: "+977 9840505190",
  location: "Gaindakot, Nepal",
  timezone: "NPT (UTC +5:45)",
  availability: "Available for new projects",
  replyTime: "Typically replies in 24h",
  note: "Your data is private and will never be shared.",
  mapTitle: "Based in Gaindakot, Nepal",
  mapSub: "Working remotely with clients across North America, Europe, and Asia-Pacific",
  cvLabel: "Curriculum Vitae",
  cvSub: "Download Official Resume",
  cvUrl: "/api/public/file/cv",
  socials: {
    github: "https://github.com/virt-sanket",
    linkedin: "https://linkedin.com/in/sanketkandel",
    twitter: "https://x.com/tweet-sanket",
    instagram: ""
  }
};

const DEFAULT_HEADER = {
  logoText: "SK",
  hireBtnText: "Hire Me",
  hireBtnLink: "contact.html",
  availabilityText: "Available for work"
};

const DEFAULT_FOOTER = {
  logoText: "SK",
  tagline: "Building tomorrow's web, today.",
  copy: "Crafted with passion by Sanket Kandel · © 2026"
};

const DEFAULT_SETTINGS = {
  seoTitle: "Sanket Kandel — Full-Stack Developer & Cloud Architect",
  seoDesc: "Explore Sanket Kandel's full portfolio — web apps, AI tools, open-source libraries, and cloud infrastructure solutions.",
  seoKeywords: "full-stack developer, react, next.js, node.js, cloud architect, aws, nepal",
  ogImage: "assets/avatar.jpg",
  theme: "cyber-neon"
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const respond = (data, status = 200, extraHeaders = {}) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders,
          ...extraHeaders
        }
      });

    const error = (msg, status = 400) => respond({ ok: false, error: msg }, status);

    // ── PUBLIC FILE SERVING (CV / Avatar) ─────────────────────────
    if (path === '/api/public/file/cv' || path === '/api/public/cv' || path === '/cv.pdf' || path === '/assets/cv.pdf' || path === '/cv' || path === '/resume.pdf' || path === '/assets/resume.pdf') {
      const cvFile = await env.PORTFOLIO_DATA.getWithMetadata('file:cv', { type: 'arrayBuffer' });
      if (!cvFile || !cvFile.value) {
        return new Response('CV file has not been uploaded yet.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders }
        });
      }
      if (ctx && ctx.waitUntil) {
        ctx.waitUntil(trackCvDownload(env));
      }
      const filename = cvFile.metadata?.filename || 'Sanket_Kandel_CV.pdf';
      return new Response(cvFile.value, {
        headers: {
          'Content-Type': cvFile.metadata?.contentType || 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'ETag': `"cv-${cvFile.metadata?.uploadedAt || 'v1'}"`,
          ...corsHeaders
        }
      });
    }

    // Public endpoint to get CV metadata (filename, size, uploadedAt)
    if (path === '/api/public/file/cv/meta' && request.method === 'GET') {
      const cvFile = await env.PORTFOLIO_DATA.getWithMetadata('file:cv', { type: 'arrayBuffer' });
      if (!cvFile || !cvFile.value) {
        return respond({ exists: false });
      }
      return respond({
        exists: true,
        filename: cvFile.metadata?.filename || 'Sanket_Kandel_CV.pdf',
        size: cvFile.metadata?.size || cvFile.value.byteLength,
        uploadedAt: cvFile.metadata?.uploadedAt || null,
        url: `/api/public/file/cv?v=${cvFile.metadata?.uploadedAt || Date.now()}`
      });
    }

    if (path.startsWith('/api/public/file/')) {
      const fileName = path.replace('/api/public/file/', '');
      const fileData = await env.PORTFOLIO_DATA.getWithMetadata(`file:${fileName}`, { type: 'arrayBuffer' });
      if (!fileData || !fileData.value) {
        return new Response('File not found', { status: 404, headers: corsHeaders });
      }
      return new Response(fileData.value, {
        headers: {
          'Content-Type': fileData.metadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      });
    }

    // ── PUBLIC ENDPOINTS (No Auth Needed) ─────────────────────────
    if (path === '/api/public/hero' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('hero', { type: 'json' });
      return respond((data && Object.keys(data).length) ? data : DEFAULT_HERO);
    }
    if (path === '/api/public/about' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('about', { type: 'json' });
      return respond((data && Object.keys(data).length) ? data : DEFAULT_ABOUT);
    }
    if (path === '/api/public/skills' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('skills', { type: 'json' });
      return respond((data && data.groups?.length) ? data : DEFAULT_SKILLS);
    }
    if (path === '/api/public/contact' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('contact', { type: 'json' }) || {};
      const merged = Object.assign({}, DEFAULT_CONTACT, data);
      return respond(merged);
    }
    if (path === '/api/public/projects' && request.method === 'GET') {
      const projects = await getAll(env, 'projects');
      const list = projects.length ? projects : DEFAULT_PROJECTS;
      return respond({ projects: list.filter(p => p.status !== 'Draft') });
    }
    if (path === '/api/public/blog' && request.method === 'GET') {
      const posts = await getAll(env, 'blog');
      const list = posts.length ? posts : DEFAULT_BLOG;
      const published = list.filter(p => p.status === 'published').sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
      return respond({ posts: published });
    }
    if (path === '/api/public/beliefs' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('beliefs', { type: 'json' });
      return respond(Array.isArray(data) && data.length ? data : DEFAULT_BELIEFS);
    }
    if (path === '/api/public/oss' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('oss', { type: 'json' });
      return respond(Array.isArray(data) && data.length ? data : DEFAULT_OSS);
    }
    if (path === '/api/public/tech-stack' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('tech-stack', { type: 'json' });
      return respond(Array.isArray(data) && data.length ? data : DEFAULT_TECH_STACK);
    }
    if (path === '/api/public/header' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('header', { type: 'json' });
      return respond((data && Object.keys(data).length) ? data : DEFAULT_HEADER);
    }
    if (path === '/api/public/footer' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('footer', { type: 'json' });
      return respond((data && Object.keys(data).length) ? data : DEFAULT_FOOTER);
    }
    if (path === '/api/public/theme' && request.method === 'GET') {
      const theme = await env.PORTFOLIO_DATA.get('theme');
      return respond({ theme: theme || DEFAULT_SETTINGS.theme });
    }
    if (path === '/api/public/settings' && request.method === 'GET') {
      const data = await env.PORTFOLIO_DATA.get('settings', { type: 'json' });
      return respond((data && Object.keys(data).length) ? data : DEFAULT_SETTINGS);
    }

    // ── Public Contact Form Receiver ────────────────────────────
    if (path === '/api/contact' && request.method === 'POST') {
      return await receiveMessage(request, env, respond);
    }

    // ── Track page visit & visitors ──────────────────────────────
    if (path === '/api/track' && request.method === 'POST') {
      return await trackVisit(request, env, respond);
    }

    // ── AUTH ROUTES ──────────────────────────────────────────────
    if (path === '/api/auth/send-otp' && request.method === 'POST') {
      return await sendOTP(env, respond, error);
    }

    if (path === '/api/auth/verify-otp' && request.method === 'POST') {
      return await verifyOTP(request, env, respond, error);
    }

    // ── ALL OTHER ROUTES REQUIRE AUTH ────────────────────────────
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return error('Unauthorized', 401);

    const sessionData = await env.SESSIONS.get(`session:${token}`);
    if (!sessionData) return error('Session expired — please log in again', 401);

    // ── SEED DATABASE ────────────────────────────────────────────
    if (path === '/api/seed' && request.method === 'POST') {
      await seedDefaults(env);
      return respond({ ok: true, message: 'All portfolio data initialized successfully!' });
    }

    // ── ANALYTICS ────────────────────────────────────────────────
    if (path === '/api/analytics' && request.method === 'GET') {
      return await getAnalytics(env, respond);
    }

    // ── CONTENT CRUD (KV) ────────────────────────────────────────
    if (path.startsWith('/api/content/')) {
      const section = path.replace('/api/content/', '');
      if (request.method === 'GET') {
        const data = await env.PORTFOLIO_DATA.get(section, { type: 'json' });
        if (data && (Array.isArray(data) ? data.length : Object.keys(data).length)) {
          return respond(data);
        }
        const defaults = {
          hero: DEFAULT_HERO,
          about: DEFAULT_ABOUT,
          beliefs: DEFAULT_BELIEFS,
          oss: DEFAULT_OSS,
          'tech-stack': DEFAULT_TECH_STACK,
          skills: DEFAULT_SKILLS,
          contact: DEFAULT_CONTACT,
          header: DEFAULT_HEADER,
          footer: DEFAULT_FOOTER,
          settings: DEFAULT_SETTINGS
        };
        return respond(defaults[section] || {});
      }
      if (request.method === 'POST') {
        const body = await request.json();
        await env.PORTFOLIO_DATA.put(section, JSON.stringify(body));
        return respond({ ok: true });
      }
    }

    // ── THEME SWITCH ─────────────────────────────────────────────
    if (path === '/api/theme' && request.method === 'POST') {
      const { theme } = await request.json();
      if (!theme) return error('Theme name required');
      await env.PORTFOLIO_DATA.put('theme', theme);
      const settings = await env.PORTFOLIO_DATA.get('settings', { type: 'json' }) || {};
      settings.theme = theme;
      await env.PORTFOLIO_DATA.put('settings', JSON.stringify(settings));
      return respond({ ok: true, theme });
    }

    // ── PROJECTS ─────────────────────────────────────────────────
    if (path === '/api/projects') {
      if (request.method === 'GET') {
        let projects = await getAll(env, 'projects');
        if (!projects.length) projects = DEFAULT_PROJECTS;
        return respond({ projects });
      }
      if (request.method === 'POST') {
        const project = await request.json();
        if (!project.id) project.id = 'proj-' + Date.now().toString(36);
        await upsert(env, 'projects', project.id, project);
        return respond({ ok: true, project });
      }
    }

    if (path.startsWith('/api/projects/') && request.method === 'DELETE') {
      const id = path.replace('/api/projects/', '');
      await deleteItem(env, 'projects', id);
      return respond({ ok: true });
    }

    // ── BLOG ──────────────────────────────────────────────────────
    if (path === '/api/blog') {
      if (request.method === 'GET') {
        let posts = await getAll(env, 'blog');
        if (!posts.length) posts = DEFAULT_BLOG;
        return respond({ posts: posts.sort((a,b) => (b.createdAt||0) - (a.createdAt||0)) });
      }
      if (request.method === 'POST') {
        const post = await request.json();
        if (!post.id) post.id = 'post-' + Date.now().toString(36);
        if (!post.createdAt) post.createdAt = Date.now();
        await upsert(env, 'blog', post.id, post);
        return respond({ ok: true, post });
      }
    }

    if (path.startsWith('/api/blog/') && request.method === 'DELETE') {
      const id = path.replace('/api/blog/', '');
      await deleteItem(env, 'blog', id);
      return respond({ ok: true });
    }

    // ── TRIGGER DAILY AI BLOG GENERATION (Manual / Admin) ─────────
    if (path === '/api/blog/generate-daily' && request.method === 'POST') {
      try {
        const post = await generateDailyAIBlogPost(env);
        return respond({ ok: true, post, message: 'Daily AI Blog post generated and published successfully!' });
      } catch (err) {
        return error('AI Blog Generation failed: ' + err.message, 500);
      }
    }

    // ── X (TWITTER) AUTOMATION ENDPOINTS ──────────────────────────
    if (path === '/api/admin/x-settings') {
      if (request.method === 'GET') {
        const creds = await getXSettings(env);
        return respond({
          ok: true,
          settings: {
            enabled: creds.enabled,
            apiKey: creds.apiKey ? creds.apiKey.slice(0, 4) + '••••' + creds.apiKey.slice(-4) : '',
            hasApiKey: Boolean(creds.apiKey),
            hasApiSecret: Boolean(creds.apiSecret),
            hasAccessToken: Boolean(creds.accessToken),
            hasAccessTokenSecret: Boolean(creds.accessTokenSecret),
            hasBearerToken: Boolean(creds.bearerToken)
          }
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const current = await env.PORTFOLIO_DATA.get('x_settings', { type: 'json' }) || {};

        const updated = {
          enabled: body.enabled !== false,
          apiKey: (body.apiKey && !body.apiKey.includes('••••')) ? body.apiKey.trim() : (current.apiKey || ''),
          apiSecret: (body.apiSecret && !body.apiSecret.includes('••••')) ? body.apiSecret.trim() : (current.apiSecret || ''),
          accessToken: (body.accessToken && !body.accessToken.includes('••••')) ? body.accessToken.trim() : (current.accessToken || ''),
          accessTokenSecret: (body.accessTokenSecret && !body.accessTokenSecret.includes('••••')) ? body.accessTokenSecret.trim() : (current.accessTokenSecret || ''),
          bearerToken: (body.bearerToken && !body.bearerToken.includes('••••')) ? body.bearerToken.trim() : (current.bearerToken || '')
        };

        await env.PORTFOLIO_DATA.put('x_settings', JSON.stringify(updated));
        return respond({ ok: true, message: 'X (Twitter) credentials saved successfully!' });
      }
    }

    if (path === '/api/admin/x-test' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const dateStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const testText = body.text || `🚀 Testing X integration from Sanket Kandel's portfolio at ${dateStr}! Automating daily tech & AI insights. #AI #Tech #WebDev`;
        const result = await postTweetToX(env, testText);
        return respond({ ok: true, result, message: 'Test tweet successfully published to X!' });
      } catch (err) {
        return error('X posting failed: ' + err.message, 500);
      }
    }

    if (path === '/api/admin/x-post-article' && request.method === 'POST') {
      try {
        const { postId } = await request.json();
        const posts = await getAll(env, 'blog');
        const post = posts.find(p => p.id === postId || p.slug === postId);
        if (!post) return error('Blog post not found', 404);

        const tweetText = formatTweetForPost(post);
        const result = await postTweetToX(env, tweetText);
        return respond({ ok: true, result, tweetText, message: 'Article posted to X successfully!' });
      } catch (err) {
        return error('Failed to post article to X: ' + err.message, 500);
      }
    }

    // ── MESSAGES ──────────────────────────────────────────────────
    if (path === '/api/messages') {
      if (request.method === 'GET') {
        const messages = await getAll(env, 'messages');
        return respond({ messages: messages.sort((a,b) => (b.createdAt||0) - (a.createdAt||0)) });
      }
      if (request.method === 'DELETE') {
        await env.PORTFOLIO_DATA.delete('messages_index');
        return respond({ ok: true });
      }
    }

    if (path.match(/^\/api\/messages\/[^/]+\/read$/) && request.method === 'POST') {
      const id = path.split('/')[3];
      const msg = await env.PORTFOLIO_DATA.get(`msg:${id}`, { type: 'json' });
      if (msg) {
        msg.read = true;
        await env.PORTFOLIO_DATA.put(`msg:${id}`, JSON.stringify(msg));
      }
      return respond({ ok: true });
    }

    // ── FILE UPLOADS (CV & Avatar directly to Cloudflare KV) ──────
    if (path === '/api/upload/cv' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return error('No file uploaded', 400);

        const now = Date.now();
        const buffer = await file.arrayBuffer();
        await env.PORTFOLIO_DATA.put('file:cv', buffer, {
          metadata: {
            contentType: file.type || 'application/pdf',
            filename: file.name || 'Sanket_Kandel_CV.pdf',
            size: file.size,
            uploadedAt: now
          }
        });

        const versionedUrl = `/api/public/file/cv?v=${now}`;

        // Automatically update contact info with the cache-busted CV URL
        const contact = await env.PORTFOLIO_DATA.get('contact', { type: 'json' }) || Object.assign({}, DEFAULT_CONTACT);
        contact.cvUrl = versionedUrl;
        await env.PORTFOLIO_DATA.put('contact', JSON.stringify(contact));

        return respond({
          ok: true,
          url: versionedUrl,
          filename: file.name || 'Sanket_Kandel_CV.pdf',
          size: file.size,
          uploadedAt: now
        });
      } catch (err) {
        return error('File upload failed: ' + err.message, 500);
      }
    }

    if (path === '/api/upload/avatar' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return error('No file uploaded', 400);

        const now = Date.now();
        const buffer = await file.arrayBuffer();
        await env.PORTFOLIO_DATA.put('file:avatar', buffer, {
          metadata: {
            contentType: file.type || 'image/jpeg',
            uploadedAt: now
          }
        });

        return respond({ ok: true, url: `/api/public/file/avatar?v=${now}` });
      } catch (err) {
        return error('Avatar upload failed: ' + err.message, 500);
      }
    }

    return error('Endpoint not found', 404);
  },

  // ── SCHEDULED CRON TRIGGER (Daily at 09:00 UTC) ───────────────
  async scheduled(event, env, ctx) {
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(generateDailyAIBlogPost(env));
    } else {
      await generateDailyAIBlogPost(env);
    }
  }
};

/* ═══ SEED DEFAULTS ═══════════════════════════════════════════════ */
async function seedDefaults(env) {
  await env.PORTFOLIO_DATA.put('hero', JSON.stringify(DEFAULT_HERO));
  await env.PORTFOLIO_DATA.put('about', JSON.stringify(DEFAULT_ABOUT));
  await env.PORTFOLIO_DATA.put('beliefs', JSON.stringify(DEFAULT_BELIEFS));
  await env.PORTFOLIO_DATA.put('oss', JSON.stringify(DEFAULT_OSS));
  await env.PORTFOLIO_DATA.put('tech-stack', JSON.stringify(DEFAULT_TECH_STACK));
  await env.PORTFOLIO_DATA.put('skills', JSON.stringify(DEFAULT_SKILLS));
  await env.PORTFOLIO_DATA.put('contact', JSON.stringify(DEFAULT_CONTACT));
  await env.PORTFOLIO_DATA.put('header', JSON.stringify(DEFAULT_HEADER));
  await env.PORTFOLIO_DATA.put('footer', JSON.stringify(DEFAULT_FOOTER));
  await env.PORTFOLIO_DATA.put('settings', JSON.stringify(DEFAULT_SETTINGS));
  await env.PORTFOLIO_DATA.put('theme', DEFAULT_SETTINGS.theme);

  for (const p of DEFAULT_PROJECTS) {
    await upsert(env, 'projects', p.id, p);
  }

  for (const b of DEFAULT_BLOG) {
    await upsert(env, 'blog', b.id, b);
  }
}

/* ═══ OTP AUTH ═══════════════════════════════════════════════════ */
async function sendOTP(env, respond, error) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000;
  await env.SESSIONS.put('pending_otp', JSON.stringify({ otp, expires }), { expirationTtl: 600 });

  const adminEmail = env.ADMIN_EMAIL || 'kandel.sanket@gmail.com';

  const emailRes = await sendEmail(env, {
    to: adminEmail,
    subject: `Admin Login OTP: ${otp}`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:440px;margin:0 auto;background:#09090f;color:#f1f5f9;padding:40px;border-radius:16px;border:1px solid rgba(255,255,255,0.1)">
        <div style="font-size:26px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">Sanket Kandel — Admin</div>
        <p style="color:#94a3b8;margin-bottom:28px;font-size:14px">Your one-time login verification code:</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:10px;text-align:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.35);border-radius:12px;padding:20px;font-family:monospace;color:#a78bfa;margin-bottom:20px">${otp}</div>
        <p style="color:#64748b;font-size:12px;text-align:center">Expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>`
  });

  if (!emailRes.ok) {
    return error(`Failed to send OTP email: ${emailRes.error}`);
  }
  return respond({ ok: true, message: 'OTP sent to your email' });
}

async function verifyOTP(request, env, respond, error) {
  const { code } = await request.json();
  const stored = await env.SESSIONS.get('pending_otp', { type: 'json' });
  if (!stored) return error('OTP not found or already used');
  if (Date.now() > stored.expires) return error('OTP has expired');
  if (stored.otp !== code) return error('Invalid OTP code');

  const token = crypto.randomUUID() + '-' + Date.now();
  await env.SESSIONS.put(`session:${token}`, JSON.stringify({ admin: true, created: Date.now() }), { expirationTtl: 86400 });
  await env.SESSIONS.delete('pending_otp');

  return respond({ ok: true, token });
}

/* ═══ EMAIL SENDER (Resend with automatic domain fallback) ══════ */
async function sendEmail(env, { to, subject, html }) {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      return { ok: false, error: 'RESEND_API_KEY is not set.' };
    }

    const sendWithFrom = async (fromAddress) => {
      return await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html
        })
      });
    };

    let res = await sendWithFrom('SK Admin <onboarding@resend.dev>');
    if (res.ok) return { ok: true };

    const errText = await res.text();
    let res2 = await sendWithFrom('SK Admin <noreply@sanketkandel.com.np>');
    if (res2.ok) return { ok: true };

    return { ok: false, error: errText };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

/* ═══ ANALYTICS TRACKING & AGGREGATION ═══════════════════════════ */
async function trackVisit(request, env, respond) {
  const body = await request.json().catch(() => ({}));
  const page = body.page || '/';
  const visitorId = body.visitorId || 'anon-' + Math.random().toString(36).substr(2, 9);
  const isCv = body.type === 'cv' || page === '/cv-download';
  const today = new Date().toISOString().split('T')[0];

  const dayKey = `analytics:day:${today}`;
  const dayData = await env.PORTFOLIO_DATA.get(dayKey, { type: 'json' }) || {
    views: 0,
    visitors: {},
    pages: {}
  };

  dayData.views = (dayData.views || 0) + 1;
  if (!dayData.visitors) dayData.visitors = {};
  dayData.visitors[visitorId] = true;

  if (!dayData.pages) dayData.pages = {};
  dayData.pages[page] = (dayData.pages[page] || 0) + 1;

  if (isCv) {
    await trackCvDownload(env);
  }

  await env.PORTFOLIO_DATA.put(dayKey, JSON.stringify(dayData), { expirationTtl: 90 * 86400 });
  return respond({ ok: true });
}

async function trackCvDownload(env) {
  try {
    const key = 'analytics:cv';
    const data = await env.PORTFOLIO_DATA.get(key, { type: 'json' }) || { count: 0 };
    data.count = (data.count || 0) + 1;
    await env.PORTFOLIO_DATA.put(key, JSON.stringify(data));
  } catch (e) {}
}

async function getAnalytics(env, respond) {
  const today = new Date();
  const chartLabels = [];
  const chartViews = [];
  const chartVisitors = [];
  const pageAgg = {};
  let todayViews = 0;
  let todayVisitors = 0;
  let weekViews = 0;
  let weekVisitorsSet = new Set();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    chartLabels.push(dayLabel);

    const key = `analytics:day:${dateStr}`;
    const data = await env.PORTFOLIO_DATA.get(key, { type: 'json' }) || { views: 0, visitors: {}, pages: {} };

    const views = data.views || data.count || 0;
    const vMap = data.visitors || {};
    const vCount = Object.keys(vMap).length || (views > 0 ? Math.max(1, Math.round(views * 0.75)) : 0);

    chartViews.push(views);
    chartVisitors.push(vCount);
    weekViews += views;

    Object.keys(vMap).forEach(vid => weekVisitorsSet.add(vid));

    if (i === 0) {
      todayViews = views;
      todayVisitors = vCount;
    }

    Object.entries(data.pages || {}).forEach(([pg, cnt]) => {
      pageAgg[pg] = (pageAgg[pg] || 0) + cnt;
    });
  }

  const topPages = Object.entries(pageAgg)
    .sort(([,a],[,b]) => b - a).slice(0, 5)
    .map(([name, count], _, arr) => ({
      name: name === '/' ? 'Home' : name.replace('.html','').replace('/',' ').trim() || name,
      icon: pageIcon(name),
      count,
      pct: Math.round((count / Math.max(arr[0] ? arr[0][1] : 1, 1)) * 100)
    }));

  const cvData = await env.PORTFOLIO_DATA.get('analytics:cv', { type: 'json' }) || { count: 0 };
  const messages = await getAll(env, 'messages');
  const newMessages = messages.filter(m => !m.read).length;

  let posts = await getAll(env, 'blog');
  if (!posts.length) posts = DEFAULT_BLOG;
  const recentPosts = posts.filter(p => p.status === 'published').slice(0, 4);
  const recentMessages = messages.sort((a,b) => (b.createdAt||0) - (a.createdAt||0)).slice(0, 4);

  return respond({
    today: todayViews,
    todayVisitors,
    week: weekViews,
    weekVisitors: Math.max(weekVisitorsSet.size, todayVisitors),
    cvDownloads: cvData.count,
    newMessages,
    chartLabels,
    chartData: chartViews,
    chartVisitors,
    topPages,
    recentPosts,
    recentMessages
  });
}

function pageIcon(page) {
  if (page === '/' || page.includes('index')) return 'fa-house';
  if (page.includes('project')) return 'fa-rocket';
  if (page.includes('blog')) return 'fa-pen-nib';
  if (page.includes('about')) return 'fa-user';
  if (page.includes('contact')) return 'fa-paper-plane';
  if (page.includes('skill')) return 'fa-bolt';
  return 'fa-file';
}

/* ═══ CONTACT FORM RECEIVER ══════════════════════════════════════ */
async function receiveMessage(request, env, respond) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const message = {
    id,
    name: body.name || '',
    email: body.email || '',
    subject: body.subject || '',
    message: body.message || '',
    type: body.type || '',
    read: false,
    createdAt: Date.now(),
    date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  };
  await env.PORTFOLIO_DATA.put(`msg:${id}`, JSON.stringify(message));

  const index = await env.PORTFOLIO_DATA.get('messages_index', { type: 'json' }) || [];
  index.unshift(id);
  await env.PORTFOLIO_DATA.put('messages_index', JSON.stringify(index.slice(0, 200)));

  await sendEmail(env, {
    to: env.ADMIN_EMAIL || 'kandel.sanket@gmail.com',
    subject: `Portfolio Contact: ${body.name || 'New Message'}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;background:#09090f;color:#f1f5f9;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.1)">
        <h2 style="margin-top:0;color:#a78bfa">New Message from ${body.name}</h2>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Subject:</strong> ${body.subject || '—'}</p>
        <p><strong>Type:</strong> ${body.type || '—'}</p>
        <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin-top:16px;white-space:pre-wrap">${body.message}</div>
      </div>`
  });

  return respond({ ok: true });
}

/* ═══ KV CRUD HELPERS ════════════════════════════════════════════ */
async function getAll(env, collection) {
  const index = await env.PORTFOLIO_DATA.get(`${collection}_index`, { type: 'json' }) || [];
  const items = await Promise.all(index.map(id => env.PORTFOLIO_DATA.get(`${collection}:${id}`, { type: 'json' })));
  return items.filter(Boolean);
}

async function upsert(env, collection, id, data) {
  await env.PORTFOLIO_DATA.put(`${collection}:${id}`, JSON.stringify(data));
  const index = await env.PORTFOLIO_DATA.get(`${collection}_index`, { type: 'json' }) || [];
  if (!index.includes(id)) {
    index.unshift(id);
    await env.PORTFOLIO_DATA.put(`${collection}_index`, JSON.stringify(index));
  }
}

async function deleteItem(env, collection, id) {
  await env.PORTFOLIO_DATA.delete(`${collection}:${id}`);
  const index = await env.PORTFOLIO_DATA.get(`${collection}_index`, { type: 'json' }) || [];
  await env.PORTFOLIO_DATA.put(`${collection}_index`, JSON.stringify(index.filter(i => i !== id)));
}

/* ═══ DAILY AI & TECH NEWS GENERATION ═════════════════════════════ */
async function generateDailyAIBlogPost(env) {
  // 1. Surf the internet: Fetch top trending AI stories from Hacker News
  let newsItems = [];
  try {
    const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&numericFilters=points>25', {
      headers: { 'User-Agent': 'SK-Portfolio-Bot/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      newsItems = (data.hits || []).filter(h => h.title && (h.url || h.story_text));
    }
  } catch(e) {
    console.error('Failed to fetch HN AI news:', e);
  }

  // Fallback to frontpage stories if search_by_date returned few
  if (newsItems.length < 3) {
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page', {
        headers: { 'User-Agent': 'SK-Portfolio-Bot/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        const aiKeywords = ['ai', 'llm', 'gpt', 'model', 'agent', 'neural', 'diffusion', 'robot', 'claude', 'deep', 'tech'];
        const relevant = (data.hits || []).filter(h => {
          const t = (h.title || '').toLowerCase();
          return aiKeywords.some(k => t.includes(k));
        });
        newsItems = newsItems.concat(relevant);
      }
    } catch(e) {}
  }

  if (!newsItems.length) {
    throw new Error('Unable to fetch trending tech news from the internet at this time.');
  }

  // 2. Avoid duplicates: Check against existing blog posts
  const existingPosts = await getAll(env, 'blog');
  const existingTitles = new Set(existingPosts.map(p => (p.title || '').toLowerCase()));
  const existingSlugs = new Set(existingPosts.map(p => p.slug));

  // Pick top story with highest points that hasn't been written about yet
  const chosen = newsItems
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .find(item => !existingTitles.has((item.title || '').toLowerCase())) || newsItems[0];

  const newsTitle = chosen.title.trim();
  const newsUrl = chosen.url || `https://news.ycombinator.com/item?id=${chosen.objectID}`;
  const newsPoints = chosen.points || 50;

  // 3. Synthesize article using Cloudflare Workers AI
  let generatedData = null;
  if (env.AI) {
    try {
      const systemPrompt = `You are Sanket Kandel, a Senior Full-Stack Developer and Cloud Infrastructure Architect based in Gaindakot, Nepal.
You write insightful, authoritative, and practical engineering articles for your portfolio blog.
You are covering the trending tech news story: "${newsTitle}" (Source URL: ${newsUrl}, Engagement: ${newsPoints} points on Hacker News).

Write a complete, high-quality blog post formatted as valid JSON with these exact keys:
{
  "title": "A captivating, professional engineering headline (50-80 chars)",
  "slug": "kebab-case-url-slug-based-on-title",
  "category": "AI & Machine Learning",
  "excerpt": "A sharp, engaging 2-sentence summary of the story and why it matters to developers.",
  "readTime": "4 min read",
  "tags": ["AI", "Machine Learning", "Cloud", "Architecture"],
  "content": "<p>A detailed 400-600 word breakdown with semantic HTML. Include: <h2>Why This Matters</h2>, <p>technical deep-dive, architectural context, models/systems involved</p>, <h2>Developer Implications</h2>, <p>practical takeaways for engineers</p>, <blockquote>a striking insight</blockquote>, and a link to the original source: <a href=\\"${newsUrl}\\" target=\\"_blank\\" rel=\\"noopener\\">Read the original discussion</a>.</p>"
}
IMPORTANT: Output ONLY the raw JSON object. Do not wrap in markdown code blocks.`;

      const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are an expert technical writer. You only reply with pure, valid JSON.' },
          { role: 'user', content: systemPrompt }
        ],
        max_tokens: 1800,
        temperature: 0.6
      });

      let text = (aiRes.response || '').trim();
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      }
    } catch (aiErr) {
      console.error('Workers AI generation error:', aiErr);
    }
  }

  // 4. Intelligent fallback if Workers AI returned invalid JSON or is not bound
  if (!generatedData || !generatedData.title || !generatedData.content) {
    const cleanTitle = newsTitle.replace(/Launch HN:\s*/i, '').replace(/Show HN:\s*/i, '');
    const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    generatedData = {
      title: `${cleanTitle}: Architectural Deep-Dive & What It Means for AI Engineering`,
      slug: `${baseSlug}-${Date.now().toString(36)}`,
      category: "AI & Machine Learning",
      excerpt: `Exploring the technical implications and architecture behind today's trending development: ${cleanTitle}. Here is our breakdown of what developers and cloud architects need to know.`,
      readTime: "4 min read",
      tags: ["AI", "Deep Learning", "Cloud Architecture", "Tech Trends"],
      content: `
        <p>The developer ecosystem moves fast, and today's prominent development is sparking significant discussion across the engineering community: <strong>${cleanTitle}</strong>.</p>
        <h2>Context &amp; Key Highlights</h2>
        <p>As modern distributed systems and AI applications scale, developments like this reflect a broader shift toward tighter infrastructure efficiency and specialized intelligence pipelines. Whether dealing with model inference latencies, context window throughput, or training paradigms, the implications for production environments are immediate.</p>
        <blockquote>"Engineering breakthroughs in AI are no longer just about model parameter size — they are fundamentally about inference efficiency, evaluation rigor, and developer workflows."</blockquote>
        <h2>Architectural Considerations for Engineers</h2>
        <p>For engineering teams evaluating this space, several design considerations stand out:</p>
        <ul>
          <li><strong>Latency &amp; Throughput:</strong> Balancing real-time responsiveness against computational cost.</li>
          <li><strong>Reliability &amp; Tracing:</strong> Ensuring deterministic behavior and observable error boundaries in agentic loops.</li>
          <li><strong>Integration Patterns:</strong> Decoupling model provider dependencies via unified APIs and edge routing.</li>
        </ul>
        <h2>Looking Ahead</h2>
        <p>As we continue monitoring developments around this release, we will benchmark its impact across our production workflows.</p>
        <p>For more details, explore the original source discussion: <a href="${newsUrl}" target="_blank" rel="noopener noreferrer">${newsTitle} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>.</p>
      `
    };
  }

  // Ensure unique slug
  let finalSlug = generatedData.slug || 'ai-news-' + Date.now().toString(36);
  if (existingSlugs.has(finalSlug)) {
    finalSlug += '-' + Date.now().toString(36).slice(-4);
  }

  const now = Date.now();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const newPost = {
    id: 'post-ai-' + now.toString(36),
    title: generatedData.title,
    slug: finalSlug,
    category: generatedData.category || 'AI & Machine Learning',
    excerpt: generatedData.excerpt || 'Latest developments in AI and tech infrastructure.',
    content: generatedData.content,
    status: 'published',
    featured: false,
    icon: 'fa-solid fa-brain',
    tags: Array.isArray(generatedData.tags) && generatedData.tags.length ? generatedData.tags : ['AI', 'Tech News', 'Engineering'],
    readTime: generatedData.readTime || '4 min read',
    date: dateStr,
    createdAt: now,
    sourceUrl: newsUrl
  };

  // 5. Upsert directly to KV database
  await upsert(env, 'blog', newPost.id, newPost);

  // 6. Auto-share to X (Twitter) if enabled and configured
  try {
    const creds = await getXSettings(env);
    if (creds.enabled && ((creds.apiKey && creds.accessToken) || creds.bearerToken)) {
      const tweetText = formatTweetForPost(newPost);
      const xResult = await postTweetToX(env, tweetText);
      newPost.tweetResult = xResult;
    }
  } catch (xErr) {
    console.error('Auto-share to X error:', xErr.message);
  }

  return newPost;
}

/* ═══ X (TWITTER) AUTOMATION HELPERS ══════════════════════════════ */
function rfc3986(str) {
  return encodeURIComponent(str || '').replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getXSettings(env) {
  let settings = {};
  try {
    settings = await env.PORTFOLIO_DATA.get('x_settings', { type: 'json' }) || {};
  } catch(e) {}

  return {
    enabled: settings.enabled !== false,
    apiKey: settings.apiKey || env.X_API_KEY || env.TWITTER_API_KEY || '',
    apiSecret: settings.apiSecret || env.X_API_SECRET || env.TWITTER_API_SECRET || '',
    accessToken: settings.accessToken || env.X_ACCESS_TOKEN || env.TWITTER_ACCESS_TOKEN || '',
    accessTokenSecret: settings.accessTokenSecret || env.X_ACCESS_TOKEN_SECRET || env.TWITTER_ACCESS_TOKEN_SECRET || '',
    bearerToken: settings.bearerToken || env.X_BEARER_TOKEN || env.TWITTER_BEARER_TOKEN || ''
  };
}

function formatTweetForPost(post) {
  const postUrl = `https://sanketkandel.com.np/blog-post?slug=${post.slug || post.id}`;
  const tags = (post.tags || ['AI', 'Tech', 'WebDev'])
    .slice(0, 3)
    .map(t => '#' + t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .join(' ');

  const header = `⚡ ${post.title.trim()}`;
  const footer = `\n\n🔗 Read full breakdown: ${postUrl}\n${tags}`;
  const availableExcerptLen = 270 - header.length - footer.length;

  let excerpt = (post.excerpt || '').trim();
  if (availableExcerptLen > 30) {
    if (excerpt.length > availableExcerptLen) {
      excerpt = excerpt.slice(0, availableExcerptLen - 3) + '…';
    }
    return `${header}\n\n${excerpt}${footer}`;
  } else {
    const maxTitleLen = 270 - footer.length;
    let safeTitle = post.title.trim();
    if (safeTitle.length > maxTitleLen) {
      safeTitle = safeTitle.slice(0, maxTitleLen - 3) + '…';
    }
    return `⚡ ${safeTitle}${footer}`;
  }
}

async function postTweetToX(env, tweetText) {
  const creds = await getXSettings(env);
  const hasOAuth1 = creds.apiKey && creds.apiSecret && creds.accessToken && creds.accessTokenSecret;
  const hasBearer = Boolean(creds.bearerToken);

  if (!hasOAuth1 && !hasBearer) {
    return { ok: false, skipped: true, reason: 'No X API credentials configured.' };
  }

  const endpoint = 'https://api.twitter.com/2/tweets';
  const body = JSON.stringify({ text: tweetText });

  let authHeader = '';

  if (hasOAuth1) {
    const method = 'POST';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const params = {
      oauth_consumer_key: creds.apiKey.trim(),
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: creds.accessToken.trim(),
      oauth_version: '1.0'
    };

    const sortedKeys = Object.keys(params).sort();
    const paramStr = sortedKeys.map(k => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
    const baseString = `${method}&${rfc3986(endpoint)}&${rfc3986(paramStr)}`;
    const signingKey = `${rfc3986(creds.apiSecret.trim())}&${rfc3986(creds.accessTokenSecret.trim())}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(signingKey),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(baseString));
    const signature = arrayBufferToBase64(sigBuf);
    params.oauth_signature = signature;

    const authHeaderParts = Object.keys(params).sort().map(k => `${rfc3986(k)}="${rfc3986(params[k])}"`);
    authHeader = 'OAuth ' + authHeaderParts.join(', ');
  } else {
    authHeader = `Bearer ${creds.bearerToken.trim()}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'SK-Portfolio-Bot/1.0'
    },
    body
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('X API error:', res.status, resData);
    throw new Error(resData.detail || resData.title || `X API error ${res.status}: ${JSON.stringify(resData)}`);
  }

  return { ok: true, data: resData };
}

