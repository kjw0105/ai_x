-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docDataJson" TEXT NOT NULL,
    "issuesJson" TEXT NOT NULL,
    "chatJson" TEXT,
    "score" INTEGER,
    "inspectorName" TEXT,
    "checklistJson" TEXT,
    "documentType" TEXT,
    "tags" TEXT,
    "projectId" TEXT,
    CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contextText" TEXT NOT NULL DEFAULT '',
    "masterPlanJson" TEXT,
    "planVersion" TEXT,
    "isStructured" BOOLEAN NOT NULL DEFAULT false
);
