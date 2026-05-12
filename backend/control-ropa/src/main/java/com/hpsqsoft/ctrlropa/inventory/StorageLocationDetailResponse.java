package com.hpsqsoft.ctrlropa.inventory;

public class StorageLocationDetailResponse {

    private StorageLocationResponse location;
    private Integer totalItems;
    private Integer availableItems;
    private Integer reservedItems;
    private Integer soldItems;
    private Integer disabledItems;
    private Integer onConsignmentItems;

    public StorageLocationDetailResponse(StorageLocationResponse location,
                                         Integer totalItems,
                                         Integer availableItems,
                                         Integer reservedItems,
                                         Integer soldItems,
                                         Integer disabledItems,
                                         Integer onConsignmentItems) {
        this.location = location;
        this.totalItems = totalItems;
        this.availableItems = availableItems;
        this.reservedItems = reservedItems;
        this.soldItems = soldItems;
        this.disabledItems = disabledItems;
        this.onConsignmentItems = onConsignmentItems;
    }

    public StorageLocationResponse getLocation() {
        return location;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public Integer getAvailableItems() {
        return availableItems;
    }

    public Integer getReservedItems() {
        return reservedItems;
    }

    public Integer getSoldItems() {
        return soldItems;
    }

    public Integer getDisabledItems() {
        return disabledItems;
    }

    public Integer getOnConsignmentItems() {
        return onConsignmentItems;
    }
}