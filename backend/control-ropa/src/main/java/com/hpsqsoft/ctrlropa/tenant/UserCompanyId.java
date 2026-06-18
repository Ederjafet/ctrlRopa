package com.hpsqsoft.ctrlropa.tenant;

import java.io.Serializable;
import java.util.Objects;

public class UserCompanyId implements Serializable {

    private Long userId;
    private Long companyId;

    public UserCompanyId() {
    }

    public UserCompanyId(Long userId, Long companyId) {
        this.userId = userId;
        this.companyId = companyId;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (!(object instanceof UserCompanyId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
                && Objects.equals(companyId, that.companyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, companyId);
    }
}
