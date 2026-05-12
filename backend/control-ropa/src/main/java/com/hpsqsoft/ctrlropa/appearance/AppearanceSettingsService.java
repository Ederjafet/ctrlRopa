package com.hpsqsoft.ctrlropa.appearance;

import com.hpsqsoft.ctrlropa.common.ButtonStyle;
import com.hpsqsoft.ctrlropa.common.DensityMode;
import com.hpsqsoft.ctrlropa.common.ThemeMode;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AppearanceSettingsService {

    private static final Long GLOBAL_SETTINGS_ID = 1L;

    private final AppearanceSettingsRepository repository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public AppearanceSettingsService(AppearanceSettingsRepository repository,
                                     AccessService accessService,
                                     CurrentUser currentUser) {
        this.repository = repository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public AppearanceSettingsResponse getCurrent() {
        return toResponse(getOrCreateDefaults());
    }

    public AppearanceSettingsResponse update(UpdateAppearanceSettingsRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.MANAGE_BRANDING);

        AppearanceSettings settings = getOrCreateDefaults();

        if (request.getAppName() != null) {
            settings.setAppName(cleanText(request.getAppName()));
        }

        if (request.getLogoUrl() != null) {
            settings.setLogoUrl(cleanNullableText(request.getLogoUrl()));
        }

        if (request.getFaviconUrl() != null) {
            settings.setFaviconUrl(cleanNullableText(request.getFaviconUrl()));
        }

        if (request.getLoginLogoUrl() != null) {
            settings.setLoginLogoUrl(cleanNullableText(request.getLoginLogoUrl()));
        }

        if (request.getPrintLogoUrl() != null) {
            settings.setPrintLogoUrl(cleanNullableText(request.getPrintLogoUrl()));
        }

        if (request.getPrimaryColor() != null) {
            settings.setPrimaryColor(request.getPrimaryColor());
        }

        if (request.getSecondaryColor() != null) {
            settings.setSecondaryColor(request.getSecondaryColor());
        }

        if (request.getAccentColor() != null) {
            settings.setAccentColor(request.getAccentColor());
        }

        if (request.getPrimaryButtonColor() != null) {
            settings.setPrimaryButtonColor(request.getPrimaryButtonColor());
        }

        if (request.getPrimaryButtonTextColor() != null) {
            settings.setPrimaryButtonTextColor(request.getPrimaryButtonTextColor());
        }

        if (request.getSecondaryButtonColor() != null) {
            settings.setSecondaryButtonColor(request.getSecondaryButtonColor());
        }

        if (request.getSecondaryButtonTextColor() != null) {
            settings.setSecondaryButtonTextColor(request.getSecondaryButtonTextColor());
        }

        if (request.getOperationButtonColor() != null) {
            settings.setOperationButtonColor(request.getOperationButtonColor());
        }

        if (request.getOperationButtonTextColor() != null) {
            settings.setOperationButtonTextColor(request.getOperationButtonTextColor());
        }

        if (request.getDangerButtonColor() != null) {
            settings.setDangerButtonColor(request.getDangerButtonColor());
        }

        if (request.getDangerButtonTextColor() != null) {
            settings.setDangerButtonTextColor(request.getDangerButtonTextColor());
        }

        if (request.getCancelButtonColor() != null) {
            settings.setCancelButtonColor(request.getCancelButtonColor());
        }

        if (request.getCancelButtonTextColor() != null) {
            settings.setCancelButtonTextColor(request.getCancelButtonTextColor());
        }

        if (request.getBackButtonColor() != null) {
            settings.setBackButtonColor(request.getBackButtonColor());
        }

        if (request.getBackButtonTextColor() != null) {
            settings.setBackButtonTextColor(request.getBackButtonTextColor());
        }

        if (request.getMenuButtonColor() != null) {
            settings.setMenuButtonColor(request.getMenuButtonColor());
        }

        if (request.getMenuButtonTextColor() != null) {
            settings.setMenuButtonTextColor(request.getMenuButtonTextColor());
        }

        if (request.getInfoCardBackgroundColor() != null) {
            settings.setInfoCardBackgroundColor(request.getInfoCardBackgroundColor());
        }

        if (request.getInfoCardTextColor() != null) {
            settings.setInfoCardTextColor(request.getInfoCardTextColor());
        }

        if (request.getInfoCardBorderColor() != null) {
            settings.setInfoCardBorderColor(request.getInfoCardBorderColor());
        }

        if (request.getCalendarSelectedColor() != null) {
            settings.setCalendarSelectedColor(request.getCalendarSelectedColor());
        }

        if (request.getCalendarSelectedTextColor() != null) {
            settings.setCalendarSelectedTextColor(request.getCalendarSelectedTextColor());
        }

        if (request.getCalendarTextColor() != null) {
            settings.setCalendarTextColor(request.getCalendarTextColor());
        }

        if (request.getDashboardMetricBackgroundColor() != null) {
            settings.setDashboardMetricBackgroundColor(request.getDashboardMetricBackgroundColor());
        }

        if (request.getDashboardMetricTextColor() != null) {
            settings.setDashboardMetricTextColor(request.getDashboardMetricTextColor());
        }

        if (request.getDashboardAccentColor() != null) {
            settings.setDashboardAccentColor(request.getDashboardAccentColor());
        }

        if (request.getThemeMode() != null) {
            settings.setThemeMode(request.getThemeMode());
        }

        if (request.getDensityMode() != null) {
            settings.setDensityMode(request.getDensityMode());
        }

        if (request.getButtonStyle() != null) {
            settings.setButtonStyle(request.getButtonStyle());
        }

        if (request.getShowLogoOnPrints() != null) {
            settings.setShowLogoOnPrints(request.getShowLogoOnPrints());
        }

        if (request.getPrintFooterText() != null) {
            settings.setPrintFooterText(cleanNullableText(request.getPrintFooterText()));
        }

        if (request.getPackageThankYouText() != null) {
            settings.setPackageThankYouText(cleanNullableText(request.getPackageThankYouText()));
        }

        validateRequiredSettings(settings);

        settings.setUpdatedByUserId(userId);

        return toResponse(repository.save(settings));
    }

    private AppearanceSettings getOrCreateDefaults() {
        return repository.findById(GLOBAL_SETTINGS_ID)
                .orElseGet(() -> {
                    AppearanceSettings defaults = new AppearanceSettings();
                    defaults.setId(GLOBAL_SETTINGS_ID);
                    defaults.setAppName("Sistema de Gestión");
                    defaults.setLogoUrl(null);
                    defaults.setFaviconUrl(null);
                    defaults.setLoginLogoUrl(null);
                    defaults.setPrintLogoUrl(null);
                    defaults.setPrimaryColor("#2563EB");
                    defaults.setSecondaryColor("#0F172A");
                    defaults.setAccentColor("#F59E0B");
                    defaults.setThemeMode(ThemeMode.AUTO);
                    defaults.setDensityMode(DensityMode.NORMAL);
                    defaults.setButtonStyle(ButtonStyle.ROUNDED);
                    defaults.setShowLogoOnPrints(true);
                    defaults.setPrintFooterText(null);
                    defaults.setPackageThankYouText("¡Gracias por tu compra!");
                    defaults.setUpdatedByUserId(null);
                    defaults.setPrimaryButtonColor("#2563EB");
                    defaults.setPrimaryButtonTextColor("#FFFFFF");
                    defaults.setSecondaryButtonColor("#0F172A");
                    defaults.setSecondaryButtonTextColor("#FFFFFF");
                    defaults.setOperationButtonColor("#0F172A");
                    defaults.setOperationButtonTextColor("#FFFFFF");
                    defaults.setDangerButtonColor("#B00020");
                    defaults.setDangerButtonTextColor("#FFFFFF");
                    defaults.setCancelButtonColor("#6B7280");
                    defaults.setCancelButtonTextColor("#FFFFFF");
                    defaults.setBackButtonColor("#374151");
                    defaults.setBackButtonTextColor("#FFFFFF");
                    defaults.setMenuButtonColor("#2563EB");
                    defaults.setMenuButtonTextColor("#FFFFFF");
                    defaults.setInfoCardBackgroundColor("#EEF2FF");
                    defaults.setInfoCardTextColor("#1E293B");
                    defaults.setInfoCardBorderColor("#93C5FD");
                    defaults.setCalendarSelectedColor("#0F172A");
                    defaults.setCalendarSelectedTextColor("#FFFFFF");
                    defaults.setCalendarTextColor("#111111");
                    defaults.setDashboardMetricBackgroundColor("#FFFFFF");
                    defaults.setDashboardMetricTextColor("#111111");
                    defaults.setDashboardAccentColor("#2563EB");
                    return repository.save(defaults);
                });
    }

    private void validateRequiredSettings(AppearanceSettings settings) {
        if (settings.getAppName() == null || settings.getAppName().isBlank()) {
            throw new IllegalArgumentException("appName es obligatorio");
        }

        if (settings.getPrimaryColor() == null || settings.getPrimaryColor().isBlank()) {
            throw new IllegalArgumentException("primaryColor es obligatorio");
        }

        if (settings.getSecondaryColor() == null || settings.getSecondaryColor().isBlank()) {
            throw new IllegalArgumentException("secondaryColor es obligatorio");
        }

        if (settings.getAccentColor() == null || settings.getAccentColor().isBlank()) {
            throw new IllegalArgumentException("accentColor es obligatorio");
        }

        if (settings.getPrimaryButtonColor() == null || settings.getPrimaryButtonColor().isBlank()) {
            throw new IllegalArgumentException("primaryButtonColor es obligatorio");
        }

        if (settings.getPrimaryButtonTextColor() == null || settings.getPrimaryButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("primaryButtonTextColor es obligatorio");
        }

        if (settings.getSecondaryButtonColor() == null || settings.getSecondaryButtonColor().isBlank()) {
            throw new IllegalArgumentException("secondaryButtonColor es obligatorio");
        }

        if (settings.getSecondaryButtonTextColor() == null || settings.getSecondaryButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("secondaryButtonTextColor es obligatorio");
        }

        if (settings.getOperationButtonColor() == null || settings.getOperationButtonColor().isBlank()) {
            throw new IllegalArgumentException("operationButtonColor es obligatorio");
        }

        if (settings.getOperationButtonTextColor() == null || settings.getOperationButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("operationButtonTextColor es obligatorio");
        }

        if (settings.getDangerButtonColor() == null || settings.getDangerButtonColor().isBlank()) {
            throw new IllegalArgumentException("dangerButtonColor es obligatorio");
        }

        if (settings.getDangerButtonTextColor() == null || settings.getDangerButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("dangerButtonTextColor es obligatorio");
        }

        if (settings.getCancelButtonColor() == null || settings.getCancelButtonColor().isBlank()) {
            throw new IllegalArgumentException("cancelButtonColor es obligatorio");
        }

        if (settings.getCancelButtonTextColor() == null || settings.getCancelButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("cancelButtonTextColor es obligatorio");
        }

        if (settings.getBackButtonColor() == null || settings.getBackButtonColor().isBlank()) {
            throw new IllegalArgumentException("backButtonColor es obligatorio");
        }

        if (settings.getBackButtonTextColor() == null || settings.getBackButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("backButtonTextColor es obligatorio");
        }

        if (settings.getMenuButtonColor() == null || settings.getMenuButtonColor().isBlank()) {
            throw new IllegalArgumentException("menuButtonColor es obligatorio");
        }

        if (settings.getMenuButtonTextColor() == null || settings.getMenuButtonTextColor().isBlank()) {
            throw new IllegalArgumentException("menuButtonTextColor es obligatorio");
        }

        if (settings.getInfoCardBackgroundColor() == null || settings.getInfoCardBackgroundColor().isBlank()) {
            throw new IllegalArgumentException("infoCardBackgroundColor es obligatorio");
        }

        if (settings.getInfoCardTextColor() == null || settings.getInfoCardTextColor().isBlank()) {
            throw new IllegalArgumentException("infoCardTextColor es obligatorio");
        }

        if (settings.getInfoCardBorderColor() == null || settings.getInfoCardBorderColor().isBlank()) {
            throw new IllegalArgumentException("infoCardBorderColor es obligatorio");
        }

        if (settings.getCalendarSelectedColor() == null || settings.getCalendarSelectedColor().isBlank()) {
            throw new IllegalArgumentException("calendarSelectedColor es obligatorio");
        }

        if (settings.getCalendarSelectedTextColor() == null || settings.getCalendarSelectedTextColor().isBlank()) {
            throw new IllegalArgumentException("calendarSelectedTextColor es obligatorio");
        }

        if (settings.getCalendarTextColor() == null || settings.getCalendarTextColor().isBlank()) {
            throw new IllegalArgumentException("calendarTextColor es obligatorio");
        }

        if (settings.getDashboardMetricBackgroundColor() == null || settings.getDashboardMetricBackgroundColor().isBlank()) {
            throw new IllegalArgumentException("dashboardMetricBackgroundColor es obligatorio");
        }

        if (settings.getDashboardMetricTextColor() == null || settings.getDashboardMetricTextColor().isBlank()) {
            throw new IllegalArgumentException("dashboardMetricTextColor es obligatorio");
        }

        if (settings.getDashboardAccentColor() == null || settings.getDashboardAccentColor().isBlank()) {
            throw new IllegalArgumentException("dashboardAccentColor es obligatorio");
        }

        if (settings.getThemeMode() == null) {
            throw new IllegalArgumentException("themeMode es obligatorio");
        }

        if (settings.getDensityMode() == null) {
            throw new IllegalArgumentException("densityMode es obligatorio");
        }

        if (settings.getButtonStyle() == null) {
            throw new IllegalArgumentException("buttonStyle es obligatorio");
        }

        if (settings.getShowLogoOnPrints() == null) {
            throw new IllegalArgumentException("showLogoOnPrints es obligatorio");
        }
    }

    private String cleanText(String value) {
        return value == null ? null : value.trim();
    }

    private String cleanNullableText(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private AppearanceSettingsResponse toResponse(AppearanceSettings settings) {
        return new AppearanceSettingsResponse(
                settings.getId(),
                settings.getAppName(),
                settings.getLogoUrl(),
                settings.getFaviconUrl(),
                settings.getLoginLogoUrl(),
                settings.getPrintLogoUrl(),
                settings.getPrimaryColor(),
                settings.getSecondaryColor(),
                settings.getAccentColor(),
                settings.getThemeMode(),
                settings.getDensityMode(),
                settings.getButtonStyle(),
                settings.getShowLogoOnPrints(),
                settings.getPrintFooterText(),
                settings.getPackageThankYouText(),
                settings.getUpdatedAt(),
                settings.getUpdatedByUserId(),
                settings.getPrimaryButtonColor(),
                settings.getPrimaryButtonTextColor(),
                settings.getSecondaryButtonColor(),
                settings.getSecondaryButtonTextColor(),
                settings.getOperationButtonColor(),
                settings.getOperationButtonTextColor(),
                settings.getDangerButtonColor(),
                settings.getDangerButtonTextColor(),
                settings.getCancelButtonColor(),
                settings.getCancelButtonTextColor(),
                settings.getBackButtonColor(),
                settings.getBackButtonTextColor(),
                settings.getMenuButtonColor(),
                settings.getMenuButtonTextColor(),
                settings.getInfoCardBackgroundColor(),
                settings.getInfoCardTextColor(),
                settings.getInfoCardBorderColor(),
                settings.getCalendarSelectedColor(),
                settings.getCalendarSelectedTextColor(),
                settings.getCalendarTextColor(),
                settings.getDashboardMetricBackgroundColor(),
                settings.getDashboardMetricTextColor(),
                settings.getDashboardAccentColor()
        );
    }
}
