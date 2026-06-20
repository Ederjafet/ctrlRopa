package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;
import java.util.List;

public class UpdatePlatformUsageRatesRequest {
    private List<UsageRateSetting> rates;

    public List<UsageRateSetting> getRates() { return rates; }
    public void setRates(List<UsageRateSetting> rates) { this.rates = rates; }

    public static class UsageRateSetting {
        private String usageType;
        private BigDecimal unitPrice;
        private String currency;
        private Boolean enabled;

        public String getUsageType() { return usageType; }
        public void setUsageType(String usageType) { this.usageType = usageType; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }
}
