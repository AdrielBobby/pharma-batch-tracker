# Final Demonstration Flow

1. Open the overview and explain the stock summary, batch expiry horizon and daily action queue.
2. Open **Medicines** and show the product catalog.
3. Open **Purchases**, receive a batch and verify that it appears in **Batches & Stock**.
4. Open **Sales**, create a sale for a medicine with multiple batches and show that the API
   allocates the earliest valid expiry first (FEFO).
5. Return to stock and confirm that the allocated batch quantity decreased.
6. Open **Expiry Alerts** and distinguish expired stock from stock expiring within 30 days.
7. Open **Reports** and demonstrate batch-wise stock, near-expiry, expired stock, sales by
   batch and supplier reporting.
8. Briefly show the Docker services, API health endpoint and successful test results.

## Essential demo proof

- Never allocate expired stock to a sale.
- Never sell more than available stock.
- FEFO selects the earliest non-expired batch with stock.
- A sale updates batch availability.
- Expiry scanning does not create duplicate alerts for the same batch on the same day.
