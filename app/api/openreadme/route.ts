/* eslint-disable @typescript-eslint/no-explicit-any */
import fetchUserData from "@/actions/fetchUserData";
import { fetchContributions } from "@/actions/githubGraphql";
import { NextRequest, NextResponse } from "next/server"
import { generateContributionGraph } from "@/utils/generate-graph";
import { fetchYearContributions } from "@/actions/fetchYearContribution";
import { rateLimit } from "@/lib/rate-limit";
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';

export const maxDuration = 45;

// Security functions
function hashUsername(username: string): string {
    return crypto.createHash('sha256').update(username.toLowerCase()).digest('hex').substring(0, 12);
}

// Store user mapping in GitHub repository
async function storeUserMapping(username: string, hashedName: string): Promise<void> {
    try {
        const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_IMAGES;
        if (!githubToken) {
            throw new Error('GitHub token not configured');
        }

        const octokit = new Octokit({ auth: githubToken });
        const repoOwner = 'ravixalgorithm';
        const repoName = 'openreadme-images';
        const mappingFile = 'mappings/user-mappings.json';

        console.log(`📝 Storing user mapping for ${username} in ${repoOwner}/${repoName}:${mappingFile}`);

        // Get existing mappings
        let existingMappings: Record<string, string> = {};
        let currentSha = '';

        try {
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: mappingFile,
            });

            if (!Array.isArray(data) && 'content' in data) {
                currentSha = data.sha;
                const content = Buffer.from(data.content, 'base64').toString();
                existingMappings = JSON.parse(content);
            }
        } catch (error) {
            // File doesn't exist, start with empty mappings
            console.log('Creating new mappings file');
        }

        // Add new mapping
        existingMappings[username.toLowerCase()] = hashedName;

        // Update the file
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: mappingFile,
            message: `Add mapping for ${username}`,
            content: Buffer.from(JSON.stringify(existingMappings, null, 2)).toString('base64'),
            sha: currentSha || undefined
        });

        console.log(`✅ Stored mapping: ${username} -> ${hashedName}`);
    } catch (error) {
        console.error('❌ Failed to store user mapping:', error);
        throw error;
    }
}

// Get existing hashed username
async function getHashedUsername(username: string): Promise<string | null> {
    try {
        const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_IMAGES;
        if (!githubToken) {
            return null;
        }

        const octokit = new Octokit({ auth: githubToken });
        const repoOwner = 'ravixalgorithm';
        const repoName = 'openreadme-images';
        const mappingFile = 'mappings/user-mappings.json';

        const { data } = await octokit.repos.getContent({
            owner: repoOwner,
            repo: repoName,
            path: mappingFile,
        });

        if (!Array.isArray(data) && 'content' in data) {
            const content = Buffer.from(data.content, 'base64').toString();
            const mappings = JSON.parse(content);
            return mappings[username.toLowerCase()] || null;
        }

        return null;
    } catch (error) {
        // File doesn't exist or other error
        return null;
    }
}

async function generateSecureFileName(username: string): Promise<string> {
    const existingHash = await getHashedUsername(username);
    if (existingHash) {
        console.log(`✅ Found existing mapping for ${username} -> ${existingHash}`);
        return `profiles/${existingHash}.png`;
    }
    const hashed = hashUsername(username);
    try {
        await storeUserMapping(username, hashed);
        console.log(`✅ Created new mapping for ${username} -> ${hashed}`);
    } catch (error) {
        console.error(`❌ Failed to store mapping for ${username}:`, error);
        throw new Error(`Failed to create user mapping for ${username}`);
    }
    return `profiles/${hashed}.png`;
}

