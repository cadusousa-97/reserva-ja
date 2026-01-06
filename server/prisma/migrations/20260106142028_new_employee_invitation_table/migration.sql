-- CreateTable
CREATE TABLE "EmployeeInvitation" (
    "id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "companyId" UUID NOT NULL,
    "role" "EmployeeRole" NOT NULL DEFAULT 'REGULAR',
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeInvitation_token_key" ON "EmployeeInvitation"("token");

-- AddForeignKey
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
