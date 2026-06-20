package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.company.CompanyService;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;
    private final CompanyService companyService;
    private final TenantResolver tenantResolver;

    public BranchService(BranchRepository branchRepository,
                         CompanyService companyService,
                         TenantResolver tenantResolver) {
        this.branchRepository = branchRepository;
        this.companyService = companyService;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<Branch> findAll() {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        return branchRepository.findByCompany_IdOrderByNameAsc(tenant.getCompanyId());
    }

    @Transactional(readOnly = true)
    public List<Branch> findByStatus(Status status) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        return branchRepository.findByCompany_IdAndStatusOrderByNameAsc(tenant.getCompanyId(), status);
    }

    @Transactional(readOnly = true)
    public Branch findById(Long id) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con id: " + id));
        assertBranchInCompany(branch, tenant.getCompanyId());
        return branch;
    }

    @Transactional(readOnly = true)
    public Branch findByCode(String code) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Branch branch = branchRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con codigo: " + code));
        assertBranchInCompany(branch, tenant.getCompanyId());
        return branch;
    }

    public Branch create(Branch branch) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Company company = companyService.findActiveById(tenant.getCompanyId());
        branch.setCompany(company);
        validateNew(branch);
        return branchRepository.save(branch);
    }

    public Branch update(Long id, Branch request) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Branch existing = findById(id);
        assertBranchInCompany(existing, tenant.getCompanyId());
        ensureCompany(existing);

        if (!existing.getCode().equals(request.getCode())
                && branchRepository.existsByCompany_IdAndCode(existing.getCompany().getId(), request.getCode())) {
            throw new IllegalArgumentException("Ya existe una sucursal con codigo: " + request.getCode());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setStatus(request.getStatus());
        existing.setAddressLine1(request.getAddressLine1());
        existing.setAddressLine2(request.getAddressLine2());
        existing.setCity(request.getCity());
        existing.setState(request.getState());
        existing.setPostalCode(request.getPostalCode());
        existing.setCountry(request.getCountry());

        return branchRepository.save(existing);
    }

    public Branch deactivate(Long id) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Branch existing = findById(id);
        assertBranchInCompany(existing, tenant.getCompanyId());
        existing.setStatus(Status.INACTIVE);
        return branchRepository.save(existing);
    }

    private void assertBranchInCompany(Branch branch, Long companyId) {
        Long branchCompanyId = branch.getCompany() == null ? null : branch.getCompany().getId();
        if (!companyId.equals(branchCompanyId)) {
            throw new AccessDeniedException("La sucursal no pertenece a la empresa activa");
        }
    }

    private void validateNew(Branch branch) {
        if (branchRepository.existsByCompany_IdAndCode(branch.getCompany().getId(), branch.getCode())) {
            throw new IllegalArgumentException("Ya existe una sucursal con codigo: " + branch.getCode());
        }
    }

    private void ensureCompany(Branch branch) {
        if (branch.getCompany() != null && branch.getCompany().getId() != null) {
            Company company = companyService.findActiveById(branch.getCompany().getId());
            branch.setCompany(company);
            return;
        }

        branch.setCompany(companyService.getDefaultCompany());
    }
}
