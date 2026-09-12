"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { WagmiProvider } from "wagmi"
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import config from "@/rainbowKitConfig"
import "@rainbow-me/rainbowkit/styles.css"

export function Providers(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: "#06b6d4",
                        accentColorForeground: "#09090b",
                        borderRadius: "large",
                        overlayBlur: "small",
                    })}
                >
                    {props.children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}