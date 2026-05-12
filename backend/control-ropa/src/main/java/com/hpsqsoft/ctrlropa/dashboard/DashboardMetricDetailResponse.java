package com.hpsqsoft.ctrlropa.dashboard;

import java.math.BigDecimal;
import java.util.List;

public class DashboardMetricDetailResponse {

    private String metric;
    private String title;
    private List<DetailItem> items;

    public DashboardMetricDetailResponse(String metric, String title, List<DetailItem> items) {
        this.metric = metric;
        this.title = title;
        this.items = items;
    }

    public String getMetric() { return metric; }
    public String getTitle() { return title; }
    public List<DetailItem> getItems() { return items; }

    public static class DetailItem {
        private String label;
        private String subtitle;
        private BigDecimal amount;
        private String status;
        private String route;

        public DetailItem(String label, String subtitle, BigDecimal amount, String status, String route) {
            this.label = label;
            this.subtitle = subtitle;
            this.amount = amount;
            this.status = status;
            this.route = route;
        }

        public String getLabel() { return label; }
        public String getSubtitle() { return subtitle; }
        public BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getRoute() { return route; }
    }
}
