# ADR 002: Pantry Inventory Management

## Summary
Track fridge inventory by recording purchase date and per-item storage duration, and automatically warn when items are approaching expiry.

## Decisions

**Item identity key**: Items are uniquely identified by `(name, purchased_at)`. The same ingredient purchased on different dates is tracked as separate batches, each with its own quantity and expiry. Calling `set_pantry_item` with the same `(name, purchased_at)` pair updates the existing batch; a different `purchased_at` creates a new batch.

**Expiry warning logic**: Instead of storing an absolute expiry date, store the purchase date and a per-item storage duration (`best_before_days`). The expiry date is derived as `purchased_at + best_before_days`. Items with no `best_before_days` produce no warning.

**Warning thresholds**: ≤ 0 days remaining = expired; 1–3 days remaining = expiring soon.

**Item removal**: Items are not physically deleted. A `status` column tracks `in_stock` / `consumed`. The UI and `get_pantry` only show `in_stock` items; consumed items remain in the database as a record. Setting quantity to 0 via `set_pantry_item` automatically marks the item as consumed.

**Usage log**: Every quantity change via `set_pantry_item` is automatically recorded in `pantry_logs` as a `delta` (positive = restocked, negative = used). The detail page shows this history. The `consume_pantry_item` MCP tool has been removed; partial and full consumption are both handled through quantity updates, which auto-log the change.

## Rejected alternatives
- **Store absolute expiry date**: Requires recalculating per item type each time; can't reuse standard durations across the same food category.
- **Physical delete**: Adopted status management instead to preserve consumption history.
