package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;

public class UpdatePlatformCommercialAgreementRequest {
    private LicensePayload license;
    private ServiceAgreementPayload serviceAgreement;

    public LicensePayload getLicense() {
        return license;
    }

    public void setLicense(LicensePayload license) {
        this.license = license;
    }

    public ServiceAgreementPayload getServiceAgreement() {
        return serviceAgreement;
    }

    public void setServiceAgreement(ServiceAgreementPayload serviceAgreement) {
        this.serviceAgreement = serviceAgreement;
    }

    public static class LicensePayload {
        private String licenseType;
        private String status;
        private BigDecimal purchaseAmount;
        private String currency;
        private String paymentDate;
        private String paymentMethod;
        private String paymentReference;
        private String notes;
        private String validFrom;
        private String validUntil;
        private Boolean noExpiration;
        private Boolean unlimitedCommercialUse;

        public String getLicenseType() { return licenseType; }
        public void setLicenseType(String licenseType) { this.licenseType = licenseType; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public BigDecimal getPurchaseAmount() { return purchaseAmount; }
        public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getPaymentDate() { return paymentDate; }
        public void setPaymentDate(String paymentDate) { this.paymentDate = paymentDate; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaymentReference() { return paymentReference; }
        public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getValidFrom() { return validFrom; }
        public void setValidFrom(String validFrom) { this.validFrom = validFrom; }
        public String getValidUntil() { return validUntil; }
        public void setValidUntil(String validUntil) { this.validUntil = validUntil; }
        public Boolean getNoExpiration() { return noExpiration; }
        public void setNoExpiration(Boolean noExpiration) { this.noExpiration = noExpiration; }
        public Boolean getUnlimitedCommercialUse() { return unlimitedCommercialUse; }
        public void setUnlimitedCommercialUse(Boolean unlimitedCommercialUse) { this.unlimitedCommercialUse = unlimitedCommercialUse; }
    }

    public static class ServiceAgreementPayload {
        private String serviceType;
        private String deploymentType;
        private String status;
        private BigDecimal annualAmount;
        private String currency;
        private String startDate;
        private String endDate;
        private Boolean autoRenew;
        private String paymentMethod;
        private String paymentReference;
        private String notes;

        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public String getDeploymentType() { return deploymentType; }
        public void setDeploymentType(String deploymentType) { this.deploymentType = deploymentType; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public BigDecimal getAnnualAmount() { return annualAmount; }
        public void setAnnualAmount(BigDecimal annualAmount) { this.annualAmount = annualAmount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public Boolean getAutoRenew() { return autoRenew; }
        public void setAutoRenew(Boolean autoRenew) { this.autoRenew = autoRenew; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaymentReference() { return paymentReference; }
        public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
