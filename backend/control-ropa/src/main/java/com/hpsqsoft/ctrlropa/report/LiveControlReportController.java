package com.hpsqsoft.ctrlropa.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/live-control")
public class LiveControlReportController {

    private final LiveControlReportService service;

    public LiveControlReportController(LiveControlReportService service) {
        this.service = service;
    }

    @GetMapping
    public LiveControlReportResponse getLiveControlReport(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LiveControlReportRequest request = new LiveControlReportRequest(branchId, date);

        return service.getLiveControlReport(request);
    }
}