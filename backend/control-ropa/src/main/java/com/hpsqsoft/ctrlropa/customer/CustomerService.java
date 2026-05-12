package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository repository;
    private final BranchRepository branchRepository;

    public CustomerService(CustomerRepository repository, BranchRepository branchRepository) {
        this.repository = repository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findByBranch(Long branchId) {
        return repository.findByBranchIdOrderByNameAsc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public CustomerResponse findByBranchAndPhone(Long branchId, String phone) {
        Customer entity = repository.findByBranchIdAndPhone(branchId, phone)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        return toResponse(entity);
    }

    public CustomerResponse create(Long branchId, Customer entity) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        validateNew(branchId, entity);

        entity.setBranch(branch);
        entity.setStatus(Status.ACTIVE);

        Customer saved = saveSafely(entity);
        return toResponse(saved);
    }

    public CustomerResponse update(Long id, Customer request) {
        Customer existing = findEntityById(id);

        if (!existing.getPhone().equals(request.getPhone())
                && repository.existsByBranchIdAndPhone(existing.getBranch().getId(), request.getPhone())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese teléfono en la sucursal");
        }

        if (Boolean.FALSE.equals(request.getIsGeneric()) && (request.getPhone() == null || request.getPhone().isBlank())) {
            throw new IllegalArgumentException("El teléfono es obligatorio para cliente real");
        }

        existing.setOwnerUserId(request.getOwnerUserId());
        existing.setName(request.getName());
        existing.setPhone(request.getPhone());
        existing.setEmail(request.getEmail());
        existing.setIsGeneric(request.getIsGeneric());
        existing.setGenericType(request.getGenericType());
        existing.setStatus(request.getStatus());

        Customer saved = saveSafely(existing);
        return toResponse(saved);
    }

    public CustomerResponse deactivate(Long id) {
        Customer existing = findEntityById(id);
        existing.setStatus(Status.INACTIVE);
        return toResponse(repository.save(existing));
    }

    @Transactional(readOnly = true)
    public CustomerResponse findGenericByType(Long branchId, GenericType genericType) {
        Customer entity = repository.findByBranchIdAndIsGenericTrueAndGenericType(branchId, genericType)
                .orElseThrow(() -> new IllegalArgumentException("Cliente genérico no encontrado"));
        return toResponse(entity);
    }

    private void validateNew(Long branchId, Customer entity) {
        if (Boolean.FALSE.equals(entity.getIsGeneric()) && (entity.getPhone() == null || entity.getPhone().isBlank())) {
            throw new IllegalArgumentException("El teléfono es obligatorio para cliente real");
        }

        if (entity.getPhone() != null && !entity.getPhone().isBlank()
                && repository.existsByBranchIdAndPhone(branchId, entity.getPhone())) {
            throw new IllegalArgumentException("Ya existe un cliente con ese teléfono en la sucursal");
        }

        if (Boolean.TRUE.equals(entity.getIsGeneric()) && entity.getGenericType() == null) {
            throw new IllegalArgumentException("El tipo genérico es obligatorio");
        }
    }

    private Customer saveSafely(Customer entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("No se pudo guardar el cliente por datos duplicados");
        }
    }

    private Customer findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con id: " + id));
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
                entity.getStatus().name()
        );
    }
}