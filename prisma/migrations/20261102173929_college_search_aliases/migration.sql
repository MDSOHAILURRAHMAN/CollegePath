-- AlterTable
ALTER TABLE "College" ADD COLUMN     "searchAliases" TEXT[] DEFAULT ARRAY[]::TEXT[];
