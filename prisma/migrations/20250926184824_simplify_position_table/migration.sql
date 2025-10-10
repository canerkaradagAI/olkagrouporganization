/*
  Warnings:

  - You are about to drop the column `brandId` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `positions` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `brands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN "levelName" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "companyId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "job_title_levels" (
    "levelId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelName" TEXT NOT NULL,
    "levelOrder" INTEGER NOT NULL,
    "description" TEXT,
    "color" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_brands" (
    "brandId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brandName" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "brands_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_brands" ("brandId", "brandName") SELECT "brandId", "brandName" FROM "brands";
DROP TABLE "brands";
ALTER TABLE "new_brands" RENAME TO "brands";
CREATE UNIQUE INDEX "brands_brandName_key" ON "brands"("brandName");
CREATE TABLE "new_positions" (
    "positionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "positionName" TEXT NOT NULL
);
INSERT INTO "new_positions" ("positionId", "positionName") SELECT "positionId", "positionName" FROM "positions";
DROP TABLE "positions";
ALTER TABLE "new_positions" RENAME TO "positions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyName_key" ON "companies"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "job_title_levels_levelName_key" ON "job_title_levels"("levelName");

-- CreateIndex
CREATE UNIQUE INDEX "job_title_levels_levelOrder_key" ON "job_title_levels"("levelOrder");
