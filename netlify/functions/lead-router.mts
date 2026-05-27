// ============================================================================
// LEAD ROUTER  —  rodmortgage.net
// ----------------------------------------------------------------------------
// Receives form POSTs from the affordability page and fans out the lead to:
//   1. Rod's Formspree inbox  (always — primary record-of-truth)
//   2. The matched realtor partner's email  (via Resend, when realtor active
//      AND Resend env vars are configured)
//
// Solo flow (no realtor): just forwards to Formspree, identical to pre-function
// behavior. The page also has a client-side fallback that POSTs directly to
// Formspree if this function ever errors, so the lead capture is double-safe.
//
// Env vars (set via Netlify dashboard > Project configuration > Environment
// variables, or via the Netlify MCP):
//   RESEND_API_KEY        Resend API token. If unset, realtor auto-email is
//                         skipped silently (lead still reaches Rod's Formspree).
//   RESEND_FROM           Optional. The verified "From" address for Resend.
//                         Defaults to "leads@rodmortgage.net" once domain is
//                         verified in Resend.
//   ROD_EMAIL             Optional. Rod's email for the Bcc copy when Resend
//                         is active. Defaults to "rodrigo@ideallending.net".
// ============================================================================

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mqewrlyl";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fan out in parallel: Formspree (always) + realtor email (when applicable).
  const tasks: { name: string; promise: Promise<unknown> }[] = [];
  tasks.push({ name: "formspree", promise: forwardToFormspree(payload) });

  const realtorEmail = String(payload["Realtor Email"] || "").trim();
  let realtorRoutingState: "sent" | "skipped_no_key" | "skipped_no_email" = "skipped_no_email";
  if (realtorEmail) {
    const apiKey = (globalThis as any).Netlify?.env?.get?.("RESEND_API_KEY")
      || process.env.RESEND_API_KEY;
    if (apiKey) {
      realtorRoutingState = "sent";
      tasks.push({ name: "resend_realtor", promise: sendToRealtor(realtorEmail, payload, apiKey) });
    } else {
      realtorRoutingState = "skipped_no_key";
    }
  }

  const results = await Promise.allSettled(tasks.map((t) => t.promise));
  const detail = results.map((r, i) => ({
    task: tasks[i].name,
    status: r.status,
    error: r.status === "rejected" ? (r as PromiseRejectedResult).reason?.message || "unknown" : undefined,
  }));
  const errors = detail.filter((d) => d.status === "rejected");

  return new Response(
    JSON.stringify({
      ok: errors.length < tasks.length, // ok unless EVERYTHING failed
      delivered: tasks.length - errors.length,
      attempted: tasks.length,
      realtorRoutingState,
      detail,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

// ----------------------------------------------------------------------------
async function forwardToFormspree(payload: Record<string, unknown>) {
  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`formspree_${res.status}`);
  }
}

// ----------------------------------------------------------------------------
async function sendToRealtor(
  toEmail: string,
  payload: Record<string, unknown>,
  apiKey: string,
) {
  const from = (globalThis as any).Netlify?.env?.get?.("RESEND_FROM")
    || process.env.RESEND_FROM
    || "Rodrigo DeOliveira <leads@rodmortgage.net>";

  const rodEmail = (globalThis as any).Netlify?.env?.get?.("ROD_EMAIL")
    || process.env.ROD_EMAIL
    || "rodrigo@ideallending.net";

  const realtorName = String(payload["Realtor Name"] || "your client");
  const buyerName = `${payload.firstName || ""} ${payload.lastName || ""}`.trim()
    || "A prospective buyer";
  const subject = `🏡 New lead from your rodmortgage.net page — ${buyerName}`;

  // Plain HTML email body, summary of the lead.
  const html = buildEmailHtml(realtorName, buyerName, payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      bcc: [rodEmail],
      subject,
      html,
      reply_to: rodEmail,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`resend_${res.status}: ${body.slice(0, 200)}`);
  }
}

// ----------------------------------------------------------------------------
function buildEmailHtml(
  realtorName: string,
  buyerName: string,
  p: Record<string, unknown>,
): string {
  const row = (label: string, value: unknown) =>
    value === undefined || value === null || value === ""
      ? ""
      : `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(String(value))}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
<div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="padding:18px 24px;background:linear-gradient(135deg,#0b0f18,#181f2e);color:#fff;">
    <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#f0c85a;font-weight:700;">New Lead</div>
    <div style="font-size:20px;font-weight:700;margin-top:4px;">${escapeHtml(buyerName)}</div>
    <div style="font-size:12px;color:#9ca3af;margin-top:6px;">via your rodmortgage.net partner page</div>
  </div>
  <div style="padding:20px 24px;">
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#0f172a;">
      Hi ${escapeHtml(realtorName)},<br><br>
      A prospect just completed the affordability + pre-qualification flow on your shared page.
      Rodrigo has the same lead and will follow up on the mortgage side.
      Reach out to coordinate the home search.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 0;">
      ${row("Name", buyerName)}
      ${row("Email", p.email)}
      ${row("Phone", p.phone)}
      ${row("Best time to call", p.callTime)}
      ${row("Language", p.Language)}
      ${row("Recommended product", p["Recommended Product"])}
      ${row("Max purchase price", p["Max Purchase Price"])}
      ${row("Down payment", p["Down Payment"])}
      ${row("Loan amount", p["Loan Amount"])}
      ${row("Total monthly payment", p["Total Monthly Payment"])}
      ${row("FICO score", p["FICO Score"])}
      ${row("Immigration status", p["Immigration Status"])}
      ${row("Employment", p["Employment Type"])}
      ${row("Time at job", p["Time at Job"])}
      ${row("Property ownership", p["Property Ownership"])}
      ${row("Bankruptcy history", p["Bankruptcy History"])}
      ${row("Buying timeline", p["Buying Timeline"])}
      ${row("TCPA consent", p["TCPA Consent"])}
    </table>
  </div>
  <div style="padding:14px 24px;background:#f6f8fb;font-size:11px;color:#6b7280;line-height:1.5;border-top:1px solid #e5e7eb;">
    This lead was submitted with the consumer's express consent for ${escapeHtml(realtorName)} and Rodrigo DeOliveira / Ideal Lending LLC to follow up.
    You and Rodrigo are independent service providers; the consumer has chosen to engage both.
    Equal Housing Lender. NMLS #2471779 (Ideal Lending) · NMLS #1435896 (Rodrigo DeOliveira).
  </div>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch] as string));
}

export const config = {
  path: "/.netlify/functions/lead-router",
};
