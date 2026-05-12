package com.hpsqsoft.ctrlropa.balance;

import com.hpsqsoft.ctrlropa.order.CustomerOrderSettlementResponse;

public class ReverseBalanceApplicationResponse {

    private CustomerOrderSettlementResponse settlement;
    private CustomerBalanceMovement movement;

    public ReverseBalanceApplicationResponse(CustomerOrderSettlementResponse settlement,
                                             CustomerBalanceMovement movement) {
        this.settlement = settlement;
        this.movement = movement;
    }

    public CustomerOrderSettlementResponse getSettlement() {
        return settlement;
    }

    public CustomerBalanceMovement getMovement() {
        return movement;
    }
}