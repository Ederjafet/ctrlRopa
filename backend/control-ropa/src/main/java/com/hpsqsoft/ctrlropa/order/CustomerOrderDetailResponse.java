package com.hpsqsoft.ctrlropa.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CustomerOrderDetailResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderLine> items;
    private List<ReservationLine> reservations;
    private List<SaleLine> sales;
    private BigDecimal total;

    public CustomerOrderDetailResponse(Long id,
                                       Long customerId,
                                       String customerName,
                                       Long branchId,
                                       String branchCode,
                                       String status,
                                       LocalDateTime createdAt,
                                       List<OrderLine> items,
                                       List<ReservationLine> reservations,
                                       List<SaleLine> sales,
                                       BigDecimal total) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.status = status;
        this.createdAt = createdAt;
        this.items = items;
        this.reservations = reservations;
        this.sales = sales;
        this.total = total;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<OrderLine> getItems() { return items; }
    public List<ReservationLine> getReservations() { return reservations; }
    public List<SaleLine> getSales() { return sales; }
    public BigDecimal getTotal() { return total; }

    public static class OrderLine {
        private Long orderItemId;
        private String type;
        private Long reservationId;
        private Long saleId;
        private Long itemId;
        private String itemCode;
        private Long salesChannelId;
        private String salesChannelCode;
        private BigDecimal price;
        private String status;
        private String paymentStatus;
        private LocalDateTime createdAt;

        public OrderLine(Long orderItemId,
                         String type,
                         Long reservationId,
                         Long saleId,
                         Long itemId,
                         String itemCode,
                         Long salesChannelId,
                         String salesChannelCode,
                         BigDecimal price,
                         String status,
                         String paymentStatus,
                         LocalDateTime createdAt) {
            this.orderItemId = orderItemId;
            this.type = type;
            this.reservationId = reservationId;
            this.saleId = saleId;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.salesChannelId = salesChannelId;
            this.salesChannelCode = salesChannelCode;
            this.price = price;
            this.status = status;
            this.paymentStatus = paymentStatus;
            this.createdAt = createdAt;
        }

        public Long getOrderItemId() { return orderItemId; }
        public String getType() { return type; }
        public Long getReservationId() { return reservationId; }
        public Long getSaleId() { return saleId; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public Long getSalesChannelId() { return salesChannelId; }
        public String getSalesChannelCode() { return salesChannelCode; }
        public BigDecimal getPrice() { return price; }
        public String getStatus() { return status; }
        public String getPaymentStatus() { return paymentStatus; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class ReservationLine {
        private Long reservationId;
        private Long itemId;
        private String itemCode;
        private Long salesChannelId;
        private String salesChannelCode;
        private BigDecimal price;
        private String status;
        private LocalDateTime createdAt;

        public ReservationLine(Long reservationId,
                               Long itemId,
                               String itemCode,
                               Long salesChannelId,
                               String salesChannelCode,
                               BigDecimal price,
                               String status,
                               LocalDateTime createdAt) {
            this.reservationId = reservationId;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.salesChannelId = salesChannelId;
            this.salesChannelCode = salesChannelCode;
            this.price = price;
            this.status = status;
            this.createdAt = createdAt;
        }

        public Long getReservationId() { return reservationId; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public Long getSalesChannelId() { return salesChannelId; }
        public String getSalesChannelCode() { return salesChannelCode; }
        public BigDecimal getPrice() { return price; }
        public String getStatus() { return status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class SaleLine {
        private Long saleId;
        private Long itemId;
        private String itemCode;
        private Long salesChannelId;
        private String salesChannelCode;
        private BigDecimal price;
        private String status;
        private String paymentStatus;
        private LocalDateTime createdAt;

        public SaleLine(Long saleId,
                        Long itemId,
                        String itemCode,
                        Long salesChannelId,
                        String salesChannelCode,
                        BigDecimal price,
                        String status,
                        String paymentStatus,
                        LocalDateTime createdAt) {
            this.saleId = saleId;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.salesChannelId = salesChannelId;
            this.salesChannelCode = salesChannelCode;
            this.price = price;
            this.status = status;
            this.paymentStatus = paymentStatus;
            this.createdAt = createdAt;
        }

        public Long getSaleId() { return saleId; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public Long getSalesChannelId() { return salesChannelId; }
        public String getSalesChannelCode() { return salesChannelCode; }
        public BigDecimal getPrice() { return price; }
        public String getStatus() { return status; }
        public String getPaymentStatus() { return paymentStatus; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}
