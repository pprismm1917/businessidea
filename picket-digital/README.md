# Picket Digital website

The marketing website for **Picket Digital** (picketdigital.com): websites for fence & deck companies in Dallas–Fort Worth.

It's a plain "static" website. There's no build step, no framework and nothing to install. The folder you see is exactly what gets uploaded.

---

## What's in this folder

| File / folder | What it is |
|---|---|
| `index.html` | The home page (the whole sales page). |
| `privacy.html` | The privacy policy (plain English). |
| `404.html` | The "page not found" page ("This fence has a gap."). |
| `assets/css/styles.css` | All the styling (colors, fonts, layout). |
| `assets/js/main.js` | Small extras: mobile menu, animations, the before/after slider, the contact form. The site still works if this doesn't load. |
| `assets/fonts/` | Barlow Condensed (headings) and Inter (body text), hosted with the site. Both are free fonts under the SIL Open Font License (license files included). |
| `assets/img/` | `logo.svg` (for light backgrounds), `logo-light.svg` (for dark backgrounds), and `fence-tile.svg` (the cedar fence pattern used around the site). |
| `assets/video/` | Where an optional hero video goes (see below). Holds only a short note for now. |
| `favicon.svg` | The little icon in the browser tab. |
| `apple-touch-icon.png` | The icon used when someone saves the site to an iPhone home screen. |
| `og.png` | The preview image shown when the link is shared (Facebook, iMessage, LinkedIn, Slack…). |
| `robots.txt`, `sitemap.xml` | Help Google find and index the site. |
| `_headers` | Settings for Cloudflare: caching and security. |

---

## Launch checklist (do these before going live)


