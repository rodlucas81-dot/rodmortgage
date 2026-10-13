// ============================================================================
// RATES  —  rodmortgage.net
// ----------------------------------------------------------------------------
// Today's market rates for the payment calculator at /payment/.
//
// Source: Optimal Blue Mortgage Market Indices, published daily by the
// St. Louis Fed (FRED). They're built from actual locked loans, one series per
// program, and the CSV endpoint needs no API key:
//   OBMMIC30YF      30-yr fixed conforming
//   OBMMIFHA30YF    30-yr fixed FHA
//   OBMMIVA30YF     30-yr fixed VA
//   OBMMIJUMBO30YF  30-yr fixed jumbo
//
// These are market averages, not a rate sheet. The page adjusts them for
// credit score / occupancy / program and labels the result as an estimate.
//
// The response is CDN-cached for 6 hours (the index updates once a business
// day), so FRED sees a handful of requests a day no matter the traffic. If
// FRED is down the function returns 502 and the page falls back to the
// hardcoded rates in its CONFIG.
// ============================================================================

const SERIES = {
  conv: "OBMMIC30YF",
  fha: "OBMMIFHA30YF",
  va: "OBMMIVA30YF",
  jumbo: "OBMMIJUMBO30YF",
} as const;

export default async () => {
  // Three weeks back is plenty to cover weekends and holidays.
  const since = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10);
  const url =
    "https://fred.stlouisfed.org/graph/fredgraph.csv?id=" +
    Object.values(SERIES).join(",") +
    "&cosd=" + since;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("FRED " + res.status);
    const rates = parseLatest(await res.text());

    return new Response(JSON.stringify({ ...rates, source: "Optimal Blue via FRED" }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800",
        "Netlify-CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("rates:", err);
    return new Response(JSON.stringify({ error: "unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};

// FRED CSV: header row, then one row per day. Missing values are "." or empty.
// Takes the most recent row where every series has a value, so all four rates
// are from the same day.
export function parseLatest(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const col = Object.fromEntries(
    Object.entries(SERIES).map(([k, id]) => [k, header.indexOf(id)])
  ) as Record<keyof typeof SERIES, number>;
  if (Object.values(col).some((i) => i < 0)) throw new Error("unexpected CSV header");

  for (let r = lines.length - 1; r > 0; r--) {
    const cells = lines[r].split(",");
    const vals = Object.fromEntries(
      Object.entries(col).map(([k, i]) => [k, parseFloat(cells[i])])
    ) as Record<keyof typeof SERIES, number>;
    if (Object.values(vals).every((v) => Number.isFinite(v) && v > 1 && v < 20)) {
      return {
        asOf: cells[0],
        conv: vals.conv / 100,
        fha: vals.fha / 100,
        va: vals.va / 100,
        jumbo: vals.jumbo / 100,
      };
    }
  }
  throw new Error("no complete row");
}
