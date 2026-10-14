#!/usr/bin/env node
// Growth Guru [GGA] website builder.
// Uses ONLY Node.js built-ins (no npm install needed). Run:  node build.mjs
// Reads site.config.json + src/ and writes the finished website to dist/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const warnings = [];
const warn = (msg) => warnings.push(msg);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function loadConfig() {
  const file = join(ROOT, 'site.config.json');
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`\n  site.config.json could not be read: ${err.message}\n  Tip: check for a missing comma or quote near the line mentioned above.\n`);
    process.exit(1);
  }
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  cfg.siteUrl = str(cfg.siteUrl).replace(/\/+$/, '');
  if (cfg.siteUrl && !/^https?:\/\//.test(cfg.siteUrl)) {
    warn(`siteUrl "${cfg.siteUrl}" should start with https:// (ignored for now).`);
    cfg.siteUrl = '';
  }
  cfg.email = str(cfg.email);
  cfg.responseTime = str(cfg.responseTime) || 'Within 24 business hours (Mon–Fri)';
  cfg.calendlyUrl = str(cfg.calendlyUrl);
  if (cfg.calendlyUrl && !/^https:\/\//.test(cfg.calendlyUrl)) {
    warn(`calendlyUrl "${cfg.calendlyUrl}" should start with https:// (ignored for now).`);
    cfg.calendlyUrl = '';
  }
  cfg.formspreeId = str(cfg.formspreeId).replace(/^https?:\/\/formspree\.io\/f\//, '');
  if (cfg.formspreeId && !/^[A-Za-z0-9]+$/.test(cfg.formspreeId)) {
    warn(`formspreeId "${cfg.formspreeId}" doesn't look right (letters and numbers only, e.g. "xyzabcde"). Ignored for now.`);
    cfg.formspreeId = '';
  }
  const socials = cfg.socials || {};
  cfg.socials = {};
  for (const key of ['instagram', 'tiktok', 'facebook', 'linkedin', 'x']) {
    const v = str(socials[key]);
    if (v && !/^https?:\/\//.test(v)) warn(`socials.${key} should be a full link starting with https:// (ignored).`);
    else if (v) cfg.socials[key] = v;
  }
  cfg.pricing = cfg.pricing || {};
  return cfg;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Icons (inline SVG, 24x24 stroke icons)
// ---------------------------------------------------------------------------
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  sparkles: '<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.2l-1.8-5.5-5.7-1.9L10.2 9z"/><path d="M19 3v4M21 5h-4M5 17v3M6.5 18.5h-3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  sliders: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  megaphone: '<path d="m3 11 16-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/><path d="M19 9.5a2.5 2.5 0 0 1 0 5"/>',
  play: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  monitor: '<rect x="2" y="3.5" width="20" height="13.5" rx="2"/><path d="M8 21h8M12 17v4"/>',
  funnel: '<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
  globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  compass: '<circle cx="12" cy="12" r="9.5"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  'pen-tool': '<path d="m12 19 7-7 3 3-7 7z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.6-4.6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  headset: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2.5"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  file: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-4"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  instagram: '<rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none"/>',
  tiktok: '<path d="M9.5 11.5a4.2 4.2 0 1 0 4.2 4.2V2.8c.6 2.7 2.8 4.9 5.8 5.2"/>',
  facebook: '<path d="M17.5 2.5H15a5 5 0 0 0-5 5v3H7v4h3v7h4v-7h3l1-4h-4v-3a1 1 0 0 1 1-1h3.5z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  'x-logo': '<path d="M4 4l11.7 16H20L8.3 4z"/><path d="M4 20l6.8-6.8M13.2 10.8 20 4"/>',
};

function icon(name, cls = '') {
  const body = ICONS[name];
  if (!body) {
    warn(`Unknown icon "${name}"`);
    return '';
  }
  return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// ---------------------------------------------------------------------------
// Markdown (small, safe subset)
// ---------------------------------------------------------------------------
function safeUrl(url) {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(u)) return u;
  if (/^[\w.-]+(\/[\w./-]*)?$/.test(u) && !/^javascript/i.test(u)) return u; // relative path
  return '#';
}

function mdInline(text) {
  let out = esc(text);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" decoding="async">`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const u = safeUrl(url);
    const external = /^https?:\/\//i.test(u);
    return `<a href="${u}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  out = out.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\w)/g, '$1<em>$2</em>');
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  return out;
}

function markdown(src, ids = new Set()) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let para = [];
  let i = 0;
  const flush = () => {
    if (para.length) out.push(`<p>${mdInline(para.join(' '))}</p>`);
    para = [];
  };
  const ulRe = /^\s*[-*+]\s+/;
  const olRe = /^\s*(\d+)[.)]\s+/;
  const nextNonBlank = (j) => {
    while (j < lines.length && !lines[j].trim()) j++;
    return j;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/))) {
      flush();
      const level = Math.max(2, m[1].length); // the page title is the only h1
      let id = slugify(m[2]) || 'section';
      while (ids.has(id)) id += '-x';
      ids.add(id);
      out.push(`<h${level} id="${id}">${mdInline(m[2])}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush();
      out.push('<hr>');
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      flush();
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${markdown(buf.join('\n'), ids)}</blockquote>`);
      continue;
    }
    const isUl = ulRe.test(line);
    const olm = line.match(olRe);
    if (isUl || olm) {
      flush();
      const re = isUl ? ulRe : olRe;
      const items = [];
      while (i < lines.length) {
        if (!lines[i].trim()) {
          const j = nextNonBlank(i);
          if (j < lines.length && re.test(lines[j])) {
            i = j;
            continue;
          }
          break;
        }
        if (!re.test(lines[i])) break;
        let item = lines[i].replace(re, '');
        i++;
        while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !ulRe.test(lines[i]) && !olRe.test(lines[i])) {
          item += ' ' + lines[i].trim();
          i++;
        }
        items.push(`<li>${mdInline(item)}</li>`);
      }
      if (isUl) out.push(`<ul>${items.join('')}</ul>`);
      else {
        const start = Number(olm[1]);
        out.push(`<ol${start !== 1 ? ` start="${start}"` : ''}>${items.join('')}</ol>`);
      }
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------
function parseValue(v) {
  if (/^".*"$/.test(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function parseFrontMatter(raw, file) {
  const m = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) throw new Error(`${file}: missing front matter (--- block at the top)`);
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const mm = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (mm) data[mm[1]] = parseValue(mm[2].trim());
  }
  return { data, body: raw.slice(m[0].length) };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------
const CATEGORIES = {
  instagram: { label: 'Instagram growth', short: 'Instagram', icon: 'instagram', blurb: 'Content, Reels and profile tips that bring followers who actually buy.' },
  tiktok: { label: 'TikTok growth', short: 'TikTok', icon: 'tiktok', blurb: 'Hooks, formats and short videos people watch to the end.' },
  facebook: { label: 'Facebook marketing', short: 'Facebook', icon: 'facebook', blurb: 'Pages, groups and ads that still work for real businesses.' },
  'ai-marketing': { label: 'AI & digital marketing', short: 'AI & marketing', icon: 'cpu', blurb: 'Use AI to plan faster, test more and spend smarter.' },
  'branding-web': { label: 'Branding & web design', short: 'Branding & web', icon: 'palette', blurb: 'Look consistent everywhere and build pages that convert.' },
};

function loadPosts() {
  const dir = join(SRC, 'content', 'blog');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
  const posts = [];
  for (const f of files) {
    const raw = readFileSync(join(dir, f), 'utf8');
    let fm;
    try {
      fm = parseFrontMatter(raw, `src/content/blog/${f}`);
    } catch (err) {
      warn(err.message + ' (post skipped)');
      continue;
    }
    const d = fm.data;
    const slug = slugify(d.slug || f.replace(/\.md$/, ''));
    if (!d.title) {
      warn(`src/content/blog/${f}: missing "title" (post skipped)`);
      continue;
    }
    if (d.draft === true) continue;
    const category = CATEGORIES[d.category] ? d.category : 'ai-marketing';
    if (!CATEGORIES[d.category]) warn(`src/content/blog/${f}: unknown category "${d.category}", using ai-marketing`);
    let body = fm.body.replace(/^\s*#\s+.+\n/, ''); // drop a duplicate "# Title" line
    const words = body.split(/\s+/).filter(Boolean).length;
    posts.push({
      file: f,
      slug,
      title: String(d.title),
      category,
      categoryLabel: String(d.categoryLabel || CATEGORIES[category].label),
      excerpt: String(d.excerpt || ''),
      date: String(d.date || '2026-01-01'),
      readMinutes: Number(d.readMinutes) || Math.max(1, Math.round(words / 220)),
      cover: String(d.cover || `/assets/img/blog/${slug}.svg`),
      featured: d.featured === true,
      author: String(d.author || 'GGA Editorial Team'),
      html: markdown(body),
      url: `/blog/${slug}/`,
    });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title)));
  return posts;
}

function postCard(p, { size = 'md', headingLevel = 3, lazy = true } = {}) {
  const h = `h${headingLevel}`;
  const search = `${p.title} ${p.excerpt} ${p.categoryLabel} ${CATEGORIES[p.category].label}`.toLowerCase();
  return `<article class="post-card post-card--${size}" data-category="${esc(p.category)}" data-search="${esc(search)}">
  <a class="post-card__link" href="${p.url}">
    <div class="post-card__media"><img src="${esc(p.cover)}" alt="" width="1200" height="675"${lazy ? ' loading="lazy"' : ''} decoding="async"></div>
    <div class="post-card__body">
      <span class="tag">${esc(p.categoryLabel)}</span>
      <${h} class="post-card__title">${esc(p.title)}</${h}>
      <p class="post-card__excerpt">${esc(p.excerpt)}</p>
      <span class="post-card__meta"><time datetime="${esc(p.date)}">${formatDate(p.date)}</time><span aria-hidden="true">·</span>${p.readMinutes} min read<span class="post-card__arrow">${icon('arrow-up-right')}</span></span>
    </div>
  </a>
</article>`;
}

// ---------------------------------------------------------------------------
// Blocks used by pages: {{block:name}}
// ---------------------------------------------------------------------------
const SOCIAL_META = {
  instagram: { label: 'Instagram', icon: 'instagram' },
  tiktok: { label: 'TikTok', icon: 'tiktok' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  x: { label: 'X (Twitter)', icon: 'x-logo' },
};

const NAV = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'services', href: '/services/', label: 'Services' },
  { key: 'work', href: '/work/', label: 'Work' },
  { key: 'pricing', href: '/pricing/', label: 'Pricing' },
  { key: 'blog', href: '/blog/', label: 'Blog' },
  { key: 'contact', href: '/contact/', label: 'Contact' },
];

const SERVICES = [
  { id: 'ai-marketing', name: 'AI-Powered Digital Marketing', short: 'AI-powered marketing' },
  { id: 'social-media', name: 'Social Media Management & Content Creation', short: 'Social media & content' },
  { id: 'web-design', name: 'Website Design & Development', short: 'Website design' },
  { id: 'lead-generation', name: 'Lead Generation & Conversion Strategy', short: 'Lead generation' },
  { id: 'branding', name: 'Branding & Creative Design', short: 'Branding & design' },
];

function bookAttrs(cfg, page, { plan = '', service = '' } = {}) {
  if (cfg.calendlyUrl) return `href="${esc(cfg.calendlyUrl)}" data-calendly target="_blank" rel="noopener"`;
  if (page.nav === 'contact') return 'href="#contact-form" data-focus-form';
  const qs = plan ? `?plan=${encodeURIComponent(plan)}` : service ? `?service=${encodeURIComponent(service)}` : '';
  return `href="/contact/${qs}"`;
}

function pricePanel(cfg, page, plans, key) {
  if (!Array.isArray(plans) || plans.length === 0) {
    const name = key === 'yearly' ? 'Yearly deals' : 'Lifetime package';
    return `<div class="quote-panel glass" data-reveal>
  <div class="quote-panel__icon">${icon(key === 'yearly' ? 'calendar' : 'gift')}</div>
  <div class="quote-panel__body">
    <span class="eyebrow">${name}</span>
    <h3>Annual and lifetime packages are quoted on a short call.</h3>
    <p>Tell us what you need for the year (or for good) and we'll put together a clear package with fixed deliverables. No lock-in, no surprises.</p>
  </div>
  <div class="quote-panel__actions">
    <a class="btn btn--primary" ${bookAttrs(cfg, page)}>Book a free strategy call ${icon('arrow-right')}</a>
    <a class="btn btn--ghost" href="mailto:${esc(cfg.email)}?subject=${encodeURIComponent(name + ' quote')}">Email us instead</a>
  </div>
</div>`;
  }
  const cur = esc(cfg.pricing.currency || '$');
  const cards = plans.map((p, i) => {
    const numeric = /^\d[\d,.]*$/.test(String(p.price ?? '').trim());
    const price = numeric
      ? `<span class="plan__currency">${cur}</span><span class="plan__amount">${esc(p.price)}</span><span class="plan__period">${esc(p.period || '')}</span>`
      : `<span class="plan__amount plan__amount--text">${esc(p.price || 'Custom pricing')}</span>`;
    const feats = (p.features || []).map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('');
    const hl = p.highlight === true;
    const id = slugify(p.id || p.name || `plan-${i}`);
    return `<article class="plan${hl ? ' plan--highlight' : ''}" data-reveal style="--d:${i}" aria-labelledby="plan-${key}-${id}">
  <div class="plan__top">
    <h3 class="plan__name" id="plan-${key}-${id}">${esc(p.name)}</h3>
    ${p.badge ? `<span class="plan__badge">${esc(p.badge)}</span>` : ''}
  </div>
  <p class="plan__price">${price}</p>
  <p class="plan__tagline">${esc(p.tagline || '')}</p>
  <ul class="plan__features">${feats}</ul>
  <a class="btn ${hl ? 'btn--primary' : 'btn--ghost'} btn--block" ${bookAttrs(cfg, page, { plan: id })}>${esc(p.button || 'Get started')}</a>
</article>`;
  });
  return `<div class="plans">${cards.join('\n')}</div>`;
}

function socialLinks(cfg, cls = 'socials') {
  const items = Object.entries(cfg.socials).map(
    ([k, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${SOCIAL_META[k].label} (opens in a new tab)">${icon(SOCIAL_META[k].icon)}</a></li>`,
  );
  return items.length ? `<ul class="${cls}">${items.join('')}</ul>` : '';
}

