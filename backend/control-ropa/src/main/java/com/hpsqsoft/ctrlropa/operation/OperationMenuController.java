package com.hpsqsoft.ctrlropa.operation;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operation")
public class OperationMenuController {

    private final OperationMenuService service;

    public OperationMenuController(OperationMenuService service) {
        this.service = service;
    }

    @GetMapping("/menu")
    public OperationMenuResponse getMenu() {
        return service.getMenu();
    }
}