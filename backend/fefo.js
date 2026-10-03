export function planFefo(batches, requestedQuantity) {
  const requested = Number(requestedQuantity);
  const available = batches.reduce((sum, batch) => sum + Number(batch.QUANTITY_AVAILABLE || 0), 0);
  let remaining = requested;
  const allocations = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const quantity = Math.min(remaining, Number(batch.QUANTITY_AVAILABLE || 0));
    if (quantity > 0) allocations.push({ batch, quantity });
    remaining -= quantity;
  }
  return { available, allocations, fulfilled: remaining === 0 };
}
