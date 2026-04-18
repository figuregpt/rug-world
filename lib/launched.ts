// Persist real, on-chain launched collections to localStorage.
// Replaces the mock data in lib/collections.ts for the launchpad + stake pages.
//
// Until we have a backend, this is per-browser only. The Campfire admin
// panel will eventually read from a server-side index instead.

export type LaunchedPhase = {
  name: string;
  price: string; // SOL
  supply: string; // "" or "0" means uses remaining
  maxPerWallet: string; // "0" means unlimited
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

export type LaunchedCollection = {
  // On-chain identifiers
  collectionAddress: string;
  collectionUri: string; // Arweave metadata URI
  creatorWallet: string;
  txSignature: string;
  network: "devnet" | "mainnet-beta";
  cluster: "devnet" | "mainnet-beta";

  // Display data (mirrored from launch form / studio)
  slug: string;
  name: string;
  tagline: string;
  description: string;
  supply: number;
  preMintCount: number;
  royaltyFee: number;
  holderShare: number;
  teamShare: number;

  // Live mint state
  minted: number;

  // Phase config (off-chain for now, enforced by admin/backend later)
  phases: LaunchedPhase[];

  status: "minting" | "finished" | "abandoned";
  launchedAt: string;
};

const STORE_KEY = "campfire:launched";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listLaunched(): LaunchedCollection[] {
  if (typeof window === "undefined") return [];
  return safeParse<LaunchedCollection[]>(localStorage.getItem(STORE_KEY), []);
}

export function getLaunched(slug: string): LaunchedCollection | undefined {
  return listLaunched().find((c) => c.slug === slug);
}

export function getLaunchedByAddress(address: string): LaunchedCollection | undefined {
  return listLaunched().find((c) => c.collectionAddress === address);
}

export function saveLaunched(col: LaunchedCollection) {
  if (typeof window === "undefined") return;
  const existing = listLaunched();
  const filtered = existing.filter(
    (c) => c.collectionAddress !== col.collectionAddress
  );
  filtered.push(col);
  localStorage.setItem(STORE_KEY, JSON.stringify(filtered));
}

export function updateLaunched(
  address: string,
  patch: Partial<LaunchedCollection>
) {
  if (typeof window === "undefined") return;
  const existing = listLaunched();
  const next = existing.map((c) =>
    c.collectionAddress === address ? { ...c, ...patch } : c
  );
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
}

export function clearLaunched() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORE_KEY);
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "collection"
  );
}
