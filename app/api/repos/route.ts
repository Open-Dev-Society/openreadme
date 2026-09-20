import { NextRequest, NextResponse } from "next/server";
import { githubGraphql } from "@/actions/githubGraphql";

export interface RepoSummary {
    name: string;
    description: string;
    url: string;
    homepage: string;
    stars: number;
    language: string;
    languages: string[];
    archived: boolean;
}

const PINNED_QUERY = `
  query ($username: String!) {
    user(login: $username) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
            stargazerCount
            isArchived
            primaryLanguage { name }
            languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
              nodes { name }
            }
          }
        }
      }
    }
  }
`;

// What someone pinned is the projects list they already curated, and it reaches
// repositories they don't own — an org's work does not show up under /users/x/repos,
// so a founder's best project is missing from it entirely.
async function fetchPinned(username: string): Promise<RepoSummary[]> {
    try {
        const data = await githubGraphql({
            query: PINNED_QUERY,
            variables: { username },
        });

        const nodes = data?.user?.pinnedItems?.nodes ?? [];
        return nodes
            .filter((node: unknown) => node && typeof node === "object")
            .map((node: Record<string, any>) => ({
                name: String(node.name ?? ""),
                description: String(node.description ?? ""),
                url: String(node.url ?? ""),
                homepage: String(node.homepageUrl ?? ""),
                stars: Number(node.stargazerCount ?? 0),
                language: String(node.primaryLanguage?.name ?? ""),
                // Every language in the repo, not just the primary one: a stack row
                // built from primaries alone says "TypeScript" and nothing else.
                languages: (node.languages?.nodes ?? [])
                    .map((lang: { name?: string }) => String(lang?.name ?? ""))
                    .filter(Boolean),
                archived: Boolean(node.isArchived),
            }));
    } catch (error) {
        console.warn(`Pinned lookup for ${username} failed:`, error);
        return [];
    }
}

// The projects table people hand-maintain, with star counts that are true at the
// moment they paste it. One REST call: sorting and filtering happen here rather
// than costing another round trip.
export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username")?.trim();

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    try {
        const pinned = await fetchPinned(username);
        if (pinned.length > 0) {
            return NextResponse.json({ repos: pinned, source: "pinned" }, { status: 200 });
        }

        const res = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "OpenReadme",
                    ...(process.env.GITHUB_TOKEN
                        ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                        : {}),
                },
                next: { revalidate: 900 },
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: `GitHub returned ${res.status}` },
                { status: res.status === 404 ? 404 : 502 }
            );
        }

        const raw = await res.json();

        const repos: RepoSummary[] = raw
            // A fork someone never touched is not a project they should lead with.
            .filter((repo: { fork: boolean }) => !repo.fork)
            .map((repo: Record<string, unknown>) => ({
                name: String(repo.name ?? ""),
                description: String(repo.description ?? ""),
                url: String(repo.html_url ?? ""),
                homepage: String(repo.homepage ?? ""),
                stars: Number(repo.stargazers_count ?? 0),
                language: String(repo.language ?? ""),
                languages: repo.language ? [String(repo.language)] : [],
                archived: Boolean(repo.archived),
            }))
            .sort((a: RepoSummary, b: RepoSummary) => b.stars - a.stars);

        return NextResponse.json({ repos, source: "owned" }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/repos:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
