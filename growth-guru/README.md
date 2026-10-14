# Growth Guru [GGA] website

The website for **Growth Guru Agency (GGA)**, a social media and digital marketing agency.

It's a fast, static website: plain HTML, CSS and a little JavaScript. There's no framework and nothing to install. A small script (`build.mjs`) puts the pages together, and the finished website lands in the `dist/` folder. That folder is what goes online.

---

## What's in this folder

| File / folder | What it is |
|---|---|
| `site.config.json` | **The settings file.** Email, booking link, form ID, social links, website address and prices. Most changes happen here. |
| `build.mjs` | The builder. Run `node build.mjs` after any change. |
| `dist/` | The finished website (made by the builder). This is what gets deployed. Don't edit files in here by hand; they're replaced on every build. |
| `src/pages/` | One file per page (home, services, work, pricing, blog, contact, privacy, 404). |
| `src/partials/` | Pieces shared by every page: `head.html`, `header.html` (top menu), `footer.html`. |
| `src/content/blog/` | Blog articles, one `.md` file each (see "Add a blog post" below). |
| `src/assets/css/styles.css` | All the styling. `cube.css` is the animated 3D cube. |
| `src/assets/js/main.js` | Menu, animations, filters, pricing tabs, blog search, contact form, booking popup. `cube.js` builds the 3D cube. |
| `src/assets/img/` | Logo, favicon, share image (`og.jpg`, 1200×630), project and blog artwork. |
| `src/assets/fonts/` | Outfit, Plus Jakarta Sans and JetBrains Mono, hosted with the site (free fonts, SIL Open Font License, licenses included). |
| `src/_headers` | Security and caching rules for Cloudflare. |
| `wrangler.jsonc` | Tells Cloudflare to publish the `dist/` folder. |

---

## 1. Change the settings

Open `site.config.json` in any text editor. Every value is optional; the site still looks finished and works while a value is empty (`""`).

| Setting | What to put there | What happens while it's empty |
|---|---|---|
| `siteUrl` | Your web address, e.g. `"https://growthguru.agency"` (no slash at the end) | Search-engine extras (canonical links, `sitemap.xml`, `robots.txt`) are skipped. Add this once the domain is live. |
| `email` | The inbox for inquiries | (Already set.) |
| `responseTime` | The reply promise shown on the contact page | (Already set.) |
| `calendlyUrl` | Your Calendly booking link, e.g. `"https://calendly.com/growthguru/strategy-call"` | Every "Book a free strategy call" and plan button goes to the contact form instead (and pre-fills the message). |
| `formspreeId` | The ID of your Formspree form, e.g. `"xyzabcde"` (the last part of `https://formspree.io/f/xyzabcde`) | The contact form politely shows your email address instead of sending. |
| `socials` | Full links to your profiles, e.g. `"https://www.instagram.com/yourhandle/"` | That icon simply doesn't appear (no dead links). |
| `pricing.monthly` | The three monthly plans: name, price, badge, description, features, button text | — |

Tips:
- Keep the quotes and commas exactly as they are. If the build complains, it tells you roughly where the typo is.
- A plan with `"highlight": true` gets the glowing "featured" style.
- If `price` is a number like `"199"`, it shows as **$199/month**. Anything else (like `"Custom pricing"`) is shown as written.

### Getting a Formspree ID (the contact form)
1. Sign up free at formspree.io with `growthguruagency1@gmail.com`.
2. Create a new form. Copy the ID from its endpoint (`https://formspree.io/f/THIS-PART`).
3. Paste it into `formspreeId`, run the build, deploy. Send a test message and confirm it in the email Formspree sends you.

### Getting a Calendly link (the booking popup)
1. In Calendly, create a 30-minute event called "Free strategy call".
2. Copy its link and paste it into `calendlyUrl`. The popup only loads when someone clicks a booking button, so the site stays fast.

---

## 2. Build the site

