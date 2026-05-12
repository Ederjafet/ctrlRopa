package com.hpsqsoft.ctrlropa.order;

import java.time.LocalDateTime;

public class CustomerOrderResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private String status;
    private LocalDateTime createdAt;
    private String salesChannelCode;

    public CustomerOrderResponse(Long id,
                                 Long customerId,
                                 String customerName,
                                 Long branchId,
                                 String branchCode,
                                 String status,
                                 LocalDateTime createdAt,
                                 String salesChannelCode) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.status = status;
        this.createdAt = createdAt;
        this.salesChannelCode = salesChannelCode;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getSalesChannelCode() { return salesChannelCode; }
}
