import { NextRequest } from "next/server";
import { parseRepo } from "@/utils/parse-repo";

/**
 * A README-health badge, for the README.
 *
 * shields.io serves over a billion of these a month, which is the whole point:
 * a badge is the one piece of a project that travels to other people's
 * repositories. This one only reports GitHub's own community profile score, so
 * it stays a single fast API call — link checking belongs in the Action, where
 * taking a few seconds is fine.
 */

const COLORS = {
    good: "#3fb950", // 80%+
    fair: "#d29922", // 50-79%
    poor: "#f85149", // under 50%
    grey: "#8b949e", // unknown
};

// Verdana at 11px, averaged. Good enough that the pill never clips its text.
const textWidth = (text: string) => text.length * 6.6 + 10;

// The label comes from a query string and is written straight into markup that
// the browser parses as XML, so it is escaped rather than trusted.
const escapeXml = (text: string) =>
    text.replace(/[<>&"']/g, (char) =>
        ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char] as string
    );

function badge(rawLabel: string, rawValue: string, color: string): string {
    const labelWidth = Math.round(textWidth(rawLabel));
    const valueWidth = Math.round(textWidth(rawValue));
    const label = escapeXml(rawLabel);
    const value = escapeXml(rawValue);
    const total = labelWidth + valueWidth;

    // Text is drawn twice: once in near-black at a one-pixel offset for the
    // shadow every badge in the wild has, then in white on top.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

const svg = (body: string, seconds: number) =>
    new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            // GitHub proxies badges through Camo, which caches aggressively;
            // stale-while-revalidate keeps it serving while we refresh behind it.
            "Cache-Control": `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=86400`,
        },
    });

export async function GET(req: NextRequest) {
    const label = (req.nextUrl.searchParams.get("label") ?? "readme health")
        .replace(/[^\w .-]/g, "")
        .slice(0, 32) || "readme health";
    const parsed = parseRepo(req.nextUrl.searchParams.get("repo") ?? "");

    if (!parsed) {
        return svg(badge(label, "unknown", COLORS.grey), 300);
    }

    try {
        const res = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/community/profile`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "OpenReadme-Badge",
                    ...(process.env.GITHUB_TOKEN
                        ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                        : {}),
                },
                next: { revalidate: 3600 },
            }
        );

        if (!res.ok) {
            // A badge that says "unknown" is honest. A badge that says 0% because
            // the API rate-limited us is a lie printed in someone's README.
            return svg(badge(label, "unknown", COLORS.grey), 300);
        }

        const score = Number((await res.json())?.health_percentage ?? 0);
        const color = score >= 80 ? COLORS.good : score >= 50 ? COLORS.fair : COLORS.poor;

        return svg(badge(label, `${score}%`, color), 3600);
    } catch (error) {
        console.error("Error in GET /api/badge:", error);
        return svg(badge(label, "unknown", COLORS.grey), 300);
    }
}
