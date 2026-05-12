SET NAMES utf8mb4;
START TRANSACTION;

ALTER TABLE cash_closures
DROP INDEX uq_cash_closure_branch_date;

CREATE UNIQUE INDEX uq_cash_closure_active_date
ON cash_closures (
  branch_id,
  closure_date,
  status
);

COMMIT;