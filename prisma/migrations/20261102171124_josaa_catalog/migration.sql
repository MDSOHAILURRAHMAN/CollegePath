-- AlterTable
ALTER TABLE "College" ADD COLUMN     "officialAddress" TEXT,
ADD COLUMN     "officialState" TEXT;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "academicYear" TEXT;

-- CreateTable
CREATE TABLE "FeeSchedule" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "publishedText" TEXT NOT NULL,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeSchedule_verificationStatus_academicYear_idx" ON "FeeSchedule"("verificationStatus", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSchedule_collegeId_academicYear_sourceId_key" ON "FeeSchedule"("collegeId", "academicYear", "sourceId");

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
