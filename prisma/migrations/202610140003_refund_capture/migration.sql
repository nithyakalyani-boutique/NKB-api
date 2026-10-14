ALTER TABLE "Refund" ADD COLUMN "captureId" UUID;
UPDATE "Refund" r SET "captureId" = (
 SELECT p.id FROM "PaymentTransaction" p WHERE p."attemptId"=r."attemptId" AND p.kind='CAPTURE' ORDER BY p."createdAt",p.id LIMIT 1
);
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "PaymentTransaction"(id) ON DELETE RESTRICT;
