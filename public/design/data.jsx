// data.jsx — mock collections + stats for the prototype

const COLLECTIONS = [
  { id: "ottoman-echoes",  name: "Ottoman Echoes",   creator: "atelier.sol",   status: "Live",     supply: 5000, minted: 3247, price: 0.5,  floor: 0.68, vol24: 142.3, chg: 12.4, stakers: 1843, royalty: 10, share: 80, v: 1, verified: true },
  { id: "kilim-society",    name: "Kilim Society",     creator: "nomad.dao",    status: "Live",     supply: 3333, minted: 2901, price: 0.8,  floor: 1.21, vol24: 98.7,  chg: -3.1, stakers: 1207, royalty: 10, share: 75, v: 2, verified: true },
  { id: "anatolia-gen",     name: "Anatolia Genesis",  creator: "loom.labs",    status: "Live",     supply: 2222, minted: 1456, price: 1.2,  floor: 1.55, vol24: 76.2,  chg: 22.0, stakers: 812,  royalty: 12, share: 90, v: 3, verified: true },
  { id: "thread-count",     name: "Thread Count",      creator: "warp.studio",  status: "Live",     supply: 7500, minted: 6210, price: 0.25, floor: 0.31, vol24: 54.1,  chg: 4.2,  stakers: 2112, royalty: 8,  share: 70, v: 4, verified: false },
  { id: "dye-room",         name: "The Dye Room",      creator: "indigo.art",   status: "Live",     supply: 1000, minted: 994,  price: 2.5,  floor: 3.40, vol24: 210.0, chg: 38.5, stakers: 620,  royalty: 15, share: 85, v: 5, verified: true },
  { id: "serpent-garden",   name: "Serpent Garden",    creator: "sultan.eth",   status: "Live",     supply: 4000, minted: 1820, price: 0.6,  floor: 0.72, vol24: 33.4,  chg: -8.2, stakers: 441,  royalty: 10, share: 80, v: 6, verified: false },
  { id: "medallion-vol-ii", name: "Medallion, Vol. II",creator: "atelier.sol",  status: "Upcoming", supply: 3000, minted: 0,    price: 0.9,  floor: 0,    vol24: 0,     chg: 0,    stakers: 0,    royalty: 10, share: 80, v: 2, verified: true, in: "2d 14h" },
  { id: "prayer-rug",       name: "Prayer Rug",        creator: "minbar.dao",   status: "Upcoming", supply: 1111, minted: 0,    price: 1.5,  floor: 0,    vol24: 0,     chg: 0,    stakers: 0,    royalty: 10, share: 100, v: 3, verified: true, in: "5d 2h" },
  { id: "flatweave",        name: "Flatweave",         creator: "warp.studio",  status: "Upcoming", supply: 2500, minted: 0,    price: 0.4,  floor: 0,    vol24: 0,     chg: 0,    stakers: 0,    royalty: 10, share: 70, v: 4, verified: false, in: "9d 20h"},
  { id: "caravan",          name: "Caravan",           creator: "silkroad.sol", status: "Ended",    supply: 2000, minted: 2000, price: 0.7,  floor: 1.08, vol24: 12.3,  chg: 1.1,  stakers: 1450, royalty: 10, share: 80, v: 5, verified: true },
  { id: "turkish-delight",  name: "Turkish Delight",   creator: "bazaar.sol",   status: "Ended",    supply: 5555, minted: 5555, price: 0.3,  floor: 0.44, vol24: 8.7,   chg: -0.8, stakers: 3200, royalty: 10, share: 80, v: 6, verified: false },
  { id: "warp-weft",        name: "Warp & Weft",       creator: "loom.labs",    status: "Ended",    supply: 1500, minted: 1500, price: 1.0,  floor: 1.88, vol24: 44.2,  chg: 9.4,  stakers: 900,  royalty: 10, share: 85, v: 1, verified: true },
];

const STATS = {
  tvl: 48291,     // SOL
  collections: 42,
  stakers: 14820,
  royaltiesPaid: 3840, // SOL
  volume24: 680,
};

const ACTIVITY = [
  { kind: "Mint",  col: "The Dye Room",       user: "4pZ...9uKm", price: 2.5,  time: "12s ago" },
  { kind: "Sale",  col: "Anatolia Genesis",   user: "9qE...B8fa", price: 1.84, time: "38s ago" },
  { kind: "Stake", col: "Kilim Society",      user: "GkT...3mLp", price: null, time: "1m ago" },
  { kind: "Sale",  col: "Ottoman Echoes",     user: "2vB...pE7z", price: 0.92, time: "2m ago" },
  { kind: "Claim", col: "Thread Count",       user: "Rx4...YnCd", price: 0.042,time: "3m ago" },
  { kind: "Mint",  col: "Ottoman Echoes",     user: "6pK...qWjL", price: 0.5,  time: "4m ago" },
  { kind: "Stake", col: "The Dye Room",       user: "AaZ...11fh", price: null, time: "6m ago" },
  { kind: "Sale",  col: "Kilim Society",      user: "nB8...VCkr", price: 1.32, time: "8m ago" },
];

window.DATA = { COLLECTIONS, STATS, ACTIVITY };
