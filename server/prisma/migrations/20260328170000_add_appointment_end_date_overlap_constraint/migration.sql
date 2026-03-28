CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
ADD COLUMN "appointmentEndDate" TIMESTAMP(3) NOT NULL;

ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_no_overlap_per_employee"
EXCLUDE USING gist (
  "employeeId" WITH =,
  tstzrange("appointmentDate", "appointmentEndDate", '[)') WITH &&
)
WHERE ("status" <> 'CANCELED');
