package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateShipmentRequest {

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotNull(message = "No se puede crear un envio sin paquete asociado.")
    private Long customerPackageId;

    private Long deliveryAddressId;

    private ShipmentPackagePaymentMode paymentMode;

    private BigDecimal expectedCodAmount;

    @NotNull(message = "deliveryType es obligatorio")
    private ShipmentDeliveryType deliveryType;

    @Size(max = 255, message = "guideReference no puede exceder 255 caracteres")
    private String guideReference;

    @Size(max = 120, message = "recipientName no puede exceder 120 caracteres")
    private String recipientName;

    @Size(max = 40, message = "recipientPhone no puede exceder 40 caracteres")
    private String recipientPhone;

    private String destinationSummary;

    @Size(max = 120, message = "destinationCity no puede exceder 120 caracteres")
    private String destinationCity;

    @Size(max = 120, message = "destinationState no puede exceder 120 caracteres")
    private String destinationState;

    @Size(max = 20, message = "destinationPostalCode no puede exceder 20 caracteres")
    private String destinationPostalCode;

    @Size(max = 100, message = "shippingCarrier no puede exceder 100 caracteres")
    private String shippingCarrier;

    private BigDecimal realShippingCost;

    private String shippingNotes;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getCustomerPackageId() {
        return customerPackageId;
    }

    public void setCustomerPackageId(Long customerPackageId) {
        this.customerPackageId = customerPackageId;
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

    public BigDecimal getExpectedCodAmount() {
        return expectedCodAmount;
    }

    public void setExpectedCodAmount(BigDecimal expectedCodAmount) {
        this.expectedCodAmount = expectedCodAmount;
    }

    public ShipmentDeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(ShipmentDeliveryType deliveryType) {
        this.deliveryType = deliveryType;
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

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}
