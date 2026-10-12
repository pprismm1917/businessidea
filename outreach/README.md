# Outreach folder

Everything Moe needs to find and contact fence and deck companies in Dallas–Fort Worth (DFW).

| File | What it is |
|---|---|
| `prospects.csv` | The prospect list: 73 small DFW fence and deck companies with no website, a Facebook-only presence, a broken website, or a weak one. One row per company, best prospects first. |
| `outreach-kit.md` | The emails, the call script, the honesty rules, the daily routine and the volume limits. Read it before you contact anyone. |
| `README.md` | This file. |

Nobody on this list has been contacted yet. Every row starts with `status` = `new`.

---

## 1. What is in `prospects.csv`

The list is sorted by `priority`, from 5 (best) to 1.

| Column | Meaning |
|---|---|
| `priority` | 5 = best. Companies with no website, a Facebook-only page, or a dead or parked website score highest. Outdated websites come next and basic websites score lowest. Good reviews, a small owner-run crew, deck or patio work, and a location in the north or east suburbs raise the score. |
| `name`, `city`, `service_area` | The company, where it is based, and where it works. |
| `phone`, `email` | Public business contact details only. `unknown` means no public number or email was found. **Do not guess.** |
| `website`, `facebook` | What the company lists online. A note in brackets says when the site is broken, for example `(parked, for sale)`. |
| `website_status` | `none`, `facebook_only`, `parked_or_broken`, `outdated` or `basic_ok`. Companies with good websites were removed. |
| `website_evidence` | What we saw when we opened the site on 2026-10-12. This is the proof behind your opening line. |
| `services`, `size_signals`, `review_signals` | What they do, how big they look, and their reviews. Google review counts come from a directory copy of Google data dated March 2026, so the numbers today may be a little higher. |
| `personal_line` | A true, specific opening sentence for your first email. Use it as-is or make it shorter. |
| `sources` | Where every fact came from. The URLs are separated by ` \| `. |
| `status`, `last_contact`, `next_step` | Your tracking columns (see section 3). |

**Rows that need one more step before contact:**

- **Phone `unknown` (13 rows, all priority 3 or lower):** these companies are on Thumbtack, HomeAdvisor or Facebook only. Look for a public phone number or email first, for example in Google Maps. Never send a sales pitch through Thumbtack or HomeAdvisor messages. Those messages are for customers asking for quotes.
- **`next_step` says "confirm still operating":** the only proof these companies are still in business is a Yellow Pages listing. Check Google Maps for recent reviews before you write to them.
- **`next_step` says "confirm phone":** the number came from a page we could not fully check. Check it before you call.

**Before every first email, take 2 minutes:**

1. Open their website (or Google listing) yourself. Is the problem in `website_evidence` still there?
2. If they fixed it, or they now have a good site, set `status` to `not_a_fit` and move on.
3. Read the `personal_line` again. Change it if anything is no longer true. Never send a line you have not checked yourself (honesty rule 7 in the kit).

---

## 2. Opening the file

### Google Sheets

1. Go to sheets.google.com and create a blank spreadsheet.
2. Click **File → Import → Upload** and choose `prospects.csv`.
3. Pick **Replace current sheet**, set the separator to **Comma**, and click **Import data**.
4. Click **View → Freeze → 1 row** so the headers stay visible.
5. To sort, select everything and use **Data → Sort range** (tick "Data has header row").
6. To keep a copy in this folder, use **File → Download → Comma-separated values (.csv)** and save it over `outreach/prospects.csv`.

### Excel

1. Open Excel, then click **Data → From Text/CSV** and choose `prospects.csv`.
2. Check that the delimiter says **Comma** and click **Load**.
3. Click **View → Freeze Panes → Freeze Top Row**.
4. To save, use **File → Save As → CSV UTF-8 (Comma delimited) (\*.csv)**.

Tips:

- Long columns (`website_evidence`, `sources`) are easier to read with **Wrap text** turned on, or you can just hide them.
- Keep the column names exactly as they are. Do not add columns in the middle. If you need more columns, add them at the end.
- Excel can change `2026-10-13` into another date format. That is fine on screen, but when you type, use `YYYY-MM-DD`.

---

## 3. Updating the status columns

Update the row **right after every contact**. The full rules are in `outreach-kit.md`, section 6.3. Short version:

**`status`**: use only these words:

`new` → `researched` → `email_1` → `email_2` → `email_3` → `no_reply`
and also: `called`, `replied`, `interested`, `draft_in_progress`, `draft_sent`, `won`, `lost`, `not_a_fit`, `do_not_contact`.

- `researched` = you checked the row yourself (website still broken, real DFW company, the line is still true).
- `not_a_fit` = franchise, big company, good website, outside DFW, supplier, or closed.
- `do_not_contact` = they said no or stop. **Never contact them again, on any channel.** Mark it the same day.

**`last_contact`**: the date of your last email, call or text, as `YYYY-MM-DD` (example: `2026-10-13`).

**`next_step`**: start with the date, then the action, so the column sorts by date:
`2026-10-16 email_2`, `2026-10-14 call 4pm`, `2026-10-15 send draft by 5pm`.
Some rows start with a note such as "find a public phone or email first". Replace the note with a dated step once you have done it.
Leave `next_step` empty for `won`, `lost`, `no_reply`, `not_a_fit` and `do_not_contact`.

Example of one row after the first email:

```
status = email_1    last_contact = 2026-10-13    next_step = 2026-10-16 email_2
```

---

## 4. Daily volume limits (reminder)

picketdigital.com is a new domain. Go slow so your emails keep landing in the inbox. Full details are in `outreach-kit.md`, section 6.1.

| Weeks | New first emails per day | All emails per day (follow-ups and replies included) |
|---|---|---|
| 1–2 | **10–15** | up to 25 |
| 3–4 | 15–20 | up to 35 |
| 5 and later | 20–30 | up to 50 |

- Send one by one from your normal inbox. Wait 2–5 minutes between emails. Weekdays only.
- Plain text, no images, no attachments, no tracking, and no more than one link (picketdigital.com).
- Only move up a level if fewer than 3 in 100 emails bounce, nobody complained, and your weekly test email still lands in the inbox.
- **Stop for 2–3 days** (replies only) if you see many bounces, your test email lands in spam, or someone calls it spam.
- Calls: 5–10 per day, during Texas business hours (Central Time).

With 10–15 new emails a day, the priority 5 and 4 rows (22 companies) take about two days. Start with those, then work down the list.
