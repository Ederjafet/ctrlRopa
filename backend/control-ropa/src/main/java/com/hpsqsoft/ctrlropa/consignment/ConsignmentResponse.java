package com.hpsqsoft.ctrlropa.consignment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ConsignmentResponse {

    private Long id;
    private String folio;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Long consigneeId;
    private String consigneeName;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime deliveredAt;
    private LocalDateTime closedAt;
    
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;
    private String cancelReason;
    
    private Integer totalItems;
    private Integer soldItems;
    private Integer returnedItems;
    private Integer openItems;
    private List<ItemLine> items;
    private List<SettlementLine> settlements;

    public ConsignmentResponse(Long id,
                               String folio,
                               Long branchId,
                               String branchCode,
                               String branchName,
                               Long consigneeId,
                               String consigneeName,
                               String status,
                               String notes,
                               LocalDateTime createdAt,
                               Long createdByUserId,
                               LocalDateTime deliveredAt,
                               LocalDateTime closedAt,
                               
                               LocalDateTime cancelledAt,
                               Long cancelledByUserId,
                               String cancelReason,
                               
                               Integer totalItems,
                               Integer soldItems,
                               Integer returnedItems,
                               Integer openItems,
                               List<ItemLine> items,
                               List<SettlementLine> settlements) {
        this.id = id;
        this.folio = folio;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.consigneeId = consigneeId;
        this.consigneeName = consigneeName;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.deliveredAt = deliveredAt;
        this.closedAt = closedAt;
        
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
        this.cancelReason = cancelReason;
        
        this.totalItems = totalItems;
        this.soldItems = soldItems;
        this.returnedItems = returnedItems;
        this.openItems = openItems;
        this.items = items;
        this.settlements = settlements;
    }

    public Long getId() { return id; }
    public String getFolio() { return folio; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public Long getConsigneeId() { return consigneeId; }
    public String getConsigneeName() { return consigneeName; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public Integer getTotalItems() { return totalItems; }
    public Integer getSoldItems() { return soldItems; }
    public Integer getReturnedItems() { return returnedItems; }
    public Integer getOpenItems() { return openItems; }
    public List<ItemLine> getItems() { return items; }
    public List<SettlementLine> getSettlements() { return settlements; }

    public static class ItemLine {
        private Long consignmentItemId;
        private Long itemId;
        private String itemCode;
        private String itemQrCode;
        private String itemStatus;
        private BigDecimal suggestedPrice;
        private String status;
        private String notes;
        private LocalDateTime createdAt;

        public ItemLine(Long consignmentItemId,
                        Long itemId,
                        String itemCode,
                        String itemQrCode,
                        String itemStatus,
                        BigDecimal suggestedPrice,
                        String status,
                        String notes,
                        LocalDateTime createdAt) {
            this.consignmentItemId = consignmentItemId;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.itemQrCode = itemQrCode;
            this.itemStatus = itemStatus;
            this.suggestedPrice = suggestedPrice;
            this.status = status;
            this.notes = notes;
            this.createdAt = createdAt;
        }

        public Long getConsignmentItemId() { return consignmentItemId; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public String getItemQrCode() { return itemQrCode; }
        public String getItemStatus() { return itemStatus; }
        public BigDecimal getSuggestedPrice() { return suggestedPrice; }
        public String getStatus() { return status; }
        public String getNotes() { return notes; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class SettlementLine {
        private Long settlementId;
        private String notes;
        private LocalDateTime createdAt;
        private Long createdByUserId;
        private List<SettlementItemLine> items;

        public SettlementLine(Long settlementId,
                              String notes,
                              LocalDateTime createdAt,
                              Long createdByUserId,
                              List<SettlementItemLine> items) {
            this.settlementId = settlementId;
            this.notes = notes;
            this.createdAt = createdAt;
            this.createdByUserId = createdByUserId;
            this.items = items;
        }

        public Long getSettlementId() { return settlementId; }
        public String getNotes() { return notes; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public Long getCreatedByUserId() { return createdByUserId; }
        public List<SettlementItemLine> getItems() { return items; }
    }

    public static class SettlementItemLine {
        private Long settlementItemId;
        private Long consignmentItemId;
        private String result;
        private BigDecimal salePrice;
        private Long customerId;
        private String customerName;
        private String notes;
        private LocalDateTime createdAt;

        public SettlementItemLine(Long settlementItemId,
                                  Long consignmentItemId,
                                  String result,
                                  BigDecimal salePrice,
                                  Long customerId,
                                  String customerName,
                                  String notes,
                                  LocalDateTime createdAt) {
            this.settlementItemId = settlementItemId;
            this.consignmentItemId = consignmentItemId;
            this.result = result;
            this.salePrice = salePrice;
            this.customerId = customerId;
            this.customerName = customerName;
            this.notes = notes;
            this.createdAt = createdAt;
        }

        public Long getSettlementItemId() { return settlementItemId; }
        public Long getConsignmentItemId() { return consignmentItemId; }
        public String getResult() { return result; }
        public BigDecimal getSalePrice() { return salePrice; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public String getNotes() { return notes; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
    
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
    public String getCancelReason() { return cancelReason; }
}