// Function to log usage statistics
async function logUserGeneration(username: string, githubToken: string): Promise<void> {
    try {
        const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || 'Open-Dev-Society';
        const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'openreadme';

        if (!githubToken) {
            console.warn('❌ No GitHub token provided, skipping stats logging');
            return;
        }

        console.log(`📊 Logging usage for ${username} to ${repoOwner}/${repoName}`);

        const octokit = new Octokit({ auth: githubToken });
        const statsFile = 'stats/usage-log.json';

        // Try to get existing stats
        let existingStats: any[] = [];
        let currentSha = '';

        try {
            const response = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: statsFile,
            });

            if (Array.isArray(response.data)) {
                const file = response.data.find((f: any) => f.name === 'usage-log.json');
                if (file && file.download_url) {
                    const content = await (await fetch(file.download_url)).text();
                    existingStats = JSON.parse(content);
                    currentSha = file.sha;
                }
            } else if ('content' in response.data) {
                const content = Buffer.from(response.data.content, 'base64').toString();
                existingStats = JSON.parse(content);
                currentSha = response.data.sha;
            }
        } catch (error: any) {
            if (error.status !== 404) {
                console.error('Error fetching stats file:', error);
                return;
            }
            console.log('Stats file does not exist, will create a new one');
        }

        // Add new entry
        const newEntry = {
            hashedUsername: hashUsername(username),
            actualUsername: username,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };

        existingStats.push(newEntry);

        // Keep only last 1000 entries
        if (existingStats.length > 1000) {
            existingStats = existingStats.slice(-1000);
        }

        // Update stats file
        const content = Buffer.from(JSON.stringify(existingStats, null, 2)).toString('base64');

        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: statsFile,
            message: `Update usage stats - ${new Date().toISOString()}`,
            content: content,
            sha: currentSha || undefined
        });

        console.log(`✅ Successfully logged usage for ${username} to stats/usage-log.json`);
    } catch (error) {
        console.error('❌ Stats logging failed (non-critical):', error);
        console.error('This means usage statistics will not be recorded, but image generation continues.');
        // Don't throw error - continue with image generation even if logging fails
    }
}

// Secure GitHub upload function
async function uploadToGitHubSafely(username: string, imageBuffer: Buffer, githubToken: string, version?: number): Promise<string> {
    try {
        const fileName = await generateSecureFileName(username);
        const octokit = new Octokit({ auth: githubToken });
        // Use ravixalgorithm for image storage repository
        const imageRepoOwner = 'ravixalgorithm';
        const imageRepoName = 'openreadme-images';

        // Try to get the file to get its SHA if it exists
        let sha: string | undefined;
        try {
            const { data } = await octokit.repos.getContent({
                owner: imageRepoOwner,
                repo: imageRepoName,
                path: fileName,
            });
            if (!Array.isArray(data) && 'sha' in data) {
                sha = data.sha;
            }
        } catch (error) {
            // File doesn't exist, which is fine
        }

        // Upload or update the file
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: imageRepoOwner,
            repo: imageRepoName,
            path: fileName,
            message: `Update profile image for ${username}${version ? ` (v${version})` : ''}`,
            content: imageBuffer.toString('base64'),
            sha: sha
        });

        // Return the raw content URL
        if (!data.content || !data.content.html_url) {
            throw new Error('Failed to get file URL from GitHub response');
        }
        return data.content.html_url
            .replace('https://github.com/', 'https://raw.githubusercontent.com/')
            .replace('/blob/', '/');

    } catch (error) {
        console.error('Error uploading to GitHub:', error);
        throw error;
    }
}

const isValidGitHubUsername = (u: string) =>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(u);

