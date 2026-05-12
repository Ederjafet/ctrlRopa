package com.hpsqsoft.ctrlropa.system;

import java.time.LocalDateTime;
import java.util.List;

public class SystemLogResponse {

    private List<SystemLogLine> lines;

    public SystemLogResponse(List<SystemLogLine> lines) {
        this.lines = lines;
    }

    public List<SystemLogLine> getLines() { return lines; }

    public static class SystemLogLine {
        private Long id;
        private String eventType;
        private String httpMethod;
        private String requestPath;
        private Integer statusCode;
        private Long branchId;
        private String branchName;
        private Long userId;
        private String userName;
        private String detail;
        private LocalDateTime createdAt;

        public SystemLogLine(Long id,
                             String eventType,
                             String httpMethod,
                             String requestPath,
                             Integer statusCode,
                             Long branchId,
                             String branchName,
                             Long userId,
                             String userName,
                             String detail,
                             LocalDateTime createdAt) {
            this.id = id;
            this.eventType = eventType;
            this.httpMethod = httpMethod;
            this.requestPath = requestPath;
            this.statusCode = statusCode;
            this.branchId = branchId;
            this.branchName = branchName;
            this.userId = userId;
            this.userName = userName;
            this.detail = detail;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public String getEventType() { return eventType; }
        public String getHttpMethod() { return httpMethod; }
        public String getRequestPath() { return requestPath; }
        public Integer getStatusCode() { return statusCode; }
        public Long getBranchId() { return branchId; }
        public String getBranchName() { return branchName; }
        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getDetail() { return detail; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}
