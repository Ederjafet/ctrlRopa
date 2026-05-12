package com.hpsqsoft.ctrlropa.security.settings;

public class SecuritySettingsResponse {

    private Integer sessionTimeoutMinutes;
    private Integer maxLoginAttempts;
    private Integer loginLockoutMinutes;
    private Integer passwordMinLength;
    private Boolean passwordRequireUppercase;
    private Boolean passwordRequireLowercase;
    private Boolean passwordRequireNumber;
    private Boolean passwordRequireSymbol;
    private Integer passwordExpirationDays;
    private Integer passwordHistoryCount;
    private Integer absoluteSessionTimeoutHours;

    public SecuritySettingsResponse(Integer sessionTimeoutMinutes,
                                    Integer maxLoginAttempts,
                                    Integer loginLockoutMinutes,
                                    Integer passwordMinLength,
                                    Boolean passwordRequireUppercase,
                                    Boolean passwordRequireLowercase,
                                    Boolean passwordRequireNumber,
                                    Boolean passwordRequireSymbol,
                                    Integer passwordExpirationDays,
                                    Integer passwordHistoryCount,
                                    Integer absoluteSessionTimeoutHours) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
        this.maxLoginAttempts = maxLoginAttempts;
        this.loginLockoutMinutes = loginLockoutMinutes;
        this.passwordMinLength = passwordMinLength;
        this.passwordRequireUppercase = passwordRequireUppercase;
        this.passwordRequireLowercase = passwordRequireLowercase;
        this.passwordRequireNumber = passwordRequireNumber;
        this.passwordRequireSymbol = passwordRequireSymbol;
        this.passwordExpirationDays = passwordExpirationDays;
        this.passwordHistoryCount = passwordHistoryCount;
        this.absoluteSessionTimeoutHours = absoluteSessionTimeoutHours;
    }

    public Integer getSessionTimeoutMinutes() { return sessionTimeoutMinutes; }
    public Integer getMaxLoginAttempts() { return maxLoginAttempts; }
    public Integer getLoginLockoutMinutes() { return loginLockoutMinutes; }
    public Integer getPasswordMinLength() { return passwordMinLength; }
    public Boolean getPasswordRequireUppercase() { return passwordRequireUppercase; }
    public Boolean getPasswordRequireLowercase() { return passwordRequireLowercase; }
    public Boolean getPasswordRequireNumber() { return passwordRequireNumber; }
    public Boolean getPasswordRequireSymbol() { return passwordRequireSymbol; }
    public Integer getPasswordExpirationDays() { return passwordExpirationDays; }
    public Integer getPasswordHistoryCount() { return passwordHistoryCount; }
    public Integer getAbsoluteSessionTimeoutHours() { return absoluteSessionTimeoutHours; }
}
