/*
  Warnings:

  - You are about to drop the column `studentCount` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "studentCount";

-- AlterTable
ALTER TABLE "BookingPerformance" ADD COLUMN     "studentCount" INTEGER NOT NULL DEFAULT 0;
