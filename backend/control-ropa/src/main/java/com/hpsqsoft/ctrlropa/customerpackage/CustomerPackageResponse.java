package com.hpsqsoft.ctrlropa.customerpackage;

import java.time.LocalDateTime;

public class CustomerPackageResponse {

    private Long id;
    private String folio;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime closedAt;
    private Long closedByUserId;

    public CustomerPackageResponse(Long id,
                                   String folio,
                                   Long customerId,
                                   String customerName,
                                   Long branchId,
                                   String branchCode,
                                   String status,
                                   String notes,
                                   LocalDateTime createdAt,
                                   Long createdByUserId,
                                   LocalDateTime closedAt,
                                   Long closedByUserId) {
        this.id = id;
        this.folio = folio;
        this.customerId = customerId;
        this.customerName = customerName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.closedAt = closedAt;
        this.closedByUserId = closedByUserId;
    }

    public Long getId() {
        return id;
    }

    public String getFolio() {
        return folio;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public String getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public Long getClosedByUserId() {
        return closedByUserId;
    }
}