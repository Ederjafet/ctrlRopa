package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository repository;
    private final BranchRepository branchRepository;
    private final TenantResolver tenantResolver;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public CustomerService(CustomerRepository repository,
                           BranchRepository branchRepository,
                           TenantResolver tenantResolver,
                           AccessService accessService,
                           CurrentUser currentUser) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.tenantResolver = tenantResolver;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findByBranch(Long branchId) {
        assertCan(PermissionCode.VIEW_CUSTOMERS);
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        return repository.findByCompanyIdAndBranchIdOrderByNameAsc(tenant.getCompanyId(), branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        assertCan(PermissionCode.VIEW_CUSTOMERS);
        return toResponse(findEntityById(id, currentCompanyId()));
    }

    @Transactional(readOnly = true)
    public CustomerResponse findByBranchAndPhone(Long branchId, String phone) {
        assertCan(PermissionCode.VIEW_CUSTOMERS);
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        Customer entity = repository.findByCompanyIdAndBranchIdAndPhone(tenant.getCompanyId(), branchId, phone)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        return toResponse(entity);
    }

    public CustomerResponse create(Long branchId, Customer entity) {
        assertCan(PermissionCode.CREATE_CUSTOMER);
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        validateNew(tenant.getCompanyId(), branchId, entity);

        entity.setCompany(branch.getCompany());
        entity.setBranch(branch);
        if (entity.getCreatedByUserId() == null) {
            entity.setCreatedByUserId(tenant.getUserId());
        }
        entity.setStatus(Status.ACTIVE);

        Customer saved = saveSafely(entity);
        return toResponse(saved);
    }

    public CustomerResponse update(Long id, Customer request) {
        assertCan(PermissionCode.EDIT_CUSTOMER);
        Long companyId = currentCompanyId();
        Customer existing = findEntityById(id, companyId);

        if (!existing.getPhone().equals(request.getPhone())
                && repository.existsByCompanyIdAndBranchIdAndPhone(
                        companyId,
                        existing.getBranch().getId(),
                        request.getPhone()
                )) {
            throw new IllegalArgumentException("Ya existe un cliente con ese telefono en la sucursal");
        }

        if (Boolean.FALSE.equals(request.getIsGeneric()) && (request.getPhone() == null || request.getPhone().isBlank())) {
            throw new IllegalArgumentException("El telefono es obligatorio para cliente real");
        }

        existing.setOwnerUserId(request.getOwnerUserId());
        existing.setName(request.getName());
        existing.setPhone(request.getPhone());
        existing.setEmail(request.getEmail());
        existing.setIsGeneric(request.getIsGeneric());
        existing.setGenericType(request.getGenericType());
        existing.setStatus(resolveUpdatedStatus(existing, request));

        Customer saved = saveSafely(existing);
        return toResponse(saved);
    }

    public CustomerResponse deactivate(Long id) {
        assertCan(PermissionCode.EDIT_CUSTOMER);
        Customer existing = findEntityById(id, currentCompanyId());
        existing.setStatus(Status.INACTIVE);
        return toResponse(repository.save(existing));
    }

    @Transactional(readOnly = true)
    public CustomerResponse findGenericByType(Long branchId, GenericType genericType) {
        assertCan(PermissionCode.VIEW_CUSTOMERS);
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        Customer entity = repository.findByCompanyIdAndBranchIdAndIsGenericTrueAndGenericType(
                        tenant.getCompanyId(),
                        branchId,
                        genericType
                )
                .orElseThrow(() -> new IllegalArgumentException("Cliente generico no encontrado"));
        return toResponse(entity);
    }

    private void validateNew(Long companyId, Long branchId, Customer entity) {
        if (Boolean.FALSE.equals(entity.getIsGeneric()) && (entity.getPhone() == null || entity.getPhone().isBlank())) {
            throw new IllegalArgumentException("El telefono es obligatorio para cliente real");
        }

        if (entity.getPhone() != null && !entity.getPhone().isBlank()
                && repository.existsByCompanyIdAndBranchIdAndPhone(companyId, branchId, entity.getPhone())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese telefono en la sucursal");
        }

        if (Boolean.TRUE.equals(entity.getIsGeneric()) && entity.getGenericType() == null) {
            throw new IllegalArgumentException("El tipo generico es obligatorio");
        }
    }

    private Customer saveSafely(Customer entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("No se pudo guardar el cliente por datos duplicados");
        }
    }

    private Long currentCompanyId() {
        return tenantResolver.resolveCurrent().getCompanyId();
    }

    private void assertCan(String permissionCode) {
        accessService.assertCan(currentUser.getUserId(), permissionCode);
    }

    private CurrentTenantContext resolveAndValidateBranch(Long branchId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        return tenant;
    }

    private Customer findEntityById(Long id, Long companyId) {
        return repository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con id: " + id));
    }

    private Status resolveUpdatedStatus(Customer existing, Customer request) {
        if (request.getStatus() != null) {
            return request.getStatus();
        }
        if (existing.getStatus() != null) {
            return existing.getStatus();
        }
        return Status.ACTIVE;
    }

    private String statusName(Customer entity) {
        Status status = entity.getStatus() == null ? Status.ACTIVE : entity.getStatus();
        return status.name();
    }

    private CustomerResponse toResponse(Customer entity) {
        return new CustomerResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getOwnerUserId(),
                entity.getCreatedByUserId(),
                entity.getName(),
                entity.getPhone(),
                entity.getEmail(),
                entity.getIsGeneric(),
                entity.getGenericType(),
                statusName(entity)
        );
    }
}
