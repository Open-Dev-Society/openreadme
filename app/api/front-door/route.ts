import { NextRequest, NextResponse } from "next/server";
import {
    generateFrontDoor,
    inspectFrontDoor,
    ownerDecisions,
} from "@/utils/front-door";
import { verifyReadme } from "@/utils/verify-readme";
import { parseRepo } from "@/utils/parse-repo";

export const maxDuration = 45;

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

/**
 * Same check, but against README content the caller supplies — what a pull
 * request proposes, rather than what is already on the default branch. The
 * verification logic stays in one place; the Action just posts the file.
 */
export async function POST(req: NextRequest) {
    let body: { repo?: string; content?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
    }

    const parsed = parseRepo(body.repo ?? "");
    if (!parsed) {
        return NextResponse.json(
            { error: "Give a repository as owner/name or a github.com URL" },
            { status: 400 }
        );
    }

    if (typeof body.content !== "string" || body.content.length === 0) {
        return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    // A README large enough to matter is a few hundred lines; this is a public
    // endpoint, so cap it rather than check links in a megabyte of text.
    if (body.content.length > 500_000) {
        return NextResponse.json({ error: "content is too large" }, { status: 413 });
    }

    const { owner, repo } = parsed;
    const token = process.env.GITHUB_TOKEN;

    try {
        const frontDoor = await inspectFrontDoor(owner, repo, token);
        const findings = await verifyReadme({
            content: body.content,
            owner,
            repo,
            branch: frontDoor.evidence.defaultBranch,
            token,
        });

        return NextResponse.json(
            {
                owner,
                repo,
                healthPercentage: frontDoor.healthPercentage,
                missing: frontDoor.missing,
                decisions: ownerDecisions(frontDoor),
                findings,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in POST /api/front-door:", error);
        const message = error instanceof Error ? error.message : "Something went wrong";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
