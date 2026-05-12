package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateConsignmentSettlementRequest {

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    private List<SettlementItemRequest> items;

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<SettlementItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SettlementItemRequest> items) {
        this.items = items;
    }

    public static class SettlementItemRequest {

        private Long consignmentItemId;
        private ConsignmentSettlementResult result;
        private java.math.BigDecimal salePrice;
        private Long customerId;

        @Size(max = 500, message = "notes no puede exceder 500 caracteres")
        private String notes;

        public Long getConsignmentItemId() {
            return consignmentItemId;
        }

        public void setConsignmentItemId(Long consignmentItemId) {
            this.consignmentItemId = consignmentItemId;
        }

        public ConsignmentSettlementResult getResult() {
            return result;
        }

        public void setResult(ConsignmentSettlementResult result) {
            this.result = result;
        }

        public java.math.BigDecimal getSalePrice() {
            return salePrice;
        }

        public void setSalePrice(java.math.BigDecimal salePrice) {
            this.salePrice = salePrice;
        }

        public Long getCustomerId() {
            return customerId;
        }

        public void setCustomerId(Long customerId) {
            this.customerId = customerId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}