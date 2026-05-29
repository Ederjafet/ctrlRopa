package com.hpsqsoft.ctrlropa.live;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class LiveResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String status;
    private String notes;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Long activeItemId;
    private String activeItemCode;
    private String activeItemQrCode;
    private Long activeItemBranchId;
    private String activeItemProductTypeName;
    private String activeItemBrandName;
    private String activeItemSizeName;
    private BigDecimal activeItemPrice;
    private String activeItemStatus;

    public LiveResponse() {
    }

    public LiveResponse(Long id,
                        Long branchId,
                        String branchCode,
                        String branchName,
                        String status,
                        String notes,
                        Long createdByUserId,
                        LocalDateTime createdAt,
                        LocalDateTime startedAt,
                        LocalDateTime endedAt,
                        Long activeItemId,
                        String activeItemCode,
                        String activeItemQrCode,
                        Long activeItemBranchId,
                        String activeItemProductTypeName,
                        String activeItemBrandName,
                        String activeItemSizeName,
                        BigDecimal activeItemPrice,
                        String activeItemStatus) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.status = status;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.activeItemId = activeItemId;
        this.activeItemCode = activeItemCode;
        this.activeItemQrCode = activeItemQrCode;
        this.activeItemBranchId = activeItemBranchId;
        this.activeItemProductTypeName = activeItemProductTypeName;
        this.activeItemBrandName = activeItemBrandName;
        this.activeItemSizeName = activeItemSizeName;
        this.activeItemPrice = activeItemPrice;
        this.activeItemStatus = activeItemStatus;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public Long getActiveItemId() { return activeItemId; }
    public String getActiveItemCode() { return activeItemCode; }
    public String getActiveItemQrCode() { return activeItemQrCode; }
    public Long getActiveItemBranchId() { return activeItemBranchId; }
    public String getActiveItemProductTypeName() { return activeItemProductTypeName; }
    public String getActiveItemBrandName() { return activeItemBrandName; }
    public String getActiveItemSizeName() { return activeItemSizeName; }
    public BigDecimal getActiveItemPrice() { return activeItemPrice; }
    public String getActiveItemStatus() { return activeItemStatus; }
}
