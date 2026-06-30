package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;

public class ShipmentCostShareLineRequest {

    private Long packageId;
    private BigDecimal assignedAmount;
    private String notes;

    public Long getPackageId() {
        return packageId;
    }

    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }

    public BigDecimal getAssignedAmount() {
        return assignedAmount;
    }

    public void setAssignedAmount(BigDecimal assignedAmount) {
        this.assignedAmount = assignedAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}