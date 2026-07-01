package com.hpsqsoft.ctrlropa.shipment;

import java.util.ArrayList;
import java.util.List;

public class ShipmentCostShareRequest {

    private ShipmentCostShareMethod shareMethod;
    private List<ShipmentCostShareLineRequest> shares = new ArrayList<>();

    public ShipmentCostShareMethod getShareMethod() {
        return shareMethod;
    }

    public void setShareMethod(ShipmentCostShareMethod shareMethod) {
        this.shareMethod = shareMethod;
    }

    public List<ShipmentCostShareLineRequest> getShares() {
        return shares;
    }

    public void setShares(List<ShipmentCostShareLineRequest> shares) {
        this.shares = shares;
    }
}