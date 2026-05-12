package com.hpsqsoft.ctrlropa.appearance;

import com.hpsqsoft.ctrlropa.common.ButtonStyle;
import com.hpsqsoft.ctrlropa.common.DensityMode;
import com.hpsqsoft.ctrlropa.common.ThemeMode;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appearance_settings")
public class AppearanceSettings {

    @Id
    private Long id;

    @Column(name = "app_name", nullable = false, length = 150)
    private String appName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "login_logo_url", length = 500)
    private String loginLogoUrl;

    @Column(name = "print_logo_url", length = 500)
    private String printLogoUrl;

    @Column(name = "primary_color", nullable = false, length = 20)
    private String primaryColor;

    @Column(name = "secondary_color", nullable = false, length = 20)
    private String secondaryColor;

    @Column(name = "accent_color", nullable = false, length = 20)
    private String accentColor;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false, length = 20)
    private ThemeMode themeMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "density_mode", nullable = false, length = 20)
    private DensityMode densityMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "button_style", nullable = false, length = 20)
    private ButtonStyle buttonStyle;

    @Column(name = "show_logo_on_prints", nullable = false)
    private Boolean showLogoOnPrints;

    @Column(name = "print_footer_text", length = 500)
    private String printFooterText;

    @Column(name = "package_thank_you_text", length = 500)
    private String packageThankYouText;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "primary_button_color", nullable = false, length = 20)
    private String primaryButtonColor;

    @Column(name = "primary_button_text_color", nullable = false, length = 20)
    private String primaryButtonTextColor;

    @Column(name = "secondary_button_color", nullable = false, length = 20)
    private String secondaryButtonColor;

    @Column(name = "secondary_button_text_color", nullable = false, length = 20)
    private String secondaryButtonTextColor;

    @Column(name = "operation_button_color", nullable = false, length = 20)
    private String operationButtonColor;

    @Column(name = "operation_button_text_color", nullable = false, length = 20)
    private String operationButtonTextColor;

    @Column(name = "danger_button_color", nullable = false, length = 20)
    private String dangerButtonColor;

    @Column(name = "danger_button_text_color", nullable = false, length = 20)
    private String dangerButtonTextColor;

    @Column(name = "cancel_button_color", nullable = false, length = 20)
    private String cancelButtonColor;

    @Column(name = "cancel_button_text_color", nullable = false, length = 20)
    private String cancelButtonTextColor;

    @Column(name = "back_button_color", nullable = false, length = 20)
    private String backButtonColor;

    @Column(name = "back_button_text_color", nullable = false, length = 20)
    private String backButtonTextColor;

    @Column(name = "menu_button_color", nullable = false, length = 20)
    private String menuButtonColor;

    @Column(name = "menu_button_text_color", nullable = false, length = 20)
    private String menuButtonTextColor;

    @Column(name = "info_card_background_color", nullable = false, length = 20)
    private String infoCardBackgroundColor;

    @Column(name = "info_card_text_color", nullable = false, length = 20)
    private String infoCardTextColor;

    @Column(name = "info_card_border_color", nullable = false, length = 20)
    private String infoCardBorderColor;

    @Column(name = "calendar_selected_color", nullable = false, length = 20)
    private String calendarSelectedColor;

    @Column(name = "calendar_selected_text_color", nullable = false, length = 20)
    private String calendarSelectedTextColor;

    @Column(name = "calendar_text_color", nullable = false, length = 20)
    private String calendarTextColor;

    @Column(name = "dashboard_metric_background_color", nullable = false, length = 20)
    private String dashboardMetricBackgroundColor;

    @Column(name = "dashboard_metric_text_color", nullable = false, length = 20)
    private String dashboardMetricTextColor;

    @Column(name = "dashboard_accent_color", nullable = false, length = 20)
    private String dashboardAccentColor;

    public AppearanceSettings() {
    }

    @PrePersist
    public void prePersist() {
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Long getUpdatedByUserId() { return updatedByUserId; }
    public void setUpdatedByUserId(Long updatedByUserId) { this.updatedByUserId = updatedByUserId; }

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
}
