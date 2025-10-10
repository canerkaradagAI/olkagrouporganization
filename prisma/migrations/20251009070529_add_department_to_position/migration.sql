-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_positions" (
    "positionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "positionName" TEXT NOT NULL,
    "departmentId" INTEGER,
    CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_positions" ("positionId", "positionName") SELECT "positionId", "positionName" FROM "positions";
DROP TABLE "positions";
ALTER TABLE "new_positions" RENAME TO "positions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
