"use client";

import Link from "next/link";
import { Github, Menu, X } from "lucide-react";
import Block from "./ui/Block";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className="overflow-x-clip">
            <Block className="sticky top-0 z-50 flex items-center justify-between col-span-12 mb-8 leading-snug bg-secondary/30 backdrop-blur-md">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Open Readme Logo"
                            width={32}
                            height={32}
                            className="w-12 h-6 sm:w-16 sm:h-8"
                        />
                        <p className="text-lg font-black sm:text-xl lg:text-2xl">
                            Open ReadMe
                        </p>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="items-center hidden gap-6 md:flex lg:gap-10">
                    <Link
                        href="/dashboard"
                        className="font-semibold transition-all duration-300 hover:underline hover:text-primary lg:text-lg"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/check"
                        className="font-semibold transition-all duration-300 hover:underline hover:text-primary lg:text-lg"
                    >
                        Check
                    </Link>
                    <Link
                        href="/guide"
                        className="font-semibold transition-all duration-300 hover:underline hover:text-primary lg:text-lg"
                    >
                        Guide
                    </Link>
                    <Link
                        href="/about"
                        className="font-semibold transition-all duration-300 hover:underline hover:text-primary lg:text-lg"
                    >
                        About
                    </Link>
                    <Link
                        href="https://github.com/open-dev-society/openreadme"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 font-semibold transition-all duration-300 group hover:underline hover:text-primary lg:text-lg"
                    >
                        <Github className="w-5 h-5 transition-colors lg:w-6 lg:h-6 group-hover:text-primary" />
                        GitHub
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="p-2 transition-colors rounded-lg md:hidden hover:bg-secondary/50"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>
            </Block>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                        onClick={closeMenu}
                    />

                    {/* Mobile Menu */}
                    <div className="fixed top-0 right-0 z-50 h-full p-6 transform bg-black border-l shadow-2xl w-80 border-teal-500/30 md:hidden">
                        {/* Mobile Menu Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/logo.png"
                                    alt="Open Readme Logo"
                                    width={24}
                                    height={24}
                                    className="w-12 h-6"
                                />
                                <h3 className="text-lg font-bold text-white">Open ReadMe</h3>
                            </div>
                            <button
                                onClick={closeMenu}
                                className="p-2 transition-colors rounded-lg hover:bg-gray-800"
                                aria-label="Close menu"
                            >
                                <X className="w-6 h-6 text-teal-500" />
                            </button>
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="space-y-1">
                            <Link
                                href="/dashboard"
                                onClick={closeMenu}
                                className="block px-4 py-3 text-base font-medium text-gray-300 transition-all duration-200 rounded-lg hover:bg-gray-800 hover:text-teal-400"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/check"
                                onClick={closeMenu}
                                className="block px-4 py-3 text-base font-medium text-gray-300 transition-all duration-200 rounded-lg hover:bg-gray-800 hover:text-teal-400"
                            >
                                Check
                            </Link>
                            <Link
                                href="/guide"
                                onClick={closeMenu}
                                className="block px-4 py-3 text-base font-medium text-gray-300 transition-all duration-200 rounded-lg hover:bg-gray-800 hover:text-teal-400"
                            >
                                Guide
                            </Link>
                            <Link
                                href="/about"
                                onClick={closeMenu}
                                className="block px-4 py-3 text-base font-medium text-gray-300 transition-all duration-200 rounded-lg hover:bg-gray-800 hover:text-teal-400"
                            >
                                About
                            </Link>
                            <Link
                                href="https://github.com/open-dev-society/openreadme"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMenu}
                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-300 transition-all duration-200 rounded-lg hover:bg-gray-800 hover:text-teal-400"
                            >
                                <Github className="w-5 h-5" />
                                GitHub
                            </Link>
                        </nav>

                        {/* Mobile Menu Footer */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="p-4 border rounded-lg bg-gray-900/50 border-teal-500/30">
                                <p className="text-sm text-gray-400">
                                    Built with ❤️ by{" "}
                                    <span className="font-semibold text-teal-400">@ravixalgorithm</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
