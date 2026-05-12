package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/daily-deliveries")
public class DailyDeliveriesReportController {

    private final DailyDeliveriesReportService service;

    public DailyDeliveriesReportController(DailyDeliveriesReportService service) {
        this.service = service;
    }

    @GetMapping
    public DailyDeliveriesReportResponse getDailyDeliveriesReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        DailyDeliveriesReportRequest request = new DailyDeliveriesReportRequest(branchId, date);

        return service.getDailyDeliveriesReport(request);
    }
}