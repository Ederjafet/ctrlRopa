package com.hpsqsoft.ctrlropa.operationauth;

import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.live.LiveEventService;
import com.hpsqsoft.ctrlropa.live.LiveEventType;
import com.hpsqsoft.ctrlropa.payment.Payment;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocation;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentStatus;
import com.hpsqsoft.ctrlropa.reservation.LiveReservationOperationalStatus;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import com.hpsqsoft.ctrlropa.web.error.ConflictException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class OperationalAuthorizationService {

    private static final int DEFAULT_TTL_HOURS = 8;

    private final OperationalAuthorizationRepository repository;
    private final ReservationRepository reservationRepository;
    private final ItemRepository itemRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantAccessGuard tenantAccessGuard;
    private final LiveEventService liveEventService;

    public OperationalAuthorizationService(OperationalAuthorizationRepository repository,
                                           ReservationRepository reservationRepository,
                                           ItemRepository itemRepository,
                                           PaymentAllocationRepository paymentAllocationRepository,
                                           PaymentRepository paymentRepository,
                                           AccessService accessService,
                                           CurrentUser currentUser,
                                           TenantAccessGuard tenantAccessGuard,
                                           LiveEventService liveEventService) {
        this.repository = repository;
        this.reservationRepository = reservationRepository;
        this.itemRepository = itemRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.paymentRepository = paymentRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantAccessGuard = tenantAccessGuard;
        this.liveEventService = liveEventService;
    }

    public OperationalAuthorizationResponse create(OperationalAuthorizationCreateRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REQUEST_LIVE_OPERATION_AUTHORIZATION);
        assertCanRequestOperation(userId, request != null ? request.getOperationType() : null);
        validateCreateRequest(request);

        TargetSnapshot target = resolveTarget(request);
        CurrentTenantContext tenant = tenantAccessGuard.requireBranch(target.branchId(), "El target de autorizacion no pertenece a la sucursal activa");

        repository.findFirstByCompanyIdAndBranchIdAndOperationTypeAndTargetTypeAndTargetIdAndStatus(
                tenant.getCompanyId(),
                target.branchId(),
                request.getOperationType(),
                request.getTargetType(),
                request.getTargetId(),
                OperationalAuthorizationStatus.REQUESTED
        ).ifPresent(existing -> {
            throw new ConflictException("Ya existe una solicitud pendiente para esta accion y target");
        });

        OperationalAuthorizationRequest entity = new OperationalAuthorizationRequest();
        entity.setOperationType(request.getOperationType());
        entity.setStatus(OperationalAuthorizationStatus.REQUESTED);
        entity.setCompanyId(tenant.getCompanyId());
        entity.setBranchId(target.branchId());
        entity.setRequestedByUserId(userId);
        entity.setRequestedAt(LocalDateTime.now());
        entity.setExpiresAt(LocalDateTime.now().plusHours(DEFAULT_TTL_HOURS));
        entity.setTargetType(request.getTargetType());
        entity.setTargetId(request.getTargetId());
        entity.setLiveId(target.liveId());
        entity.setReservationId(target.reservationId());
        entity.setItemId(target.itemId());
        entity.setPaymentId(request.getPaymentId());
        entity.setSaleId(request.getSaleId());
        entity.setReason(cleanReason(request.getReason()));
        entity.setPayloadJson(cleanOptionalJson(request.getPayloadJson()));
        entity.setSnapshotJson(target.snapshotJson());
        entity.setCurrentStateHash(sha256(target.snapshotJson()));

        return toResponse(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<OperationalAuthorizationResponse> findByBranch(Long branchId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VIEW_LIVE_OPERATION_AUTHORIZATIONS);
        CurrentTenantContext tenant = tenantAccessGuard.requireBranch(branchId, "La sucursal de autorizaciones no pertenece a la sesion activa");
        return repository.findByCompanyIdAndBranchIdOrderByCreatedAtDesc(tenant.getCompanyId(), branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OperationalAuthorizationResponse> findPending(Long branchId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VIEW_LIVE_OPERATION_AUTHORIZATIONS);
        CurrentTenantContext tenant = tenantAccessGuard.requireBranch(branchId, "La sucursal de autorizaciones no pertenece a la sesion activa");
        return repository.findByCompanyIdAndBranchIdAndStatusOrderByCreatedAtDesc(
                        tenant.getCompanyId(),
                        branchId,
                        OperationalAuthorizationStatus.REQUESTED
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OperationalAuthorizationResponse> findMine(Long branchId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REQUEST_LIVE_OPERATION_AUTHORIZATION);
        CurrentTenantContext tenant = tenantAccessGuard.requireBranch(branchId, "La sucursal de autorizaciones no pertenece a la sesion activa");
        return repository.findByCompanyIdAndBranchIdAndRequestedByUserIdOrderByCreatedAtDesc(
                        tenant.getCompanyId(),
                        branchId,
                        userId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OperationalAuthorizationResponse findById(Long id) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VIEW_LIVE_OPERATION_AUTHORIZATIONS);
        OperationalAuthorizationRequest entity = findScoped(id);
        return toResponse(entity);
    }

    public OperationalAuthorizationResponse approve(Long id, OperationalAuthorizationDecisionRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.APPROVE_LIVE_OPERATION_AUTHORIZATION);
        OperationalAuthorizationRequest entity = findScoped(id);
        ensureRequested(entity);
        ensureNotExpired(entity);
        if (userId.equals(entity.getRequestedByUserId())) {
            throw new AccessDeniedException("El solicitante no puede aprobar su propia autorizacion");
        }
        entity.setStatus(OperationalAuthorizationStatus.APPROVED);
        entity.setDecidedByUserId(userId);
        entity.setDecidedAt(LocalDateTime.now());
        entity.setDecisionReason(cleanReason(request != null ? request.getReason() : null));
        return toResponse(repository.save(entity));
    }

    public OperationalAuthorizationResponse reject(Long id, OperationalAuthorizationDecisionRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.APPROVE_LIVE_OPERATION_AUTHORIZATION);
        OperationalAuthorizationRequest entity = findScoped(id);
        ensureRequested(entity);
        entity.setStatus(OperationalAuthorizationStatus.REJECTED);
        entity.setDecidedByUserId(userId);
        entity.setDecidedAt(LocalDateTime.now());
        entity.setDecisionReason(cleanReason(request != null ? request.getReason() : null));
        return toResponse(repository.save(entity));
    }

    public OperationalAuthorizationResponse cancel(Long id, OperationalAuthorizationDecisionRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REQUEST_LIVE_OPERATION_AUTHORIZATION);
        OperationalAuthorizationRequest entity = findScoped(id);
        ensureRequested(entity);
        if (!userId.equals(entity.getRequestedByUserId())) {
            throw new AccessDeniedException("Solo el solicitante puede cancelar la solicitud pendiente");
        }
        entity.setStatus(OperationalAuthorizationStatus.CANCELLED);
        entity.setDecisionReason(cleanReason(request != null ? request.getReason() : "Cancelada por solicitante"));
        entity.setDecidedByUserId(userId);
        entity.setDecidedAt(LocalDateTime.now());
        return toResponse(repository.save(entity));
    }

    public OperationalAuthorizationResponse apply(Long id, OperationalAuthorizationDecisionRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.APPLY_LIVE_OPERATION_AUTHORIZATION);
        OperationalAuthorizationRequest entity = findScoped(id);

        if (entity.getStatus() == OperationalAuthorizationStatus.REJECTED) {
            throw new IllegalArgumentException("No se puede aplicar una autorizacion rechazada");
        }
        if (entity.getStatus() != OperationalAuthorizationStatus.APPROVED) {
            throw new IllegalArgumentException("Solo se puede aplicar una autorizacion aprobada");
        }
        ensureNotExpired(entity);

        if (entity.getOperationType() != OperationalAuthorizationType.UNDO_LIVE_OPERATIONAL_SALE) {
            throw new IllegalArgumentException("La aplicacion de esta accion queda pendiente de contrato funcional");
        }

        applyUndoLiveOperationalSale(entity, userId, request != null ? request.getReason() : null);
        entity.setStatus(OperationalAuthorizationStatus.APPLIED);
        entity.setAppliedByUserId(userId);
        entity.setAppliedAt(LocalDateTime.now());
        return toResponse(repository.save(entity));
    }

    private void applyUndoLiveOperationalSale(OperationalAuthorizationRequest entity, Long userId, String reason) {
        accessService.assertCan(userId, PermissionCode.UNDO_LIVE_OPERATIONAL_SALE);
        Reservation reservation = reservationRepository.findById(entity.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        tenantAccessGuard.requireBranch(reservation.getBranch().getId(), "La reserva no pertenece a la sucursal activa");

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo una reserva activa puede deshacer vendido operativo");
        }
        if (reservation.getLive() == null) {
            throw new IllegalArgumentException("La reserva no pertenece a LIVE");
        }
        if (reservation.getLiveOperationalStatus() != LiveReservationOperationalStatus.OPERATIONAL_SOLD) {
            throw new IllegalArgumentException("La reserva no esta en vendido operativo");
        }
        if (reservation.getItem() == null || reservation.getItem().getStatus() != ItemStatus.RESERVED) {
            throw new IllegalArgumentException("La prenda debe seguir reservada para deshacer vendido operativo");
        }
        if (calculateActiveAppliedToReservation(reservation.getId()).compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("No se puede aplicar desde LIVE si la reserva tiene pago activo");
        }

        String currentSnapshot = reservationSnapshot(reservation);
        if (!sha256(currentSnapshot).equals(entity.getCurrentStateHash())) {
            throw new ConflictException("El estado de la reserva cambio desde la aprobacion");
        }

        LiveReservationOperationalStatus previousStatus = reservation.getLiveOperationalStatus();
        reservation.setLiveOperationalStatus(LiveReservationOperationalStatus.RESERVED);
        reservation.setLiveOperationalStatusUpdatedAt(LocalDateTime.now());
        reservation.setLiveOperationalStatusUpdatedByUserId(userId);
        reservation.setLiveOperationalStatusReason(cleanOptionalText(reason));
        Reservation saved = reservationRepository.save(reservation);

        String payload = "{\"reservationId\":" + saved.getId()
                + ",\"previousStatus\":\"" + previousStatus.name()
                + "\",\"newStatus\":\"" + saved.getLiveOperationalStatus().name()
                + "\",\"authorizationId\":" + entity.getId() + "}";
        liveEventService.record(
                saved.getLive(),
                LiveEventType.LIVE_RESERVATION_STATUS_CHANGED,
                userId,
                "RESERVATION",
                saved.getId(),
                payload
        );
        liveEventService.record(
                saved.getLive(),
                LiveEventType.LIVE_OPERATIONAL_SOLD_UNDONE,
                userId,
                "RESERVATION",
                saved.getId(),
                payload
        );
    }

    private TargetSnapshot resolveTarget(OperationalAuthorizationCreateRequest request) {
        if (request.getTargetType() == OperationalAuthorizationTargetType.RESERVATION || request.getReservationId() != null) {
            Long reservationId = request.getReservationId() != null ? request.getReservationId() : request.getTargetId();
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
            Long branchId = reservation.getBranch().getId();
            if (request.getBranchId() != null && !request.getBranchId().equals(branchId)) {
                throw new AccessDeniedException("La reserva no pertenece a la sucursal solicitada");
            }
            validateReservationOperation(request.getOperationType(), reservation);
            return new TargetSnapshot(
                    branchId,
                    reservation.getLive() != null ? reservation.getLive().getId() : request.getLiveId(),
                    reservation.getId(),
                    reservation.getItem() != null ? reservation.getItem().getId() : request.getItemId(),
                    reservationSnapshot(reservation)
            );
        }

        if (request.getTargetType() == OperationalAuthorizationTargetType.ITEM || request.getItemId() != null) {
            Long itemId = request.getItemId() != null ? request.getItemId() : request.getTargetId();
            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
            Long branchId = item.getBranch().getId();
            if (request.getBranchId() != null && !request.getBranchId().equals(branchId)) {
                throw new AccessDeniedException("El item no pertenece a la sucursal solicitada");
            }
            return new TargetSnapshot(branchId, request.getLiveId(), request.getReservationId(), item.getId(), itemSnapshot(item));
        }

        if (request.getBranchId() == null) {
            throw new IllegalArgumentException("branchId es obligatorio para este target");
        }
        return new TargetSnapshot(
                request.getBranchId(),
                request.getLiveId(),
                request.getReservationId(),
                request.getItemId(),
                "{\"targetType\":\"" + request.getTargetType().name() + "\",\"targetId\":" + request.getTargetId() + "}"
        );
    }

    private void validateReservationOperation(OperationalAuthorizationType operationType, Reservation reservation) {
        if (operationType == OperationalAuthorizationType.UNDO_LIVE_OPERATIONAL_SALE
                && reservation.getLiveOperationalStatus() != LiveReservationOperationalStatus.OPERATIONAL_SOLD) {
            throw new IllegalArgumentException("Solo se puede solicitar deshacer vendido operativo sobre OPERATIONAL_SOLD");
        }
        if (operationType == OperationalAuthorizationType.CANCEL_RESERVATION_WITH_PAYMENT
                && calculateActiveAppliedToReservation(reservation.getId()).compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La reserva no tiene pago activo aplicado");
        }
    }

    private BigDecimal calculateActiveAppliedToReservation(Long reservationId) {
        return paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
                .stream()
                .map(this::activeAllocationAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal activeAllocationAmount(PaymentAllocation allocation) {
        Payment payment = paymentRepository.findById(allocation.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
        return payment.getStatus() == PaymentStatus.ACTIVE ? allocation.getAmount() : BigDecimal.ZERO;
    }

    private OperationalAuthorizationRequest findScoped(Long id) {
        OperationalAuthorizationRequest entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de autorizacion no encontrada"));
        CurrentTenantContext tenant = tenantAccessGuard.requireBranch(entity.getBranchId(), "La autorizacion no pertenece a la sucursal activa");
        if (!tenant.getCompanyId().equals(entity.getCompanyId())) {
            throw new AccessDeniedException("La autorizacion no pertenece a la company activa");
        }
        return entity;
    }

    private void validateCreateRequest(OperationalAuthorizationCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Solicitud requerida");
        }
        if (request.getOperationType() == null) {
            throw new IllegalArgumentException("operationType es obligatorio");
        }
        if (request.getTargetType() == null) {
            throw new IllegalArgumentException("targetType es obligatorio");
        }
        if (request.getTargetId() == null) {
            throw new IllegalArgumentException("targetId es obligatorio");
        }
        cleanReason(request.getReason());
    }

    private void assertCanRequestOperation(Long userId, OperationalAuthorizationType operationType) {
        if (operationType == null) {
            return;
        }
        switch (operationType) {
            case CANCEL_RESERVATION_WITH_PAYMENT ->
                    accessService.assertCan(userId, PermissionCode.CANCEL_RESERVATION_WITH_PAYMENT);
            case RELEASE_RESERVED_ITEM -> accessService.assertCan(userId, PermissionCode.RELEASE_RESERVED_ITEM);
            case UNDO_LIVE_OPERATIONAL_SALE -> accessService.assertCan(userId, PermissionCode.UNDO_LIVE_OPERATIONAL_SALE);
            case REASSIGN_RESERVATION -> accessService.assertCan(userId, PermissionCode.REASSIGN_RESERVATION);
            case EDIT_LOCKED_ITEM -> accessService.assertCan(userId, PermissionCode.EDIT_LOCKED_ITEM);
        }
    }

    private void ensureRequested(OperationalAuthorizationRequest entity) {
        if (entity.getStatus() != OperationalAuthorizationStatus.REQUESTED) {
            throw new IllegalArgumentException("Solo se puede decidir una solicitud pendiente");
        }
    }

    private void ensureNotExpired(OperationalAuthorizationRequest entity) {
        if (entity.getExpiresAt() != null && entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            entity.setStatus(OperationalAuthorizationStatus.EXPIRED);
            repository.save(entity);
            throw new IllegalArgumentException("La autorizacion expiro");
        }
    }

    private OperationalAuthorizationResponse toResponse(OperationalAuthorizationRequest entity) {
        return new OperationalAuthorizationResponse(entity);
    }

    private String cleanReason(String value) {
        String cleaned = cleanOptionalText(value);
        if (cleaned == null) {
            throw new IllegalArgumentException("reason es obligatorio");
        }
        return cleaned;
    }

    private String cleanOptionalText(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String cleaned = value.trim();
        return cleaned.length() > 2000 ? cleaned.substring(0, 2000) : cleaned;
    }

    private String cleanOptionalJson(String value) {
        String cleaned = cleanOptionalText(value);
        if (cleaned == null) {
            return null;
        }
        return cleaned.length() > 4000 ? cleaned.substring(0, 4000) : cleaned;
    }

    private String reservationSnapshot(Reservation reservation) {
        return "{\"reservationId\":" + reservation.getId()
                + ",\"status\":\"" + reservation.getStatus().name()
                + "\",\"liveOperationalStatus\":\"" + statusName(reservation.getLiveOperationalStatus())
                + "\",\"branchId\":" + reservation.getBranch().getId()
                + ",\"liveId\":" + nullableNumber(reservation.getLive() != null ? reservation.getLive().getId() : null)
                + ",\"itemId\":" + nullableNumber(reservation.getItem() != null ? reservation.getItem().getId() : null)
                + ",\"itemStatus\":\"" + (reservation.getItem() != null ? reservation.getItem().getStatus().name() : "null")
                + "\"}";
    }

    private String itemSnapshot(Item item) {
        return "{\"itemId\":" + item.getId()
                + ",\"branchId\":" + item.getBranch().getId()
                + ",\"status\":\"" + item.getStatus().name() + "\"}";
    }

    private String statusName(LiveReservationOperationalStatus status) {
        return status == null ? "null" : status.name();
    }

    private String nullableNumber(Long value) {
        return value == null ? "null" : value.toString();
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("No se pudo calcular hash de autorizacion", ex);
        }
    }

    private record TargetSnapshot(Long branchId, Long liveId, Long reservationId, Long itemId, String snapshotJson) {
    }
}
