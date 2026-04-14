import type { Metadata } from "next";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";
import RugNav from "@/components/RugNav";

export const metadata: Metadata = {
  title: "Rug World",
  description: "The curated NFT launchpad with built-in royalty sharing. Stake NFTs, earn royalties.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SolanaProvider>
          <RugNav />
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
