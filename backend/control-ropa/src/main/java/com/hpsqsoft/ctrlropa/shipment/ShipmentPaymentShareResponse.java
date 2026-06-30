package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.util.List;

public class ShipmentPaymentShareResponse {
    private final Long costShareId;
    private final Long packageId;
    private final String packageReference;
    private final Long customerId;
    private final String customerName;
    private final BigDecimal assignedAmount;
    private final BigDecimal paidAmount;
    private final BigDecimal balanceAmount;
    private final List<ShipmentPaymentLineResponse> payments;

    public ShipmentPaymentShareResponse(Long costShareId,
                                        Long packageId,
                                        String packageReference,
                                        Long customerId,
                                        String customerName,
                                        BigDecimal assignedAmount,
                                        BigDecimal paidAmount,
                                        BigDecimal balanceAmount,
                                        List<ShipmentPaymentLineResponse> payments) {
        this.costShareId = costShareId;
        this.packageId = packageId;
        this.packageReference = packageReference;
        this.customerId = customerId;
        this.customerName = customerName;
        this.assignedAmount = assignedAmount;
        this.paidAmount = paidAmount;
        this.balanceAmount = balanceAmount;
        this.payments = payments;
    }

    public Long getCostShareId() { return costShareId; }
    public Long getPackageId() { return packageId; }
    public String getPackageReference() { return packageReference; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public BigDecimal getAssignedAmount() { return assignedAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public List<ShipmentPaymentLineResponse> getPayments() { return payments; }
}
