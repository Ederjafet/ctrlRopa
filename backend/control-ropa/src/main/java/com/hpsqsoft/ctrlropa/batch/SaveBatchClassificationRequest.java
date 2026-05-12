package com.hpsqsoft.ctrlropa.batch;

import java.util.ArrayList;
import java.util.List;

public class SaveBatchClassificationRequest {

    private List<BatchClassificationDetailRequest> details = new ArrayList<>();

    public SaveBatchClassificationRequest() {
    }

    public List<BatchClassificationDetailRequest> getDetails() { return details; }
    public void setDetails(List<BatchClassificationDetailRequest> details) { this.details = details; }
}
