# Campfire

Permissionless NFT launchpad on Solana with a built-in art generator, lazy mint, and royalty-share staking.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + Framer Motion
- Solana devnet via `@solana/web3.js` + wallet-adapter
- Metaplex Core (`@metaplex-foundation/mpl-core`) for collections and assets
- Arweave uploads via Irys (`@metaplex-foundation/umi-uploader-irys`)

## Setup

```bash
npm install
cp .env.example .env.local
```

### 1. Generate an operator keypair

The server signs mint transactions and Arweave uploads with an operator wallet. Generate one and fund it on devnet.

```bash
solana-keygen new --no-bip39-passphrase -o operator.json
solana address -k operator.json          # copy this for NEXT_PUBLIC_OPERATOR_PUBKEY
solana airdrop 5 -k operator.json --url devnet
cat operator.json                         # copy the JSON array for OPERATOR_PRIVATE_KEY
```

Paste the values into `.env.local`:

```
OPERATOR_PRIVATE_KEY=[12,34,...]
NEXT_PUBLIC_OPERATOR_PUBKEY=<pubkey>
SOLANA_CLUSTER=devnet
SOLANA_RPC=https://api.devnet.solana.com
IRYS_NODE=https://devnet.irys.xyz
```

### 2. Run the dev server

```bash
npm run dev
```

## Flow

1. **Studio** (`/studio`) - add layers, upload trait images, generate unique NFTs (DNA-hashed), add 1/1s
2. **Launch** (`/create`) - set pre-mint, mint phases with start/end times, launch fee (1 SOL). The operator wallet is set as collection admin so the server can mint later.
3. **Mint** (`/launchpad/[slug]`) - buyer signs **one** payment tx. The server verifies on-chain, uploads metadata to Arweave, mints the NFT to the buyer. FreezeDelegate attached so the buyer can't flip.
4. **Stake** (`/stake`) - shows launched collections (staking program not yet deployed).

## Fees

- **Launch fee:** 1 SOL to the treasury (configurable in `lib/metaplex.ts`)
- **Royalty:** 10% on every secondary sale, all to stakers
- **Marketplace fee:** 2.5% of the mint price, from the buyer, to the treasury
- **Upload buffer:** ~0.004 SOL per NFT included in the buyer's payment to cover server Irys fees

## API

- `GET /api/operator` - returns the operator pubkey and cluster so the client can set it as the collection admin during launch
- `POST /api/mint` - buyer payment verification + server-side mint

See `app/api/mint/route.ts` for the request shape.

## Key files

- `lib/metaplex.ts` - client Metaplex helpers (launch, bulk pre-mint, payment tx)
- `lib/server-metaplex.ts` - server Metaplex helpers (upload, mint on behalf of buyer, payment verification)
- `lib/uploader.ts` - Irys upload helpers (layer flattening, metadata upload)
- `lib/launched.ts` - localStorage store of launched collections (to be replaced by a backend index)
- `app/api/mint/route.ts` - the mint endpoint
- `app/create/page.tsx` - launch flow
- `app/launchpad/[slug]/page.tsx` - buyer mint page
- `app/launchpad/[slug]/admin/page.tsx` - Campfire admin panel (adjust supply, phases, prices mid-flight)

## Roadmap

- Per-collection royalty vault PDA (currently royalties route to the creator wallet)
- Staking program (Anchor) for freeze-on-stake and royalty distribution
- Whitelist gating on phases (merkle tree or backend allow-list)
- Backend index for launched collections (currently localStorage per-browser)
- Audit + mainnet launch
