ALTER TABLE "InventoryBalance" ADD CONSTRAINT inventory_nonnegative CHECK ("onHand">=0 AND reserved>=0 AND reserved<="onHand");
ALTER TABLE "Reservation" ADD CONSTRAINT reservation_quantity CHECK (quantity>0 AND fulfilled>=0 AND released>=0 AND quantity>=fulfilled+released AND ((state='CLOSED' AND quantity=fulfilled+released) OR (state IN ('ACTIVE','ALLOCATED') AND quantity>fulfilled+released)));
