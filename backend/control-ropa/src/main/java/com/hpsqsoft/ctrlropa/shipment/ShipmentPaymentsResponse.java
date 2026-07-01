package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.util.List;

public class ShipmentPaymentsResponse {
    private final Long shipmentId;
    private final BigDecimal realShippingCost;
    private final BigDecimal assignedTotal;
    private final BigDecimal paidTotal;
    private final BigDecimal shippingBalance;
    private final BigDecimal absorbedAmount;
    private final BigDecimal overAssignedAmount;
    private final List<ShipmentPaymentShareResponse> shares;
    private final List<ShipmentPaymentLineResponse> payments;

    public ShipmentPaymentsResponse(Long shipmentId,
                                    BigDecimal realShippingCost,
                                    BigDecimal assignedTotal,
                                    BigDecimal paidTotal,
                                    BigDecimal shippingBalance,
                                    BigDecimal absorbedAmount,
                                    BigDecimal overAssignedAmount,
                                    List<ShipmentPaymentShareResponse> shares,
                                    List<ShipmentPaymentLineResponse> payments) {
        this.shipmentId = shipmentId;
        this.realShippingCost = realShippingCost;
        this.assignedTotal = assignedTotal;
        this.paidTotal = paidTotal;
        this.shippingBalance = shippingBalance;
        this.absorbedAmount = absorbedAmount;
        this.overAssignedAmount = overAssignedAmount;
        this.shares = shares;
        this.payments = payments;
    }

    public Long getShipmentId() { return shipmentId; }
    public BigDecimal getRealShippingCost() { return realShippingCost; }
    public BigDecimal getAssignedTotal() { return assignedTotal; }
    public BigDecimal getPaidTotal() { return paidTotal; }
    public BigDecimal getShippingBalance() { return shippingBalance; }
    public BigDecimal getAbsorbedAmount() { return absorbedAmount; }
    public BigDecimal getOverAssignedAmount() { return overAssignedAmount; }
    public List<ShipmentPaymentShareResponse> getShares() { return shares; }
    public List<ShipmentPaymentLineResponse> getPayments() { return payments; }
}
