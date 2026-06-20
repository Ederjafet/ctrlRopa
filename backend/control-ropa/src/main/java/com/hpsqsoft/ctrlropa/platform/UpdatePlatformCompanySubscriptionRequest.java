package com.hpsqsoft.ctrlropa.platform;

public class UpdatePlatformCompanySubscriptionRequest {
    private Long planId;
    private String billingModel;
    private String billingPeriod;
    private String status;
    private String startedAt;
    private String endsAt;
    private String nextBillingAt;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public String getBillingModel() { return billingModel; }
    public void setBillingModel(String billingModel) { this.billingModel = billingModel; }
    public String getBillingPeriod() { return billingPeriod; }
    public void setBillingPeriod(String billingPeriod) { this.billingPeriod = billingPeriod; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }
    public String getEndsAt() { return endsAt; }
    public void setEndsAt(String endsAt) { this.endsAt = endsAt; }
    public String getNextBillingAt() { return nextBillingAt; }
    public void setNextBillingAt(String nextBillingAt) { this.nextBillingAt = nextBillingAt; }
}
