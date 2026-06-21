package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformDashboardSummaryResponse(
        Summary summary,
        TodayActivity todayActivity,
        List<InstallationPending> installationPendings,
        List<AttentionCompany> attentionCompanies,
        List<OperationalAlert> operationalAlerts
) {
    public record Summary(
            Integer activeCompanies,
            Integer trialCompanies,
            Integer suspendedCompanies,
            Integer companiesWithoutPlan,
            Integer companiesWithActiveSubscription,
            Integer companiesWithUsageBilling,
            Integer activeUsers,
            Integer activeBranches,
            Integer activePlans,
            Integer companiesWithUsageToday,
            Integer companiesWithPerpetualLicense,
            Integer appModaHostedCompanies,
            Integer clientHostedCompanies,
            Integer annualServicesPastDue,
            Integer annualServicesExpiringSoon,
            BigDecimal oneTimeLicenseAmount,
            BigDecimal estimatedMonthlyRevenue
    ) {
    }

    public record TodayActivity(
            Integer itemsCreated,
            Integer reservationsCreated,
            Integer packagesCreated,
            Integer paymentsRegistered,
            BigDecimal paymentAmount,
            Integer shipmentsCreated,
            Integer liveSessions,
            Integer liveReservations
    ) {
    }

    public record InstallationPending(
            Long companyId,
            String companyName,
            String status,
            List<String> missing,
            String actionSection
    ) {
    }

    public record AttentionCompany(
            Long companyId,
            String companyName,
            String status,
            String planName,
            String billingModel,
            String licenseType,
            String deploymentType,
            String serviceAgreementStatus,
            Integer activeUsers,
            Integer maxUsers,
            Integer activeBranches,
            Integer maxBranches,
            List<String> modules,
            String usageLabel,
            List<String> pendingLabels
    ) {
    }

    public record OperationalAlert(
            String type,
            String label,
            Integer count,
            String tone,
            String actionSection
    ) {
    }
}
