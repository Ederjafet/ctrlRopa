package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ShipmentShippingBalanceResponse {

    private final Long shipmentId;
    private final String shipmentFolio;
    private final String shipmentStatus;
    private final Long customerId;
    private final String customerName;
    private final Long packageCount;
    private final BigDecimal realShippingCost;
    private final BigDecimal assignedShippingAmount;
    private final BigDecimal paidShippingAmount;
    private final BigDecimal pendingShippingBalance;
    private final BigDecimal absorbedAmount;
    private final BigDecimal overassignedAmount;
    private final BigDecimal overpaidAmount;
    private final String paymentStatus;
    private final LocalDateTime createdAt;
    private final LocalDateTime dispatchedAt;
    private final LocalDateTime deliveredAt;

    public ShipmentShippingBalanceResponse(Long shipmentId,
                                           String shipmentFolio,
                                           String shipmentStatus,
                                           Long customerId,
                                           String customerName,
                                           Long packageCount,
                                           BigDecimal realShippingCost,
                                           BigDecimal assignedShippingAmount,
                                           BigDecimal paidShippingAmount,
                                           BigDecimal pendingShippingBalance,
                                           BigDecimal absorbedAmount,
                                           BigDecimal overassignedAmount,
                                           BigDecimal overpaidAmount,
                                           String paymentStatus,
                                           LocalDateTime createdAt,
                                           LocalDateTime dispatchedAt,
                                           LocalDateTime deliveredAt) {
        this.shipmentId = shipmentId;
        this.shipmentFolio = shipmentFolio;
        this.shipmentStatus = shipmentStatus;
        this.customerId = customerId;
        this.customerName = customerName;
        this.packageCount = packageCount;
        this.realShippingCost = realShippingCost;
        this.assignedShippingAmount = assignedShippingAmount;
        this.paidShippingAmount = paidShippingAmount;
        this.pendingShippingBalance = pendingShippingBalance;
        this.absorbedAmount = absorbedAmount;
        this.overassignedAmount = overassignedAmount;
        this.overpaidAmount = overpaidAmount;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.dispatchedAt = dispatchedAt;
        this.deliveredAt = deliveredAt;
    }

    public Long getShipmentId() { return shipmentId; }
    public String getShipmentFolio() { return shipmentFolio; }
    public String getShipmentStatus() { return shipmentStatus; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getPackageCount() { return packageCount; }
    public BigDecimal getRealShippingCost() { return realShippingCost; }
    public BigDecimal getAssignedShippingAmount() { return assignedShippingAmount; }
    public BigDecimal getPaidShippingAmount() { return paidShippingAmount; }
    public BigDecimal getPendingShippingBalance() { return pendingShippingBalance; }
    public BigDecimal getAbsorbedAmount() { return absorbedAmount; }
    public BigDecimal getOverassignedAmount() { return overassignedAmount; }
    public BigDecimal getOverpaidAmount() { return overpaidAmount; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
}