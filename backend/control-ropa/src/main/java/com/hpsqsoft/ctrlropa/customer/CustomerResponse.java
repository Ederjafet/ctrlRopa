package com.hpsqsoft.ctrlropa.customer;

public class CustomerResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Long ownerUserId;
    private Long createdByUserId;
    private String name;
    private String phone;
    private String email;
    private Boolean isGeneric;
    private GenericType genericType;
    private String status;

    public CustomerResponse() {
    }

    public CustomerResponse(Long id,
                            Long branchId,
                            String branchCode,
                            String branchName,
                            Long ownerUserId,
                            Long createdByUserId,
                            String name,
                            String phone,
                            String email,
                            Boolean isGeneric,
                            GenericType genericType,
                            String status) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.ownerUserId = ownerUserId;
        this.createdByUserId = createdByUserId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.isGeneric = isGeneric;
        this.genericType = genericType;
        this.status = status;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public Long getOwnerUserId() { return ownerUserId; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public Boolean getIsGeneric() { return isGeneric; }
    public GenericType getGenericType() { return genericType; }
    public String getStatus() { return status; }
}