package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/daily-deposits")
public class DailyDepositsReportController {

    private final DailyDepositsReportService service;

    public DailyDepositsReportController(DailyDepositsReportService service) {
        this.service = service;
    }

    @GetMapping
    public DailyDepositsReportResponse getDailyDepositsReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        DailyDepositsReportRequest request = new DailyDepositsReportRequest(branchId, date);

        return service.getDailyDepositsReport(request);
    }
}