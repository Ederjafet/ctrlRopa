package com.hpsqsoft.ctrlropa.appearance;

import com.hpsqsoft.ctrlropa.common.ButtonStyle;
import com.hpsqsoft.ctrlropa.common.DensityMode;
import com.hpsqsoft.ctrlropa.common.ThemeMode;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateAppearanceSettingsRequest {

    @Size(max = 150, message = "appName no puede exceder 150 caracteres")
    private String appName;

    @Size(max = 500, message = "logoUrl no puede exceder 500 caracteres")
    private String logoUrl;

    @Size(max = 500, message = "faviconUrl no puede exceder 500 caracteres")
    private String faviconUrl;

    @Size(max = 500, message = "loginLogoUrl no puede exceder 500 caracteres")
    private String loginLogoUrl;

    @Size(max = 500, message = "printLogoUrl no puede exceder 500 caracteres")
    private String printLogoUrl;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "primaryColor debe tener formato hexadecimal, ejemplo #2563EB")
    private String primaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "secondaryColor debe tener formato hexadecimal, ejemplo #0F172A")
    private String secondaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "accentColor debe tener formato hexadecimal, ejemplo #F59E0B")
    private String accentColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "primaryButtonColor debe tener formato hexadecimal, ejemplo #2563EB")
    private String primaryButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "primaryButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String primaryButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "secondaryButtonColor debe tener formato hexadecimal, ejemplo #0F172A")
    private String secondaryButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "secondaryButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String secondaryButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "operationButtonColor debe tener formato hexadecimal, ejemplo #0F172A")
    private String operationButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "operationButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String operationButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "dangerButtonColor debe tener formato hexadecimal, ejemplo #B00020")
    private String dangerButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "dangerButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String dangerButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "cancelButtonColor debe tener formato hexadecimal, ejemplo #6B7280")
    private String cancelButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "cancelButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String cancelButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "backButtonColor debe tener formato hexadecimal, ejemplo #374151")
    private String backButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "backButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String backButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "menuButtonColor debe tener formato hexadecimal, ejemplo #2563EB")
    private String menuButtonColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "menuButtonTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String menuButtonTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "infoCardBackgroundColor debe tener formato hexadecimal, ejemplo #EEF2FF")
    private String infoCardBackgroundColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "infoCardTextColor debe tener formato hexadecimal, ejemplo #1E293B")
    private String infoCardTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "infoCardBorderColor debe tener formato hexadecimal, ejemplo #93C5FD")
    private String infoCardBorderColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "calendarSelectedColor debe tener formato hexadecimal, ejemplo #0F172A")
    private String calendarSelectedColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "calendarSelectedTextColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String calendarSelectedTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "calendarTextColor debe tener formato hexadecimal, ejemplo #111111")
    private String calendarTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "dashboardMetricBackgroundColor debe tener formato hexadecimal, ejemplo #FFFFFF")
    private String dashboardMetricBackgroundColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "dashboardMetricTextColor debe tener formato hexadecimal, ejemplo #111111")
    private String dashboardMetricTextColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "dashboardAccentColor debe tener formato hexadecimal, ejemplo #2563EB")
    private String dashboardAccentColor;

    private ThemeMode themeMode;
    private DensityMode densityMode;
    private ButtonStyle buttonStyle;
    private Boolean showLogoOnPrints;

    @Size(max = 500, message = "printFooterText no puede exceder 500 caracteres")
    private String printFooterText;

    @Size(max = 500, message = "packageThankYouText no puede exceder 500 caracteres")
    private String packageThankYouText;

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getFaviconUrl() { return faviconUrl; }
    public void setFaviconUrl(String faviconUrl) { this.faviconUrl = faviconUrl; }

    public String getLoginLogoUrl() { return loginLogoUrl; }
    public void setLoginLogoUrl(String loginLogoUrl) { this.loginLogoUrl = loginLogoUrl; }

    public String getPrintLogoUrl() { return printLogoUrl; }
    public void setPrintLogoUrl(String printLogoUrl) { this.printLogoUrl = printLogoUrl; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public String getPrimaryButtonColor() { return primaryButtonColor; }
    public void setPrimaryButtonColor(String primaryButtonColor) { this.primaryButtonColor = primaryButtonColor; }

    public String getPrimaryButtonTextColor() { return primaryButtonTextColor; }
    public void setPrimaryButtonTextColor(String primaryButtonTextColor) { this.primaryButtonTextColor = primaryButtonTextColor; }

    public String getSecondaryButtonColor() { return secondaryButtonColor; }
    public void setSecondaryButtonColor(String secondaryButtonColor) { this.secondaryButtonColor = secondaryButtonColor; }

    public String getSecondaryButtonTextColor() { return secondaryButtonTextColor; }
    public void setSecondaryButtonTextColor(String secondaryButtonTextColor) { this.secondaryButtonTextColor = secondaryButtonTextColor; }

    public String getOperationButtonColor() { return operationButtonColor; }
    public void setOperationButtonColor(String operationButtonColor) { this.operationButtonColor = operationButtonColor; }

    public String getOperationButtonTextColor() { return operationButtonTextColor; }
    public void setOperationButtonTextColor(String operationButtonTextColor) { this.operationButtonTextColor = operationButtonTextColor; }

    public String getDangerButtonColor() { return dangerButtonColor; }
    public void setDangerButtonColor(String dangerButtonColor) { this.dangerButtonColor = dangerButtonColor; }

    public String getDangerButtonTextColor() { return dangerButtonTextColor; }
    public void setDangerButtonTextColor(String dangerButtonTextColor) { this.dangerButtonTextColor = dangerButtonTextColor; }

    public String getCancelButtonColor() { return cancelButtonColor; }
    public void setCancelButtonColor(String cancelButtonColor) { this.cancelButtonColor = cancelButtonColor; }

    public String getCancelButtonTextColor() { return cancelButtonTextColor; }
    public void setCancelButtonTextColor(String cancelButtonTextColor) { this.cancelButtonTextColor = cancelButtonTextColor; }

    public String getBackButtonColor() { return backButtonColor; }
    public void setBackButtonColor(String backButtonColor) { this.backButtonColor = backButtonColor; }

    public String getBackButtonTextColor() { return backButtonTextColor; }
    public void setBackButtonTextColor(String backButtonTextColor) { this.backButtonTextColor = backButtonTextColor; }

    public String getMenuButtonColor() { return menuButtonColor; }
    public void setMenuButtonColor(String menuButtonColor) { this.menuButtonColor = menuButtonColor; }

    public String getMenuButtonTextColor() { return menuButtonTextColor; }
    public void setMenuButtonTextColor(String menuButtonTextColor) { this.menuButtonTextColor = menuButtonTextColor; }

    public String getInfoCardBackgroundColor() { return infoCardBackgroundColor; }
    public void setInfoCardBackgroundColor(String infoCardBackgroundColor) { this.infoCardBackgroundColor = infoCardBackgroundColor; }

    public String getInfoCardTextColor() { return infoCardTextColor; }
    public void setInfoCardTextColor(String infoCardTextColor) { this.infoCardTextColor = infoCardTextColor; }

    public String getInfoCardBorderColor() { return infoCardBorderColor; }
    public void setInfoCardBorderColor(String infoCardBorderColor) { this.infoCardBorderColor = infoCardBorderColor; }

    public String getCalendarSelectedColor() { return calendarSelectedColor; }
    public void setCalendarSelectedColor(String calendarSelectedColor) { this.calendarSelectedColor = calendarSelectedColor; }

    public String getCalendarSelectedTextColor() { return calendarSelectedTextColor; }
    public void setCalendarSelectedTextColor(String calendarSelectedTextColor) { this.calendarSelectedTextColor = calendarSelectedTextColor; }

    public String getCalendarTextColor() { return calendarTextColor; }
    public void setCalendarTextColor(String calendarTextColor) { this.calendarTextColor = calendarTextColor; }

    public String getDashboardMetricBackgroundColor() { return dashboardMetricBackgroundColor; }
    public void setDashboardMetricBackgroundColor(String dashboardMetricBackgroundColor) { this.dashboardMetricBackgroundColor = dashboardMetricBackgroundColor; }

    public String getDashboardMetricTextColor() { return dashboardMetricTextColor; }
    public void setDashboardMetricTextColor(String dashboardMetricTextColor) { this.dashboardMetricTextColor = dashboardMetricTextColor; }

    public String getDashboardAccentColor() { return dashboardAccentColor; }
    public void setDashboardAccentColor(String dashboardAccentColor) { this.dashboardAccentColor = dashboardAccentColor; }

    public ThemeMode getThemeMode() { return themeMode; }
    public void setThemeMode(ThemeMode themeMode) { this.themeMode = themeMode; }

    public DensityMode getDensityMode() { return densityMode; }
    public void setDensityMode(DensityMode densityMode) { this.densityMode = densityMode; }

    public ButtonStyle getButtonStyle() { return buttonStyle; }
    public void setButtonStyle(ButtonStyle buttonStyle) { this.buttonStyle = buttonStyle; }

    public Boolean getShowLogoOnPrints() { return showLogoOnPrints; }
    public void setShowLogoOnPrints(Boolean showLogoOnPrints) { this.showLogoOnPrints = showLogoOnPrints; }

    public String getPrintFooterText() { return printFooterText; }
    public void setPrintFooterText(String printFooterText) { this.printFooterText = printFooterText; }

    public String getPackageThankYouText() { return packageThankYouText; }
    public void setPackageThankYouText(String packageThankYouText) { this.packageThankYouText = packageThankYouText; }
}
