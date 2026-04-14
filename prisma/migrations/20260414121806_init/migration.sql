-- CreateTable
CREATE TABLE "LaunchedCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionAddress" TEXT NOT NULL,
    "collectionUri" TEXT NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "supply" INTEGER NOT NULL,
    "preMintCount" INTEGER NOT NULL DEFAULT 0,
    "royaltyFee" INTEGER NOT NULL DEFAULT 10,
    "holderShare" INTEGER NOT NULL DEFAULT 100,
    "teamShare" INTEGER NOT NULL DEFAULT 0,
    "minted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'minting',
    "launchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "supply" TEXT NOT NULL,
    "maxPerWallet" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "Phase_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "LaunchedCollection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "tokenIndex" INTEGER NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "imageUri" TEXT,
    "name" TEXT NOT NULL,
    "attributes" TEXT,
    "isOneOfOne" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedBy" TEXT,
    "claimedAt" DATETIME,
    "assetAddress" TEXT,
    "mintSignature" TEXT,
    CONSTRAINT "CollectionAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "LaunchedCollection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MintIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "buyerWallet" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "priceSol" TEXT NOT NULL,
    "expectedLamports" BIGINT NOT NULL,
    "creatorRecipient" TEXT NOT NULL,
    "treasuryRecipient" TEXT NOT NULL,
    "phaseName" TEXT,
    "nonce" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentSignature" TEXT,
    "assetAddresses" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "MintIntent_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "LaunchedCollection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LaunchedCollection_collectionAddress_key" ON "LaunchedCollection"("collectionAddress");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchedCollection_slug_key" ON "LaunchedCollection"("slug");

-- CreateIndex
CREATE INDEX "LaunchedCollection_status_idx" ON "LaunchedCollection"("status");

-- CreateIndex
CREATE INDEX "Phase_collectionId_orderIndex_idx" ON "Phase"("collectionId", "orderIndex");

-- CreateIndex
CREATE INDEX "CollectionAsset_collectionId_claimed_idx" ON "CollectionAsset"("collectionId", "claimed");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionAsset_collectionId_tokenIndex_key" ON "CollectionAsset"("collectionId", "tokenIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MintIntent_nonce_key" ON "MintIntent"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "MintIntent_memo_key" ON "MintIntent"("memo");

-- CreateIndex
CREATE UNIQUE INDEX "MintIntent_paymentSignature_key" ON "MintIntent"("paymentSignature");

-- CreateIndex
CREATE INDEX "MintIntent_buyerWallet_status_idx" ON "MintIntent"("buyerWallet", "status");

-- CreateIndex
CREATE INDEX "MintIntent_status_expiresAt_idx" ON "MintIntent"("status", "expiresAt");
