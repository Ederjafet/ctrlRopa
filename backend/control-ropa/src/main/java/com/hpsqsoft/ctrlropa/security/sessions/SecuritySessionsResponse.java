package com.hpsqsoft.ctrlropa.security.sessions;

import java.time.LocalDateTime;
import java.util.List;

public class SecuritySessionsResponse {

    private List<UserLoginSecurityLine> users;
    private List<ApiSessionLine> sessions;

    public SecuritySessionsResponse(List<UserLoginSecurityLine> users, List<ApiSessionLine> sessions) {
        this.users = users;
        this.sessions = sessions;
    }

    public List<UserLoginSecurityLine> getUsers() { return users; }
    public List<ApiSessionLine> getSessions() { return sessions; }

    public static class UserLoginSecurityLine {
        private Long userId;
        private String userName;
        private String email;
        private String branchName;
        private Integer failedLoginAttempts;
        private LocalDateTime lockedUntil;
        private LocalDateTime lastFailedLoginAt;
        private LocalDateTime lastSuccessLoginAt;
        private String lastLoginIp;
        private String lastLoginUserAgent;

        public UserLoginSecurityLine(Long userId,
                                     String userName,
                                     String email,
                                     String branchName,
                                     Integer failedLoginAttempts,
                                     LocalDateTime lockedUntil,
                                     LocalDateTime lastFailedLoginAt,
                                     LocalDateTime lastSuccessLoginAt,
                                     String lastLoginIp,
                                     String lastLoginUserAgent) {
            this.userId = userId;
            this.userName = userName;
            this.email = email;
            this.branchName = branchName;
            this.failedLoginAttempts = failedLoginAttempts;
            this.lockedUntil = lockedUntil;
            this.lastFailedLoginAt = lastFailedLoginAt;
            this.lastSuccessLoginAt = lastSuccessLoginAt;
            this.lastLoginIp = lastLoginIp;
            this.lastLoginUserAgent = lastLoginUserAgent;
        }

        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getEmail() { return email; }
        public String getBranchName() { return branchName; }
        public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
        public LocalDateTime getLockedUntil() { return lockedUntil; }
        public LocalDateTime getLastFailedLoginAt() { return lastFailedLoginAt; }
        public LocalDateTime getLastSuccessLoginAt() { return lastSuccessLoginAt; }
        public String getLastLoginIp() { return lastLoginIp; }
        public String getLastLoginUserAgent() { return lastLoginUserAgent; }
    }

    public static class ApiSessionLine {
        private Long id;
        private Long userId;
        private String userName;
        private String email;
        private String branchName;
        private LocalDateTime expiresAt;
        private LocalDateTime absoluteExpiresAt;
        private LocalDateTime lastSeenAt;
        private LocalDateTime revokedAt;
        private LocalDateTime createdAt;
        private String ipAddress;
        private String userAgent;

        public ApiSessionLine(Long id,
                              Long userId,
                              String userName,
                              String email,
                              String branchName,
                              LocalDateTime expiresAt,
                              LocalDateTime absoluteExpiresAt,
                              LocalDateTime lastSeenAt,
                              LocalDateTime revokedAt,
                              LocalDateTime createdAt,
                              String ipAddress,
                              String userAgent) {
            this.id = id;
            this.userId = userId;
            this.userName = userName;
            this.email = email;
            this.branchName = branchName;
            this.expiresAt = expiresAt;
            this.absoluteExpiresAt = absoluteExpiresAt;
            this.lastSeenAt = lastSeenAt;
            this.revokedAt = revokedAt;
            this.createdAt = createdAt;
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
        }

        public Long getId() { return id; }
        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getEmail() { return email; }
        public String getBranchName() { return branchName; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public LocalDateTime getAbsoluteExpiresAt() { return absoluteExpiresAt; }
        public LocalDateTime getLastSeenAt() { return lastSeenAt; }
        public LocalDateTime getRevokedAt() { return revokedAt; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
    }
}
