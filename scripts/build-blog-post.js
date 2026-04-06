#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TITLE = process.env.ISSUE_TITLE;
const BODY = process.env.ISSUE_BODY;
const ISSUE_NUM = parseInt(process.env.ISSUE_NUMBER, 10);
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseIssueBody(body) {
  const sections = {};
  const matches = [...body.matchAll(/^### (.+)$/gm)];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const val = body.slice(start, end).trim();
    sections[name] = val === '_No response_' ? '' : val;
  }
  return sections;
}

async function renderMarkdown(md) {
  const res = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: md, mode: 'gfm', context: REPO }),
  });
  if (!res.ok) throw new Error(`Markdown API error: ${res.status} ${await res.text()}`);
  return res.text();
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Shared HTML fragments
// ---------------------------------------------------------------------------

function navHTML(base) {
  return `<nav class="navbar" id="navbar">
  <div class="container">
    <a href="${base}index.html" class="nav-logo">
      <img src="${base}brand_assets/SD&G Contracting Logo.png" alt="SD&amp;G Contracting" />
    </a>
    <ul class="nav-links">
      <li><a href="${base}index.html">Home</a></li>
      <li><a href="${base}about.html">About</a></li>
      <li><a href="${base}services.html">Services</a></li>
      <li><a href="${base}projects.html">Projects</a></li>
      <li><a href="${base}blog.html">Blog</a></li>
      <li><a href="${base}financing.html">Financing</a></li>
      <li><a href="${base}contact.html">Contact</a></li>
      <li><a href="${base}merch.html">Merch</a></li>
      <li><a href="${base}book.html" class="btn btn-primary">Book Consultation</a></li>
    </ul>
    <button class="nav-toggle" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<nav class="nav-mobile">
  <a href="${base}index.html">Home</a>
  <a href="${base}about.html">About</a>
  <a href="${base}services.html">Services</a>
  <a href="${base}projects.html">Projects</a>
  <a href="${base}blog.html">Blog</a>
  <a href="${base}financing.html">Financing</a>
  <a href="${base}contact.html">Contact</a>
  <a href="${base}merch.html">Merch</a>
  <a href="${base}book.html" class="btn btn-primary">Book Consultation</a>
</nav>`;
}

function footerHTML(base) {
  const year = new Date().getFullYear();
  return `<div class="contact-strip">
  <div class="container">
    <div class="contact-strip-item">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
      613-363-9166
    </div>
    <div class="contact-strip-item">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
      Info@sdgcontracts.com
    </div>
    <div class="contact-strip-item">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
      Cornwall, Ontario
    </div>
  </div>
</div>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="${base}brand_assets/SD&G Contracting Logo.png" alt="SD&amp;G Contracting" />
        <p>Cornwall, Ontario's trusted contractor for landscaping, hardscaping, excavation, and property services since 2017.</p>
        <div class="footer-social">
          <a href="https://www.facebook.com/sdgcontract/" target="_blank" rel="noopener" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/sdgcontracts/" target="_blank" rel="noopener" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <ul>
          <li><a href="${base}index.html">Home</a></li>
          <li><a href="${base}about.html">About Us</a></li>
          <li><a href="${base}services.html">Services</a></li>
          <li><a href="${base}projects.html">Projects</a></li>
          <li><a href="${base}blog.html">Blog</a></li>
          <li><a href="${base}book.html">Book Consultation</a></li>
          <li><a href="${base}financing.html">Financing</a></li>
          <li><a href="${base}merch.html">Merch</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <ul>
          <li><a href="${base}services.html#landscaping">Landscaping</a></li>
          <li><a href="${base}services.html#hardscaping">Hardscaping</a></li>
          <li><a href="${base}services.html#excavation">Excavation</a></li>
          <li><a href="${base}services.html#snow">Snow Removal</a></li>
          <li><a href="${base}services.html#fencing">Fencing</a></li>
          <li><a href="${base}services.html#concrete">Concrete</a></li>
          <li><a href="${base}services.html#maintenance">Property Maintenance</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <div class="footer-contact-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
          <a href="tel:6133639166">613-363-9166</a>
        </div>
        <div class="footer-contact-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
          <a href="mailto:Info@sdgcontracts.com">Info@sdgcontracts.com</a>
        </div>
        <div class="footer-contact-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          <span>406-841 Sydney St, Unit 7<br />Cornwall, Ontario K6H 7L2</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${year} SD&amp;G Contracting. All rights reserved.</p>
      <div class="footer-bottom-links">
        <a href="${base}contact.html">Contact</a>
        <a href="${base}book.html">Book Online</a>
      </div>
    </div>
  </div>
</footer>`;
}

// ---------------------------------------------------------------------------
// Page generators
// ---------------------------------------------------------------------------

function postPageHTML(title, dateStr, contentHTML, image, excerpt) {
  const base = '../../';
  const titleEsc = escapeHTML(title);
  const excerptEsc = escapeHTML(excerpt);
  const heroStyle = image ? `background-image: url('${image}');` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleEsc} | SD&amp;G Contracting Blog</title>
  <meta name="description" content="${excerptEsc}" />
  <link rel="stylesheet" href="${base}css/style.css" />
  <link rel="icon" type="image/png" href="${base}brand_assets/SD&G Contracting Logo.png" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${titleEsc}" />
  <meta property="og:description" content="${excerptEsc}" />
${image ? `  <meta property="og:image" content="${image}" />\n` : ''}</head>
<body>

${navHTML(base)}

