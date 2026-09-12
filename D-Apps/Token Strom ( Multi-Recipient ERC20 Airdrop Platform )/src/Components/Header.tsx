"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"

export default function Header() {
    return (
        <nav className="px-6 sm:px-8 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 flex flex-row justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-6">
                <a href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20">
                        <Image src="/T-Sender.svg" alt="TSender" width={28} height={28} priority />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                            Token Storm
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                v2.0
                            </span>
                        </h1>
                    </div>
                </a>

                <a
                    href="https://github.com/AdityaSharma262/PROJECTS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 text-zinc-400 hover:text-white hidden md:flex items-center gap-2 text-xs"
                    title="View Source on GitHub"
                >
                    <FaGithub className="h-4 w-4" />
                    <span>GitHub</span>
                </a>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 px-3.5 py-1.5 rounded-full border border-zinc-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Gas-optimized multi-recipient ERC20 airdrop platform</span>
            </div>

            <div className="flex items-center gap-4">
                <ConnectButton
                    showBalance={false}
                    accountStatus={{
                        smallScreen: "avatar",
                        largeScreen: "full",
                    }}
                />
            </div>
        </nav>
    )
}