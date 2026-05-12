ALTER TABLE sales
ADD COLUMN payment_status ENUM('UNPAID','PARTIALLY_PAID','PAID')
NOT NULL DEFAULT 'UNPAID'
AFTER status;

CREATE INDEX idx_sales_payment_status
    ON sales (payment_status);

UPDATE sales s
LEFT JOIN (
    SELECT pa.sale_id, SUM(pa.amount) AS paid_amount
    FROM payment_allocations pa
    INNER JOIN payments p
        ON p.id = pa.payment_id
       AND p.status = 'ACTIVE'
    WHERE pa.sale_id IS NOT NULL
    GROUP BY pa.sale_id
) x ON x.sale_id = s.id
SET s.payment_status = CASE
    WHEN COALESCE(x.paid_amount, 0) <= 0 THEN 'UNPAID'
    WHEN COALESCE(x.paid_amount, 0) < s.price THEN 'PARTIALLY_PAID'
    ELSE 'PAID'
END;

UPDATE items i
INNER JOIN sales s
        ON s.item_id = i.id
       AND s.status = 'ACTIVE'
SET i.status = CASE
    WHEN s.payment_status = 'PAID' THEN 'SOLD'
    ELSE 'RESERVED'
END;