package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/remissions")
public class RemissionsReportController {

    private final RemissionsReportService service;

    public RemissionsReportController(RemissionsReportService service) {
        this.service = service;
    }

    @GetMapping
    public RemissionsReportResponse getRemissionsReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        RemissionsReportRequest request = new RemissionsReportRequest(branchId, date);

        return service.getRemissionsReport(request);
    }
}