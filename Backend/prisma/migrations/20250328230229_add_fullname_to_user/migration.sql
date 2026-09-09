/*
  Warnings:

  - Added the required column `contactPerson` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `industry` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "contactPerson" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "industry" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "batch" TEXT NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "resume" TEXT,
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "university" TEXT NOT NULL;
