import type { Metadata } from "next";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Campfire",
  description: "Permissionless NFT launchpad on Solana. Royalties flow to holders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SolanaProvider>
          <Shell>{children}</Shell>
        </SolanaProvider>
      </body>
    </html>
  );
}
