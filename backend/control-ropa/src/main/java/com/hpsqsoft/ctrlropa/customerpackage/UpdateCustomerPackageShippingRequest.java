package com.hpsqsoft.ctrlropa.customerpackage;

import java.math.BigDecimal;

public class UpdateCustomerPackageShippingRequest {

    private BigDecimal shippingCostAmount;
    private Boolean shippingCostWaived;
    private String shippingNotes;
    private String shippingCarrier;
    private String trackingNumber;

    public BigDecimal getShippingCostAmount() {
        return shippingCostAmount;
    }

    public void setShippingCostAmount(BigDecimal shippingCostAmount) {
        this.shippingCostAmount = shippingCostAmount;
    }

    public Boolean getShippingCostWaived() {
        return shippingCostWaived;
    }

    public void setShippingCostWaived(Boolean shippingCostWaived) {
        this.shippingCostWaived = shippingCostWaived;
    }

    public String getShippingNotes() {
        return shippingNotes;
    }

    public void setShippingNotes(String shippingNotes) {
        this.shippingNotes = shippingNotes;
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
}
