# Backend Rules
- Do not create orders manually
- Always attach reservation/sale to active order
- Block payments if balance = 0
- Item status is controlled by operational flows, not manual inventory edits
- Item properties can be edited from inventory only when item status is AVAILABLE
- Door Sale ends with a paid sale and SOLD items; it must not create a customer package
