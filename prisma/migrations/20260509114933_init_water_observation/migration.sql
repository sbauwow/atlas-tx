-- CreateTable
CREATE TABLE "WaterObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "countySlug" TEXT,
    "imagePath" TEXT,
    "imageHash" TEXT,
    "stripBrand" TEXT,
    "clientReading" TEXT NOT NULL,
    "llmReading" TEXT,
    "llmModel" TEXT,
    "agreement" REAL,
    "qaFlags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "caveatsShown" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "WaterObservation_imageHash_key" ON "WaterObservation"("imageHash");

-- CreateIndex
CREATE INDEX "WaterObservation_createdAt_idx" ON "WaterObservation"("createdAt");

-- CreateIndex
CREATE INDEX "WaterObservation_kind_idx" ON "WaterObservation"("kind");

-- CreateIndex
CREATE INDEX "WaterObservation_countySlug_idx" ON "WaterObservation"("countySlug");
