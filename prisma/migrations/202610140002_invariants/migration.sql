ALTER TABLE "InventoryBalance" ADD CONSTRAINT inventory_nonnegative CHECK ("onHand">=0 AND reserved>=0 AND reserved<="onHand");
