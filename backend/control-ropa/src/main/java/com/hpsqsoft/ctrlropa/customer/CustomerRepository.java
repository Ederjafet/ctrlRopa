package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByCompanyIdAndId(Long companyId, Long id);

    List<Customer> findByCompanyIdAndBranchIdOrderByNameAsc(Long companyId, Long branchId);

    List<Customer> findByCompanyIdAndBranchIdAndStatusOrderByNameAsc(Long companyId, Long branchId, Status status);

    Optional<Customer> findByCompanyIdAndBranchIdAndPhone(Long companyId, Long branchId, String phone);

    boolean existsByCompanyIdAndBranchIdAndPhone(Long companyId, Long branchId, String phone);

    List<Customer> findByCompanyIdAndBranchIdAndIsGenericTrueOrderByNameAsc(Long companyId, Long branchId);

    Optional<Customer> findByCompanyIdAndBranchIdAndIsGenericTrueAndGenericType(
            Long companyId,
            Long branchId,
            GenericType genericType
    );

    List<Customer> findByBranchIdOrderByNameAsc(Long branchId);

    List<Customer> findByBranchIdAndStatusOrderByNameAsc(Long branchId, Status status);

    Optional<Customer> findByBranchIdAndPhone(Long branchId, String phone);

    boolean existsByBranchIdAndPhone(Long branchId, String phone);

    List<Customer> findByBranchIdAndIsGenericTrueOrderByNameAsc(Long branchId);

    Optional<Customer> findByBranchIdAndIsGenericTrueAndGenericType(Long branchId, GenericType genericType);
}
