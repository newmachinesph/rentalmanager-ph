-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "image" TEXT,
    "monthlyTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "areaSqm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyRent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Vacant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL DEFAULT '',
    "emergencyPhone" TEXT NOT NULL DEFAULT '',
    "idType" TEXT NOT NULL DEFAULT '',
    "idNumber" TEXT NOT NULL DEFAULT '',
    "occupation" TEXT NOT NULL DEFAULT '',
    "employer" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" TEXT NOT NULL DEFAULT '',
    "tenantType" TEXT NOT NULL DEFAULT 'Person',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDueDay" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "signedDate" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeRecord" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "tenantId" TEXT,
    "leaseId" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT NOT NULL,
    "paidDate" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "referenceNo" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRecord" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "vendor" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "receiptUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "dateReported" TEXT NOT NULL,
    "dateCompleted" TEXT,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCost" DOUBLE PRECISION,
    "contractor" TEXT NOT NULL DEFAULT '',
    "contractorPhone" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgReminder" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "dateTime" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMileage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "date" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgNote" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "dateUploaded" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyDocument" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "dateUploaded" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyContact" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMileage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyMileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyNote" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityReading" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "utilityType" TEXT NOT NULL,
    "readingDate" TEXT NOT NULL,
    "previousReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE INDEX "Unit_status_idx" ON "Unit"("status");

-- CreateIndex
CREATE INDEX "Tenant_email_idx" ON "Tenant"("email");

-- CreateIndex
CREATE INDEX "Tenant_lastName_firstName_idx" ON "Tenant"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Tenant_tenantType_idx" ON "Tenant"("tenantType");

-- CreateIndex
CREATE INDEX "Tenant_createdAt_idx" ON "Tenant"("createdAt");

-- CreateIndex
CREATE INDEX "Lease_propertyId_idx" ON "Lease"("propertyId");

-- CreateIndex
CREATE INDEX "Lease_unitId_idx" ON "Lease"("unitId");

-- CreateIndex
CREATE INDEX "Lease_tenantId_idx" ON "Lease"("tenantId");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE INDEX "Lease_endDate_idx" ON "Lease"("endDate");

-- CreateIndex
CREATE INDEX "Lease_createdAt_idx" ON "Lease"("createdAt");

-- CreateIndex
CREATE INDEX "Lease_unitId_status_idx" ON "Lease"("unitId", "status");

