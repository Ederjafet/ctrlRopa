package com.hpsqsoft.ctrlropa.operationauth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OperationalAuthorizationRepository extends JpaRepository<OperationalAuthorizationRequest, Long> {

    List<OperationalAuthorizationRequest> findByCompanyIdAndBranchIdOrderByCreatedAtDesc(Long companyId, Long branchId);

    List<OperationalAuthorizationRequest> findByCompanyIdAndBranchIdAndStatusOrderByCreatedAtDesc(
            Long companyId,
            Long branchId,
            OperationalAuthorizationStatus status
    );

    List<OperationalAuthorizationRequest> findByCompanyIdAndBranchIdAndRequestedByUserIdOrderByCreatedAtDesc(
            Long companyId,
            Long branchId,
            Long requestedByUserId
    );

    Optional<OperationalAuthorizationRequest> findFirstByCompanyIdAndBranchIdAndOperationTypeAndTargetTypeAndTargetIdAndStatus(
            Long companyId,
            Long branchId,
            OperationalAuthorizationType operationType,
            OperationalAuthorizationTargetType targetType,
            Long targetId,
            OperationalAuthorizationStatus status
    );
}
