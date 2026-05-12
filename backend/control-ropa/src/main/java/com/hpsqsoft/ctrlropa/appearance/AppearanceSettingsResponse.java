package com.hpsqsoft.ctrlropa.appearance;

import com.hpsqsoft.ctrlropa.common.ButtonStyle;
import com.hpsqsoft.ctrlropa.common.DensityMode;
import com.hpsqsoft.ctrlropa.common.ThemeMode;

import java.time.LocalDateTime;

public class AppearanceSettingsResponse {

    private Long id;
    private String appName;
    private String logoUrl;
    private String faviconUrl;
    private String loginLogoUrl;
    private String printLogoUrl;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private ThemeMode themeMode;
    private DensityMode densityMode;
    private ButtonStyle buttonStyle;
    private Boolean showLogoOnPrints;
    private String printFooterText;
    private String packageThankYouText;
    private LocalDateTime updatedAt;
    private Long updatedByUserId;

    private String primaryButtonColor;
    private String primaryButtonTextColor;
    private String secondaryButtonColor;
    private String secondaryButtonTextColor;
    private String operationButtonColor;
    private String operationButtonTextColor;
    private String dangerButtonColor;
    private String dangerButtonTextColor;
    private String cancelButtonColor;
    private String cancelButtonTextColor;
    private String backButtonColor;
    private String backButtonTextColor;
    private String menuButtonColor;
    private String menuButtonTextColor;
    private String infoCardBackgroundColor;
    private String infoCardTextColor;
    private String infoCardBorderColor;
    private String calendarSelectedColor;
    private String calendarSelectedTextColor;
    private String calendarTextColor;
    private String dashboardMetricBackgroundColor;
    private String dashboardMetricTextColor;
    private String dashboardAccentColor;

    public AppearanceSettingsResponse(Long id,
                                      String appName,
                                      String logoUrl,
                                      String faviconUrl,
                                      String loginLogoUrl,
                                      String printLogoUrl,
                                      String primaryColor,
                                      String secondaryColor,
                                      String accentColor,
                                      ThemeMode themeMode,
                                      DensityMode densityMode,
                                      ButtonStyle buttonStyle,
                                      Boolean showLogoOnPrints,
                                      String printFooterText,
                                      String packageThankYouText,
                                      LocalDateTime updatedAt,
                                      Long updatedByUserId,
                                      String primaryButtonColor,
                                      String primaryButtonTextColor,
                                      String secondaryButtonColor,
                                      String secondaryButtonTextColor,
                                      String operationButtonColor,
                                      String operationButtonTextColor,
                                      String dangerButtonColor,
                                      String dangerButtonTextColor,
                                      String cancelButtonColor,
                                      String cancelButtonTextColor,
                                      String backButtonColor,
                                      String backButtonTextColor,
                                      String menuButtonColor,
                                      String menuButtonTextColor,
                                      String infoCardBackgroundColor,
                                      String infoCardTextColor,
                                      String infoCardBorderColor,
                                      String calendarSelectedColor,
                                      String calendarSelectedTextColor,
                                      String calendarTextColor,
                                      String dashboardMetricBackgroundColor,
                                      String dashboardMetricTextColor,
                                      String dashboardAccentColor) {
        this.id = id;
        this.appName = appName;
        this.logoUrl = logoUrl;
        this.faviconUrl = faviconUrl;
        this.loginLogoUrl = loginLogoUrl;
        this.printLogoUrl = printLogoUrl;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.accentColor = accentColor;
        this.themeMode = themeMode;
        this.densityMode = densityMode;
        this.buttonStyle = buttonStyle;
        this.showLogoOnPrints = showLogoOnPrints;
        this.printFooterText = printFooterText;
        this.packageThankYouText = packageThankYouText;
        this.updatedAt = updatedAt;
        this.updatedByUserId = updatedByUserId;
        this.primaryButtonColor = primaryButtonColor;
        this.primaryButtonTextColor = primaryButtonTextColor;
        this.secondaryButtonColor = secondaryButtonColor;
        this.secondaryButtonTextColor = secondaryButtonTextColor;
        this.operationButtonColor = operationButtonColor;
        this.operationButtonTextColor = operationButtonTextColor;
        this.dangerButtonColor = dangerButtonColor;
        this.dangerButtonTextColor = dangerButtonTextColor;
        this.cancelButtonColor = cancelButtonColor;
        this.cancelButtonTextColor = cancelButtonTextColor;
        this.backButtonColor = backButtonColor;
        this.backButtonTextColor = backButtonTextColor;
        this.menuButtonColor = menuButtonColor;
        this.menuButtonTextColor = menuButtonTextColor;
        this.infoCardBackgroundColor = infoCardBackgroundColor;
        this.infoCardTextColor = infoCardTextColor;
        this.infoCardBorderColor = infoCardBorderColor;
        this.calendarSelectedColor = calendarSelectedColor;
        this.calendarSelectedTextColor = calendarSelectedTextColor;
        this.calendarTextColor = calendarTextColor;
        this.dashboardMetricBackgroundColor = dashboardMetricBackgroundColor;
        this.dashboardMetricTextColor = dashboardMetricTextColor;
        this.dashboardAccentColor = dashboardAccentColor;
    }

