"use client";

import { useState } from "react";
import {
    Clipboard,
    FileText,
    Link2,
    Loader2,
    X,
    Zap,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { TextShimmer } from "./ui/text-shimmer";
import { toast } from "sonner";
import Link from "next/link";
import confetti from "canvas-confetti";

// Generating the image and handing back the embed snippet is the same job for
// every theme, so it lives here instead of once per theme component.
export default function GenerateBar({
    name,
    githubURL,
    twitterURL,
    linkedinURL,
    imageUrl,
    portfolioUrl,
    theme,
}: {
    name: string;
    githubURL: string;
    twitterURL: string;
    linkedinURL: string;
    imageUrl: string;
    portfolioUrl: string;
    theme: string;
}) {
    const [imageLink, setImageLink] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleGenerateLink = async () => {
        if (isGenerated) {
            setIsOpen(true);
            return;
        }
        setLoading(true);
        setIsGenerated(false);

        const params = new URLSearchParams({
            n: name || '',
            i: imageUrl || '',
            g: githubURL || '',
            x: twitterURL || '',
            l: linkedinURL || '',
            p: portfolioUrl || '',
            t: theme
        });

        try {
            const res = await fetch(`/api/openreadme?${params.toString()}`, {
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

    if (!githubURL) return null;

    return (
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
    );
}
