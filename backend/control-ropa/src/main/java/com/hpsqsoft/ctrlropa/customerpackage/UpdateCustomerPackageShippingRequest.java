package com.hpsqsoft.ctrlropa.customerpackage;

import java.math.BigDecimal;

public class UpdateCustomerPackageShippingRequest {

    private CustomerPackageDeliveryType deliveryType;
    private CustomerPackageAddressSource addressSource;
    private Long sourceCustomerAddressId;
    private String addressLabel;
    private String recipientName;
    private String recipientPhone;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String references;
    private Boolean saveAddressToCustomer;
    private Boolean makePrimaryAddress;
    private BigDecimal shippingCostAmount;
    private Boolean shippingCostWaived;
    private Boolean collectShipping;
    private Boolean customerProvidedLabel;
    private String shippingNotes;
    private String shippingCarrier;
    private String trackingNumber;

    public CustomerPackageDeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(CustomerPackageDeliveryType deliveryType) {
        this.deliveryType = deliveryType;
    }

    public CustomerPackageAddressSource getAddressSource() {
        return addressSource;
    }

    public void setAddressSource(CustomerPackageAddressSource addressSource) {
        this.addressSource = addressSource;
    }

    public Long getSourceCustomerAddressId() {
        return sourceCustomerAddressId;
    }

    public void setSourceCustomerAddressId(Long sourceCustomerAddressId) {
        this.sourceCustomerAddressId = sourceCustomerAddressId;
    }

    public String getAddressLabel() {
        return addressLabel;
    }

    public void setAddressLabel(String addressLabel) {
        this.addressLabel = addressLabel;
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

    public String getLine1() {
        return line1;
    }

    public void setLine1(String line1) {
        this.line1 = line1;
    }

    public String getLine2() {
        return line2;
    }

    public void setLine2(String line2) {
        this.line2 = line2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getReferences() {
        return references;
    }

    public void setReferences(String references) {
        this.references = references;
    }

    public Boolean getSaveAddressToCustomer() {
        return saveAddressToCustomer;
    }

    public void setSaveAddressToCustomer(Boolean saveAddressToCustomer) {
        this.saveAddressToCustomer = saveAddressToCustomer;
    }

    public Boolean getMakePrimaryAddress() {
        return makePrimaryAddress;
    }

    public void setMakePrimaryAddress(Boolean makePrimaryAddress) {
        this.makePrimaryAddress = makePrimaryAddress;
    }

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

    public Boolean getCollectShipping() {
        return collectShipping;
    }

    public void setCollectShipping(Boolean collectShipping) {
        this.collectShipping = collectShipping;
    }

    public Boolean getCustomerProvidedLabel() {
        return customerProvidedLabel;
    }

    public void setCustomerProvidedLabel(Boolean customerProvidedLabel) {
        this.customerProvidedLabel = customerProvidedLabel;
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
