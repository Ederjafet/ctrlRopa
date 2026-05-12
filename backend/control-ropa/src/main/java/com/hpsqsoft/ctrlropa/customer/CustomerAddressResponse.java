package com.hpsqsoft.ctrlropa.customer;

public class CustomerAddressResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String label;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private Boolean isDefault;
    private String status;

    public CustomerAddressResponse() {
    }

    public CustomerAddressResponse(Long id,
                                   Long customerId,
                                   String customerName,
                                   String label,
                                   String line1,
                                   String line2,
                                   String city,
                                   String state,
                                   String postalCode,
                                   String country,
                                   Boolean isDefault,
                                   String status) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.label = label;
        this.line1 = line1;
        this.line2 = line2;
        this.city = city;
        this.state = state;
        this.postalCode = postalCode;
        this.country = country;
        this.isDefault = isDefault;
        this.status = status;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public String getLabel() { return label; }
    public String getLine1() { return line1; }
    public String getLine2() { return line2; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getPostalCode() { return postalCode; }
    public String getCountry() { return country; }
    public Boolean getIsDefault() { return isDefault; }
    public String getStatus() { return status; }
}