-- CreateIndex
CREATE INDEX "Lease_tenantId_propertyId_status_idx" ON "Lease"("tenantId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "Lease_propertyId_status_idx" ON "Lease"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Contract_leaseId_idx" ON "Contract"("leaseId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "IncomeRecord_propertyId_idx" ON "IncomeRecord"("propertyId");

-- CreateIndex
CREATE INDEX "IncomeRecord_unitId_idx" ON "IncomeRecord"("unitId");

-- CreateIndex
CREATE INDEX "IncomeRecord_tenantId_idx" ON "IncomeRecord"("tenantId");

-- CreateIndex
CREATE INDEX "IncomeRecord_leaseId_idx" ON "IncomeRecord"("leaseId");

-- CreateIndex
CREATE INDEX "IncomeRecord_status_idx" ON "IncomeRecord"("status");

-- CreateIndex
CREATE INDEX "IncomeRecord_dueDate_idx" ON "IncomeRecord"("dueDate");

-- CreateIndex
CREATE INDEX "IncomeRecord_category_idx" ON "IncomeRecord"("category");

-- CreateIndex
CREATE INDEX "IncomeRecord_createdAt_idx" ON "IncomeRecord"("createdAt");

-- CreateIndex
CREATE INDEX "IncomeRecord_status_dueDate_idx" ON "IncomeRecord"("status", "dueDate");

-- CreateIndex
CREATE INDEX "IncomeRecord_propertyId_status_idx" ON "IncomeRecord"("propertyId", "status");

-- CreateIndex
CREATE INDEX "IncomeRecord_status_paidDate_idx" ON "IncomeRecord"("status", "paidDate");

-- CreateIndex
CREATE INDEX "ExpenseRecord_propertyId_idx" ON "ExpenseRecord"("propertyId");

-- CreateIndex
CREATE INDEX "ExpenseRecord_unitId_idx" ON "ExpenseRecord"("unitId");

-- CreateIndex
CREATE INDEX "ExpenseRecord_category_idx" ON "ExpenseRecord"("category");

-- CreateIndex
CREATE INDEX "ExpenseRecord_date_idx" ON "ExpenseRecord"("date");

-- CreateIndex
CREATE INDEX "ExpenseRecord_createdAt_idx" ON "ExpenseRecord"("createdAt");

-- CreateIndex
CREATE INDEX "ExpenseRecord_vendor_idx" ON "ExpenseRecord"("vendor");

-- CreateIndex
CREATE INDEX "ExpenseRecord_propertyId_category_idx" ON "ExpenseRecord"("propertyId", "category");

-- CreateIndex
CREATE INDEX "ExpenseRecord_propertyId_date_idx" ON "ExpenseRecord"("propertyId", "date");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_propertyId_idx" ON "MaintenanceRequest"("propertyId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_unitId_idx" ON "MaintenanceRequest"("unitId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_tenantId_idx" ON "MaintenanceRequest"("tenantId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_priority_idx" ON "MaintenanceRequest"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_propertyId_status_idx" ON "MaintenanceRequest"("propertyId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_dateReported_idx" ON "MaintenanceRequest"("status", "dateReported");

-- CreateIndex
CREATE INDEX "OrgReminder_propertyId_idx" ON "OrgReminder"("propertyId");

-- CreateIndex
CREATE INDEX "OrgReminder_dateTime_idx" ON "OrgReminder"("dateTime");

-- CreateIndex
CREATE INDEX "OrgMileage_propertyId_idx" ON "OrgMileage"("propertyId");

-- CreateIndex
CREATE INDEX "OrgMileage_date_idx" ON "OrgMileage"("date");

-- CreateIndex
CREATE INDEX "OrgNote_date_idx" ON "OrgNote"("date");

-- CreateIndex
CREATE INDEX "OrgDocument_dateUploaded_idx" ON "OrgDocument"("dateUploaded");

-- CreateIndex
CREATE INDEX "OrgDocument_createdAt_idx" ON "OrgDocument"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyDocument_propertyId_idx" ON "PropertyDocument"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyDocument_createdAt_idx" ON "PropertyDocument"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyContact_propertyId_idx" ON "PropertyContact"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyMileage_propertyId_idx" ON "PropertyMileage"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyMileage_date_idx" ON "PropertyMileage"("date");

-- CreateIndex
CREATE INDEX "PropertyNote_propertyId_idx" ON "PropertyNote"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyNote_date_idx" ON "PropertyNote"("date");

-- CreateIndex
CREATE INDEX "UtilityReading_propertyId_idx" ON "UtilityReading"("propertyId");

-- CreateIndex
CREATE INDEX "UtilityReading_unitId_idx" ON "UtilityReading"("unitId");

-- CreateIndex
CREATE INDEX "UtilityReading_utilityType_idx" ON "UtilityReading"("utilityType");

-- CreateIndex
CREATE INDEX "UtilityReading_readingDate_idx" ON "UtilityReading"("readingDate");

-- CreateIndex
CREATE INDEX "UtilityReading_isPaid_idx" ON "UtilityReading"("isPaid");

-- CreateIndex
CREATE INDEX "UtilityReading_createdAt_idx" ON "UtilityReading"("createdAt");

-- CreateIndex
CREATE INDEX "UtilityReading_propertyId_utilityType_idx" ON "UtilityReading"("propertyId", "utilityType");

-- CreateIndex
CREATE INDEX "UtilityReading_propertyId_readingDate_idx" ON "UtilityReading"("propertyId", "readingDate");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRecord" ADD CONSTRAINT "ExpenseRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRecord" ADD CONSTRAINT "ExpenseRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgReminder" ADD CONSTRAINT "OrgReminder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMileage" ADD CONSTRAINT "OrgMileage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDocument" ADD CONSTRAINT "PropertyDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContact" ADD CONSTRAINT "PropertyContact_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMileage" ADD CONSTRAINT "PropertyMileage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyNote" ADD CONSTRAINT "PropertyNote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityReading" ADD CONSTRAINT "UtilityReading_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityReading" ADD CONSTRAINT "UtilityReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
