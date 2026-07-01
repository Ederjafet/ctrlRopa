package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ShipmentPaymentLineResponse {
    private final Long id;
    private final Long costShareId;
    private final Long packageId;
    private final String packageReference;
    private final Long customerId;
    private final String customerName;
    private final Long paidByCustomerId;
    private final String paidByCustomerName;
    private final BigDecimal amount;
    private final String paymentMethod;
    private final String reference;
    private final String notes;
    private final String status;
    private final LocalDateTime registeredAt;
    private final Long registeredBy;
    private final LocalDateTime cancelledAt;
    private final Long cancelledBy;
    private final String cancelReason;

    public ShipmentPaymentLineResponse(Long id,
                                       Long costShareId,
                                       Long packageId,
                                       String packageReference,
                                       Long customerId,
                                       String customerName,
                                       Long paidByCustomerId,
                                       String paidByCustomerName,
                                       BigDecimal amount,
                                       String paymentMethod,
                                       String reference,
                                       String notes,
                                       String status,
                                       LocalDateTime registeredAt,
                                       Long registeredBy,
                                       LocalDateTime cancelledAt,
                                       Long cancelledBy,
                                       String cancelReason) {
        this.id = id;
        this.costShareId = costShareId;
        this.packageId = packageId;
        this.packageReference = packageReference;
        this.customerId = customerId;
        this.customerName = customerName;
        this.paidByCustomerId = paidByCustomerId;
        this.paidByCustomerName = paidByCustomerName;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.reference = reference;
        this.notes = notes;
        this.status = status;
        this.registeredAt = registeredAt;
        this.registeredBy = registeredBy;
        this.cancelledAt = cancelledAt;
        this.cancelledBy = cancelledBy;
        this.cancelReason = cancelReason;
    }

    public Long getId() { return id; }
    public Long getCostShareId() { return costShareId; }
    public Long getPackageId() { return packageId; }
    public String getPackageReference() { return packageReference; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getPaidByCustomerId() { return paidByCustomerId; }
    public String getPaidByCustomerName() { return paidByCustomerName; }
    public BigDecimal getAmount() { return amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getReference() { return reference; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public Long getRegisteredBy() { return registeredBy; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public Long getCancelledBy() { return cancelledBy; }
    public String getCancelReason() { return cancelReason; }
}
