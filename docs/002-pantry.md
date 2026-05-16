# ADR 002: Pantry Inventory Management

## Summary
Track fridge inventory by recording purchase date and per-item storage duration, and automatically warn when items are approaching expiry.

## Decisions

**Item identity key**: Items are uniquely identified by `name`. Adding the same item again overwrites it (upsert by name, same pattern as `set_meal`).

**Expiry warning logic**: Instead of storing an absolute expiry date, store the purchase date and a per-item storage duration (`best_before_days`). The expiry date is derived as `purchased_at + best_before_days`. Items with no `best_before_days` produce no warning.

**Warning thresholds**: ≤ 0 days remaining = expired; 1–3 days remaining = expiring soon.

**Item removal**: Items are not physically deleted. A `status` column tracks `in_stock` / `consumed`. The UI and `get_pantry` only show `in_stock` items; consumed items remain in the database as a record.

## Rejected alternatives
- **Store absolute expiry date**: Requires recalculating per item type each time; can't reuse standard durations across the same food category.
- **Physical delete**: Adopted status management instead to preserve consumption history.
