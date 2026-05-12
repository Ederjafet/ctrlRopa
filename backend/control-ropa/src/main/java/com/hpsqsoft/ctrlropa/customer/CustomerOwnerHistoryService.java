package com.hpsqsoft.ctrlropa.customer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerOwnerHistoryService {

    private final CustomerOwnerHistoryRepository repository;
    private final CustomerRepository customerRepository;

    public CustomerOwnerHistoryService(CustomerOwnerHistoryRepository repository,
                                       CustomerRepository customerRepository) {
        this.repository = repository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerOwnerHistoryResponse> findByCustomer(Long customerId) {
        return repository.findByCustomerIdOrderByChangedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerOwnerHistoryResponse reassign(Long customerId, Long toUserId, String reason, Long changedByUserId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        CustomerOwnerHistory history = new CustomerOwnerHistory();
        history.setCustomerId(customerId);
        history.setFromUserId(customer.getOwnerUserId());
        history.setToUserId(toUserId);
        history.setReason(reason);
        history.setChangedByUserId(changedByUserId);

        customer.setOwnerUserId(toUserId);
        customerRepository.save(customer);

        CustomerOwnerHistory saved = repository.save(history);
        return toResponse(saved);
    }

    private CustomerOwnerHistoryResponse toResponse(CustomerOwnerHistory entity) {
        return new CustomerOwnerHistoryResponse(
                entity.getId(),
                entity.getCustomerId(),
                entity.getFromUserId(),
                entity.getToUserId(),
                entity.getReason(),
                entity.getChangedAt(),
                entity.getChangedByUserId()
        );
    }
}