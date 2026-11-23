-- CreateTable
CREATE TABLE "MemorizationGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "fromSurah" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toSurah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemorizationGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MemorizationGoal_studentId_status_idx" ON "MemorizationGoal"("studentId", "status");

-- CreateIndex
CREATE INDEX "MemorizationGoal_targetDate_idx" ON "MemorizationGoal"("targetDate");