function makeBlocks(cfg, posts) {
  const featured = [...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured)].slice(0, 3);
  const counts = {};
  for (const p of posts) counts[p.category] = (counts[p.category] || 0) + 1;

  return {
    nav: (ctx) =>
      `<ul class="nav__list">${NAV.map(
        (n) => `<li><a class="nav__link" href="${n.href}"${ctx.page.nav === n.key ? ' aria-current="page"' : ''}>${n.label}</a></li>`,
      ).join('')}</ul>`,
    'mobile-nav': (ctx) =>
      `<ul class="mobile-menu__list">${NAV.map(
        (n, i) => `<li style="--i:${i}"><a href="${n.href}"${ctx.page.nav === n.key ? ' aria-current="page"' : ''}>${n.label}${icon('arrow-right')}</a></li>`,
      ).join('')}</ul>`,
    socials: () => socialLinks(cfg),
    'footer-services': () =>
      `<ul>${SERVICES.map((s) => `<li><a href="/services/#${s.id}">${esc(s.short)}</a></li>`).join('')}</ul>`,
    'pricing-monthly': (ctx) => pricePanel(cfg, ctx.page, cfg.pricing.monthly, 'monthly'),
    'pricing-yearly': (ctx) => pricePanel(cfg, ctx.page, cfg.pricing.yearly, 'yearly'),
    'pricing-lifetime': (ctx) => pricePanel(cfg, ctx.page, cfg.pricing.lifetime, 'lifetime'),
    'service-options': () =>
      [...SERVICES.map((s) => `<option value="${esc(s.name)}" data-key="${s.id}">${esc(s.name)}</option>`), '<option value="Not sure yet" data-key="not-sure">Not sure yet</option>'].join(''),
    'form-attrs': () => {
      const plans = {};
      for (const p of cfg.pricing.monthly || []) {
        const numeric = /^\d[\d,.]*$/.test(String(p.price ?? '').trim());
        plans[slugify(p.id || p.name)] = `${p.name}${numeric ? ` (${cfg.pricing.currency || '$'}${p.price}${p.period || ''})` : ''}`;
      }
      const endpoint = cfg.formspreeId ? `https://formspree.io/f/${cfg.formspreeId}` : '';
      const base = endpoint
        ? `action="${endpoint}" method="POST" data-endpoint="${endpoint}"`
        : `action="mailto:${esc(cfg.email)}" method="POST" enctype="text/plain" data-endpoint=""`;
      return `${base} data-email="${esc(cfg.email)}" data-plans="${esc(JSON.stringify(plans))}"`;
    },
    'blog-topics': () =>
      Object.entries(CATEGORIES)
        .map(
          ([k, c], i) => `<a class="topic-card glow-card" href="#latest" data-topic="${k}" data-reveal style="--d:${i}">
  <span class="topic-card__icon">${icon(c.icon)}</span>
  <span class="topic-card__title">${esc(c.label)}</span>
  <span class="topic-card__text">${esc(c.blurb)}</span>
  <span class="topic-card__count">${counts[k] || 0} ${counts[k] === 1 ? 'article' : 'articles'}${icon('arrow-right')}</span>
</a>`,
        )
        .join('\n'),
    'blog-featured': () => {
      if (!featured.length) return '<p class="empty-note">New articles are on the way.</p>';
      const [first, ...rest] = featured;
      return `<div class="featured-grid">
  <div class="featured-grid__main" data-reveal>${postCard(first, { size: 'lg', lazy: false })}</div>
  <div class="featured-grid__side">${rest.map((p, i) => `<div data-reveal style="--d:${i + 1}">${postCard(p, { size: 'sm' })}</div>`).join('')}</div>
</div>`;
    },
    'blog-filters': () =>
      `<button type="button" class="chip" data-filter="all" aria-pressed="true">All</button>` +
      Object.entries(CATEGORIES)
        .map(([k, c]) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="false">${esc(c.short)}</button>`)
        .join(''),
    'blog-grid': () => posts.map((p) => `<div class="post-grid__item" data-post data-category="${esc(p.category)}">${postCard(p)}</div>`).join('\n'),
    'blog-count': () => String(posts.length),
    'blog-hero-cards': () => {
      const pick = featured.length ? featured : [{ categoryLabel: 'Instagram growth', title: 'Content that turns followers into customers' }];
      return pick
        .slice(0, 3)
        .map(
          (p, i) => `<div class="ed-card ed-card--${i + 1}">
  <div class="ed-card__media"></div>
  <span class="ed-card__tag">${esc(p.categoryLabel)}</span>
  <span class="ed-card__title">${esc(p.title)}</span>
  <span class="ed-card__lines"><i></i><i></i></span>
</div>`,
        )
        .join('');
    },
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function render(tpl, ctx, blocks, file) {
  // {{#if key}} ... {{else}} ... {{/if}}  (not nested)
  tpl = tpl.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, key, yes, no = '') => {
    const v = getPath(ctx, key);
    const truthy = v && (typeof v !== 'object' || Object.keys(v).length > 0);
    return truthy ? yes : no;
  });
  return tpl.replace(/\{\{\s*([\w.:-]+)\s*\}\}/g, (m, key) => {
    if (key.startsWith('icon:')) return icon(key.slice(5));
    if (key === 'book') return bookAttrs(ctx.site, ctx.page);
    if (key.startsWith('book:')) {
      const [kind, val] = key.slice(5).split(':');
      return bookAttrs(ctx.site, ctx.page, kind === 'plan' ? { plan: val } : { service: val });
    }
    if (key.startsWith('block:')) {
      const fn = blocks[key.slice(6)];
      if (!fn) throw new Error(`${file}: unknown block {{${key}}}`);
      return fn(ctx);
    }
    const v = getPath(ctx, key);
    if (v === undefined) throw new Error(`${file}: unknown placeholder {{${key}}}`);
    return esc(v);
  });
}

function parsePage(raw, file) {
  const m = raw.match(/^\s*<!--page\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--page { ... } --> header`);
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (err) {
    throw new Error(`${file}: page header is not valid JSON (${err.message})`);
  }
  return { meta, body: raw.slice(m[0].length) };
}

