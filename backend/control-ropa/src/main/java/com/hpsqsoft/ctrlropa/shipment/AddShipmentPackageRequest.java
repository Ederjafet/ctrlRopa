package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class AddShipmentPackageRequest {

    @NotNull(message = "customerPackageId es obligatorio")
    private Long customerPackageId;

    private Long deliveryAddressId;

    @NotNull(message = "paymentMode es obligatorio")
    private ShipmentPackagePaymentMode paymentMode;

    private BigDecimal expectedCodAmount;

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
}
