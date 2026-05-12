package com.hpsqsoft.ctrlropa.transfer;

import java.time.LocalDateTime;
import java.util.List;

public class BranchTransferResponse {

    private Long id;
    private String folio;
    private Long fromBranchId;
    private String fromBranchCode;
    private String fromBranchName;
    private Long toBranchId;
    private String toBranchCode;
    private String toBranchName;
    private Long customerOrderId;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime sentAt;
    private LocalDateTime receivedAt;
    private Integer totalItems;
    private Integer receivedItems;
    private List<ItemLine> items;

    public BranchTransferResponse(Long id,
                                  String folio,
                                  Long fromBranchId,
                                  String fromBranchCode,
                                  String fromBranchName,
                                  Long toBranchId,
                                  String toBranchCode,
                                  String toBranchName,
                                  Long customerOrderId,
                                  String status,
                                  String notes,
                                  LocalDateTime createdAt,
                                  Long createdByUserId,
                                  LocalDateTime sentAt,
                                  LocalDateTime receivedAt,
                                  Integer totalItems,
                                  Integer receivedItems,
                                  List<ItemLine> items) {
        this.id = id;
        this.folio = folio;
        this.fromBranchId = fromBranchId;
        this.fromBranchCode = fromBranchCode;
        this.fromBranchName = fromBranchName;
        this.toBranchId = toBranchId;
        this.toBranchCode = toBranchCode;
        this.toBranchName = toBranchName;
        this.customerOrderId = customerOrderId;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.sentAt = sentAt;
        this.receivedAt = receivedAt;
        this.totalItems = totalItems;
        this.receivedItems = receivedItems;
        this.items = items;
    }

    public Long getId() { return id; }
    public String getFolio() { return folio; }
    public Long getFromBranchId() { return fromBranchId; }
    public String getFromBranchCode() { return fromBranchCode; }
    public String getFromBranchName() { return fromBranchName; }
    public Long getToBranchId() { return toBranchId; }
    public String getToBranchCode() { return toBranchCode; }
    public String getToBranchName() { return toBranchName; }
    public Long getCustomerOrderId() { return customerOrderId; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getSentAt() { return sentAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public Integer getTotalItems() { return totalItems; }
    public Integer getReceivedItems() { return receivedItems; }
    public List<ItemLine> getItems() { return items; }

    public static class ItemLine {
        private Long transferItemId;
        private Long itemId;
        private String itemCode;
        private String itemQrCode;
        private String itemStatus;
        private LocalDateTime receivedAt;
        private Long receivedByUserId;

        public ItemLine(Long transferItemId,
                        Long itemId,
                        String itemCode,
                        String itemQrCode,
                        String itemStatus,
                        LocalDateTime receivedAt,
                        Long receivedByUserId) {
            this.transferItemId = transferItemId;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.itemQrCode = itemQrCode;
            this.itemStatus = itemStatus;
            this.receivedAt = receivedAt;
            this.receivedByUserId = receivedByUserId;
        }

        public Long getTransferItemId() { return transferItemId; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public String getItemQrCode() { return itemQrCode; }
        public String getItemStatus() { return itemStatus; }
        public LocalDateTime getReceivedAt() { return receivedAt; }
        public Long getReceivedByUserId() { return receivedByUserId; }
    }
}