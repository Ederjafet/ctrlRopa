package com.hpsqsoft.ctrlropa.item;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<ItemResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/{id}")
    public ItemResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/code/{code}")
    public ItemResponse findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @GetMapping("/lookup/code/{code}")
    public ItemLookupResponse lookupByCode(@PathVariable String code) {
        return service.lookupByCode(code);
    }

    @GetMapping("/lookup/qr/{qrCode}")
    public ItemLookupResponse lookupByQrCode(@PathVariable String qrCode) {
        return service.lookupByQrCode(qrCode);
    }

    @PostMapping
    public ItemResponse create(@RequestBody ItemService.CreateItemRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable Long id, @RequestBody ItemService.UpdateItemRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/location/{storageLocationId}")
    public ItemResponse changeLocation(@PathVariable Long id, @PathVariable Long storageLocationId) {
        return service.changeLocation(id, storageLocationId);
    }
}