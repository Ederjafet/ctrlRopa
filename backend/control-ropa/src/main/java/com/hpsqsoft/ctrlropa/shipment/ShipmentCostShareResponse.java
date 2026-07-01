package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.util.List;

public class ShipmentCostShareResponse {

    private final Long shipmentId;
    private final BigDecimal realShippingCost;
    private final String shareMethod;
    private final BigDecimal assignedTotal;
    private final BigDecimal absorbedAmount;
    private final BigDecimal overAssignedAmount;
    private final List<ShipmentCostShareLineResponse> shares;

    public ShipmentCostShareResponse(Long shipmentId,
                                     BigDecimal realShippingCost,
                                     String shareMethod,
                                     BigDecimal assignedTotal,
                                     BigDecimal absorbedAmount,
                                     BigDecimal overAssignedAmount,
                                     List<ShipmentCostShareLineResponse> shares) {
        this.shipmentId = shipmentId;
        this.realShippingCost = realShippingCost;
        this.shareMethod = shareMethod;
        this.assignedTotal = assignedTotal;
        this.absorbedAmount = absorbedAmount;
        this.overAssignedAmount = overAssignedAmount;
        this.shares = shares;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public BigDecimal getRealShippingCost() {
        return realShippingCost;
    }

    public String getShareMethod() {
        return shareMethod;
    }

    public BigDecimal getAssignedTotal() {
        return assignedTotal;
    }

    public BigDecimal getAbsorbedAmount() {
        return absorbedAmount;
    }

    public BigDecimal getOverAssignedAmount() {
        return overAssignedAmount;
    }

    public List<ShipmentCostShareLineResponse> getShares() {
        return shares;
    }
}