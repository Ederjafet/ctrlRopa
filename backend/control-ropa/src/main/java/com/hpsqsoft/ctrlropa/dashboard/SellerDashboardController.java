package com.hpsqsoft.ctrlropa.dashboard;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class SellerDashboardController {

    private final SellerDashboardService service;
    private final UserDashboardService userDashboardService;

    public SellerDashboardController(SellerDashboardService service,
                                     UserDashboardService userDashboardService) {
        this.service = service;
        this.userDashboardService = userDashboardService;
    }

    @GetMapping("/me")
    public UserDashboardResponse getCurrentUserDashboard() {
        return userDashboardService.getCurrentUserDashboard();
    }

    @GetMapping("/me/branches/{branchId}/metrics/{metric}")
    public DashboardMetricDetailResponse getMetricDetail(@PathVariable Long branchId,
                                                         @PathVariable String metric) {
        return userDashboardService.getMetricDetail(branchId, metric);
    }

    @GetMapping("/seller")
    public SellerDashboardResponse getSellerDashboard(@RequestParam Long branchId) {
        return service.getSellerDashboard(branchId);
    }
}
