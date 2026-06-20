package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;
import java.util.List;

public class UpdatePlatformPlanPricesRequest {
    private List<PriceSetting> prices;

    public List<PriceSetting> getPrices() { return prices; }
    public void setPrices(List<PriceSetting> prices) { this.prices = prices; }

    public static class PriceSetting {
        private String billingPeriod;
        private BigDecimal priceAmount;
        private String currency;
        private String status;

        public String getBillingPeriod() { return billingPeriod; }
        public void setBillingPeriod(String billingPeriod) { this.billingPeriod = billingPeriod; }
        public BigDecimal getPriceAmount() { return priceAmount; }
        public void setPriceAmount(BigDecimal priceAmount) { this.priceAmount = priceAmount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
