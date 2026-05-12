package com.hpsqsoft.ctrlropa.inventory;

import java.math.BigDecimal;
import java.util.List;

public class BoxDetailResponse {

    private BoxResponse box;
    private Integer totalReservations;
    private Integer activeReservations;
    private BigDecimal totalAmount;
    private List<BoxContentResponse> content;

    public BoxDetailResponse(BoxResponse box,
                             Integer totalReservations,
                             Integer activeReservations,
                             BigDecimal totalAmount,
                             List<BoxContentResponse> content) {
        this.box = box;
        this.totalReservations = totalReservations;
        this.activeReservations = activeReservations;
        this.totalAmount = totalAmount;
        this.content = content;
    }

    public BoxResponse getBox() {
        return box;
    }

    public Integer getTotalReservations() {
        return totalReservations;
    }

    public Integer getActiveReservations() {
        return activeReservations;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public List<BoxContentResponse> getContent() {
        return content;
    }
}