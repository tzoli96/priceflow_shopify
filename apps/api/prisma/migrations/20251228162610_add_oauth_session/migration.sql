-- CreateTable
CREATE TABLE "OAuthSession" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT,
    "onlineAccessInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OAuthSession_shop_idx" ON "OAuthSession"("shop");

-- CreateIndex
CREATE INDEX "OAuthSession_state_idx" ON "OAuthSession"("state");

-- CreateIndex
CREATE INDEX "OAuthSession_createdAt_idx" ON "OAuthSession"("createdAt");
