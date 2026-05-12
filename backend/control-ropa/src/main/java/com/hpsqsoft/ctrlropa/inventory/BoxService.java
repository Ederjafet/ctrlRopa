package com.hpsqsoft.ctrlropa.inventory;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class BoxService {

    private final BoxRepository repository;
    private final BranchRepository branchRepository;
    private final ReservationRepository reservationRepository;

    public BoxService(BoxRepository repository,
                      BranchRepository branchRepository,
                      ReservationRepository reservationRepository) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public List<BoxResponse> findByBranch(Long branchId) {
        return repository.findByBranchIdOrderByCodeAsc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BoxResponse> findActiveByBranch(Long branchId) {
        return repository.findByBranchIdAndStatusOrderByCodeAsc(branchId, Status.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoxResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public BoxDetailResponse findDetail(Long id) {
        Box box = findEntity(id);
        List<BoxContentResponse> content = findContent(id);

        int totalReservations = content.size();

        int activeReservations = (int) content.stream()
                .filter(line -> ReservationStatus.ACTIVE.name().equals(line.getReservationStatus()))
                .count();

        BigDecimal totalAmount = content.stream()
                .map(BoxContentResponse::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BoxDetailResponse(
                toResponse(box),
                totalReservations,
                activeReservations,
                totalAmount,
                content
        );
    }

    @Transactional(readOnly = true)
    public List<BoxContentResponse> findContent(Long boxId) {
        findEntity(boxId);

        return reservationRepository.findByBoxIdOrderByCreatedAtAsc(boxId)
                .stream()
                .map(this::toContentResponse)
                .toList();
    }

    public BoxResponse create(Long branchId, Box entity) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        String code = cleanRequired(entity.getCode(), "code");
        String description = cleanRequired(entity.getDescription(), "description");
        String qrCode = cleanRequired(entity.getQrCode(), "qrCode");

        if (repository.existsByBranchIdAndCode(branchId, code)) {
            throw new IllegalArgumentException("Ya existe una caja con ese código en la sucursal");
        }

        if (repository.existsByQrCode(qrCode)) {
            throw new IllegalArgumentException("QR duplicado");
        }

        entity.setBranch(branch);
        entity.setCode(code);
        entity.setDescription(description);
        entity.setQrCode(qrCode);
        entity.setStatus(Status.ACTIVE);

        return toResponse(repository.save(entity));
    }

    public BoxResponse update(Long id, UpdateBoxRequest request) {
        Box box = findEntity(id);

        if (request.getCode() != null) {
            String code = cleanRequired(request.getCode(), "code");

            if (repository.existsByBranchIdAndCodeAndIdNot(box.getBranch().getId(), code, box.getId())) {
                throw new IllegalArgumentException("Ya existe una caja con ese código en la sucursal");
            }

            box.setCode(code);
        }

        if (request.getDescription() != null) {
            box.setDescription(cleanRequired(request.getDescription(), "description"));
        }

        if (request.getQrCode() != null) {
            String qrCode = cleanRequired(request.getQrCode(), "qrCode");

            if (repository.existsByQrCodeAndIdNot(qrCode, box.getId())) {
                throw new IllegalArgumentException("QR duplicado");
            }

            box.setQrCode(qrCode);
        }

        return toResponse(repository.save(box));
    }

    public BoxResponse deactivate(Long id) {
        Box box = findEntity(id);

        List<Reservation> activeReservations = reservationRepository.findByBoxIdOrderByCreatedAtAsc(id)
                .stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.ACTIVE)
                .toList();

        if (!activeReservations.isEmpty()) {
            throw new IllegalArgumentException("No se puede desactivar una caja con reservas activas");
        }

        box.setStatus(Status.INACTIVE);

        return toResponse(repository.save(box));
    }

    public BoxResponse activate(Long id) {
        Box box = findEntity(id);

        box.setStatus(Status.ACTIVE);

        return toResponse(repository.save(box));
    }

    private Box findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada con id: " + id));
    }

    private String cleanRequired(String value, String fieldName) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(fieldName + " es obligatorio");
        }

        return value.trim();
    }

    private BoxResponse toResponse(Box entity) {
        return new BoxResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getQrCode(),
                entity.getStatus().name(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private BoxContentResponse toContentResponse(Reservation reservation) {
        return new BoxContentResponse(
                reservation.getId(),
                reservation.getItem().getId(),
                reservation.getItem().getCode(),
                reservation.getItem().getQrCode(),
                reservation.getItem().getStatus().name(),
                reservation.getCustomer().getId(),
                reservation.getCustomer().getName(),
                reservation.getPrice(),
                reservation.getStatus().name(),
                reservation.getCreatedAt()
        );
    }
}