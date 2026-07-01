package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;

public class ShipmentCostShareLineResponse {

    private final Long packageId;
    private final String packageCode;
    private final Long customerId;
    private final String customerName;
    private final BigDecimal assignedAmount;
    private final String notes;

    public ShipmentCostShareLineResponse(Long packageId,
                                         String packageCode,
                                         Long customerId,
                                         String customerName,
                                         BigDecimal assignedAmount,
                                         String notes) {
        this.packageId = packageId;
        this.packageCode = packageCode;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignedAmount = assignedAmount;
        this.notes = notes;
    }

    public Long getPackageId() {
        return packageId;
    }

    public String getPackageCode() {
        return packageCode;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public BigDecimal getAssignedAmount() {
        return assignedAmount;
    }

    public String getNotes() {
        return notes;
    }
}