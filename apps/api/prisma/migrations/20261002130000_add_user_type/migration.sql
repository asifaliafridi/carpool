-- Add flexible account type without changing existing role data.
CREATE TYPE "UserType" AS ENUM ('DRIVER', 'RIDER', 'BOTH');

ALTER TABLE "User"
ADD COLUMN "userType" "UserType" NOT NULL DEFAULT 'RIDER';
