/*
  Warnings:

  - The values [REMOTE,HYBRID,ONSITE] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REMOTE_ONLY,ONSITE,NO_PREFERENCE] on the enum `RemotePreference` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE');
ALTER TABLE "User" ALTER COLUMN "preferredJobTypes" TYPE "JobType_new"[] USING ("preferredJobTypes"::text::"JobType_new"[]);
ALTER TABLE "Job" ALTER COLUMN "jobType" TYPE "JobType_new" USING ("jobType"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "JobType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RemotePreference_new" AS ENUM ('ON_SITE', 'REMOTE', 'HYBRID', 'FLEXIBLE');
ALTER TABLE "User" ALTER COLUMN "remotePreference" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "remotePreference" TYPE "RemotePreference_new" USING ("remotePreference"::text::"RemotePreference_new");
ALTER TYPE "RemotePreference" RENAME TO "RemotePreference_old";
ALTER TYPE "RemotePreference_new" RENAME TO "RemotePreference";
DROP TYPE "RemotePreference_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "graduationYear",
DROP COLUMN "isVerified",
DROP COLUMN "profilePicture",
DROP COLUMN "refreshToken",
DROP COLUMN "verificationToken",
ALTER COLUMN "minSalary" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "remotePreference" DROP NOT NULL,
ALTER COLUMN "remotePreference" DROP DEFAULT;