function extractUsername(req: NextRequest, body?: any) {
    const sp = req.nextUrl?.searchParams;
    const u = sp?.get("username") ??
        sp?.get("userName") ??
        sp?.get("user") ??
        sp?.get("u") ??
        sp?.get("github") ??
        sp?.get("gh") ??
        sp?.get("login") ??
        (body && (body.username ?? body.userName ?? body.user ?? body.u ?? body.github ?? body.gh ?? body.login));
    return typeof u === "string" ? u.trim() : "";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const username = extractUsername(req, body);

        if (!isValidGitHubUsername(username)) {
            return NextResponse.json(
                { error: "Valid GitHub username is required (2-39 characters)" },
                { status: 400 }
            );
        }

        // Rate limiting
        const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const rateLimitResult = rateLimit(clientIP, {
            windowMs: 10 * 60 * 1000, // 10 minutes
            maxRequests: 10
        });

        if (!rateLimitResult.allowed) {
            return new NextResponse(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    message: "Too many requests. Please wait before generating another image.",
                    retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
                }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const { searchParams } = new URL(req.url);
        const n = decodeURIComponent(searchParams.get("n") || "").trim();
        const g = decodeURIComponent(searchParams.get("g") || username).trim();
        const i = decodeURIComponent(searchParams.get("i") || "").trim();
        const x = decodeURIComponent(searchParams.get("x") || "").trim();
        const l = decodeURIComponent(searchParams.get("l") || "").trim();
        const p = decodeURIComponent(searchParams.get("p") || "").trim();

        // Validate image URL if provided
        if (i && !i.startsWith('https://')) {
            return new NextResponse(
                JSON.stringify({ error: "Image URL must use HTTPS" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log(`[${new Date().toISOString()}] 🎨 Generating image for user: ${g}`);

        // Fetch GitHub data
        let userStats: any = {};
        let contributionStats: any = {};
        let graphSVG = "";

        if (g) {
            try {
                const currentYear = new Date().getFullYear();
                const contributionDays = await fetchYearContributions(g, currentYear);
                graphSVG = generateContributionGraph(contributionDays);
                const userData = await fetchUserData(g);
                userStats = userData.userStats;
                contributionStats = await fetchContributions(g);
            } catch (error) {
                console.error("❌ Error fetching GitHub data:", error);
                userStats = {};
                contributionStats = {};
            }
        }

        // Generate HTML template matching BentoClassic.tsx design
         const html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8" />
    <title>Open Readme</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      body {
        font-family: 'Space Grotesk', sans-serif;
        margin: 0;
        padding: 20px 0;
        min-height: 100vh;
        box-sizing: border-box;
      }
      .contribution-graph {
        max-height: 200px;
        overflow: visible;
      }
      .main-container {
        width: 1160px;
        max-width: 1160px;
        margin: 0 auto;
        padding: 0 4px;
      }
      .grid-container {
        min-height: 1100px;
      }
      /* Fix icon sizes */
      .background-icon {
        opacity: 0.1 !important;
      }
      .foreground-icon {
        opacity: 1 !important;
      }
    </style>
  </head>
  <body class="bg-neutral-950 text-white">
    <div class="main-container">
      <div class="relative grid w-full grid-cols-12 gap-4 mx-auto mb-8 grid-container">

        <!-- Hero/Name Card -->
        <div class="col-span-12 row-span-2 md:col-span-4 lg:col-span-3 group">
          <div class="relative h-full min-h-[260px] p-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-2xl">
            <div class="absolute inset-0 opacity-20">
              <div class="absolute top-0 left-0 w-20 h-20 -translate-x-10 -translate-y-10 bg-white rounded-full animate-pulse"></div>
              <div class="absolute bottom-0 right-0 w-24 h-24 translate-x-12 translate-y-12 bg-white rounded-full animate-pulse"></div>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <div class="flex items-center justify-between">
                <i data-lucide="sparkles" class="w-6 h-6 text-yellow-300 animate-pulse foreground-icon"></i>
                <div class="px-3 py-1 text-lg font-medium rounded-full bg-white/20 backdrop-blur">Developer</div>
              </div>
              <div>
                <p class="mb-2 text-xl font-medium opacity-90">Hello, I'm</p>
                <h1 class="text-5xl font-bold leading-tight">${n || "Your Name"}</h1>
                <p class="mt-3 text-white/80 text-md">Building the future, one commit at a time</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Image -->
        <div class="col-span-12 row-span-3 md:col-span-8 lg:col-span-6 group">
          <div class="relative h-full min-h-[300px] overflow-hidden rounded-3xl shadow-2xl">
            ${i ? `<img src="${i}" alt="${n || 'Profile'}" class="object-cover w-full h-full" style="width: 100%; height: 100%;" />` : `
              <div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-800">
                <div class="text-center text-gray-600 dark:text-gray-300">
                  <i data-lucide="user" class="w-16 h-16 mx-auto mb-4 foreground-icon"></i>
                  <p class="text-lg font-medium">Add your profile image</p>
                  <p class="mt-2 text-sm opacity-75">Upload an image URL in the form above</p>
                </div>
              </div>
            `}
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            <!-- Floating info card -->
            <div class="absolute bottom-6 left-6 right-6">
              <div class="p-4 border bg-white/10 backdrop-blur-md rounded-2xl border-white/20">
                <div class="flex items-center justify-between text-white">
                  <div>
                    <p class="text-sm opacity-80">GitHub Profile</p>
                    <p class="font-semibold">@${g || "username"}</p>
                  </div>
                  <i data-lucide="github" class="w-5 h-5 foreground-icon"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Social Links Grid -->
        <div class="grid grid-cols-1 col-span-12 row-span-3 gap-4 lg:col-span-3">
          <!-- Twitter -->
          <div class="group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl overflow-hidden shadow-lg">
            <div class="absolute -top-2 -right-2 background-icon">
              <i data-lucide="twitter" class="w-12 h-12"></i>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <i data-lucide="twitter" class="w-5 h-5 foreground-icon"></i>
              <div>
                <p class="text-md opacity-80">Follow me on</p>
                <p class="font-semibold text-xl">@${x || "twitter"}</p>
              </div>
            </div>
          </div>

          <!-- LinkedIn -->
          <div class="group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl overflow-hidden shadow-lg">
            <div class="absolute -top-2 -right-2 background-icon">
              <i data-lucide="linkedin" class="w-12 h-12"></i>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <i data-lucide="linkedin" class="w-5 h-5 foreground-icon"></i>
              <div>
                <p class="text-md opacity-80">Connect on</p>
                <p class="font-semibold text-xl">${l || "LinkedIn"}</p>
              </div>
            </div>
          </div>

          <!-- Portfolio -->
          <div class="group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl overflow-hidden shadow-lg">
            <div class="absolute -top-2 -right-2 background-icon">
              <i data-lucide="globe" class="w-12 h-12"></i>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <i data-lucide="globe" class="w-5 h-5 foreground-icon"></i>
              <div>
                <p class="text-md opacity-80">Visit</p>
                <p class="font-semibold text-xl truncate">${p ? (p.startsWith("https://") ? p.replace("https://", "") : p) : "Portfolio"}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Stars - Hero Card -->
        <div class="col-span-12 row-span-2 md:col-span-6 lg:col-span-4">
          <div class="relative h-full min-h-[200px] p-6 bg-gradient-to-br from-yellow-600 to-orange-700 rounded-3xl overflow-hidden shadow-xl">
            <div class="absolute inset-0 background-icon opacity-70">
              <i data-lucide="star" class="absolute w-6 h-6 text-yellow-300 animate-pulse" style="top: 20%; left: 10%;"></i>
              <i data-lucide="star" class="absolute w-6 h-6 text-yellow-300 animate-pulse" style="top: 35%; left: 30%; animation-delay: 0.5s;"></i>
              <i data-lucide="star" class="absolute w-6 h-6 text-yellow-300 animate-pulse" style="top: 50%; left: 50%; animation-delay: 1s;"></i>
              <i data-lucide="star" class="absolute w-6 h-6 text-yellow-300 animate-pulse" style="top: 65%; left: 70%; animation-delay: 1.5s;"></i>
              <i data-lucide="star" class="absolute w-6 h-6 text-yellow-300 animate-pulse" style="top: 80%; left: 90%; animation-delay: 2s;"></i>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <div class="flex items-center gap-2">
                <span class="text-3xl font-medium">Total Stars</span>
              </div>
              <div>
                <div class="mb-2 font-bold text-7xl">${userStats["Star Earned"] || "0"}</div>
                <p class="text-white/80 text-md">Stars earned across repositories</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Mini Grid -->
        <div class="grid grid-cols-2 col-span-12 row-span-2 gap-4 md:col-span-6 lg:col-span-4">
          <!-- Commits -->
          <div class="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl">
            <i data-lucide="git-commit" class="absolute w-24 h-24 text-green-300 opacity-100 -top-2 right-2"></i>
            <div class="relative z-10 text-white top-1/2">
              <div class="text-5xl font-bold">${userStats.Commits || "0"}</div>
              <p class="text-md opacity-80">Commits</p>
            </div>
          </div>

          <!-- Pull Requests -->
          <div class="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
            <i data-lucide="git-pull-request" class="absolute w-24 h-24 text-pink-300 opacity-100 top-2 right-2"></i>
            <div class="relative z-10 text-white top-1/2">
              <div class="text-5xl font-bold">${userStats["Pull Requests"] || "0"}</div>
              <p class="text-md opacity-80">Pull Requests</p>
            </div>
          </div>

          <!-- Followers -->
          <div class="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
            <i data-lucide="users" class="absolute w-24 h-24 text-white top-2 right-2 opacity-20"></i>
            <div class="relative z-10 text-white top-1/2">
              <div class="text-5xl font-bold">${userStats.Followers || "0"}</div>
              <p class="text-md opacity-80">Followers</p>
            </div>
          </div>

          <!-- Contributed To -->
          <div class="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl">
            <i data-lucide="git-branch" class="absolute w-24 h-24 text-white top-2 right-2 opacity-20"></i>
            <div class="relative z-10 text-white top-1/2">
              <div class="text-5xl font-bold">${userStats["Contributed To"] || "0"}</div>
              <p class="text-md opacity-80">Contributed To</p>
            </div>
          </div>
        </div>

        <!-- Streak Stats -->
        <div class="grid col-span-12 grid-rows-3 row-span-2 gap-4 lg:col-span-4">
          <!-- Current Streak -->
          <div class="relative row-span-2 p-6 overflow-hidden shadow-xl bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl">
            <div class="absolute inset-0 text-orange-500 opacity-100">
              <i data-lucide="flame" class="absolute w-24 h-24 top-4 right-4"></i>
            </div>
            <div class="relative z-10 flex flex-col justify-between h-full text-white">
              <div class="flex items-center gap-2">
                <span class="font-medium">Current Streak</span>
              </div>
              <div>
                <div class="mb-1 font-bold text-7xl">${contributionStats.currentStreak || "0"}</div>
                <p class="text-md text-white/80">days</p>
              </div>
            </div>
          </div>

          <!-- Longest Streak -->
          <div class="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl">
            <i data-lucide="trophy" class="absolute w-12 h-12 text-white opacity-100 top-2 right-2"></i>
            <div class="relative z-10 text-white">
              <div class="text-3xl font-bold">${contributionStats.longestStreak || "0"}</div>
              <p class="text-md opacity-80">Longest Streak</p>
            </div>
          </div>
        </div>

        <!-- Contribution Graph -->
        <div class="col-span-12 row-span-1">
          <div class="relative h-full min-h-[280px] p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-xl">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <i data-lucide="calendar" class="w-5 h-5 text-green-400 foreground-icon"></i>
                <h3 class="text-2xl font-semibold text-white">Contribution Graph</h3>
              </div>
              <div class="flex items-center gap-2 text-lg text-gray-400">
                <span>Less</span>
                <div class="flex gap-1">
                  <div class="w-3 h-3 rounded-sm" style="background-color: #0d1117"></div>
                  <div class="w-3 h-3 rounded-sm" style="background-color: #0e4429"></div>
                  <div class="w-3 h-3 rounded-sm" style="background-color: #006d32"></div>
                  <div class="w-3 h-3 rounded-sm" style="background-color: #26a641"></div>
                  <div class="w-3 h-3 rounded-sm" style="background-color: #39d353"></div>
                </div>
                <span>More</span>
              </div>
            </div>
            <div class="contribution-graph w-full h-full overflow-visible">
              ${graphSVG}
            </div>
          </div>
        </div>

        <!-- Open Dev Society Branding -->
        <div class="absolute z-20 -bottom-4 -right-2">
          <div class="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg transform -rotate-3">
            <p class="text-xl font-medium text-white">Powered by <span class="font-bold">Open Dev Society</span></p>
          </div>
        </div>

    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script>lucide.createIcons();</script>
  </body>
</html>`;

        if (!process.env.GITHUB_TOKEN) {
            throw new Error("GitHub token not configured");
        }

        // Launch browser and capture screenshot
        console.log('🚀 Starting browser launch...');
        const isProduction = process.env.NODE_ENV === 'production';
        const isVercel = !!process.env.VERCEL;
        console.log(`Environment: ${isProduction ? 'production' : 'development'}, Vercel: ${isVercel}`);

        let browser: any;
        try {
            if (isVercel || isProduction) {
                console.log('📦 Loading Chromium for production...');
                const chromium = await import('@sparticuz/chromium');
                const puppeteerCore = await import('puppeteer-core');
                browser = await puppeteerCore.default.launch({
                    args: chromium.default.args,
                    defaultViewport: { width: 1400, height: 1800 },
                    executablePath: await chromium.default.executablePath(),
                    headless: true,
                });
                console.log('✅ Chromium browser launched successfully');
            } else {
                console.log('💻 Loading Puppeteer for development...');
                const puppeteerLocal = await import('puppeteer');
                browser = await puppeteerLocal.default.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ],
                    defaultViewport: { width: 1400, height: 1800 },
                    headless: true,
                });
                console.log('✅ Local Puppeteer browser launched successfully');
            }

            console.log('📄 Creating new page...');
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 1.5 });

            console.log('🎨 Setting page content...');
            await page.setContent(html, { waitUntil: "networkidle0" });

            console.log('📸 Taking screenshot...');
            const screenshot = await page.screenshot({ type: "png", fullPage: true }) as Buffer;
            console.log(`✅ Screenshot captured: ${screenshot.length} bytes`);

            await browser.close();
            console.log('🔒 Browser closed successfully');

            // Get version from query params if provided
            const versionParam = req.nextUrl.searchParams.get('v');
            const version = versionParam ? parseInt(versionParam, 10) : undefined;

            // Upload to GitHub
            try {
                const uploadToken = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_IMAGES;
                if (!uploadToken) {
                    throw new Error("GitHub token not configured");
                }

                const imageUrl = await uploadToGitHubSafely(g, screenshot, uploadToken, version);
                console.log('✅ Image uploaded to GitHub:', imageUrl);

                // Log usage statistics
                await logUserGeneration(g, uploadToken);

                return new NextResponse(JSON.stringify({
                    url: imageUrl,
                    method: "github_upload",
                    message: "Image successfully uploaded to GitHub",
                    user: g
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=3600",
                    },
                });
            } catch (uploadError: any) {
                console.error("❌ GitHub upload failed:", uploadError);
                const base64 = screenshot.toString('base64');

                // Still log usage even if upload failed
                const uploadToken = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_IMAGES;
                if (uploadToken) {
                    await logUserGeneration(g, uploadToken);
                }

                return new NextResponse(JSON.stringify({
                    url: `data:image/png;base64,${base64}`,
                    method: "base64_fallback",
                    message: "GitHub upload failed, using base64 fallback",
                    warning: "Base64 images may not display properly in GitHub README",
                    error: uploadError instanceof Error ? uploadError.message : String(uploadError)
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=300",
                    },
                });
            }
        } catch (browserError: any) {
            console.error("💥 Browser error:", browserError);
            return new NextResponse(JSON.stringify({
                error: "Browser initialization failed",
                message: browserError instanceof Error ? browserError.message : String(browserError),
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (error: any) {
        console.error("💥 Image generation error:", error);
        return new NextResponse(JSON.stringify({
            error: "Failed to generate image",
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Use consistent token for both image upload and stats logging
const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_IMAGES;

function ghHeaders() {
    return {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('github');

        console.log('Received request for user:', username);
        console.log('Request URL:', req.url);

        if (!username || !isValidGitHubUsername(username)) {
            console.error('Invalid username:', username);
            return NextResponse.json(
                { error: "Valid GitHub username is required (2-39 characters)" },
                { status: 400 }
            );
        }

        if (!githubToken) {
            console.error('Missing GitHub token');
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || 'Open-Dev-Society';
        const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'openreadme';
        const statsFile = 'stats/usage-log.json';

        try {
            const octokit = new Octokit({ auth: githubToken });

            // First, check if the repository exists
            try {
                await octokit.repos.get({
                    owner: repoOwner,
                    repo: repoName
                });
            } catch (error: any) {
                if (error.status === 404) {
                    console.error(`Repository ${repoOwner}/${repoName} not found`);
                    return NextResponse.json(
                        {
                            error: "Repository not found",
                            message: `The repository ${repoOwner}/${repoName} does not exist or is not accessible`
                        },
                        { status: 404 }
                    );
                }
                throw error;
            }

            // If we get here, the repository exists, try to get the file
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: statsFile,
            });

            if (Array.isArray(data) || !('content' in data)) {
                throw new Error('Unexpected response from GitHub API');
            }

            const content = Buffer.from(data.content, 'base64').toString();
            return NextResponse.json(JSON.parse(content));

        } catch (error: any) {
            if (error.status === 404) {
                // File doesn't exist, return empty array
                console.log('Stats file does not exist, returning empty array');
                return NextResponse.json([]);
            }

            console.error('Error fetching stats:', error);
            return NextResponse.json(
                {
                    error: "Failed to fetch statistics",
                    message: error.message,
                    details: error.status === 403 ?
                        "Access denied. Please check your GitHub token permissions." :
                        "An error occurred while fetching statistics"
                },
                { status: error.status || 500 }
            );
        }
    } catch (error: any) {
        console.error("💥 Error in GET handler:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
