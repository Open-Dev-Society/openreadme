import { NextRequest, NextResponse } from "next/server";
import {
    generateFrontDoor,
    inspectFrontDoor,
    ownerDecisions,
} from "@/utils/front-door";
import { verifyReadme } from "@/utils/verify-readme";

export const maxDuration = 45;

/** Accepts "owner/repo", a github.com URL, or a git clone URL. */
export function parseRepo(input: string): { owner: string; repo: string } | null {
    const trimmed = input.trim().replace(/\.git$/, "");
    const fromUrl = trimmed.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
    if (fromUrl) return { owner: fromUrl[1], repo: fromUrl[2] };

    const bare = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (bare) return { owner: bare[1], repo: bare[2] };

    return null;
}

export async function GET(req: NextRequest) {
    const target = req.nextUrl.searchParams.get("repo") ?? "";
    const parsed = parseRepo(target);

    if (!parsed) {
        return NextResponse.json(
            { error: "Give a repository as owner/name or a github.com URL" },
            { status: 400 }
        );
    }

    const { owner, repo } = parsed;
    const token = process.env.GITHUB_TOKEN;

    try {
        const frontDoor = await inspectFrontDoor(owner, repo, token);
        const files = generateFrontDoor(frontDoor);
        const decisions = ownerDecisions(frontDoor);

        // The README's claims are checked in the same pass: a repository can
        // score 100% on the checklist and still tell visitors things that
        // stopped being true a year ago.
        let findings: Awaited<ReturnType<typeof verifyReadme>> = [];
        const readmeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            {
                headers: {
                    Accept: "application/vnd.github.raw",
                    "User-Agent": "OpenReadme-FrontDoor",
                    ...(token ? { Authorization: `token ${token}` } : {}),
                },
            }
        );

        if (readmeRes.ok) {
            findings = await verifyReadme({
                content: await readmeRes.text(),
                owner,
                repo,
                branch: frontDoor.evidence.defaultBranch,
                token,
            });
        }

        return NextResponse.json(
            { owner, repo, frontDoor, files, decisions, findings },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in GET /api/front-door:", error);
        const message = error instanceof Error ? error.message : "Something went wrong";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