    public Long getId() { return id; }
    public String getAppName() { return appName; }
    public String getLogoUrl() { return logoUrl; }
    public String getFaviconUrl() { return faviconUrl; }
    public String getLoginLogoUrl() { return loginLogoUrl; }
    public String getPrintLogoUrl() { return printLogoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public String getSecondaryColor() { return secondaryColor; }
    public String getAccentColor() { return accentColor; }
    public ThemeMode getThemeMode() { return themeMode; }
    public DensityMode getDensityMode() { return densityMode; }
    public ButtonStyle getButtonStyle() { return buttonStyle; }
    public Boolean getShowLogoOnPrints() { return showLogoOnPrints; }
    public String getPrintFooterText() { return printFooterText; }
    public String getPackageThankYouText() { return packageThankYouText; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getUpdatedByUserId() { return updatedByUserId; }

    public String getPrimaryButtonColor() { return primaryButtonColor; }
    public String getPrimaryButtonTextColor() { return primaryButtonTextColor; }
    public String getSecondaryButtonColor() { return secondaryButtonColor; }
    public String getSecondaryButtonTextColor() { return secondaryButtonTextColor; }
    public String getOperationButtonColor() { return operationButtonColor; }
    public String getOperationButtonTextColor() { return operationButtonTextColor; }
    public String getDangerButtonColor() { return dangerButtonColor; }
    public String getDangerButtonTextColor() { return dangerButtonTextColor; }
    public String getCancelButtonColor() { return cancelButtonColor; }
    public String getCancelButtonTextColor() { return cancelButtonTextColor; }
    public String getBackButtonColor() { return backButtonColor; }
    public String getBackButtonTextColor() { return backButtonTextColor; }
    public String getMenuButtonColor() { return menuButtonColor; }
    public String getMenuButtonTextColor() { return menuButtonTextColor; }
    public String getInfoCardBackgroundColor() { return infoCardBackgroundColor; }
    public String getInfoCardTextColor() { return infoCardTextColor; }
    public String getInfoCardBorderColor() { return infoCardBorderColor; }
    public String getCalendarSelectedColor() { return calendarSelectedColor; }
    public String getCalendarSelectedTextColor() { return calendarSelectedTextColor; }
    public String getCalendarTextColor() { return calendarTextColor; }
    public String getDashboardMetricBackgroundColor() { return dashboardMetricBackgroundColor; }
    public String getDashboardMetricTextColor() { return dashboardMetricTextColor; }
    public String getDashboardAccentColor() { return dashboardAccentColor; }
}
