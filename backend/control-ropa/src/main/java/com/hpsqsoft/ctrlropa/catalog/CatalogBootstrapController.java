package com.hpsqsoft.ctrlropa.catalog;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalogs")
public class CatalogBootstrapController {

    private final CatalogBootstrapService service;

    public CatalogBootstrapController(CatalogBootstrapService service) {
        this.service = service;
    }

    @GetMapping("/bootstrap")
    public CatalogBootstrapResponse getBootstrap(@RequestParam(required = false) Long branchId) {
        return service.getBootstrap(branchId);
    }
}