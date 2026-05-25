# rodmortgage

Live site → **https://rodmortgage.netlify.app/**

Source for [rodmortgage.netlify.app](https://rodmortgage.netlify.app/) — Rodrigo DeOliveira's mortgage marketing pages.

| Path | Page |
|---|---|
| `/` | Find the Home You Can Afford — affordability calculator + pre-qualification |
| `/credit/` | Free Credit Analysis & 90-Day Game Plan — IG funnel for credit-curious leads |
| `/privacy_policy/` | Privacy policy (covers both calculators) |

## Deployment

Auto-deploys to Netlify on push to `main`. No build step — static HTML/CSS/JS.

Netlify project: `rodmortgage`
Publish directory: `.` (repository root)

## Compliance posture

- **NMLS** — Rodrigo DeOliveira NMLS #1435896, Ideal Lending LLC NMLS #2471779
- **Licensed in** CT, FL, MA (per Rodrigo's individual license footprint)
- **Equal Housing Lender** — logo and statement on every page
- **TCPA** — FCC §64.1200(f)(9) safe-harbor consent on every lead-capture form
- **Reg Z §1026.24(c)** — Estimated APR shown alongside any quoted rate
- **FCRA** — no credit pull happens on this site; future hard inquiries require separate written authorization
- **CROA** — explicit non-credit-repair disclosure on `/credit/`
- **ECOA Reg B §1002.5(d)(2)** — residency/immigration question framed with the regulatory citation
- **CAN-SPAM** — physical address (5589 Okeechobee Blvd STE 101, West Palm Beach, FL 33417) on every page
- **GLBA** — privacy policy at `/privacy_policy/`
- **ADA / WCAG 2.0 AA** — UserWay widget + accessibility statement link on every page

## Lead capture

All forms post to Formspree `mqewrlyl`.
- Affordability calculator (root): form name `mortgage-lead`
- Credit page (`/credit/`): subject-tagged `Credit Analysis Lead — <name> (<state>, <outcome>, <situation>)`

## Editing

Each page is a single self-contained HTML file. Edit, push, deploy.

```bash
# After making changes
git add -A
git commit -m "Update copy on /credit/ hero"
git push
# Netlify builds + deploys in ~30 seconds
```

## Local preview

Any static-file server works. Examples:

```bash
# Python
python -m http.server 5173

# Node
npx serve .
```

Then visit http://localhost:5173/, /credit/, /privacy_policy/.
