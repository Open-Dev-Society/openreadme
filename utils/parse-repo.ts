/** Accepts "owner/repo", a github.com URL, or a git clone URL. */
export function parseRepo(input: string): { owner: string; repo: string } | null {
    const trimmed = input.trim().replace(/\.git$/, "");

    const fromUrl = trimmed.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
    if (fromUrl) return { owner: fromUrl[1], repo: fromUrl[2] };

    const bare = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (bare) return { owner: bare[1], repo: bare[2] };

    return null;
}
