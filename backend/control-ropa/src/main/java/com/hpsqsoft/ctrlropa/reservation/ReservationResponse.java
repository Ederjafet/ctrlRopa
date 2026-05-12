package com.hpsqsoft.ctrlropa.reservation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReservationResponse {

    private Long id;
    private Long itemId;
    private String itemCode;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private Long customerOrderId;
    private Long liveId;
    private String liveStatus;
    private String liveNotes;
    private Long salesChannelId;
    private String salesChannelCode;
    private Long sellerUserId;
    private String sellerUserName;
    private Long boxId;
    private String boxCode;
    private BigDecimal price;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private Long cancelledByUserId;

    public ReservationResponse() {
    }

    public ReservationResponse(Long id,
                               Long itemId,
                               String itemCode,
                               Long customerId,
                               String customerName,
                               Long branchId,
                               String branchCode,
                               Long customerOrderId,
                               Long liveId,
                               String liveStatus,
                               String liveNotes,
                               Long salesChannelId,
                               String salesChannelCode,
                               Long sellerUserId,
                               String sellerUserName,
                               Long boxId,
                               String boxCode,
                               BigDecimal price,
                               String notes,
                               String status,
                               LocalDateTime createdAt,
                               LocalDateTime cancelledAt,
                               String cancelReason,
                               Long cancelledByUserId) {
        this.id = id;
        this.itemId = itemId;
        this.itemCode = itemCode;
        this.customerId = customerId;
        this.customerName = customerName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.customerOrderId = customerOrderId;
        this.liveId = liveId;
        this.liveStatus = liveStatus;
        this.liveNotes = liveNotes;
        this.salesChannelId = salesChannelId;
        this.salesChannelCode = salesChannelCode;
        this.sellerUserId = sellerUserId;
        this.sellerUserName = sellerUserName;
        this.boxId = boxId;
        this.boxCode = boxCode;
        this.price = price;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
        this.cancelledAt = cancelledAt;
        this.cancelReason = cancelReason;
        this.cancelledByUserId = cancelledByUserId;
    }

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public String getItemCode() { return itemCode; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public Long getCustomerOrderId() { return customerOrderId; }
    public Long getLiveId() { return liveId; }
    public String getLiveStatus() { return liveStatus; }
    public String getLiveNotes() { return liveNotes; }
    public Long getSalesChannelId() { return salesChannelId; }
    public String getSalesChannelCode() { return salesChannelCode; }
    public Long getSellerUserId() { return sellerUserId; }
    public String getSellerUserName() { return sellerUserName; }
    public Long getBoxId() { return boxId; }
    public String getBoxCode() { return boxCode; }
    public BigDecimal getPrice() { return price; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public String getCancelReason() { return cancelReason; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
}
