export type Phase = {
  name: string;
  price: string;
  maxPerWallet: number;
  supply: number | "Remaining";
  status: "active" | "upcoming" | "ended";
  startDate: string;
};

export type RoadmapItem = {
  quarter: string;
  title: string;
  description: string;
  done: boolean;
};

export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  images: string[];
  supply: number;
  minted: number;
  royaltyFee: number;
  /** Share of the collection's royalty that goes to stakers (%) */
  holderShare: number;
  /** Share of the collection's royalty that goes to the collection team (%) */
  teamShare: number;
  status: "minting" | "finished" | "abandoned";
  /** If abandoned, collection is available for CTO */
  ctoAvailable?: boolean;
  /** Who performed the CTO, if applicable */
  ctoBy?: string;
  phases: Phase[];
  roadmap: RoadmapItem[];
  socials: { twitter?: string; discord?: string; website?: string };
};

/**
 * Platform-level royalty cut from EVERY collection on Campfire.
 * This is 1% of every secondary sale, split evenly:
 *  - 0.5% to BOIS holders
 *  - 0.5% to Campfire team
 *
 * This is ON TOP of the collection's own royalty fee.
 * Example: Collection has 10% royalty fee.
 *  - 1% goes to Campfire platform (0.5% BOIS + 0.5% team)
 *  - 9% is split between collection stakers and collection team per holderShare/teamShare
 */
export const PLATFORM_CUT = 1; // 1% of every sale
export const BOIS_CUT = 0.5;   // 0.5% to BOIS holders
export const RW_TEAM_CUT = 0.5; // 0.5% to Campfire team

