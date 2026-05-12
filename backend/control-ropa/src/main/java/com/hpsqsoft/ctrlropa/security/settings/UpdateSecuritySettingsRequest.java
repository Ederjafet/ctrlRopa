package com.hpsqsoft.ctrlropa.security.settings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateSecuritySettingsRequest {

    @NotNull(message = "sessionTimeoutMinutes es obligatorio")
    @Min(value = 5, message = "sessionTimeoutMinutes minimo es 5")
    @Max(value = 720, message = "sessionTimeoutMinutes maximo es 720")
    private Integer sessionTimeoutMinutes;

    @NotNull(message = "maxLoginAttempts es obligatorio")
    @Min(value = 3, message = "maxLoginAttempts minimo es 3")
    @Max(value = 20, message = "maxLoginAttempts maximo es 20")
    private Integer maxLoginAttempts;

    @NotNull(message = "loginLockoutMinutes es obligatorio")
    @Min(value = 1, message = "loginLockoutMinutes minimo es 1")
    @Max(value = 1440, message = "loginLockoutMinutes maximo es 1440")
    private Integer loginLockoutMinutes;

    @NotNull(message = "passwordMinLength es obligatorio")
    @Min(value = 6, message = "passwordMinLength minimo es 6")
    @Max(value = 64, message = "passwordMinLength maximo es 64")
    private Integer passwordMinLength;

    private Boolean passwordRequireUppercase;
    private Boolean passwordRequireLowercase;
    private Boolean passwordRequireNumber;
    private Boolean passwordRequireSymbol;

    @NotNull(message = "passwordExpirationDays es obligatorio")
    @Min(value = 0, message = "passwordExpirationDays minimo es 0")
    @Max(value = 365, message = "passwordExpirationDays maximo es 365")
    private Integer passwordExpirationDays;

    @NotNull(message = "passwordHistoryCount es obligatorio")
    @Min(value = 0, message = "passwordHistoryCount minimo es 0")
    @Max(value = 20, message = "passwordHistoryCount maximo es 20")
    private Integer passwordHistoryCount;

    @NotNull(message = "absoluteSessionTimeoutHours es obligatorio")
    @Min(value = 0, message = "absoluteSessionTimeoutHours minimo es 0")
    @Max(value = 720, message = "absoluteSessionTimeoutHours maximo es 720")
    private Integer absoluteSessionTimeoutHours;

    public Integer getSessionTimeoutMinutes() { return sessionTimeoutMinutes; }
    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) { this.sessionTimeoutMinutes = sessionTimeoutMinutes; }

    public Integer getMaxLoginAttempts() { return maxLoginAttempts; }
    public void setMaxLoginAttempts(Integer maxLoginAttempts) { this.maxLoginAttempts = maxLoginAttempts; }

    public Integer getLoginLockoutMinutes() { return loginLockoutMinutes; }
    public void setLoginLockoutMinutes(Integer loginLockoutMinutes) { this.loginLockoutMinutes = loginLockoutMinutes; }

    public Integer getPasswordMinLength() { return passwordMinLength; }
    public void setPasswordMinLength(Integer passwordMinLength) { this.passwordMinLength = passwordMinLength; }

    public Boolean getPasswordRequireUppercase() { return passwordRequireUppercase; }
    public void setPasswordRequireUppercase(Boolean passwordRequireUppercase) { this.passwordRequireUppercase = passwordRequireUppercase; }

    public Boolean getPasswordRequireLowercase() { return passwordRequireLowercase; }
    public void setPasswordRequireLowercase(Boolean passwordRequireLowercase) { this.passwordRequireLowercase = passwordRequireLowercase; }

    public Boolean getPasswordRequireNumber() { return passwordRequireNumber; }
    public void setPasswordRequireNumber(Boolean passwordRequireNumber) { this.passwordRequireNumber = passwordRequireNumber; }

    public Boolean getPasswordRequireSymbol() { return passwordRequireSymbol; }
    public void setPasswordRequireSymbol(Boolean passwordRequireSymbol) { this.passwordRequireSymbol = passwordRequireSymbol; }

    public Integer getPasswordExpirationDays() { return passwordExpirationDays; }
    public void setPasswordExpirationDays(Integer passwordExpirationDays) { this.passwordExpirationDays = passwordExpirationDays; }

    public Integer getPasswordHistoryCount() { return passwordHistoryCount; }
    public void setPasswordHistoryCount(Integer passwordHistoryCount) { this.passwordHistoryCount = passwordHistoryCount; }

    public Integer getAbsoluteSessionTimeoutHours() { return absoluteSessionTimeoutHours; }
    public void setAbsoluteSessionTimeoutHours(Integer absoluteSessionTimeoutHours) { this.absoluteSessionTimeoutHours = absoluteSessionTimeoutHours; }
}
