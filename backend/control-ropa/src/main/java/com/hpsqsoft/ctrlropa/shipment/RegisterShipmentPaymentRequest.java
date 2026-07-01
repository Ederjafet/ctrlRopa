package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RegisterShipmentPaymentRequest {
    private Long costShareId;
    private Long packageId;
    private Long customerId;
    private Long paidByCustomerId;
    private BigDecimal amount;
    private String paymentMethod;
    private String reference;
    private String notes;
    private LocalDateTime registeredAt;

    public Long getCostShareId() { return costShareId; }
    public void setCostShareId(Long costShareId) { this.costShareId = costShareId; }
    public Long getPackageId() { return packageId; }
    public void setPackageId(Long packageId) { this.packageId = packageId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getPaidByCustomerId() { return paidByCustomerId; }
    public void setPaidByCustomerId(Long paidByCustomerId) { this.paidByCustomerId = paidByCustomerId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
}
