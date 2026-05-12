package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/daily-store")
public class DailyStoreReportController {

    private final DailyStoreReportService service;

    public DailyStoreReportController(DailyStoreReportService service) {
        this.service = service;
    }

    @GetMapping
    public DailyStoreReportResponse getDailyStoreReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        DailyStoreReportRequest request = new DailyStoreReportRequest(branchId, date);

        return service.getDailyStoreReport(request);
    }
}