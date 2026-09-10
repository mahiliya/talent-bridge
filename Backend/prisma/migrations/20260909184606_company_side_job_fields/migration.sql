-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "positions" INTEGER,
ADD COLUMN     "workMode" "RemotePreference";
