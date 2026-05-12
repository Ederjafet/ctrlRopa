package com.hpsqsoft.ctrlropa.sale;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateSaleRequest {

    @NotNull(message = "itemId es obligatorio")
    private Long itemId;

    @NotNull(message = "customerId es obligatorio")
    private Long customerId;

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    private Long sellerUserId;

    private Long customerOrderId;

    @NotNull(message = "salesChannelId es obligatorio")
    private Long salesChannelId;

    @NotNull(message = "price es obligatorio")
    @DecimalMin(value = "0.01", message = "price debe ser mayor a 0")
    private BigDecimal price;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getSellerUserId() {
        return sellerUserId;
    }

    public void setSellerUserId(Long sellerUserId) {
        this.sellerUserId = sellerUserId;
    }

    public Long getCustomerOrderId() {
        return customerOrderId;
    }

    public void setCustomerOrderId(Long customerOrderId) {
        this.customerOrderId = customerOrderId;
    }

    public Long getSalesChannelId() {
        return salesChannelId;
    }

    public void setSalesChannelId(Long salesChannelId) {
        this.salesChannelId = salesChannelId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}