package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
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
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con código: " + code));
    }

    public Branch create(Branch branch) {
        validateNew(branch);
        return branchRepository.save(branch);
    }

    public Branch update(Long id, Branch request) {
        Branch existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && branchRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe una sucursal con código: " + request.getCode());
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
        if (branchRepository.existsByCode(branch.getCode())) {
            throw new IllegalArgumentException("Ya existe una sucursal con código: " + branch.getCode());
        }
    }
}