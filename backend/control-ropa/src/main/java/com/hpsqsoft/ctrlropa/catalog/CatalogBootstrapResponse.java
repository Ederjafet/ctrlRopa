package com.hpsqsoft.ctrlropa.catalog;

import java.util.List;

public class CatalogBootstrapResponse {

    private List<SimpleCatalog> branches;
    private List<SimpleCatalog> salesChannels;
    private List<SimpleCatalog> paymentMethods;
    private List<SimpleCatalog> roles;
    private List<SimpleCatalog> permissions;

    private List<SimpleCatalog> productTypes;
    private List<SimpleCatalog> brands;
    private List<SimpleCatalog> sizes;

    private List<SimpleCatalog> storageLocations;
    private List<SimpleCatalog> boxes;

    public CatalogBootstrapResponse(List<SimpleCatalog> branches,
                                    List<SimpleCatalog> salesChannels,
                                    List<SimpleCatalog> paymentMethods,
                                    List<SimpleCatalog> roles,
                                    List<SimpleCatalog> permissions,
                                    List<SimpleCatalog> productTypes,
                                    List<SimpleCatalog> brands,
                                    List<SimpleCatalog> sizes,
                                    List<SimpleCatalog> storageLocations,
                                    List<SimpleCatalog> boxes) {
        this.branches = branches;
        this.salesChannels = salesChannels;
        this.paymentMethods = paymentMethods;
        this.roles = roles;
        this.permissions = permissions;
        this.productTypes = productTypes;
        this.brands = brands;
        this.sizes = sizes;
        this.storageLocations = storageLocations;
        this.boxes = boxes;
    }

    public List<SimpleCatalog> getBranches() { return branches; }
    public List<SimpleCatalog> getSalesChannels() { return salesChannels; }
    public List<SimpleCatalog> getPaymentMethods() { return paymentMethods; }
    public List<SimpleCatalog> getRoles() { return roles; }
    public List<SimpleCatalog> getPermissions() { return permissions; }
    public List<SimpleCatalog> getProductTypes() { return productTypes; }
    public List<SimpleCatalog> getBrands() { return brands; }
    public List<SimpleCatalog> getSizes() { return sizes; }
    public List<SimpleCatalog> getStorageLocations() { return storageLocations; }
    public List<SimpleCatalog> getBoxes() { return boxes; }

    // ------------------------

    public static class SimpleCatalog {

        private Long id;
        private String code;
        private String name;

        public SimpleCatalog(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
    }
}