package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.constraints.NotNull;

public class AddReturnItemRequest {

    @NotNull(message = "itemId es obligatorio")
    private Long itemId;

    @NotNull(message = "condition es obligatorio")
    private ReturnItemCondition condition;

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public ReturnItemCondition getCondition() {
        return condition;
    }

    public void setCondition(ReturnItemCondition condition) {
        this.condition = condition;
    }
}