export const collections: Collection[] = [
  {
    slug: "shadow-ronin",
    name: "Shadow Ronin",
    tagline: "Masterless warriors of the digital frontier.",
    description:
      "Shadow Ronin is a collection of 5,000 unique warriors that roam the blockchain. Each Ronin carries the weight of a forgotten oath and the skill of a thousand battles. Born from the fusion of traditional Japanese art and futuristic cyberpunk aesthetics, these warriors are more than art -they're a statement. Holding a Shadow Ronin means you stand with the crew. You earn from every trade, every flip, every move the market makes.",
    images: ["/collections/sr-1.png", "/collections/sr-2.png", "/collections/sr-3.png", "/collections/sr-4.png"],
    supply: 5000,
    minted: 3247,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "minting",
    phases: [
      { name: "OG", price: "0.3 SOL", maxPerWallet: 3, supply: 500, status: "ended", startDate: "2026-04-01" },
      { name: "Whitelist", price: "0.4 SOL", maxPerWallet: 5, supply: 1500, status: "ended", startDate: "2026-04-05" },
      { name: "Public", price: "0.5 SOL", maxPerWallet: 10, supply: "Remaining", status: "active", startDate: "2026-04-10" },
    ],
    roadmap: [
      { quarter: "Q2 2026", title: "Launch & Mint", description: "Shadow Ronin collection goes live on Campfire. OG, WL, and Public phases.", done: true },
      { quarter: "Q2 2026", title: "Staking Goes Live", description: "Staking pool opens. Holders start earning royalties from secondary sales.", done: false },
      { quarter: "Q3 2026", title: "Lore Chapters", description: "First lore drop -interactive story chapters driven by holder votes.", done: false },
      { quarter: "Q4 2026", title: "Merch & IRL", description: "Physical merch line and IRL events for holders.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/" },
  },
  {
    slug: "pixel-samurai",
    name: "Pixel Samurai",
    tagline: "8-bit honor in a high-res world.",
    description:
      "Pixel Samurai brings retro pixel art to the Solana blockchain. 3,333 samurai, each hand-crafted in a nostalgic 32x32 pixel style with over 150 unique traits. From legendary katanas to rare armor sets, every samurai tells a story of honor, battle, and loyalty. The collection pays homage to classic gaming while pushing the boundaries of onchain culture.",
    images: ["/collections/ps-1.png", "/collections/ps-2.png", "/collections/ps-3.png", "/collections/ps-4.png"],
    supply: 3333,
    minted: 1891,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "minting",
    phases: [
      { name: "OG", price: "0.5 SOL", maxPerWallet: 2, supply: 333, status: "ended", startDate: "2026-04-08" },
      { name: "Whitelist", price: "0.65 SOL", maxPerWallet: 3, supply: 1000, status: "active", startDate: "2026-04-12" },
      { name: "Public", price: "0.8 SOL", maxPerWallet: 5, supply: "Remaining", status: "upcoming", startDate: "2026-04-16" },
    ],
    roadmap: [
      { quarter: "Q2 2026", title: "Mint Launch", description: "Pixel Samurai drops on Campfire with 3-phase mint.", done: true },
      { quarter: "Q2 2026", title: "Staking Activation", description: "Staking pool goes live after mint completes.", done: false },
      { quarter: "Q3 2026", title: "Pixel Battles", description: "PvP battle system where samurai traits determine outcomes.", done: false },
      { quarter: "Q4 2026", title: "Expansion Pack", description: "New trait drops and crossover collaborations.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/", website: "https://pixelsamurai.io" },
  },
  {
    slug: "neon-drifters",
    name: "Neon Drifters",
    tagline: "Street racers of the neon underground.",
    description:
      "Neon Drifters is a 10,000 piece generative collection inspired by underground racing culture and cyberpunk aesthetics. Each drifter is algorithmically generated with over 200 traits -from custom ride modifications to neon-lit cityscapes. The collection features dynamic metadata that evolves based on community milestones. Built for the culture, fueled by the community.",
    images: ["/collections/nd-1.png", "/collections/nd-2.png", "/collections/nd-3.png", "/collections/nd-4.png"],
    supply: 10000,
    minted: 4520,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "minting",
    phases: [
      { name: "OG", price: "0.15 SOL", maxPerWallet: 5, supply: 1000, status: "ended", startDate: "2026-04-06" },
      { name: "Whitelist", price: "0.2 SOL", maxPerWallet: 5, supply: 3000, status: "ended", startDate: "2026-04-09" },
      { name: "Public", price: "0.25 SOL", maxPerWallet: 20, supply: "Remaining", status: "active", startDate: "2026-04-12" },
    ],
    roadmap: [
      { quarter: "Q2 2026", title: "Genesis Drop", description: "10,000 Neon Drifters hit the streets of Campfire.", done: true },
      { quarter: "Q3 2026", title: "The Garage", description: "NFT customization system -modify your drifter's ride.", done: false },
      { quarter: "Q3 2026", title: "Race Leagues", description: "Competitive racing leagues with SOL prize pools.", done: false },
      { quarter: "Q4 2026", title: "Neon City", description: "Virtual world for Drifter holders to explore and earn.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/" },
  },
  {
    slug: "void-walkers",
    name: "Void Walkers",
    tagline: "Travelers of the space between spaces.",
    description:
      "Void Walkers is a sold-out collection of 2,222 interdimensional beings that traverse the void between realities. Each Walker is a unique combination of cosmic energy, ancient artifacts, and void-touched mutations. The collection explores themes of existentialism, cosmic horror, and the beauty found in absolute nothingness.",
    images: ["/collections/vw-1.png", "/collections/vw-2.png", "/collections/vw-3.png", "/collections/vw-4.png"],
    supply: 2222,
    minted: 2222,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "finished",
    phases: [
      { name: "OG", price: "0.8 SOL", maxPerWallet: 2, supply: 222, status: "ended", startDate: "2026-03-01" },
      { name: "Whitelist", price: "1.0 SOL", maxPerWallet: 3, supply: 800, status: "ended", startDate: "2026-03-05" },
      { name: "Public", price: "1.2 SOL", maxPerWallet: 5, supply: "Remaining", status: "ended", startDate: "2026-03-08" },
    ],
    roadmap: [
      { quarter: "Q1 2026", title: "Void Opens", description: "2,222 Void Walkers emerge from the void. Sold out in 4 hours.", done: true },
      { quarter: "Q2 2026", title: "Staking Live", description: "Void Walker staking pool is active. Holders earning royalties.", done: true },
      { quarter: "Q3 2026", title: "Void Expeditions", description: "Holders send their Walkers on expeditions for bonus rewards.", done: false },
      { quarter: "Q4 2026", title: "Dimension Rift", description: "Cross-collection event with other Campfire collections.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/" },
  },
  {
    slug: "astral-apes",
    name: "Astral Apes",
    tagline: "Primates ascending to the cosmos.",
    description:
      "Astral Apes is a community-driven collection of 5,555 cosmic primates. Inspired by the primate NFT culture but taken to an entirely new dimension -literally. Each ape has been touched by astral energy, transforming them into beings of pure cosmic potential. The collection is fully sold out and actively earning royalties for stakers.",
    images: ["/collections/aa-1.png", "/collections/aa-2.png", "/collections/aa-3.png", "/collections/aa-4.png"],
    supply: 5555,
    minted: 5555,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "finished",
    phases: [
      { name: "OG", price: "0.25 SOL", maxPerWallet: 3, supply: 555, status: "ended", startDate: "2026-02-15" },
      { name: "Whitelist", price: "0.35 SOL", maxPerWallet: 5, supply: 2000, status: "ended", startDate: "2026-02-18" },
      { name: "Public", price: "0.4 SOL", maxPerWallet: 10, supply: "Remaining", status: "ended", startDate: "2026-02-20" },
    ],
    roadmap: [
      { quarter: "Q1 2026", title: "Astral Launch", description: "5,555 apes launch into the cosmos. Sold out in 12 hours.", done: true },
      { quarter: "Q1 2026", title: "Staking Active", description: "Staking pool live. Ape holders earning from every trade.", done: true },
      { quarter: "Q2 2026", title: "BananaDAO", description: "Community governance DAO for collection decisions.", done: true },
      { quarter: "Q3 2026", title: "Astral Breeding", description: "Breed two apes to create a new generation.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/", website: "https://astralapes.xyz" },
  },
  {
    slug: "crystal-punks",
    name: "Crystal Punks",
    tagline: "Forged in crystal. Built to last.",
    description:
      "Crystal Punks is a 4,444 piece collection of crystalline humanoids, each formed from unique mineral combinations found deep within the blockchain. The art merges geological beauty with punk aesthetics, creating characters that are both raw and refined. Crystal Punks was the first sold-out collection on Campfire.",
    images: ["/collections/cp-1.png", "/collections/cp-2.png", "/collections/cp-3.png", "/collections/cp-4.png"],
    supply: 4444,
    minted: 4444,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "finished",
    phases: [
      { name: "OG", price: "0.4 SOL", maxPerWallet: 2, supply: 444, status: "ended", startDate: "2026-01-20" },
      { name: "Whitelist", price: "0.5 SOL", maxPerWallet: 4, supply: 1500, status: "ended", startDate: "2026-01-23" },
      { name: "Public", price: "0.6 SOL", maxPerWallet: 8, supply: "Remaining", status: "ended", startDate: "2026-01-25" },
    ],
    roadmap: [
      { quarter: "Q1 2026", title: "Crystal Genesis", description: "4,444 Crystal Punks forged. First Campfire sold-out.", done: true },
      { quarter: "Q1 2026", title: "Staking Activated", description: "Staking pool live since day 1. Holders earning royalties.", done: true },
      { quarter: "Q2 2026", title: "Crystal Forge", description: "Combine crystals to upgrade traits and rarity.", done: true },
      { quarter: "Q3 2026", title: "Crystal Wars", description: "PvP system with crystal-based powers.", done: false },
    ],
    socials: { twitter: "https://x.com/", discord: "https://discord.gg/" },
  },
  // Abandoned collection -available for CTO
  {
    slug: "ghost-protocol",
    name: "Ghost Protocol",
    tagline: "They vanished. The art remains.",
    description:
      "Ghost Protocol was a 3,000 piece collection that launched strong but was abandoned by its original team after mint. The art is solid, the community is still here, and the collection is now available for Community Takeover. If you want to take the lead and revive Ghost Protocol, reach out to the Campfire team.",
    images: ["/collections/gp-1.png", "/collections/gp-2.png", "/collections/gp-3.png", "/collections/gp-4.png"],
    supply: 3000,
    minted: 3000,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "abandoned",
    ctoAvailable: true,
    phases: [
      { name: "OG", price: "0.3 SOL", maxPerWallet: 3, supply: 300, status: "ended", startDate: "2026-01-10" },
      { name: "Public", price: "0.5 SOL", maxPerWallet: 10, supply: "Remaining", status: "ended", startDate: "2026-01-12" },
    ],
    roadmap: [
      { quarter: "Q1 2026", title: "Launch", description: "3,000 Ghosts minted. Collection launched on Campfire.", done: true },
      { quarter: "Q1 2026", title: "Team Goes Silent", description: "Original team stopped responding. Community left hanging.", done: true },
      { quarter: "TBD", title: "Awaiting CTO", description: "Collection is available for Community Takeover. New leadership wanted.", done: false },
    ],
    socials: {},
  },
  {
    slug: "dead-pixels",
    name: "Dead Pixels",
    tagline: "Broken screens, broken promises.",
    description:
      "Dead Pixels was an ambitious pixel art collection of 2,000 NFTs. The original artist delivered incredible work but couldn't sustain the project solo. The community rallied but without leadership the project stalled. Now available for CTO -the art speaks for itself, it just needs someone to carry the torch.",
    images: ["/collections/dp-1.png", "/collections/dp-2.png", "/collections/dp-3.png", "/collections/dp-4.png"],
    supply: 2000,
    minted: 2000,
    royaltyFee: 10,
    holderShare: 80,
    teamShare: 20,
    status: "abandoned",
    ctoAvailable: true,
    phases: [
      { name: "Public", price: "0.2 SOL", maxPerWallet: 10, supply: 2000, status: "ended", startDate: "2025-12-15" },
    ],
    roadmap: [
      { quarter: "Q4 2025", title: "Mint", description: "2,000 Dead Pixels minted in a single public phase.", done: true },
      { quarter: "Q1 2026", title: "Project Stalled", description: "Solo artist couldn't sustain. Project needs new leadership.", done: true },
      { quarter: "TBD", title: "Awaiting CTO", description: "Open for Community Takeover. Contact Campfire team to claim.", done: false },
    ],
    socials: {},
  },
];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}
