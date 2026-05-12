package com.hpsqsoft.ctrlropa.returns;

import java.time.LocalDateTime;
import java.util.List;

public class ReturnResponse {

    private Long id;
    private Long saleId;
    private Long customerId;
    private String customerName;
    private Long itemId;
    private String itemCode;
    private String type;
    private String reason;
    private String status;
    private Long processedByUserId;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime processedAt;
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;
    private String cancelReason;
    private String notes;
    private List<ItemLine> items;

    public ReturnResponse(Long id,
                          Long saleId,
                          Long customerId,
                          String customerName,
                          Long itemId,
                          String itemCode,
                          String type,
                          String reason,
                          String status,
                          Long processedByUserId,
                          Long createdByUserId,
                          LocalDateTime createdAt,
                          LocalDateTime updatedAt,
                          LocalDateTime processedAt,
                          LocalDateTime cancelledAt,
                          Long cancelledByUserId,
                          String cancelReason,
                          String notes,
                          List<ItemLine> items) {
        this.id = id;
        this.saleId = saleId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.itemId = itemId;
        this.itemCode = itemCode;
        this.type = type;
        this.reason = reason;
        this.status = status;
        this.processedByUserId = processedByUserId;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.processedAt = processedAt;
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
        this.cancelReason = cancelReason;
        this.notes = notes;
        this.items = items;
    }

    public Long getId() { return id; }
    public Long getSaleId() { return saleId; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getItemId() { return itemId; }
    public String getItemCode() { return itemCode; }
    public String getType() { return type; }
    public String getReason() { return reason; }
    public String getStatus() { return status; }
    public Long getProcessedByUserId() { return processedByUserId; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
    public String getCancelReason() { return cancelReason; }
    public String getNotes() { return notes; }
    public List<ItemLine> getItems() { return items; }

    public static class ItemLine {
        private Long id;
        private Long itemId;
        private String itemCode;
        private String condition;
        private LocalDateTime createdAt;

        public ItemLine(Long id,
                        Long itemId,
                        String itemCode,
                        String condition,
                        LocalDateTime createdAt) {
            this.id = id;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.condition = condition;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public String getCondition() { return condition; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}