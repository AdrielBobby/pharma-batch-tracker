# Member 4 Integration Test Cases

| ID | Scenario | Expected result |
|---|---|---|
| TC-01 | Open overview after API startup | Stock summary, expiry horizon and action queue load without errors |
| TC-02 | Create a medicine with valid fields | Medicine appears in the catalog |
| TC-03 | Create a duplicate medicine/manufacturer pair | API returns a clear validation/conflict error |
| TC-04 | Receive a valid batch | Batch and available quantity are created |
| TC-05 | Set expiry before manufacture date | Request is rejected |
| TC-06 | Sell medicine with two eligible batches | Earliest-expiring batch is allocated first |
| TC-07 | Sale quantity exceeds total stock | Sale is rejected and no stock changes |
| TC-08 | Attempt sale from an expired batch | Expired batch is not allocated |
| TC-09 | Run 30-day expiry scan twice | No duplicate same-day alerts are created |
| TC-10 | Resolve an expiry alert | Alert becomes resolved and leaves active list |
| TC-11 | Search tables on mobile viewport | Matching rows remain readable and scroll safely |
| TC-12 | Stop database while UI is open | UI shows an actionable connection error |

API mutation tests are pending Member 2's finalized endpoint contract.
