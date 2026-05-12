package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.constraints.NotNull;

public class AddCustomerPackageItemRequest {

    @NotNull(message = "itemId es obligatorio")
    private Long itemId;

    private Long reservationId;

    private Long saleId;

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }
}