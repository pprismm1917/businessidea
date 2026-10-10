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
| `assets/video/` | Empty. This is where an optional hero video goes (see below). |
| `favicon.svg` | The little icon in the browser tab. |
| `apple-touch-icon.png` | The icon used when someone saves the site to an iPhone home screen. |
| `og.png` | The preview image shown when the link is shared (Facebook, iMessage, LinkedIn, Slack…). |
| `robots.txt`, `sitemap.xml` | Help Google find and index the site. |
| `_headers` | Settings for Cloudflare: caching and security. |

---

## Launch checklist (do these before going live)

Search the files for `TODO` to find every spot.

1. **Phone number.** `(214) 555-0100` is a placeholder. Replace it in `index.html` (contact section and footer, 2 places each: the visible number *and* the `tel:+12145550100` link). Once you have a real number, you can also add `"telephone": "+1-214-…"` to the JSON-LD block near the top of `index.html`.
2. **Email address.** Make sure `hello@picketdigital.com` actually receives mail (set up the inbox or forwarding in your email provider). It appears in `index.html`, `privacy.html` and in `assets/js/main.js` (the error message).
3. **Contact form (Formspree).**
   - Go to [formspree.io](https://formspree.io), create a free account and a new form. Set the notification email to your inbox.
   - Formspree gives you an endpoint like `https://formspree.io/f/abcdwxyz`.
   - In `index.html`, find `https://formspree.io/f/YOUR_FORM_ID` and replace `YOUR_FORM_ID` with your ID (e.g. `abcdwxyz`).
   - Send yourself a test from the live site. The first submission may ask you to confirm the form in Formspree.
   - Until you do this, the form shows a friendly "not connected yet, please email us" message.
4. **(Optional) Hero video.** See "Add a hero video" below.
5. **If your domain is not picketdigital.com**, search-and-replace `https://picketdigital.com` in `index.html`, `privacy.html`, `sitemap.xml` and `robots.txt` (canonical link, Open Graph tags, JSON-LD, sitemap).
6. After launch, check the share preview with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and submit `https://picketdigital.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

---

## Put it online with Cloudflare Pages

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

---

## Add a hero video (optional, e.g. from Higgsfield)

By default, the top of the page shows a hand-built, very lightweight illustrated golden-hour scene. You can layer a short looping video on top of it. The video only loads on **desktop screens (900px+ wide)**, when the visitor hasn't asked for reduced motion and isn't in data-saver mode. Phones always get the fast illustration.

1. **Make the clip.** In Higgsfield (or similar), generate a calm 5–10 second shot, e.g. *"golden hour Texas backyard, new cedar privacy fence, warm sunlight, slow camera push-in"*. Keep the **left side darker/simple**, because the headline sits there. Export **MP4, 1080p, no audio**.
2. **Compress it.** Install [ffmpeg](https://ffmpeg.org/download.html), put the export next to you as `input.mp4`, then run:

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

- In `index.html` and `privacy.html`: `assets/css/styles.css?v=1` becomes `?v=2`, and `assets/js/main.js?v=1` becomes `?v=2`
- In `404.html`: `/assets/css/styles.css?v=1` and `/assets/js/main.js?v=1`, same change

Use the same new number everywhere. Next time use `?v=3`, and so on. If you swap an image or font in `assets/`, give the new file a new name instead.

HTML pages aren't cached long, so text changes in the `.html` files show up right away after you deploy.

---

## Good to know

- **Honesty rules used on this site:** no fake testimonials, logos, review counts or invented stats. The demo designs and the before/after are labeled as illustrations with fictional companies (`.example` web addresses). The only outside number is the ~165,000 monthly searches estimate, credited to Google Keyword Planner data via MarketKeep. Once you have real clients (with permission), swap a demo for a real project.
- **Security header (`_headers`).** The `Content-Security-Policy` line only allows scripts from this site, plus Cloudflare Web Analytics and Formspree. If you add another service later (Google Analytics, a chat widget, a booking tool), add its domain to that line or delete the line. Also, the small inline script at the top of each HTML page is allowed by its fingerprint (the `sha256-…` value). If you edit that one line of script, the fingerprint must be updated too, but the site still works if you don't.
- **Privacy policy.** `privacy.html` is a plain-English template, not legal advice. Update it if you add analytics, ads or a newsletter.
- **Preview on your computer:** you can double-click `index.html` to open it. For a true preview (including the 404 page), run `npx http-server picket-digital` in this repository and open the address it shows.
