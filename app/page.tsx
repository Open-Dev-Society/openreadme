import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Github,
  Star,
  Users,
  Zap,
  Palette,
  RefreshCw,
  Code,
  ArrowRight,
  Play,
  ExternalLink
} from "lucide-react";
import { Highlight } from "@/components/ui/highlight";
import Odsbranding from "@/components/Odsbranding";

export default function Home() {
  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Multiple Themes",
      description: "Choose from beautiful, customizable themes for your profile"
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Daily Auto-Updates",
      description: "Your profile refreshes automatically every day at midnight UTC"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Static URLs",
      description: "One permanent link that always stays up-to-date"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "100% Open Source",
      description: "Free forever, transparent, and community-driven"
    }
  ];

  const testimonials = [
    {
      name: "Ravi Pratap Singh",
      role: "Founder, Open Dev Society",
      username: "@ravixalgorithm",
      avatar: "https://avatars.githubusercontent.com/ravixalgorithm",
      quote: "I built Open Readme because I wanted every developer to have a beautiful, professional GitHub profile without the hassle. It's completely free, updates automatically, and built with love for the community. Seeing developers showcase their work beautifully makes it all worth it!",
      link: "https://github.com/ravixalgorithm"
    },
    {
      name: "Priyanshu Bhardwaj",
      role: "Co-Founder, Open Dev Society",
      username: "@priyanshucosmos",
      avatar: "https://avatars.githubusercontent.com/priyanshucosmos",
      quote: "Open Readme represents what open source should be—accessible, powerful, and community-first. It's amazing to see how a simple idea has evolved into a tool that helps developers worldwide present their best work. The automated workflow makes it effortless!",
      link: "https://github.com/priyanshucosmos"
    }
  ];

  const stats = [
    { label: "GitHub Stars", value: "100+", icon: <Star className="w-5 h-5" /> },
    { label: "Active Users", value: "200+", icon: <Users className="w-5 h-5" /> },
    { label: "Open Source", value: "100%", icon: <Github className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 h-32 -translate-x-1/2 rounded-full left-1/2 w-96 bg-primary/10 blur-3xl" />
          <div className="absolute w-64 h-64 rounded-full top-20 right-1/4 bg-purple-500/5 blur-3xl" />
          <div className="absolute bottom-0 rounded-full left-1/4 w-80 h-80 bg-teal-500/5 blur-3xl" />
        </div>

        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium border rounded-full bg-secondary/50 border-secondary backdrop-blur-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span>Open Source README Toolkit</span>
            <Github className="w-4 h-4" />
          </div>

          {/* Hero Text */}
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            Your README is making <br/>
            <Highlight className="text-transparent bg-gradient-to-r from-teal-500 to-purple-600 bg-clip-text">
              promises
            </Highlight>
          </h1>

          <p className="max-w-3xl mx-auto mb-8 text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl">
            Dead links, badges for workflows you deleted, star counts from last year,
            a licence that says three different things.
            <span className="font-semibold text-foreground"> OpenReadme finds what stopped being true, and writes what is missing.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 mb-12 sm:flex-row">
            <Button asChild size="lg" className="px-8 py-6 text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600">
              <Link href="/check" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Check a repository
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold text-teal-600 border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/20">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Profile cards
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="text-teal-500">{stat.icon}</div>
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Community Badge */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Initiative by</span>
            <Odsbranding />
          </div>
        </div>
      </section>

      {/* Demo Image Section */}
      <section className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">See It In Action</h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Transform your GitHub profile with beautiful, customizable grids that showcase your work
          </p>
        </div>

        <div className="relative">
          {/* Demo Image Container */}
          <div className="relative overflow-hidden shadow-2xl rounded-2xl bg-gradient-to-br from-muted/50 to-muted">
            <Image
              src="/home.png"
              alt="Open Readme Demo - Beautiful GitHub Profile Grid"
              width={1200}
              height={800}
              className="object-cover w-full h-auto"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Floating Elements */}
          <div className="absolute px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-full shadow-lg -top-4 -left-4">
            ✨ Live Preview
          </div>
          <div className="absolute px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-full shadow-lg -bottom-4 -right-4">
            🚀 Auto-Generated
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Why Choose <span className="text-teal-500">Open Readme</span>?
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-muted-foreground">
            Built by developers, for developers. Experience the future of GitHub profiles.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="relative group">
              <div className="p-8 transition-all duration-300 border bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-2xl border-secondary hover:border-teal-500/50 group-hover:shadow-xl group-hover:shadow-teal-500/10">
                <div className="mb-4 text-teal-500 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            From the <span className="text-teal-500">Founders</span>
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-muted-foreground">
            Built with passion by developers who care about the community
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="relative group">
              <div className="h-full p-8 transition-all duration-300 border bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-2xl border-secondary hover:border-teal-500/50 group-hover:shadow-xl group-hover:shadow-teal-500/10">
                {/* Quote Icon */}
                <div className="mb-6 text-6xl text-teal-500/20">&ldquo;
                </div>
                
                {/* Quote */}
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                  {testimonial.quote}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <a href={testimonial.link} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="rounded-full ring-2 ring-teal-500/20"
                    />
                  </a>
                  <div>
                    <a href={testimonial.link} target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-teal-500">
                      {testimonial.name}
                    </a>
                    <p className="text-sm text-teal-500">{testimonial.role}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.username}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="p-8 border from-teal-950/20 to-purple-950/20 rounded-3xl md:p-12 border-teal-800/50">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Join the Community
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-lg text-muted-foreground">
              Be part of the open source movement. Contribute, customize, and create together.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild className="font-semibold text-white bg-teal-500 hover:bg-teal-600">
                <a href="https://github.com/open-dev-society/openreadme" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Star on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="font-semibold text-purple-700 border-purple-300 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30">
                <Link href="/about">
                  Learn More About ODS
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to Transform Your Profile?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-muted-foreground">
            Get started in minutes. No credit card required. Forever free and open source.
          </p>

          <Button asChild size="lg" className="px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Zap className="w-6 h-6" />
              Start Building Now
              <ArrowRight className="w-6 h-6" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
