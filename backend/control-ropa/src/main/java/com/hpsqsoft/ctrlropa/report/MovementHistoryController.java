package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/movement-history")
public class MovementHistoryController {

    private final MovementHistoryService service;

    public MovementHistoryController(MovementHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public MovementHistoryResponse getMovementHistory(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "ALL") String movementType) {
        return service.getMovementHistory(branchId, startDate, endDate, movementType);
    }
}