// ---------------------------------------------------------------------------
// Head / SEO
// ---------------------------------------------------------------------------
const INLINE_SCRIPT =
  "(function(d){d.classList.add('js');setTimeout(function(){if(!d.classList.contains('ready'))d.classList.remove('js')},4000)})(document.documentElement);";

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

function headMeta(cfg, page) {
  const abs = (p) => (cfg.siteUrl ? cfg.siteUrl + p : p);
  const out = [];
  const ogImage = abs('/og.png');
  if (cfg.siteUrl && page.path) {
    out.push(`<link rel="canonical" href="${esc(abs(page.path))}">`);
    out.push(`<meta property="og:url" content="${esc(abs(page.path))}">`);
  }
  if (page.noindex) out.push('<meta name="robots" content="noindex">');
  out.push(
    `<meta property="og:type" content="${page.ogType || 'website'}">`,
    `<meta property="og:site_name" content="Growth Guru Agency">`,
    `<meta property="og:title" content="${esc(page.ogTitle || page.fullTitle)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:image" content="${esc(ogImage)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Growth Guru Agency — social media and digital marketing">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(page.ogTitle || page.fullTitle)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${esc(ogImage)}">`,
  );
  if (page.article) {
    out.push(`<meta property="article:published_time" content="${esc(page.article.date)}">`);
    out.push(`<meta property="article:section" content="${esc(page.article.categoryLabel)}">`);
  }
  return out.join('\n');
}

