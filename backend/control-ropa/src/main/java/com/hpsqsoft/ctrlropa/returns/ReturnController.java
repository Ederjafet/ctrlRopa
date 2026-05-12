package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    private final ReturnService service;

    public ReturnController(ReturnService service) {
        this.service = service;
    }

    @PostMapping
    public ReturnResponse create(@Valid @RequestBody CreateReturnRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/items")
    public ReturnResponse addItem(@PathVariable Long id,
                                  @Valid @RequestBody AddReturnItemRequest request) {
        return service.addItem(id, request);
    }

    @PatchMapping("/{id}/process")
    public ReturnResponse process(@PathVariable Long id,
                                  @Valid @RequestBody ProcessReturnRequest request) {
        return service.process(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public ReturnResponse cancel(@PathVariable Long id,
                                 @Valid @RequestBody CancelReturnRequest request) {
        return service.cancel(id, request);
    }

    @GetMapping("/{id}")
    public ReturnResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/sale/{saleId}")
    public List<ReturnResponse> findBySale(@PathVariable Long saleId) {
        return service.findBySale(saleId);
    }

    @GetMapping
    public List<ReturnResponse> findByStatus(@RequestParam ReturnStatus status) {
        return service.findByStatus(status);
    }
    
    @PostMapping("/item-code/{code}")
    public ReturnResponse createByItemCode(@PathVariable String code,
                                           @Valid @RequestBody CreateReturnByItemRequest request) {
        return service.createByItemCode(code, request);
    }

    @PostMapping("/qr/{qrCode}")
    public ReturnResponse createByQrCode(@PathVariable String qrCode,
                                         @Valid @RequestBody CreateReturnByItemRequest request) {
        return service.createByQrCode(qrCode, request);
    }
}