import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import Header from "@/Components/Header";

export const metadata: Metadata = {
  title: "Token Storm | Multi-Recipient ERC20 Airdrop Platform",
  description: "Ultra gas-efficient ERC20 multi-recipient token airdrop and batch distribution dApp.",
  icons: {
    icon: "/T-Sender.svg",
  },
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500 selection:text-zinc-950">
        <Providers>
          <Header />
          <main>{props.children}</main>
        </Providers>
      </body>
    </html>
  );
}
