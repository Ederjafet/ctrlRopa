package com.hpsqsoft.ctrlropa.report;

import java.time.LocalDate;

public class LiveControlReportRequest {

    private Long branchId;
    private LocalDate date;

    public LiveControlReportRequest() {
    }

    public LiveControlReportRequest(Long branchId, LocalDate date) {
        this.branchId = branchId;
        this.date = date;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }
}