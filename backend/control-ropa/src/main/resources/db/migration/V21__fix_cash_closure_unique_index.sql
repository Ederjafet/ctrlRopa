SET NAMES utf8mb4;
START TRANSACTION;

-- 1. Eliminar índice incorrecto
DROP INDEX uq_cash_closure_active_date ON cash_closures;

-- 2. Crear columna generada
ALTER TABLE cash_closures
ADD COLUMN active_unique_date DATE
GENERATED ALWAYS AS (
  CASE
    WHEN status IN ('OPEN', 'CLOSED') THEN closure_date
    ELSE NULL
  END
) STORED;

-- 3. Crear índice único correcto
CREATE UNIQUE INDEX uq_cash_closure_active
ON cash_closures (branch_id, active_unique_date);

COMMIT;