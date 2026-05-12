package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/daily-cancellations")
public class DailyCancellationsReportController {

    private final DailyCancellationsReportService service;

    public DailyCancellationsReportController(DailyCancellationsReportService service) {
        this.service = service;
    }

    @GetMapping
    public DailyCancellationsReportResponse getDailyCancellationsReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        DailyCancellationsReportRequest request = new DailyCancellationsReportRequest(branchId, date);

        return service.getDailyCancellationsReport(request);
    }
}