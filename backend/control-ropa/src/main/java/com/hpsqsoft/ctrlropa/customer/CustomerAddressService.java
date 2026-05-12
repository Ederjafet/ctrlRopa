package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerAddressService {

    private final CustomerAddressRepository repository;
    private final CustomerRepository customerRepository;

    public CustomerAddressService(CustomerAddressRepository repository,
                                  CustomerRepository customerRepository) {
        this.repository = repository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerAddressResponse> findByCustomer(Long customerId) {
        return repository.findByCustomerIdOrderByIsDefaultDescLabelAsc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerAddressResponse create(Long customerId, CustomerAddress entity) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        if (repository.existsByCustomerIdAndLabel(customerId, entity.getLabel())) {
            throw new IllegalArgumentException("Ya existe una dirección con esa etiqueta");
        }

        if (Boolean.TRUE.equals(entity.getIsDefault())) {
            clearDefault(customerId);
        }

        entity.setCustomer(customer);
        entity.setStatus(Status.ACTIVE);

        CustomerAddress saved = saveSafely(entity);
        return toResponse(saved);
    }

    public CustomerAddressResponse update(Long id, CustomerAddress request) {
        CustomerAddress existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dirección no encontrada"));

        if (!existing.getLabel().equals(request.getLabel())
                && repository.existsByCustomerIdAndLabel(existing.getCustomer().getId(), request.getLabel())) {
            throw new IllegalArgumentException("Ya existe una dirección con esa etiqueta");
        }

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefault(existing.getCustomer().getId());
        }

        existing.setLabel(request.getLabel());
        existing.setLine1(request.getLine1());
        existing.setLine2(request.getLine2());
        existing.setCity(request.getCity());
        existing.setState(request.getState());
        existing.setPostalCode(request.getPostalCode());
        existing.setCountry(request.getCountry());
        existing.setIsDefault(request.getIsDefault());
        existing.setStatus(request.getStatus());

        CustomerAddress saved = saveSafely(existing);
        return toResponse(saved);
    }

    public CustomerAddressResponse deactivate(Long id) {
        CustomerAddress existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dirección no encontrada"));

        existing.setStatus(Status.INACTIVE);
        return toResponse(repository.save(existing));
    }

    private void clearDefault(Long customerId) {
        List<CustomerAddress> addresses = repository.findByCustomerIdAndStatusOrderByIsDefaultDescLabelAsc(customerId, Status.ACTIVE);
        for (CustomerAddress address : addresses) {
            if (Boolean.TRUE.equals(address.getIsDefault())) {
                address.setIsDefault(false);
                repository.save(address);
            }
        }
    }

    private CustomerAddress saveSafely(CustomerAddress entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("No se pudo guardar la dirección por datos duplicados");
        }
    }

    private CustomerAddressResponse toResponse(CustomerAddress entity) {
        return new CustomerAddressResponse(
                entity.getId(),
                entity.getCustomer().getId(),
                entity.getCustomer().getName(),
                entity.getLabel(),
                entity.getLine1(),
                entity.getLine2(),
                entity.getCity(),
                entity.getState(),
                entity.getPostalCode(),
                entity.getCountry(),
                entity.getIsDefault(),
                entity.getStatus().name()
        );
    }
}