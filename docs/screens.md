# Screens
- Dashboard (Admin/Seller)
- Inventory
- Customers
- Reservations
- Door Sale
- Payments
- Orders (read-only operational)

## Payments
- Main view shows customer orders with active reservations and pending balance for the current branch
- Payments are collected at order level in the UI
- Internally, payments are allocated to active reservations because backend payments are linked to reservations
- Door Sale does not appear in Payments because it is paid inside the Door Sale flow
- Manual sale collection is not part of this screen
