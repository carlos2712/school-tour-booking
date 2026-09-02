-- AlterEnum
ALTER TYPE "PaymentOption" ADD VALUE 'MANATEE_COUNTY';

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "enableManateeCounty" BOOLEAN NOT NULL DEFAULT true;
