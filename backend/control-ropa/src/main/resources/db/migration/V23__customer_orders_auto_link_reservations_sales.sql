-- Alinea pedidos con la regla funcional:
-- customer_order agrupa reservas y ventas; el usuario no debe crear pedidos vacíos manualmente.
-- Esta migración vincula datos existentes usando customer_order_items.

-- 1) Crear un pedido OPEN por cliente/sucursal cuando existan reservas o ventas operativas sin pedido abierto.
INSERT INTO customer_orders (customer_id, branch_id, status)
SELECT x.customer_id, x.branch_id, 'OPEN'
FROM (
    SELECT DISTINCT r.customer_id, r.branch_id
    FROM reservations r
    WHERE r.status IN ('ACTIVE', 'CONVERTED_TO_SALE')

    UNION

    SELECT DISTINCT s.customer_id, s.branch_id
    FROM sales s
    WHERE s.status = 'ACTIVE'
) x
WHERE NOT EXISTS (
    SELECT 1
    FROM customer_orders co
    WHERE co.customer_id = x.customer_id
      AND co.branch_id = x.branch_id
      AND co.status = 'OPEN'
);

-- 2) Vincular reservas existentes al último pedido OPEN del cliente/sucursal.
INSERT INTO customer_order_items (customer_order_id, item_id, reservation_id, sale_id, price)
SELECT
    (
        SELECT co.id
        FROM customer_orders co
        WHERE co.customer_id = r.customer_id
          AND co.branch_id = r.branch_id
          AND co.status = 'OPEN'
        ORDER BY co.created_at DESC, co.id DESC
        LIMIT 1
    ) AS customer_order_id,
    r.item_id,
    r.id,
    NULL,
    r.price
FROM reservations r
WHERE r.status IN ('ACTIVE', 'CONVERTED_TO_SALE')
  AND NOT EXISTS (
      SELECT 1
      FROM customer_order_items coi
      WHERE coi.reservation_id = r.id
  )
  AND (
        SELECT co.id
        FROM customer_orders co
        WHERE co.customer_id = r.customer_id
          AND co.branch_id = r.branch_id
          AND co.status = 'OPEN'
        ORDER BY co.created_at DESC, co.id DESC
        LIMIT 1
  ) IS NOT NULL;

-- 3) Asegurar customer_order_id en ventas existentes.
UPDATE sales s
SET s.customer_order_id = (
    SELECT co.id
    FROM customer_orders co
    WHERE co.customer_id = s.customer_id
      AND co.branch_id = s.branch_id
      AND co.status = 'OPEN'
    ORDER BY co.created_at DESC, co.id DESC
    LIMIT 1
)
WHERE s.status = 'ACTIVE'
  AND s.customer_order_id IS NULL;

-- 4) Vincular ventas existentes al pedido.
INSERT INTO customer_order_items (customer_order_id, item_id, reservation_id, sale_id, price)
SELECT
    s.customer_order_id,
    s.item_id,
    NULL,
    s.id,
    s.price
FROM sales s
WHERE s.status = 'ACTIVE'
  AND s.customer_order_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM customer_order_items coi
      WHERE coi.sale_id = s.id
  );
