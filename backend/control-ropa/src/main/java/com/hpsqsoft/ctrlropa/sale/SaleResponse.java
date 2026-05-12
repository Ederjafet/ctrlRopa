package com.hpsqsoft.ctrlropa.sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SaleResponse {

    private Long id;
    private Long itemId;
    private String itemCode;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private Long sellerUserId;
    private Long customerOrderId;
    private Long salesChannelId;
    private String salesChannelCode;
    private BigDecimal price;
    private String status;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private Long cancelledByUserId;

    public SaleResponse() {
    }

    public SaleResponse(Long id,
                        Long itemId,
                        String itemCode,
                        Long customerId,
                        String customerName,
                        Long branchId,
                        String branchCode,
                        Long sellerUserId,
                        Long customerOrderId,
                        Long salesChannelId,
                        String salesChannelCode,
                        BigDecimal price,
                        String status,
                        String paymentStatus,
                        LocalDateTime createdAt,
                        Long createdByUserId,
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
        this.sellerUserId = sellerUserId;
        this.customerOrderId = customerOrderId;
        this.salesChannelId = salesChannelId;
        this.salesChannelCode = salesChannelCode;
        this.price = price;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
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
    public Long getSellerUserId() { return sellerUserId; }
    public Long getCustomerOrderId() { return customerOrderId; }
    public Long getSalesChannelId() { return salesChannelId; }
    public String getSalesChannelCode() { return salesChannelCode; }
    public BigDecimal getPrice() { return price; }
    public String getStatus() { return status; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public String getCancelReason() { return cancelReason; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
}