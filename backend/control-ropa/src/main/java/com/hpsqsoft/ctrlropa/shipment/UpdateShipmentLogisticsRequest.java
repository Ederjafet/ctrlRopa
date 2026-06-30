package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class UpdateShipmentLogisticsRequest {
    private ShipmentDeliveryType deliveryType;
    private String recipientName;
    private String recipientPhone;
    private String destinationSummary;
    private String destinationCity;
    private String destinationState;
    private String destinationPostalCode;
    private String shippingCarrier;
    private String trackingNumber;
    private BigDecimal realShippingCost;
    private String shippingNotes;
    private LocalDateTime quotedAt;
    private LocalDateTime readyAt;

    public ShipmentDeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(ShipmentDeliveryType deliveryType) {
        this.deliveryType = deliveryType;
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

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
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
}