function structuredData(cfg, page, posts) {
  const abs = (p) => (cfg.siteUrl ? cfg.siteUrl + p : undefined);
  if (page.nav === 'home') {
    const org = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Growth Guru Agency',
      alternateName: ['GGA', 'Growth Guru'],
      description: 'Social media and digital marketing agency for businesses, brands and creators. Social media management, content creation, website design, paid ads, lead generation and branding.',
      email: cfg.email,
      areaServed: 'Worldwide',
      knowsAbout: SERVICES.map((s) => s.name),
    };
    if (cfg.siteUrl) {
      org.url = cfg.siteUrl + '/';
      org.logo = cfg.siteUrl + '/apple-touch-icon.png';
      org.image = cfg.siteUrl + '/og.png';
    }
    const same = Object.values(cfg.socials);
    if (same.length) org.sameAs = same;
    return jsonLd(org);
  }
  if (page.article) {
    const p = page.article;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      datePublished: p.date,
      dateModified: p.date,
      articleSection: p.categoryLabel,
      author: { '@type': 'Organization', name: p.author === 'GGA Editorial Team' ? 'Growth Guru Agency (GGA)' : p.author },
      publisher: { '@type': 'Organization', name: 'Growth Guru Agency' },
    };
    if (cfg.siteUrl) {
      data.mainEntityOfPage = abs(p.url);
      data.url = abs(p.url);
      data.image = abs(p.cover);
      data.publisher.logo = { '@type': 'ImageObject', url: abs('/apple-touch-icon.png') };
    }
    return jsonLd(data);
  }
  return '';
}

