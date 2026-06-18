package com.hpsqsoft.ctrlropa.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCompanyRepository extends JpaRepository<UserCompany, UserCompanyId> {

    boolean existsByUserIdAndCompanyIdAndStatus(Long userId, Long companyId, String status);
}
