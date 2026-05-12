-- 1) customer_packages.status
-- Estado actual: OPEN, CLOSED, CANCELLED
-- Estado objetivo: OPEN, READY, SHIPPED, DELIVERED, CANCELLED

-- Paso 1: permitir temporalmente CLOSED y READY
ALTER TABLE customer_packages
MODIFY COLUMN status ENUM('OPEN','CLOSED','READY','SHIPPED','DELIVERED','CANCELLED')
NOT NULL DEFAULT 'OPEN';

-- Paso 2: migrar datos viejos
UPDATE customer_packages
SET status = 'READY'
WHERE status = 'CLOSED';

-- Paso 3: dejar enum final sin CLOSED
ALTER TABLE customer_packages
MODIFY COLUMN status ENUM('OPEN','READY','SHIPPED','DELIVERED','CANCELLED')
NOT NULL DEFAULT 'OPEN';

-- 2) shipment_packages
-- Permitir reintentos: quitar unicidad global de customer_package_id

-- Crear primero un índice normal para que la FK no se quede sin soporte
CREATE INDEX idx_shipment_packages_customer_package_tmp
    ON shipment_packages (customer_package_id);

-- Soltar la FK que depende del índice único
ALTER TABLE shipment_packages
DROP FOREIGN KEY fk_shipment_packages_customer_package;

-- Ahora sí, soltar el índice único
ALTER TABLE shipment_packages
DROP INDEX uq_shipment_packages_customer_package;

-- Recrear la FK sobre el índice normal
ALTER TABLE shipment_packages
ADD CONSTRAINT fk_shipment_packages_customer_package
FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id);

-- Dejar índices útiles finales
CREATE INDEX idx_shipment_packages_shipment_customer_package
    ON shipment_packages (shipment_id, customer_package_id);