You need [Node.js](https://nodejs.org) (version 18 or newer). Then, in this folder:

```
node build.mjs
```

It prints a short summary: every page it made, and which settings are still empty. Run it after **any** change, then deploy the updated `dist/` folder.

To preview on your computer: `npx serve dist` and open the address it shows.

---

## 3. Put it online (Cloudflare, free)

The site is set up for **Cloudflare Workers & Pages**.

1. Put this project on GitHub (the whole repository, including the `growth-guru/dist` folder; it's meant to be committed).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**, and pick the repository.
3. Settings:
   - **Path / root directory:** `growth-guru`
   - **Build command:** leave empty (you build on your computer with `node build.mjs` and commit `dist/`)
   - **Deploy command:** `npx wrangler deploy`
4. Deploy. You get a free `growth-guru.<your-account>.workers.dev` address to check everything.

From then on, every push to GitHub redeploys automatically.

---

## 4. Connect your GoDaddy domain

**Before you change anything: copy down your email records.** If your domain has email (or you might add some), changing nameservers can break it unless the records come along.

1. In GoDaddy: **My Products → your domain → DNS**. Screenshot or write down every record, especially **MX**, **TXT** (SPF, DKIM, verification) and any **CNAME** records.
2. In Cloudflare: **Add a site → enter your domain → Free plan**. Cloudflare scans and copies most existing records. Compare its list with your notes and add anything missing (especially MX and TXT).
3. Cloudflare shows two **nameservers**. In GoDaddy: **Domain → Nameservers → Change → "I'll use my own nameservers"** and paste both. Save. (It can take from a few minutes to a day to switch.)
4. When the domain shows "Active" in Cloudflare: open your Worker (**Workers & Pages → growth-guru → Settings → Domains & Routes → Add → Custom domain**) and add `yourdomain.com` and `www.yourdomain.com`.
5. Set `siteUrl` in `site.config.json` to `https://yourdomain.com`, run `node build.mjs`, and push. This turns on the sitemap and the search-engine tags.
6. Optional: in Google Search Console, add the domain and submit `https://yourdomain.com/sitemap.xml`.

---

## 5. Add a blog post

1. Make a new file in `src/content/blog/`, e.g. `reels-ideas.md`.
2. Start it with this block (keep the quotes):

```
---
title: "10 Reels ideas for small businesses"
slug: "reels-ideas"
category: "instagram"
categoryLabel: "Instagram growth"
excerpt: "One or two sentences that make people want to read it."
date: "2026-11-02"
readMinutes: 6
cover: "/assets/img/blog/reels-ideas.svg"
featured: false
author: "GGA Editorial Team"
---
```

   - `category` must be one of: `instagram`, `tiktok`, `facebook`, `ai-marketing`, `branding-web`.
   - Put the cover image in `src/assets/img/blog/` (1200 × 675 works best; `.svg`, `.png`, `.jpg` or `.webp`).
   - `featured: true` puts it in "Editor's picks" at the top of the blog (the first three featured posts are shown).
3. Write the article under the block. You can use:
   - `## Heading` and `### Smaller heading`
   - `**bold**`, `*italic*`, `` `code` ``
   - `[link text](https://example.com)`
   - lists starting with `- ` or `1. `
   - `> quote`
4. Run `node build.mjs`. The post gets its own page at `/blog/reels-ideas/`, appears in the blog list, search and topic filters, and in "Keep reading" on related posts.

---

## Honesty rules this site follows

- No made-up numbers, results, testimonials or client logos.
- Portfolio pieces are labeled **Concept** ("Sample concepts that show our style. Client work is shared with permission."). When you have real client work you're allowed to share, swap a concept for it and remove the label for that one.
- Only promises you already make: zero lock-in contracts, replies within 24 business hours (Mon–Fri), global remote team, and the plan deliverables.

---

## If something looks wrong

- **The build fails:** read the message. It names the file and usually the problem (often a missing comma or quote in `site.config.json`).
- **A change doesn't show online:** did you run `node build.mjs` and push the updated `dist/`? Then hard-refresh the browser.
- **Added a new outside service** (chat widget, analytics, video embed) and it doesn't load: add its domain to the `Content-Security-Policy` line in `src/_headers`, rebuild, deploy.
