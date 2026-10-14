ALTER TABLE "InventoryBalance" ADD CONSTRAINT inventory_nonnegative CHECK ("onHand">=0 AND reserved>=0 AND reserved<="onHand");
ALTER TABLE "Reservation" ADD CONSTRAINT reservation_quantity CHECK (quantity>0 AND fulfilled>=0 AND released>=0 AND quantity>=fulfilled+released AND ((state='CLOSED' AND quantity=fulfilled+released) OR (state IN ('ACTIVE','ALLOCATED') AND quantity>fulfilled+released)));
ALTER TABLE "CartItem" ADD CONSTRAINT cart_quantity CHECK (quantity BETWEEN 1 AND 20);
CREATE UNIQUE INDEX one_active_cart_per_actor ON "Cart" (actor) WHERE status='ACTIVE';
