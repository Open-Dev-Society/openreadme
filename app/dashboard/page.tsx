"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import InputBlock from "@/components/InputBlock";
import ThemeSelector from "@/components/ThemeSelector";
import { getThemeComponent, type ThemeId } from "@/themes";
import type { Graph, StreakStats, UserStats } from "@/types";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [githubURL, setGithubURL] = useState("");
  const [linkedinURL, setLinkedinURL] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [twitterURL, setTwitterURL] = useState("");
  const [portfolioURL, setPortfolioURL] = useState("");

  const [stats, setStats] = useState<UserStats | undefined>(undefined);
  const [streak, setStreak] = useState<StreakStats | undefined>(undefined);
  const [graph, setGraph] = useState<Graph[] | undefined>(undefined);

  const [theme, setTheme] = useState<ThemeId>("bento1"); // Ensure "bento1" is a valid ThemeId
  const ThemedGrid = getThemeComponent(theme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Navbar />

      <div className="px-4 pt-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-transparent text-white sm:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Create Your Profile
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
            Fill in your details to generate a beautiful GitHub profile README
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-12">
          <h2 className="flex items-center gap-2 mb-6 text-2xl font-semibold">
            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-teal-500 rounded-full">
              1
            </div>
            Your Information
          </h2>
          <div className="grid w-full grid-cols-12 gap-6 mx-auto max-w-7xl grid-flow-dense">
            <InputBlock
              setName={setName}
              setGithubURL={setGithubURL}
              setTwitterURL={setTwitterURL}
              setImageUrl={setImageUrl}
              setStats={setStats}
              setStreak={setStreak}
              setGraph={setGraph}
              setLinkedinURL={setLinkedinURL}
              setPortfolioURL={setPortfolioURL}
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="mb-8">
          <div className="flex flex-col items-start justify-between mb-6 md:items-center md:flex-row">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-purple-500 rounded-full">
                2
              </div>
              Preview & Generate
            </h2>
            <ThemeSelector value={theme} onChange={setTheme} />
          </div>

          <div className="p-2 border md:p-8 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl border-secondary">
            <ThemedGrid
              name={name}
              githubURL={githubURL}
              twitterURL={twitterURL}
              linkedinURL={linkedinURL}
              imageUrl={imageUrl}
              stats={stats}
              streak={streak}
              graph={graph}
              portfolioUrl={portfolioURL}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