// ---------------------------------------------------------------------------
// Article page body
// ---------------------------------------------------------------------------
function articleBody(cfg, post, posts) {
  const same = posts.filter((p) => p !== post && p.category === post.category);
  const others = posts.filter((p) => p !== post && p.category !== post.category);
  const related = [...same, ...others].slice(0, 3);
  const cat = CATEGORIES[post.category];
  return `<article class="article">
  <header class="article__hero">
    <div class="container container--narrow">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/blog/">Growth Hub</a></li><li><a href="/blog/#latest" data-topic-link="${post.category}">${esc(cat.label)}</a></li></ol></nav>
      <span class="tag">${icon(cat.icon)}${esc(post.categoryLabel)}</span>
      <h1 class="article__title">${esc(post.title)}</h1>
      ${post.excerpt ? `<p class="article__lede">${esc(post.excerpt)}</p>` : ''}
      <div class="article__meta">
        <span class="article__author"><img src="/assets/img/logo-mark.svg" alt="" width="28" height="28">${esc(post.author)}</span>
        <span><time datetime="${esc(post.date)}">${formatDate(post.date)}</time></span>
        <span>${post.readMinutes} min read</span>
      </div>
    </div>
  </header>
  <figure class="article__cover container">
    <img src="${esc(post.cover)}" alt="" width="1200" height="675" fetchpriority="high" decoding="async">
  </figure>
  <div class="container container--narrow">
    <div class="prose">
${post.html}
    </div>
    <aside class="cta-box glass" aria-label="Work with us">
      <span class="eyebrow">Want help with this?</span>
      <h2>Let us put this into practice for your brand.</h2>
      <p>Book a free strategy call. We'll look at where you are now and suggest the next few steps, with no lock-in contracts.</p>
      <div class="cta-box__actions">
        <a class="btn btn--primary" ${bookAttrs(cfg, { nav: 'blog' })}>Book a free strategy call ${icon('arrow-right')}</a>
        <a class="btn btn--ghost" href="/services/">See our services</a>
      </div>
    </aside>
  </div>
</article>
${
  related.length
    ? `<section class="section section--tight related" aria-labelledby="keep-reading">
  <div class="container">
    <div class="section-head section-head--row">
      <div><span class="eyebrow">[ Growth Hub ]</span><h2 id="keep-reading">Keep reading</h2></div>
      <a class="link-arrow" href="/blog/">All articles ${icon('arrow-right')}</a>
    </div>
    <div class="post-grid">${related.map((p, i) => `<div class="post-grid__item" data-reveal style="--d:${i}">${postCard(p)}</div>`).join('')}</div>
  </div>
</section>`
    : ''
}`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
function build() {
  const started = Date.now();
  const cfg = loadConfig();
  const posts = loadPosts();
  const blocks = makeBlocks(cfg, posts);

  const partial = (name) => readFileSync(join(SRC, 'partials', `${name}.html`), 'utf8');
  const headTpl = partial('head');
  const headerTpl = partial('header');
  const footerTpl = partial('footer');

  // 1) fresh dist + assets
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  const assetHashes = new Map();
  let assetBytes = 0;
  for (const file of walk(join(SRC, 'assets'))) {
    const rel = relative(SRC, file).split(sep).join('/');
    const dest = join(DIST, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(file, dest);
    const buf = readFileSync(file);
    assetBytes += buf.length;
    assetHashes.set('/' + rel, hash(buf).slice(0, 8));
  }
  for (const file of walk(join(SRC, 'static'))) {
    const rel = relative(join(SRC, 'static'), file).split(sep).join('/');
    writeFile(join(DIST, rel), readFileSync(file));
  }
  if (existsSync(join(SRC, 'assets', 'img', 'favicon.svg'))) copyFileSync(join(SRC, 'assets', 'img', 'favicon.svg'), join(DIST, 'favicon.svg'));

  const versioned = (html, outFile) =>
    html.replace(/(href|src|content)="(\/assets\/[^"?#]+)"/g, (m, attr, p) => {
      if (/\.woff2?$/.test(p)) return m; // fonts are also referenced from CSS; keep one URL
      const h = assetHashes.get(p);
      if (!h) {
        warn(`${outFile}: references missing file ${p}`);
        return m;
      }
      return attr === 'content' ? m : `${attr}="${p}?v=${h}"`;
    });

  // 2) pages
  const pages = [];
  const pageDir = join(SRC, 'pages');
  for (const f of readdirSync(pageDir).filter((x) => x.endsWith('.html')).sort()) {
    const { meta, body } = parsePage(readFileSync(join(pageDir, f), 'utf8'), `src/pages/${f}`);
    const name = f.replace(/\.html$/, '');
    const out = name === 'index' ? 'index.html' : name === '404' ? '404.html' : `${name}/index.html`;
    const path = name === 'index' ? '/' : name === '404' ? null : `/${name}/`;
    pages.push({ ...meta, file: `src/pages/${f}`, out, path: meta.noindex ? meta.path ?? null : path, body });
  }
  for (const p of posts) {
    pages.push({
      title: p.title,
      description: p.excerpt || `${p.title}: a practical guide from Growth Guru Agency.`,
      nav: 'blog',
      bodyClass: 'page-article',
      ogType: 'article',
      article: p,
      file: `src/content/blog/${p.file}`,
      out: `blog/${p.slug}/index.html`,
      path: p.url,
      body: articleBody(cfg, p, posts),
    });
  }

  const inlineHash = createHash('sha256').update(INLINE_SCRIPT).digest('base64');
  const written = [];
  for (const page of pages) {
    page.fullTitle = page.fullTitleOverride || (page.nav === 'home' ? page.title : `${page.title} | Growth Guru Agency`);
    const ctx = { site: cfg, page, year: 2026, posts };
    const pageBlocks = {
      ...blocks,
      'head-meta': () => headMeta(cfg, page),
      jsonld: () => structuredData(cfg, page, posts),
      'inline-script': () => `<script>${INLINE_SCRIPT}</script>`,
      'page-css': () => (page.cube ? '<link rel="stylesheet" href="/assets/css/cube.css">' : ''),
      'page-js': () => (page.cube ? '<script src="/assets/js/cube.js" defer></script>' : ''),
    };
    const body = page.article ? page.body : render(page.body, ctx, pageBlocks, page.file);
    let html =
      render(headTpl, ctx, pageBlocks, 'src/partials/head.html') +
      `<body class="${esc(page.bodyClass || '')}">\n<a class="skip-link" href="#main">Skip to content</a>\n` +
      render(headerTpl, ctx, pageBlocks, 'src/partials/header.html') +
      `<main id="main" tabindex="-1">\n${body}\n</main>\n` +
      render(footerTpl, ctx, pageBlocks, 'src/partials/footer.html') +
      '\n</body>\n</html>\n';
    html = versioned(html, page.out);
    writeFile(join(DIST, page.out), html);
    written.push({ out: page.out, bytes: Buffer.byteLength(html) });
  }

  // 3) _headers (CSP hash + HTML cache rules filled in)
  const htmlPaths = ['/', '/index.html', '/404.html', ...pages.filter((p) => p.path && p.path !== '/').flatMap((p) => [p.path, p.path + 'index.html'])];
  const headersSrc = readFileSync(join(SRC, '_headers'), 'utf8')
    .replace('{{CSP_SCRIPT_HASHES}}', `'sha256-${inlineHash}'`)
    .replace('{{HTML_CACHE_RULES}}', htmlPaths.map((p) => `${p}\n  Cache-Control: public, max-age=0, must-revalidate`).join('\n'));
  writeFile(join(DIST, '_headers'), headersSrc);

  // 4) sitemap + robots (only when the site address is known)
  if (cfg.siteUrl) {
    const urls = pages
      .filter((p) => p.path && !p.noindex)
      .map((p) => `  <url><loc>${esc(cfg.siteUrl + p.path)}</loc>${p.article ? `<lastmod>${esc(p.article.date)}</lastmod>` : ''}</url>`);
    writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
    writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
  }

  // 5) summary
  const kb = (n) => (n / 1024).toFixed(1) + ' KB';
  const status = (on, yes, no) => (on ? `set (${yes})` : `not set yet (${no})`);
  console.log('\n  Growth Guru build complete\n  ---------------------------');
  for (const w of written) console.log(`  ${w.out.padEnd(48)} ${kb(w.bytes).padStart(9)}`);
  console.log(`\n  Pages: ${written.length} (${posts.length} blog posts) · assets: ${assetHashes.size} files, ${kb(assetBytes)}`);
  console.log(`  siteUrl:     ${status(cfg.siteUrl, cfg.siteUrl, 'no canonical tags, sitemap.xml or robots.txt')}`);
  console.log(`  calendlyUrl: ${status(cfg.calendlyUrl, 'booking buttons open Calendly', 'booking buttons go to /contact/')}`);
  console.log(`  formspreeId: ${status(cfg.formspreeId, 'form sends to Formspree', 'form shows the email address instead')}`);
  console.log(`  socials:     ${Object.keys(cfg.socials).length ? Object.keys(cfg.socials).join(', ') : 'none set (icons hidden)'}`);
  if (warnings.length) {
    console.log(`\n  Warnings (${warnings.length}):`);
    for (const w of [...new Set(warnings)]) console.log(`  - ${w}`);
  }
  console.log(`\n  Done in ${Date.now() - started} ms. Output: dist/\n`);
}

try {
  build();
} catch (err) {
  console.error(`\n  Build failed: ${err.message}\n`);
  process.exit(1);
}
