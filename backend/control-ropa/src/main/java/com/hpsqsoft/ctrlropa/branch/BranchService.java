package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.company.CompanyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;
    private final CompanyService companyService;

    public BranchService(BranchRepository branchRepository, CompanyService companyService) {
        this.branchRepository = branchRepository;
        this.companyService = companyService;
    }

    @Transactional(readOnly = true)
    public List<Branch> findAll() {
        return branchRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Branch> findByStatus(Status status) {
        return branchRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Branch findById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con id: " + id));
    }

    @Transactional(readOnly = true)
    public Branch findByCode(String code) {
        return branchRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con codigo: " + code));
    }

    public Branch create(Branch branch) {
        ensureCompany(branch);
        validateNew(branch);
        return branchRepository.save(branch);
    }

    public Branch update(Long id, Branch request) {
        Branch existing = findById(id);
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
        Branch existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        return branchRepository.save(existing);
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
