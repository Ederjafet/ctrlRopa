package com.hpsqsoft.ctrlropa.shipment;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_packages")
public class ShipmentPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "customer_package_id", nullable = false)
    private Long customerPackageId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "delivery_address_id")
    private Long deliveryAddressId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false, length = 20)
    private ShipmentPackagePaymentMode paymentMode;

    @Column(name = "expected_cod_amount", precision = 12, scale = 2)
    private BigDecimal expectedCollectionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, length = 30)
    private ShipmentPackageStatus status;

    @Column(name = "collected_amount", precision = 12, scale = 2)
    private BigDecimal collectedAmount;

    @Column(name = "collection_difference", precision = 12, scale = 2)
    private BigDecimal collectionDifference;

    @Enumerated(EnumType.STRING)
    @Column(name = "collection_status", length = 20)
    private CollectionStatus collectionStatus;

    @Column(name = "result_notes", length = 255)
    private String collectionNotes;

    @Column(name = "delivery_confirmed_by_user_id")
    private Long deliveryConfirmedByUserId;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    public ShipmentPackage() {
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = ShipmentPackageStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(Long shipmentId) {
        this.shipmentId = shipmentId;
    }

    public Long getCustomerPackageId() {
        return customerPackageId;
    }

    public void setCustomerPackageId(Long customerPackageId) {
        this.customerPackageId = customerPackageId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getDeliveryAddressId() {
        return deliveryAddressId;
    }

    public void setDeliveryAddressId(Long deliveryAddressId) {
        this.deliveryAddressId = deliveryAddressId;
    }

    public ShipmentPackagePaymentMode getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(ShipmentPackagePaymentMode paymentMode) {
        this.paymentMode = paymentMode;
    }

    public BigDecimal getExpectedCollectionAmount() {
        return expectedCollectionAmount;
    }

    public void setExpectedCollectionAmount(BigDecimal expectedCollectionAmount) {
        this.expectedCollectionAmount = expectedCollectionAmount;
    }

    public ShipmentPackageStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentPackageStatus status) {
        this.status = status;
    }

    public BigDecimal getCollectedAmount() {
        return collectedAmount;
    }

    public void setCollectedAmount(BigDecimal collectedAmount) {
        this.collectedAmount = collectedAmount;
    }

    public BigDecimal getCollectionDifference() {
        return collectionDifference;
    }

    public void setCollectionDifference(BigDecimal collectionDifference) {
        this.collectionDifference = collectionDifference;
    }

    public CollectionStatus getCollectionStatus() {
        return collectionStatus;
    }

    public void setCollectionStatus(CollectionStatus collectionStatus) {
        this.collectionStatus = collectionStatus;
    }

    public String getCollectionNotes() {
        return collectionNotes;
    }

    public void setCollectionNotes(String collectionNotes) {
        this.collectionNotes = collectionNotes;
    }

    public Long getDeliveryConfirmedByUserId() {
        return deliveryConfirmedByUserId;
    }

    public void setDeliveryConfirmedByUserId(Long deliveryConfirmedByUserId) {
        this.deliveryConfirmedByUserId = deliveryConfirmedByUserId;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(LocalDateTime returnedAt) {
        this.returnedAt = returnedAt;
    }
}
