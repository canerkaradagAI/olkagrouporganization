-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "currAccCode" TEXT NOT NULL PRIMARY KEY,
    "firstLastName" TEXT NOT NULL,
    "organization" TEXT,
    "positionId" INTEGER,
    "locationId" INTEGER,
    "departmentId" INTEGER,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "managerId" TEXT,
    "brandId" INTEGER,
    "levelName" TEXT,
    CONSTRAINT "employees_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions" ("positionId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("locationId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("brandId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees" ("currAccCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_employees" ("brandId", "currAccCode", "firstLastName", "isBlocked", "isManager", "levelName", "locationId", "managerId", "organization", "positionId") SELECT "brandId", "currAccCode", "firstLastName", "isBlocked", "isManager", "levelName", "locationId", "managerId", "organization", "positionId" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
