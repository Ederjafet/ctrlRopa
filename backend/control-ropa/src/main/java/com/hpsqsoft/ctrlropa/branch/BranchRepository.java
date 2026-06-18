package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCompany_IdAndCode(Long companyId, String code);

    List<Branch> findByStatus(Status status);
}