<section class="page-hero">
  <div class="page-hero-bg" style="${heroStyle}"></div>
  <div class="page-hero-overlay"></div>
  <div class="container page-hero-content">
    <span class="page-hero-label">${dateStr}</span>
    <h1 class="page-hero-title">${titleEsc}</h1>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="blog-article">
      <a href="${base}blog.html" class="blog-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Blog
      </a>
      <div class="blog-article-content">
${contentHTML}
      </div>
      <a href="${base}blog.html" class="blog-back" style="margin-top: 48px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Blog
      </a>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>Ready to Start Your <span>Next Project?</span></h2>
    <p>Book your free consultation today. We'll assess your property, discuss your vision, and deliver a no-obligation estimate.</p>
    <div class="cta-buttons">
      <a href="${base}book.html" class="btn btn-primary btn-lg">Book a Free Consultation</a>
      <a href="tel:6133639166" class="btn btn-outline btn-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
        Call 613-363-9166
      </a>
    </div>
  </div>
</section>

${footerHTML(base)}

<script src="${base}js/main.js"></script>
</body>
</html>`;
}

function blogCardHTML(post) {
  const titleEsc = escapeHTML(post.title);
  const excerptEsc = escapeHTML(post.excerpt);
  const dateStr = formatDate(new Date(post.date));
  const imgTag = post.featuredImage
    ? `<img class="blog-card-img" src="${post.featuredImage}" alt="${titleEsc}" loading="lazy" />`
    : '<div class="blog-card-img blog-card-img--placeholder"></div>';

  return `      <a href="blog/posts/${post.slug}.html" class="blog-card fade-up">
        ${imgTag}
        <div class="blog-card-body">
          <div class="blog-card-date">${dateStr}</div>
          <h3 class="blog-card-title">${titleEsc}</h3>
          <p class="blog-card-excerpt">${excerptEsc}</p>
          <span class="blog-card-link">
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </div>
      </a>`;
}

function listingPageHTML(posts) {
  const cardsHTML = posts.map((p) => blogCardHTML(p)).join('\n\n');
  const emptyHTML = `      <div class="text-center" style="padding: 60px 0;">
        <p class="section-subtitle" style="margin: 0 auto;">No blog posts yet. Check back soon!</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog | SD&amp;G Contracting</title>
  <meta name="description" content="Tips, insights, and project updates from SD&amp;G Contracting — Cornwall Ontario's trusted contractor." />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="icon" type="image/png" href="brand_assets/SD&G Contracting Logo.png" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="https://www.sdgcontracts.com/blog" />
  <meta property="og:locale" content="en_CA" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Blog | SD&amp;G Contracting" />
  <meta property="og:description" content="Tips, insights, and project updates from SD&amp;G Contracting — Cornwall Ontario's trusted contractor." />
  <meta property="og:url" content="https://www.sdgcontracts.com/blog" />
</head>
<body>

${navHTML('')}

<section class="page-hero">
  <div class="page-hero-bg" style="background-image: url('https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1800&q=80');"></div>
  <div class="page-hero-overlay"></div>
  <div class="container page-hero-content">
    <span class="page-hero-label">SD&amp;G Contracting</span>
    <h1 class="page-hero-title">Our Blog</h1>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="text-center fade-up">
      <span class="section-label">Latest Posts</span>
      <h2 class="section-title">Tips, Updates &amp; Insights</h2>
      <div class="divider divider--center"></div>
      <p class="section-subtitle">Stay up to date with the latest from SD&amp;G Contracting — project highlights, seasonal tips, and industry insights.</p>
    </div>

    <div class="blog-grid" style="margin-top: 56px;">
${posts.length > 0 ? cardsHTML : emptyHTML}
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>Ready to Start Your <span>Next Project?</span></h2>
    <p>Book your free consultation today. We'll assess your property, discuss your vision, and deliver a no-obligation estimate.</p>
    <div class="cta-buttons">
      <a href="book.html" class="btn btn-primary btn-lg">Book a Free Consultation</a>
      <a href="tel:6133639166" class="btn btn-outline btn-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
        Call 613-363-9166
      </a>
    </div>
  </div>
</section>

${footerHTML('')}

<script src="js/main.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const parsed = parseIssueBody(BODY);
  const content = parsed['Blog Post Content'] || '';
  const image = parsed['Featured Image URL (optional)'] || '';
  const excerpt = parsed['Short Description'] || '';

  if (!content) {
    console.error('No blog post content found in the issue body.');
    process.exit(1);
  }

  const slug = slugify(TITLE);
  const now = new Date();
  const dateStr = formatDate(now);

  console.log(`Building blog post: "${TITLE}" (${slug})`);

  const contentHTML = await renderMarkdown(content);

  const postsDir = path.join(ROOT, 'blog', 'posts');
  fs.mkdirSync(postsDir, { recursive: true });

  fs.writeFileSync(
    path.join(postsDir, `${slug}.html`),
    postPageHTML(TITLE, dateStr, contentHTML, image, excerpt)
  );

  const manifestPath = path.join(ROOT, 'blog', 'posts.json');
  let posts = [];
  try {
    posts = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {}
  posts = posts.filter((p) => p.issueNumber !== ISSUE_NUM);
  posts.unshift({
    title: TITLE,
    slug,
    excerpt,
    featuredImage: image,
    date: now.toISOString(),
    issueNumber: ISSUE_NUM,
  });
  fs.writeFileSync(manifestPath, JSON.stringify(posts, null, 2));

  fs.writeFileSync(path.join(ROOT, 'blog.html'), listingPageHTML(posts));

  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) fs.appendFileSync(outputFile, `slug=${slug}\n`);

  console.log(`Published: /blog/posts/${slug}`);
  console.log('Updated: /blog.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