1. **Phone number.** ✅ Done: calls go to (469) 629-7172 (KrispCall); the WhatsApp link in the contact section uses +1 276-300-4340. To change it, edit the `tel:` links and visible number in `index.html` (contact section and footer) and the `"telephone"` line in the JSON-LD block near the top.
2. **Email address.** Make sure `hello@picketdigital.com` actually receives mail (set up the inbox or forwarding in your email provider). It appears in `index.html`, `privacy.html` and in `assets/js/main.js` (the error message).
3. **Contact form (Formspree).** ✅ Connected to form `mbgdyzln`. Send yourself a test from the live site; the first submission may ask you to confirm the form in Formspree. To switch forms, change the `action` URL of the form in `index.html`.
4. **(Optional) Hero video.** See "Add a hero video" below.
5. **If your domain is not picketdigital.com**, search-and-replace `https://picketdigital.com` in `index.html`, `privacy.html`, `sitemap.xml` and `robots.txt` (canonical link, Open Graph tags, JSON-LD, sitemap).
6. **Email still sends and receives after the domain/DNS move.** Send a test to `hello@picketdigital.com` from another account and reply from it (see "Domain bought somewhere else" below).
7. After launch, check the share preview with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and submit `https://picketdigital.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

**Later, to keep the site honest:**

- **When your first 3 launch partners have signed**, remove the launch offer from `index.html`: the ribbon (`price-card__ribbon`), the "$0 for launch partners*" pill (`price__zero`) and the * footnote (`price__fine`).
- **If you edit `privacy.html`**, update its "Last updated" date and the `<lastmod>` date for `/privacy` in `sitemap.xml`.

---

## Put it online with Cloudflare Workers (current setup)

The repository root has a `wrangler.jsonc` file that tells Cloudflare to publish this folder as a static site.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → choose `businessidea`.
2. **Project name:** `picket-digital` (must match `"name"` in `wrangler.jsonc`).
3. **Build command:** leave empty. **Deploy command:** `npx wrangler deploy`.
4. After it's created: **Settings → Builds → Production branch** → pick the branch that contains this folder (currently `claude/sleepy-ramanujan-vf20b2`). Every push to that branch then redeploys the site automatically.
5. **Settings → Domains & Routes → Add → Custom domain** → `picketdigital.com` (and `www.picketdigital.com` if you want).

`README.md` and `assets/video/README.txt` are excluded from the published site by `.assetsignore`.

## Alternative: Cloudflare Pages

Pick Option A or B up front: a project created with Direct Upload can't be switched to GitHub later (you'd have to create a new project).

### Option A: Direct Upload (easiest, no GitHub needed)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and go to **Workers & Pages**, then **Create**, then **Pages**, then **Upload assets**.
2. Name the project (e.g. `picket-digital`) and click **Create project**.
3. Drag the whole **`picket-digital` folder** (the one containing `index.html`) into the upload box, then click **Deploy site**.
4. You get a free `…pages.dev` address right away. Open it and check everything.
5. To update the site later: open the project, click **Create deployment** and upload the folder again.

### Option B: Connect the GitHub repository (updates go live automatically when you push)

1. **Workers & Pages**, then **Create**, then **Pages**, then **Connect to Git**, and pick the repository.
2. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `picket-digital`
3. Click **Save and Deploy**.

### Add your domain

1. In the Pages project, go to **Custom domains**, then **Set up a custom domain**.
2. Add `picketdigital.com` and follow the prompts. If the domain is already on Cloudflare, the DNS records are created for you.
3. Repeat for `www.picketdigital.com`.
4. Optional but recommended: make `www` redirect to the main domain. In Cloudflare go to **Rules**, then **Redirect Rules**, and create a rule that sends `www.picketdigital.com/*` to `https://picketdigital.com/${1}` (301).

HTTPS/SSL is automatic.

### Domain bought somewhere else / email already set up

Cloudflare Pages can only use the main domain (`picketdigital.com`, without `www`) once the domain's DNS is managed by Cloudflare. That means switching the domain's **nameservers** to Cloudflare. If you do that without copying your email records first, **`hello@picketdigital.com` stops working**, and the site, the contact form's error message and the privacy page all point people to that address. So, in this order:

1. In Cloudflare, click **Add a site** (or **Add a domain**), enter `picketdigital.com` and choose the **Free** plan.
2. **Before you change any nameservers**, compare the DNS list Cloudflare imported with the records your email provider gave you. Make sure every one is there: the **MX** records, the **SPF** record (a TXT record starting `v=spf1`), the **DKIM** record(s) (TXT or CNAME) and the **DMARC** record (TXT on `_dmarc`). Add any that are missing, and set them to **DNS only** (grey cloud), not Proxied.
3. At the company where you bought the domain (your registrar), replace the nameservers with the two Cloudflare shows you. Wait until Cloudflare says the domain is **Active** (minutes to a few hours).
4. Now add the custom domains in the Pages project, as described above.
5. Send a test email to `hello@picketdigital.com` from another account, and reply from it, to confirm email still works both ways.

---

## Add a hero video (optional, e.g. from Higgsfield)

By default, the top of the page shows a hand-built, very lightweight illustrated golden-hour scene. You can layer a short looping video on top of it. The video only loads on **desktop screens (900px+ wide)**, when the visitor hasn't asked for reduced motion and isn't in data-saver mode. Phones always get the fast illustration.

1. **Make the clip.** In Higgsfield (or similar), generate a calm 5–10 second shot, e.g. *"golden hour Texas backyard, new cedar privacy fence, warm sunlight, slow camera push-in"*. Keep the **left side darker/simple**, because the headline sits there. Export **MP4, 1080p, no audio**.
2. **Compress it.** Install [ffmpeg](https://ffmpeg.org/download.html). Put your exported video in a folder and rename it `input.mp4`. Open **Terminal** (Mac) or **Command Prompt** (Windows) in that folder (Mac: right-click the folder → Services → New Terminal at Folder; Windows: type `cmd` in the folder's address bar and press Enter), then run:

   ```bash
   # MP4 (H.264): works everywhere
   ffmpeg -i input.mp4 -vf "scale=1600:-2,fps=30" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart -an hero.mp4

   # WebM (VP9): smaller, used by Chrome/Firefox/Edge
   ffmpeg -i input.mp4 -vf "scale=1600:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an hero.webm
   ```

   Aim for **under 3 MB each**. If a file is bigger, raise the number after `-crf` (e.g. 30 for mp4, 42 for webm) or shorten the clip with `-t 8`.
3. **Add the files.** Put `hero.mp4` and `hero.webm` in `assets/video/`.
4. **Switch it on.** In `index.html`, find `data-video="off"` and change it to `data-video="on"`.
5. Deploy. If the files are missing or can't play, the illustrated scene simply stays. Nothing breaks.

If you replace the video later with a new file of the same name, change `?v=1` to `?v=2` in the two `data-src-…` attributes next to `data-video` so browsers fetch the new one.

---

## Editing CSS or JavaScript? Bump the version

Files in `assets/` are cached by visitors' browsers for a year (that's what makes repeat visits instant). So after you change `styles.css` or `main.js`, change the version number where they're loaded, or people may keep seeing the old file:

- In `index.html` and `privacy.html`: `assets/css/styles.css?v=3` becomes `?v=4`, and `assets/js/main.js?v=3` becomes `?v=4`
- In `404.html`: `/assets/css/styles.css?v=3` and `/assets/js/main.js?v=3`, same change

Use the same new number everywhere. Next time use `?v=5`, and so on. If you swap an image or font in `assets/`, give the new file a new name instead.

HTML pages aren't cached long, so text changes in the `.html` files show up right away after you deploy.

---

## Good to know

- **Honesty rules used on this site:** no fake testimonials, logos, review counts or invented stats. The demo designs and the before/after are labeled as illustrations with fictional companies (`.example` web addresses). The only outside number is the ~165,000 monthly searches estimate, credited to Google Keyword Planner data via MarketKeep. Once you have real clients (with permission), swap a demo for a real project.
- **Security header (`_headers`).** The `Content-Security-Policy` line allows scripts only from this site and Cloudflare Web Analytics, and lets the contact form send to Formspree. If you add another service later (Google Analytics, a chat widget, a booking tool), add its domain to that line or delete the line. Also, the small inline script at the top of each HTML page is allowed by its fingerprint (the `sha256-…` value). If you edit that one line of script, the fingerprint must be updated too, but the site still works if you don't.
- **Privacy policy.** `privacy.html` is a plain-English template, not legal advice. Update it if you add analytics, ads or a newsletter.
- **This README is public.** Everything in the folder gets uploaded, so this file can be opened at `picketdigital.com/README.md`. That's harmless (it holds no passwords), and `_headers` tells search engines not to list it. Never put passwords or private notes in this folder.
- **Preview on your computer:** you can double-click `index.html` to open it. For a true preview (including the 404 page), run `npx http-server picket-digital` in this repository and open the address it shows.
