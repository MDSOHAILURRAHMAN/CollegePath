-- AlterTable
ALTER TABLE "College" ADD COLUMN "aisheCode" TEXT,
ADD COLUMN "managementType" TEXT,
ADD COLUMN "officialDistrict" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "College_aisheCode_key" ON "College"("aisheCode");
