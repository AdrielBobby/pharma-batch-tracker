import test from 'node:test';
import assert from 'node:assert/strict';
import { planFefo } from './fefo.js';

test('uses the earliest supplied batch first', () => {
  const early = { BATCH_ID: 1, QUANTITY_AVAILABLE: 20 };
  const later = { BATCH_ID: 2, QUANTITY_AVAILABLE: 50 };
  const plan = planFefo([early, later], 12);
  assert.equal(plan.fulfilled, true);
  assert.deepEqual(plan.allocations.map(item => [item.batch.BATCH_ID, item.quantity]), [[1, 12]]);
});

test('splits a sale across batches without skipping early stock', () => {
  const plan = planFefo([
    { BATCH_ID: 1, QUANTITY_AVAILABLE: 5 },
    { BATCH_ID: 2, QUANTITY_AVAILABLE: 20 }
  ], 10);
  assert.equal(plan.fulfilled, true);
  assert.deepEqual(plan.allocations.map(item => [item.batch.BATCH_ID, item.quantity]), [[1, 5], [2, 5]]);
});

test('reports insufficient total eligible stock', () => {
  const plan = planFefo([{ BATCH_ID: 1, QUANTITY_AVAILABLE: 4 }], 6);
  assert.equal(plan.fulfilled, false);
  assert.equal(plan.available, 4);
});
