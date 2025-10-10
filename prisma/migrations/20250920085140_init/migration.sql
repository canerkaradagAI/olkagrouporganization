-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "departments" (
    "departmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "brands" (
    "brandId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brandName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "locations" (
    "locationId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "locationName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "assignment_type_lookup" (
    "assignmentTypeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentTypeName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "positions" (
    "positionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "positionName" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,
    "brandId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    CONSTRAINT "positions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("locationId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "positions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("brandId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employees" (
    "currAccCode" TEXT NOT NULL PRIMARY KEY,
    "firstLastName" TEXT NOT NULL,
    "organization" TEXT,
    "positionId" INTEGER,
    "locationId" INTEGER,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "managerId" TEXT,
    "brandId" INTEGER,
    CONSTRAINT "employees_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions" ("positionId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("locationId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("brandId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees" ("currAccCode") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "position_assignments" (
    "assignmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "positionId" INTEGER NOT NULL,
    "currAccCode" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "assignmentType" TEXT NOT NULL,
    CONSTRAINT "position_assignments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions" ("positionId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "position_assignments_currAccCode_fkey" FOREIGN KEY ("currAccCode") REFERENCES "employees" ("currAccCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "position_assignments_assignmentType_fkey" FOREIGN KEY ("assignmentType") REFERENCES "assignment_type_lookup" ("assignmentTypeName") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "roleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roleName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "screens" (
    "screenId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "screenName" TEXT NOT NULL,
    "screenPath" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "permissions" (
    "permissionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "permissionName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "role_screen_permissions" (
    "roleId" INTEGER NOT NULL,
    "screenId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    PRIMARY KEY ("roleId", "screenId", "permissionId"),
    CONSTRAINT "role_screen_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("roleId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "role_screen_permissions_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens" ("screenId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "role_screen_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("permissionId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("roleId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "departments_departmentName_key" ON "departments"("departmentName");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brandName_key" ON "brands"("brandName");

-- CreateIndex
CREATE UNIQUE INDEX "locations_locationName_key" ON "locations"("locationName");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_type_lookup_assignmentTypeName_key" ON "assignment_type_lookup"("assignmentTypeName");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleName_key" ON "roles"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "screens_screenName_key" ON "screens"("screenName");

-- CreateIndex
CREATE UNIQUE INDEX "screens_screenPath_key" ON "screens"("screenPath");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permissionName_key" ON "permissions"("permissionName");
