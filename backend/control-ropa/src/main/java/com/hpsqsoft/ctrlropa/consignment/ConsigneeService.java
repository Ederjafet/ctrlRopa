package com.hpsqsoft.ctrlropa.consignment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ConsigneeService {

    private final ConsigneeRepository repository;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public ConsigneeService(ConsigneeRepository repository,
                            BranchRepository branchRepository,
                            AccessService accessService,
                            CurrentUser currentUser) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<ConsigneeResponse> findByBranch(Long branchId) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                branchId
        );

        return repository.findByBranchIdOrderByNameAsc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsigneeResponse> findActiveByBranch(Long branchId) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                branchId
        );

        return repository.findByBranchIdAndStatusOrderByNameAsc(branchId, Status.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsigneeResponse findById(Long id) {
        Consignee consignee = findEntity(id);

        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignee.getBranch().getId()
        );

        return toResponse(consignee);
    }

    public ConsigneeResponse create(CreateConsigneeRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                request.getBranchId()
        );

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        Consignee consignee = new Consignee();
        consignee.setBranch(branch);
        consignee.setName(cleanRequired(request.getName(), "name"));
        consignee.setPhone(cleanRequired(request.getPhone(), "phone"));
        consignee.setEmail(cleanNullable(request.getEmail()));
        consignee.setNotes(cleanNullable(request.getNotes()));
        consignee.setStatus(Status.ACTIVE);

        return toResponse(repository.save(consignee));
    }

    public ConsigneeResponse update(Long id, UpdateConsigneeRequest request) {
        Consignee consignee = findEntity(id);

        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignee.getBranch().getId()
        );

        if (request.getName() != null) {
            consignee.setName(cleanRequired(request.getName(), "name"));
        }

        if (request.getPhone() != null) {
            consignee.setPhone(cleanRequired(request.getPhone(), "phone"));
        }

        if (request.getEmail() != null) {
            consignee.setEmail(cleanNullable(request.getEmail()));
        }

        if (request.getNotes() != null) {
            consignee.setNotes(cleanNullable(request.getNotes()));
        }

        if (request.getStatus() != null) {
            consignee.setStatus(request.getStatus());
        }

        return toResponse(repository.save(consignee));
    }

    public ConsigneeResponse deactivate(Long id) {
        Consignee consignee = findEntity(id);

        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignee.getBranch().getId()
        );

        consignee.setStatus(Status.INACTIVE);

        return toResponse(repository.save(consignee));
    }

    private Consignee findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Consignatario no encontrado con id: " + id));
    }

    private String cleanRequired(String value, String fieldName) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(fieldName + " es obligatorio");
        }

        return value.trim();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private ConsigneeResponse toResponse(Consignee entity) {
        return new ConsigneeResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getName(),
                entity.getPhone(),
                entity.getEmail(),
                entity.getNotes(),
                entity.getStatus().name(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}