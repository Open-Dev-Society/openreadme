"use client";

import { useState } from "react";
import Block from "./ui/Block";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import Link from "next/link";
import {
  Github,
  Twitter,
  CircleUser,
  Save,
  Loader2,
  Image as ImageIcon,
  Linkedin,
  Globe,
  Zap,
  FileQuestion,
  CheckCircle,
} from "lucide-react";
import type { Graph, StreakStats, UserStats } from "@/types";

export default function InputBlock({
  setName,
  setGithubURL,
  setTwitterURL,
  setImageUrl,
  setStats,
  setStreak,
  setGraph,
  setLinkedinURL,
  setPortfolioURL,
}: {
  setName: (name: string) => void;
  setGithubURL: (url: string) => void;
  setTwitterURL: (url: string) => void;
  setImageUrl: (url: string) => void;
  setStats: (stats: UserStats | undefined) => void;
  setStreak: (streak: StreakStats | undefined) => void;
  setGraph: (graph: Graph[] | undefined) => void;
  setLinkedinURL: (url: string) => void;
  setPortfolioURL: (url: string) => void;
}) {
  const [tUrl, setTUrl] = useState("");
  const [gUrl, setGUrl] = useState("");
  const [iUrl, setIUrl] = useState("");
  const [nameText, setNameText] = useState("");
  const [lUrl, setLUrl] = useState("");
  const [pUrl, setPUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState({
    name: false,
    github: false,
    twitter: false,
    linkedin: false,
    image: false,
    portfolio: false
  });

  const handleStats = async () => {
    setLoading(true);
    setGraph(undefined);
    setStats(undefined);
    setStreak(undefined);
    if (!gUrl) {
      toast.error("Github Username is required");
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel to improve performance
      const [statsPromise, streakPromise, graphPromise, profilePromise] = [
        fetch("/api/stats?&username=" + gUrl),
        fetch("/api/streak?&username=" + gUrl),
        fetch("/api/graph?username=" + gUrl),
        fetch("/api/user-profile?username=" + gUrl)
      ];

      // Wait for stats first to validate the username
      const statsResponse = await statsPromise;
      const statsData = await statsResponse.json();

      if (statsData.error) {
        toast.error(statsData.error || "Username not found");
        setLoading(false);
        return;
      }

      setStats(statsData.stats);

      // Process the other responses
      try {
        const streakResponse = await streakPromise;
        const streakData = await streakResponse.json();
        if (streakData.error) {
          toast.warning("Could not load streak data");
        } else {
          setStreak(streakData.stats);
        }
      } catch (streakError) {
        console.error("Streak fetch error:", streakError);
        toast.warning("Could not load streak data");
      }

      try {
        const graphResponse = await graphPromise;
        const graphData = await graphResponse.json();
        if (graphData.error) {
          toast.warning("Could not load graph data");
        } else {
          setGraph(graphData);
        }
      } catch (graphError) {
        console.error("Graph fetch error:", graphError);
        toast.warning("Could not load graph data");
      }

      setGithubURL(gUrl);
      setSaved(prev => ({ ...prev, github: true }));

      // Fill the fields the user hasn't typed from what GitHub already knows.
      // Anything they did type wins, so this never overwrites their work.
      const filled = {
        name: nameText,
        profilePic: iUrl,
        twitterUsername: tUrl,
        linkedinUsername: lUrl,
        portfolioUrl: pUrl,
      };

      try {
        const profileResponse = await profilePromise;
        const { profile } = await profileResponse.json();

        if (profile) {
          const autofill: [keyof typeof filled, string, (v: string) => void, (v: string) => void][] = [
            ["name", profile.name, setNameText, setName],
            ["profilePic", profile.profilePic, setIUrl, setImageUrl],
            ["twitterUsername", profile.twitterUsername, setTUrl, setTwitterURL],
            ["portfolioUrl", profile.portfolioUrl, setPUrl, setPortfolioURL],
          ];

          const autofilled: string[] = [];
          for (const [field, value, setLocal, setParent] of autofill) {
            if (filled[field] || !value) continue;
            filled[field] = value;
            setLocal(value);
            setParent(value);
            autofilled.push(field);
          }

          if (autofilled.length > 0) {
            setSaved(prev => ({
              ...prev,
              name: prev.name || autofilled.includes("name"),
              image: prev.image || autofilled.includes("profilePic"),
              twitter: prev.twitter || autofilled.includes("twitterUsername"),
              portfolio: prev.portfolio || autofilled.includes("portfolioUrl"),
            }));
            toast.info(`Filled ${autofilled.length} field${autofilled.length > 1 ? "s" : ""} from GitHub — edit any of them`);
          }
        }
      } catch (profileError) {
        console.error("Profile autofill error:", profileError);
        // Non-fatal: the user types the fields themselves, as before.
      }

      // Save all current profile data to the backend
      await saveUserProfile(gUrl, filled);

      toast.success("Github data loaded successfully");
    } catch (error) {
      console.error("GitHub data fetch error:", error);
      toast.error("Failed to load GitHub data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Values are passed in rather than read from state, because a caller that
  // just autofilled them would otherwise save the pre-autofill values.
  const saveUserProfile = async (
    username: string,
    values: {
      name: string;
      profilePic: string;
      twitterUsername: string;
      linkedinUsername: string;
      portfolioUrl: string;
    } = {
      name: nameText,
      profilePic: iUrl,
      twitterUsername: tUrl,
      linkedinUsername: lUrl,
      portfolioUrl: pUrl,
    }
  ) => {
    try {
      console.log("💾 Saving user profile for:", username);
      const response = await fetch("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          ...values,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("❌ Failed to save user profile:", data);
        toast.error(data.error || "Failed to save profile");
      } else {
        console.log("✅ Profile saved successfully:", data);
        toast.success("Profile data saved!");
      }
    } catch (error) {
      console.error("❌ Error saving user profile:", error);
      toast.error("Error saving profile data");
    }
  };

  const saveField = async (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    setSaved(prev => ({ ...prev, [field]: true }));
    
    // Save to backend if GitHub username is set
    if (gUrl) {
      await saveUserProfile(gUrl);
    }
    
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} saved`);
  };

  return (
    <>
      {/* Name */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <CircleUser className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CircleUser className="w-6 h-6" />
              {saved.name && <CheckCircle className="w-5 h-5 text-teal-200" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">Your Name</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/20 border-white/30 placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="Enter your name"
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-teal-600 border-0 right-1 top-1 hover:bg-teal-700 disabled:bg-teal-400/50"
                onClick={() => saveField('name', nameText, setName)}
                disabled={!nameText.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Block>

      {/* GitHub Username */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-gray-900 to-black hover:from-black hover:to-gray-900">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <Github className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Github className="w-6 h-6" />
              {saved.github && <CheckCircle className="w-5 h-5 text-gray-300" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">GitHub Username</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/10 border-white/20 placeholder:text-white/60 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="Enter username"
                value={gUrl}
                onChange={(e) => setGUrl(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-gray-800 border-0 right-1 top-1 hover:bg-gray-700 disabled:bg-gray-600/50"
                onClick={handleStats}
                disabled={!gUrl.trim() || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading GitHub data...
              </div>
            )}
          </div>
        </div>
      </Block>

      {/* Image URL */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <ImageIcon className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <ImageIcon className="w-6 h-6" />
              {saved.image && <CheckCircle className="w-5 h-5 text-orange-200" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">Profile Image</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/20 border-white/30 placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="Image URL"
                type="url"
                value={iUrl}
                onChange={(e) => setIUrl(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-orange-600 border-0 right-1 top-1 hover:bg-orange-700 disabled:bg-orange-400/50"
                onClick={() => saveField('image', iUrl, setImageUrl)}
                disabled={!iUrl.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Block>

      {/* Twitter */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <Twitter className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Twitter className="w-6 h-6" />
              {saved.twitter && <CheckCircle className="w-5 h-5 text-blue-200" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">Twitter Handle</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/20 border-white/30 placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="Twitter Username"
                value={tUrl}
                onChange={(e) => setTUrl(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-blue-600 border-0 right-1 top-1 hover:bg-blue-700 disabled:bg-blue-400/50"
                onClick={() => saveField('twitter', tUrl, setTwitterURL)}
                disabled={!tUrl.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Block>

      {/* LinkedIn */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <Linkedin className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Linkedin className="w-6 h-6" />
              {saved.linkedin && <CheckCircle className="w-5 h-5 text-blue-300" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">LinkedIn</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/20 border-white/30 placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="LinkedIn Username"
                value={lUrl}
                onChange={(e) => setLUrl(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-blue-800 border-0 right-1 top-1 hover:bg-blue-900 disabled:bg-blue-600/50"
                onClick={() => saveField('linkedin', lUrl, setLinkedinURL)}
                disabled={!lUrl.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Block>

      {/* Portfolio */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-20">
            <Globe className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Globe className="w-6 h-6" />
              {saved.portfolio && <CheckCircle className="w-5 h-5 text-purple-200" />}
            </div>
            <h2 className="mb-6 text-xl font-bold">Portfolio</h2>
            <div className="relative">
              <Input
                className="w-full h-12 pr-12 text-white bg-white/20 border-white/30 placeholder:text-white/70 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                placeholder="your-website.com"
                type="url"
                value={pUrl}
                onChange={(e) => setPUrl(e.target.value)}
              />
              <Button
                size="icon"
                className="absolute w-10 h-10 text-white transition-all duration-200 bg-purple-600 border-0 right-1 top-1 hover:bg-purple-700 disabled:bg-purple-400/50"
                onClick={() => saveField('portfolio', pUrl, setPortfolioURL)}
                disabled={!pUrl.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Block>

      {/* Documentation Card */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute bottom-4 right-4 opacity-20">
            <FileQuestion className="w-20 h-20 text-white" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <FileQuestion className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Need Help?</h2>
            </div>
            <p className="flex-1 mb-6 text-white/90">
              Check out our comprehensive guide for setup instructions and customization tips.
            </p>
            <Link
              href="/guide"
              className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold transition-all duration-200 border rounded-lg bg-emerald-600 hover:bg-emerald-700 backdrop-blur-sm border-white/20"
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Read Documentation
            </Link>
          </div>
        </div>
      </Block>

      {/* Contribute Card */}
      <Block className="col-span-12 overflow-hidden transition-all duration-300 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
        <div className="relative h-full p-6 text-white">
          {/* Background Icon */}
          <div className="absolute bottom-4 right-4 opacity-20">
            <Zap className="w-20 h-20 text-white" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Contribute</h2>
            </div>
            <p className="flex-1 mb-6 text-white/90">
              Create custom themes and help grow the Open Dev Society community!
            </p>
            <Link
              href="https://github.com/ravixalgorithm/openreadme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold transition-all duration-200 bg-pink-600 border rounded-lg hover:bg-pink-700 backdrop-blur-sm border-white/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Contributing
            </Link>
          </div>
        </div>
      </Block>
    </>
  );
}
