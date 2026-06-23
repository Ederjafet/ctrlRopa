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

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}
