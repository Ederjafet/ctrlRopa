package com.hpsqsoft.ctrlropa.security.audit;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security/audit-events")
public class SecurityAuditEventController {

    private final SecurityAuditEventQueryService service;

    public SecurityAuditEventController(SecurityAuditEventQueryService service) {
        this.service = service;
    }

    @GetMapping
    public SecurityAuditEventResponse findEvents(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Integer statusCode,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String path,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return service.findEvents(eventType, email, companyId, branchId, statusCode, dateFrom, dateTo, path, page, size);
    }

    @GetMapping("/summary")
    public SecurityAuditSummaryResponse summary(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String eventType
    ) {
        return service.summary(eventType, email, companyId, branchId, dateFrom, dateTo);
    }

    @GetMapping("/alerts")
    public SecurityAuditAlertsResponse alerts(
            @RequestParam(required = false) Integer windowMinutes,
            @RequestParam(required = false) Integer threshold,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String email
    ) {
        return service.alerts(windowMinutes, threshold, companyId, branchId, email);
    }
}
