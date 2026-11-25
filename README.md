# rodmortgage

Live site → **https://rodmortgage.net/**

Source for [rodmortgage.net](https://rodmortgage.net/) — Rodrigo L. Deoliveira's mortgage marketing pages.

| Path | Page |
|---|---|
| `/` | PT-BR mini-application (pre-qualification quiz) |
| `/afford/` | Find the Home You Can Afford — affordability calculator + pre-qualification |
| `/credit/` | Free Credit Analysis & 90-Day Game Plan — IG funnel for credit-curious leads |
| `/calculator/` | Client-facing amortization calculator (standard vs. accelerated) |
| `/payment/` | Payment-first calculator — reverse (live rates) |
| `/dreambuilder/` | DreamBuilder landing (3.5% down, ITIN-friendly) |
| `/privacy_policy/` | Privacy policy |

## Deployment

Auto-deploys to Netlify on push to `main`. No build step — static HTML/CSS/JS with one serverless function.

Netlify project: `rodmortgage`
Publish directory: `.` (repository root)
Function: `netlify/functions/lead-router.mts` — fans out leads to Formspree + Resend to realtor partners.

## Branding (Nov 2026)

- **Loan Officer:** Rodrigo L. Deoliveira — Loan Officer Team Lead · Rize Mortgage
- **Individual NMLS:** #1435896
- **Company:** Standard Mortgage Capital LLC dba Rize Mortgage
- **Company NMLS:** #1604663
- **Company address:** 53 NW 100th Ave, Plantation, FL 33324
- **NMLS Consumer Access:** https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/1604663
- **Company website:** https://rizemtg.com/

## Compliance posture

- **NMLS** — Rodrigo L. Deoliveira NMLS #1435896, Standard Mortgage Capital LLC dba Rize Mortgage NMLS #1604663
- **Licensed footprint** — Rize is licensed in 40+ states; verify specific state authorization via NMLS Consumer Access
- **Equal Housing Lender** — logo and statement on every page
- **TCPA** — FCC §64.1200(f)(9) safe-harbor consent on every lead-capture form
- **Reg Z §1026.24(c)** — Estimated APR shown alongside any quoted rate
- **FCRA** — no credit pull happens on this site; future hard inquiries require separate written authorization
- **CROA** — explicit non-credit-repair disclosure on `/credit/`
- **ECOA Reg B §1002.5(d)(2)** — residency/immigration question framed with the regulatory citation
- **CAN-SPAM** — physical address (53 NW 100th Ave, Plantation, FL 33324) on every page
- **GLBA** — privacy policy at `/privacy_policy/`
- **ADA / WCAG 2.1** — Rize in-house ADA widget loaded on every page

## Lead capture

Forms POST to `/.netlify/functions/lead-router`, which:
1. Always forwards to Formspree `mqewrlyl` (Rod's record-of-truth inbox).
2. When a realtor partner is active (`?r=<slug>` on the affordability page), additionally sends a formatted lead email to the matched realtor via Resend.

Env vars (set via Netlify Project configuration > Environment variables):
- `RESEND_API_KEY` — required for realtor auto-email
- `RESEND_FROM` — optional, defaults to `Rodrigo L. Deoliveira (Rize Mortgage) <leads@rodmortgage.net>`
- `ROD_EMAIL` — optional, defaults to `rodrigo@finstars.us`

## Editing

Each page is a single self-contained HTML file. Edit, push, deploy.

```bash
git add -A
git commit -m "Update copy on /credit/ hero"
git push
# Netlify builds + deploys in ~30 seconds
```

## Local preview

Any static-file server works:

```bash
python -m http.server 5173
# or
npx serve .
```
