CREATE TABLE returns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sale_id BIGINT UNSIGNED NOT NULL,
    type ENUM('TOTAL','PARTIAL') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('OPEN','PROCESSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
    processed_by_user_id BIGINT UNSIGNED NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    processed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    cancelled_by_user_id BIGINT UNSIGNED NULL,
    cancel_reason VARCHAR(255) NULL,
    notes VARCHAR(500) NULL,

    PRIMARY KEY (id),
    KEY idx_returns_sale (sale_id),
    KEY idx_returns_status (status),
    CONSTRAINT fk_returns_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE TABLE return_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    return_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    condition_status ENUM('GOOD','DAMAGED','DEFECTIVE','UNSELLABLE') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_return_items_return (return_id),
    KEY idx_return_items_item (item_id),
    CONSTRAINT fk_return_items_return FOREIGN KEY (return_id) REFERENCES returns(id),
    CONSTRAINT fk_return_items_item FOREIGN KEY (item_id) REFERENCES items(id)
);