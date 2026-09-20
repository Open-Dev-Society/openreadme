/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo } from "react";
import { Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    AlertTriangle,
    Calendar,
    Clipboard,
    Download,
    FileText,
    Flame,
    GitBranch,
    Github,
    GitPullRequest,
    Link2,
    Linkedin,
    Loader2,
    Star,
    Trophy,
    Twitter,
    Users,
    X,
    Globe,
    Code2,
    GitCommit,
    Sparkles,
    User as UserIcon,
    Zap
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Graph, StreakStats, UserStats } from "@/types";
import { generateContributionGraph } from "@/utils/generate-graph";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { TextShimmer } from "../ui/text-shimmer";

// Import React explicitly
import * as React from 'react';

const space = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "300", "600", "700", "500"],
});

interface OpenReadmeGridProps {
    name: string;
    githubURL: string;
    twitterURL: string;
    linkedinURL: string;
    imageUrl: string;
    stats: UserStats | undefined;
    streak: StreakStats | undefined;
    graph: Graph[] | undefined;
    portfolioUrl: string;
    theme: string; // Theme is now part of the props
}

const OpenReadmeGrid: React.FC<OpenReadmeGridProps> = ({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    imageUrl,
    stats,
    streak,
    graph,
    portfolioUrl,
    theme
}) => {
    const [imageLink, setImageLink] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getColor = (value: number) => {
        switch (value) {
            case 0:
                return "#0d1117";
            case 1:
                return "#0e4429";
            case 2:
                return "#006d32";
            case 3:
                return "#26a641";
            case 4:
                return "#39d353";
            default:
                return "#161b22";
        }
    };

    const handleDownload = async () => {
        try {
            const yamlLink = document.createElement("a");
            yamlLink.href = "/update-openreadme.yml";
            yamlLink.download = "update-openreadme.yml";
            document.body.appendChild(yamlLink);
            yamlLink.click();
            document.body.removeChild(yamlLink);
            window.URL.revokeObjectURL(yamlLink.href);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const response = await fetch("/get-openreadme.ts.template");
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.statusText}`);
            }

            let fileContent = await response.text();

            const apiUrl = `${window.location.origin}/api/openreadme?n=${encodeURIComponent(
                name,
            )}&g=${encodeURIComponent(githubURL)}&x=${encodeURIComponent(
                twitterURL,
            )}&l=${encodeURIComponent(linkedinURL)}&i=${encodeURIComponent(
                imageUrl || ''
            )}&p=${encodeURIComponent(portfolioUrl || '')}`;

            fileContent = `const apiUrl = "${apiUrl}";\n` + fileContent;

            const blob = new Blob([fileContent], { type: "text/typescript" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "get-openreadme.ts";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Files downloaded successfully");
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Error downloading file");
        }
    };

    const handleGenerateLink = async () => {
        if (isGenerated) {
            setIsOpen(true);
            return;
        }
        setLoading(true);
        setIsGenerated(false);

        // Build the API URL with all parameters
        const params = new URLSearchParams({
            n: name || '',
            i: imageUrl || '',
            g: githubURL || '',
            x: twitterURL || '',
            l: linkedinURL || '',
            p: portfolioUrl || '',
            t: theme
        });

    const apiURL = `/api/openreadme?${params.toString()}`;

    try {
        const res = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                github: githubURL // Also pass username in body as fallback
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        }

        setImageLink(data.url);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
        });
        setIsGenerated(true);
        setIsOpen(true);
    } catch (error) {
        console.error("Error generating or uploading the image:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
        setLoading(false);
    }
};

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(`![OpenReadme](${imageLink})`);
        toast.success("Copied to clipboard");
    };

    return (
        <div className={cn("w-full md:max-w-7xl mx-auto md:px-4", space.className)}>
            <div className="relative grid w-full grid-cols-12 gap-4 mx-auto mb-8">
                {/* Hero/Name Card - Enhanced */}
                <div className="col-span-12 row-span-2 md:col-span-4 lg:col-span-3 group">
                    <div className="relative h-full min-h-[280px] p-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-32 h-32 -translate-x-16 -translate-y-16 bg-white rounded-full animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-40 h-40 delay-1000 translate-x-20 translate-y-20 bg-white rounded-full animate-pulse"></div>
                        </div>

                        <div className="relative z-10 flex flex-col justify-between h-full text-white">
                            <div className="flex items-center justify-between">
                                <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                                <div className="px-3 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur">
                                    Developer
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-lg font-medium opacity-90">Hello, I'm</p>
                                <h1 className="text-4xl font-bold leading-tight">
                                    {name || "Your Name"}
                                </h1>
                                <p className="mt-3 text-white/80">
                                    Building the future, one commit at a time
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Image - Enhanced */}
                <div className="col-span-12 row-span-3 md:col-span-8 lg:col-span-6 group">
                    <div className="relative h-full min-h-[400px] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-300 hover:scale-[1.01]">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={name || "Profile"}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                    console.error("Image failed to load:", imageUrl);
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-800">
                                <div className="text-center text-gray-600 dark:text-gray-300">
                                    <UserIcon className="w-20 h-20 mx-auto mb-4" />
                                    <p className="text-lg font-medium">Add your profile image</p>
                                    <p className="mt-2 text-sm opacity-75">Upload an image URL in the form above</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        {/* Floating info card */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="p-4 border bg-white/10 backdrop-blur-md rounded-2xl border-white/20">
                                <div className="flex items-center justify-between text-white">
                                    <div>
                                        <p className="text-sm opacity-80">GitHub Profile</p>
                                        <p className="font-semibold">@{githubURL || "username"}</p>
                                    </div>
                                    <Github className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Links - Enhanced Grid */}
                <div className="grid grid-cols-1 col-span-12 row-span-3 gap-4 lg:col-span-3">
                    {/* Twitter */}
                    <a
                        href={twitterURL ? `https://twitter.com/${twitterURL}` : "#"}
                        className={`group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${!twitterURL ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <div className="absolute -top-4 -right-4 opacity-20">
                            <Twitter size={80} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full text-white">
                            <Twitter className="w-6 h-6" />
                            <div>
                                <p className="text-sm opacity-80">Follow me on</p>
                                <p className="font-semibold">@{twitterURL || "twitter"}</p>
                            </div>
                        </div>
                    </a>

                    {/* LinkedIn */}
                    <a
                        href={linkedinURL ? `https://linkedin.com/in/${linkedinURL}` : "#"}
                        className={`group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${!linkedinURL ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <div className="absolute -top-4 -right-4 opacity-20">
                            <Linkedin size={80} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full text-white">
                            <Linkedin className="w-6 h-6" />
                            <div>
                                <p className="text-sm opacity-80">Connect on</p>
                                <p className="font-semibold">{linkedinURL}</p>
                            </div>
                        </div>
                    </a>

                    {/* Portfolio */}
                    <a
                        href={portfolioUrl || "#"}
                        className={`group relative h-full min-h-[120px] p-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${!portfolioUrl ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <div className="absolute -top-4 -right-4 opacity-20">
                            <Globe size={80} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full text-white">
                            <Globe className="w-6 h-6" />
                            <div>
                                <p className="text-sm opacity-80">Visit </p>
                                <p className="font-semibold truncate">{portfolioUrl}</p>
                            </div>
                        </div>
                    </a>
                </div>

                {/* Stats Grid - Enhanced */}
                {stats && (
                    <>
                        {/* Total Stars - Hero Card */}
                        <div className="col-span-12 row-span-2 md:col-span-6 lg:col-span-4">
                            <div className="relative h-full min-h-[200px] p-8 bg-gradient-to-br from-yellow-600 to-orange-700 rounded-3xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-[1.02]">
                                <div className="absolute inset-0 opacity-70">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`absolute w-8 h-8 text-yellow-300 animate-pulse`}
                                            style={{
                                                top: `${20 + i * 15}%`,
                                                left: `${10 + i * 20}%`,
                                                animationDelay: `${i * 0.5}s`
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                    <div className="flex items-center gap-2">

                                        <span className="text-3xl font-medium">Total Stars</span>
                                    </div>
                                    <div>
                                        <div className="mb-2 font-bold text-7xl">
                                            {stats["Star Earned"] || "0"}
                                        </div>
                                        <p className="text-white/80">Stars earned across repositories</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Mini Grid */}
                        <div className="grid grid-cols-2 col-span-12 row-span-2 gap-4 md:col-span-6 lg:col-span-4">
                            {/* Commits */}
                            <div className="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl">
                                <GitCommit className="absolute w-24 h-24 text-green-300 opacity-100 -top-2 right-2" />
                                <div className="relative z-10 text-white top-1/2">
                                    <div className="text-5xl font-bold">{stats.Commits || "0"}</div>
                                    <p className="text-xs opacity-80">Commits</p>
                                </div>
                            </div>

                            {/* Pull Requests */}
                            <div className="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                                <GitPullRequest className="absolute w-24 h-24 text-pink-300 opacity-100 top-2 right-2" />
                                <div className="relative z-10 text-white top-1/2">

                                    <div className="text-5xl font-bold">{stats["Pull Requests"] || "0"}</div>
                                    <p className="text-xs opacity-80">Pull Requests</p>
                                </div>
                            </div>

                            {/* Followers */}
                            <div className="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                                <Users className="absolute w-24 h-24 text-white top-2 right-2 opacity-20" />
                                <div className="relative z-10 text-white top-1/2">
                                    <div className="text-5xl font-bold">{stats.Followers || "0"}</div>
                                    <p className="text-xs opacity-80">Followers</p>
                                </div>
                            </div>

                            {/* Contributed To */}
                            <div className="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl">
                                <GitBranch className="absolute w-24 h-24 text-white top-2 right-2 opacity-20" />
                                <div className="relative z-10 text-white top-1/2">
                                    <div className="text-5xl font-bold">{stats["Contributed To"] || "0"}</div>
                                    <p className="text-xs opacity-80">Contributed To</p>
                                </div>
                            </div>
                        </div>

                        {/* Streak Stats */}
                        <div className="grid col-span-12 grid-rows-3 row-span-2 gap-4 lg:col-span-4">
                            {/* Current Streak */}
                            <div className="relative row-span-2 p-6 overflow-hidden shadow-xl bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl">
                                <div className="absolute inset-0 text-orange-500 opacity-100 ">
                                    <Flame className="absolute w-24 h-24 top-4 right-4" />
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Current Streak</span>
                                    </div>
                                    <div>
                                        <div className="mb-1 font-bold text-7xl">
                                            {streak?.currentStreak || "0"}
                                        </div>
                                        <p className="text-sm text-white/80">days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Longest Streak */}
                            <div className="relative p-4 overflow-hidden shadow-lg bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl">
                                <Trophy className="absolute w-12 h-12 text-white opacity-100 top-2 right-2" />
                                <div className="relative z-10 text-white">
                                    <div className="text-3xl font-bold">{streak?.longestStreak || "0"}</div>
                                    <p className="text-xs opacity-80">Longest Streak</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Contribution Graph - Enhanced */}
                {graph && (
                    <div className="col-span-12 row-span-1">
                        <div className="relative h-full min-h-[300px] p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-6 h-6 text-green-400" />
                                    <h3 className="text-xl font-semibold text-white">
                                        Contribution Graph
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4].map((value) => (
                                            <div
                                                key={value}
                                                className="w-3 h-3 rounded-sm"
                                                style={{ backgroundColor: getColor(value) }}
                                            />
                                        ))}
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>
                            <div
                                className="contribution-graph"
                                dangerouslySetInnerHTML={{
                                    __html: generateContributionGraph(graph),
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Open Dev Society Branding - Enhanced */}
                <div className="absolute z-20 -bottom-2 -right-2">
                    <div className="px-4 py-2 transition-all duration-300 transform shadow-lg bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl -rotate-3 hover:rotate-0 hover:scale-105">
                        <p className="text-xs font-medium text-white">
                            Powered by{" "}
                            <span className="font-bold">Open Dev Society</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Generate Button Section - Enhanced */}
            {githubURL && (
                <div className="flex flex-col items-center justify-center w-full gap-4 mb-8">
                    <Button
                        onClick={handleGenerateLink}
                        size="lg"
                        className="px-8 py-6 text-lg font-semibold text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-2xl hover:scale-105 hover:shadow-2xl"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-2" />
                                Generate README Image
                            </>
                        )}
                    </Button>

                    {loading && (
                        <TextShimmer className="text-sm tracking-wide text-muted-foreground">
                            Creating your beautiful profile... This may take up to 10 seconds
                        </TextShimmer>
                    )}

                    {/* Enhanced Alert Dialog */}
                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                        <AlertDialogContent className="max-w-3xl overflow-hidden border-gray-700 shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl">
                            <AlertDialogHeader className="relative pb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10"></div>
                                <AlertDialogTitle className="relative mb-2 text-3xl font-bold text-white">
                                    🎉 Your Open Readme is Ready!
                                </AlertDialogTitle>
                                <p className="relative text-gray-300">
                                    Your beautiful GitHub profile has been generated successfully
                                </p>
                                <Button
                                    variant="ghost"
                                    className="absolute top-0 right-0 text-gray-400 hover:text-white"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </AlertDialogHeader>


                            {/* Embed Link Section - Enhanced */}
                            <div className="mb-6 space-y-3">
                                <div className="flex items-center gap-2 text-white">
                                    <Link2 className="w-5 h-5" />
                                    <h3 className="text-lg font-semibold">README Embed Code</h3>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Copy and paste this into your GitHub README.md file
                                </p>
                                <div className="relative">
                                    <Input
                                        value={`[![OpenReadme](${imageLink})](${typeof window !== 'undefined' ? window.location.origin : ''})`}
                                        readOnly
                                        className="pr-16 font-mono text-sm text-white bg-gray-800 border-gray-600"
                                    />
                                    <Button
                                        onClick={copyToClipboard}
                                        className="absolute h-8 px-3 bg-teal-600 top-1 right-1 hover:bg-teal-700"
                                    >
                                        <Clipboard className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>



                            {/* Footer Actions - Enhanced */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                <Link
                                    href="/guide"
                                    className="inline-flex items-center gap-2 text-sm text-teal-400 transition-colors hover:text-teal-300"
                                >
                                    <FileText className="w-4 h-4" />
                                    Guide
                                </Link>

                                <Button
                                    variant="ghost"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Close
                                </Button>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
};

export default OpenReadmeGrid;
