package com.hpsqsoft.ctrlropa.shipment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String folio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false, length = 20)
    private ShipmentDeliveryType deliveryType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShipmentStatus status;

    @Column(name = "guide_reference", length = 255)
    private String guideReference;

    @Column(name = "recipient_name", length = 120)
    private String recipientName;

    @Column(name = "recipient_phone", length = 40)
    private String recipientPhone;

    @Column(name = "destination_summary", columnDefinition = "TEXT")
    private String destinationSummary;

    @Column(name = "destination_city", length = 120)
    private String destinationCity;

    @Column(name = "destination_state", length = 120)
    private String destinationState;

    @Column(name = "destination_postal_code", length = 20)
    private String destinationPostalCode;

    @Column(name = "shipping_carrier", length = 100)
    private String shippingCarrier;

    @Column(name = "real_shipping_cost", precision = 12, scale = 2)
    private BigDecimal realShippingCost;

    @Column(name = "shipping_notes", columnDefinition = "TEXT")
    private String shippingNotes;

    @Column(name = "quoted_at")
    private LocalDateTime quotedAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "dispatched_by_user_id")
    private Long dispatchedByUserId;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by_user_id")
    private Long cancelledByUserId;

    public Shipment() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ShipmentStatus.OPEN;
        }
    }

    public Long getId() {
        return id;
    }

    public String getFolio() {
        return folio;
    }

    public void setFolio(String folio) {
        this.folio = folio;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
    }

    public ShipmentDeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(ShipmentDeliveryType deliveryType) {
        this.deliveryType = deliveryType;
    }

    public ShipmentStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }

    public String getGuideReference() {
        return guideReference;
    }

    public void setGuideReference(String guideReference) {
        this.guideReference = guideReference;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getDestinationSummary() {
        return destinationSummary;
    }

    public void setDestinationSummary(String destinationSummary) {
        this.destinationSummary = destinationSummary;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public void setDestinationCity(String destinationCity) {
        this.destinationCity = destinationCity;
    }

    public String getDestinationState() {
        return destinationState;
    }

    public void setDestinationState(String destinationState) {
        this.destinationState = destinationState;
    }

    public String getDestinationPostalCode() {
        return destinationPostalCode;
    }

    public void setDestinationPostalCode(String destinationPostalCode) {
        this.destinationPostalCode = destinationPostalCode;
    }

    public String getShippingCarrier() {
        return shippingCarrier;
    }

    public void setShippingCarrier(String shippingCarrier) {
        this.shippingCarrier = shippingCarrier;
    }

    public BigDecimal getRealShippingCost() {
        return realShippingCost;
    }

    public void setRealShippingCost(BigDecimal realShippingCost) {
        this.realShippingCost = realShippingCost;
    }

    public String getShippingNotes() {
        return shippingNotes;
    }

    public void setShippingNotes(String shippingNotes) {
        this.shippingNotes = shippingNotes;
    }

    public LocalDateTime getQuotedAt() {
        return quotedAt;
    }

    public void setQuotedAt(LocalDateTime quotedAt) {
        this.quotedAt = quotedAt;
    }

    public LocalDateTime getReadyAt() {
        return readyAt;
    }

    public void setReadyAt(LocalDateTime readyAt) {
        this.readyAt = readyAt;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public LocalDateTime getDispatchedAt() {
        return dispatchedAt;
    }

    public void setDispatchedAt(LocalDateTime dispatchedAt) {
        this.dispatchedAt = dispatchedAt;
    }

    public Long getDispatchedByUserId() {
        return dispatchedByUserId;
    }

    public void setDispatchedByUserId(Long dispatchedByUserId) {
        this.dispatchedByUserId = dispatchedByUserId;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }

    public void setCancelledByUserId(Long cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }
}