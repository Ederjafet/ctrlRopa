package com.hpsqsoft.ctrlropa.inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BoxContentResponse {

    private Long reservationId;
    private Long itemId;
    private String itemCode;
    private String itemQrCode;
    private String itemStatus;
    private Long customerId;
    private String customerName;
    private BigDecimal price;
    private String reservationStatus;
    private LocalDateTime reservationCreatedAt;

    public BoxContentResponse(Long reservationId,
                              Long itemId,
                              String itemCode,
                              String itemQrCode,
                              String itemStatus,
                              Long customerId,
                              String customerName,
                              BigDecimal price,
                              String reservationStatus,
                              LocalDateTime reservationCreatedAt) {
        this.reservationId = reservationId;
        this.itemId = itemId;
        this.itemCode = itemCode;
        this.itemQrCode = itemQrCode;
        this.itemStatus = itemStatus;
        this.customerId = customerId;
        this.customerName = customerName;
        this.price = price;
        this.reservationStatus = reservationStatus;
        this.reservationCreatedAt = reservationCreatedAt;
    }

    public Long getReservationId() { return reservationId; }
    public Long getItemId() { return itemId; }
    public String getItemCode() { return itemCode; }
    public String getItemQrCode() { return itemQrCode; }
    public String getItemStatus() { return itemStatus; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public BigDecimal getPrice() { return price; }
    public String getReservationStatus() { return reservationStatus; }
    public LocalDateTime getReservationCreatedAt() { return reservationCreatedAt; }
}