-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "sourceId" TEXT;

-- CreateIndex
CREATE INDEX "Program_sourceId_idx" ON "Program"("sourceId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
