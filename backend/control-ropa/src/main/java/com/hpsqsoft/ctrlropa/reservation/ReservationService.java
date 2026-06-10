package com.hpsqsoft.ctrlropa.reservation;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.inventory.Box;
import com.hpsqsoft.ctrlropa.inventory.BoxRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.live.Live;
import com.hpsqsoft.ctrlropa.live.LiveEventService;
import com.hpsqsoft.ctrlropa.live.LiveEventType;
import com.hpsqsoft.ctrlropa.live.LiveRepository;
import com.hpsqsoft.ctrlropa.live.LiveStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import com.hpsqsoft.ctrlropa.web.error.ConflictException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
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
public class ReservationService {

    private static final String RESERVATION_CREATE_OPERATION = "RESERVATION_CREATE";
    private static final int IDEMPOTENCY_KEY_MAX_LENGTH = 120;

    private final ReservationRepository repository;
    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final LiveRepository liveRepository;
    private final SalesChannelRepository salesChannelRepository;
    private final BoxRepository boxRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final CustomerOrderService customerOrderService;
    private final JdbcTemplate jdbcTemplate;
    private final TenantAccessGuard tenantAccessGuard;
    private final LiveEventService liveEventService;
    private final ReservationIdempotencyRepository idempotencyRepository;

    public ReservationService(ReservationRepository repository,
                              ItemRepository itemRepository,
                              CustomerRepository customerRepository,
                              BranchRepository branchRepository,
                              LiveRepository liveRepository,
                              SalesChannelRepository salesChannelRepository,
                              BoxRepository boxRepository,
                              AccessService accessService,
                              CurrentUser currentUser,
                              CustomerOrderService customerOrderService,
                              JdbcTemplate jdbcTemplate,
                              TenantAccessGuard tenantAccessGuard,
                              LiveEventService liveEventService,
                              ReservationIdempotencyRepository idempotencyRepository) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.liveRepository = liveRepository;
        this.salesChannelRepository = salesChannelRepository;
        this.boxRepository = boxRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.customerOrderService = customerOrderService;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantAccessGuard = tenantAccessGuard;
        this.liveEventService = liveEventService;
        this.idempotencyRepository = idempotencyRepository;
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> findByBranch(Long branchId) {
        tenantAccessGuard.requireBranch(branchId, "La sucursal de reservas no pertenece al tenant activo");
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> findActiveWithoutBox(Long branchId) {
        tenantAccessGuard.requireBranch(branchId, "La sucursal de reservas no pertenece al tenant activo");
        return repository.findByBoxIsNullAndBranchIdAndStatusOrderByCreatedAtDesc(branchId, ReservationStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> findByBox(Long boxId) {
        Box box = boxRepository.findById(boxId)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada"));
        tenantAccessGuard.requireBranch(box.getBranch().getId(), "La caja no pertenece a la sucursal activa");
        return repository.findByBoxIdOrderByCreatedAtAsc(boxId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    public ReservationResponse create(CreateReservationRequest request) {
        return create(request, null);
    }

    public ReservationResponse create(CreateReservationRequest request, String idempotencyKey) {
        Long userId = currentUser.getUserId();
        tenantAccessGuard.requireBranch(request.getBranchId(), "La sucursal de la reserva no pertenece al tenant activo");

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        tenantAccessGuard.requireBranch(item.getBranch().getId(), "El item no pertenece a la sucursal activa");

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        if (!item.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El item no pertenece a la sucursal indicada");
        }

        ReservationIdempotencyRecord existingIdempotency = findExistingIdempotency(
                item.getCompany().getId(),
                branch.getId(),
                userId,
                idempotencyKey,
                request
        );

        if (existingIdempotency == null && item.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("El item no esta disponible");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        tenantAccessGuard.requireBranch(customer.getBranch().getId(), "El cliente no pertenece a la sucursal activa");

        SalesChannel salesChannel = salesChannelRepository.findById(request.getSalesChannelId())
                .orElseThrow(() -> new IllegalArgumentException("Canal de venta no encontrado"));

        if (!customer.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El cliente no pertenece a la sucursal indicada");
        }

        validateReservationCreateAccess(userId, salesChannel.getCode(), branch.getId());

        Live live = null;
        if (request.getLiveId() != null) {
            live = liveRepository.findById(request.getLiveId())
                    .orElseThrow(() -> new IllegalArgumentException("Live no encontrado"));
            tenantAccessGuard.requireBranch(live.getBranch().getId(), "La transmision no pertenece a la sucursal activa");

            if (live.getStatus() != LiveStatus.OPEN && live.getStatus() != LiveStatus.ACTIVE) {
                throw new IllegalArgumentException("El live no está disponible para reservar");
            }

            if (!ChannelCode.LIVE.equals(salesChannel.getCode())) {
                throw new IllegalArgumentException("Si la reserva viene de live, el canal debe ser LIVE");
            }

            if (!live.getBranch().getId().equals(branch.getId())) {
                throw new IllegalArgumentException("El live no pertenece a la sucursal indicada");
            }
        }

        if (request.getLiveId() == null && ChannelCode.LIVE.equals(salesChannel.getCode())) {
            throw new IllegalArgumentException("Las reservas LIVE requieren liveId");
        }

        if (existingIdempotency != null) {
            return resolveExistingIdempotency(existingIdempotency);
        }

        ReservationIdempotencyRecord idempotencyRecord = createIdempotencyRecord(
                item.getCompany().getId(),
                branch.getId(),
                userId,
                idempotencyKey,
                request
        );

        Reservation activeReservation = repository.findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)
                .orElse(null);

        if (activeReservation != null) {
            throw new IllegalArgumentException("El item ya tiene una reserva activa");
        }

        int reservedRows = itemRepository.reserveIfAvailable(
                item.getCompany().getId(),
                item.getBranch().getId(),
                item.getId(),
                ItemStatus.AVAILABLE,
                ItemStatus.RESERVED
        );

        if (reservedRows != 1) {
            throw new IllegalArgumentException("La prenda ya no esta disponible para apartar");
        }

        BigDecimal effectivePrice = request.getPrice();

        if (effectivePrice == null) {
            effectivePrice = item.getPrice();
        }

        if (effectivePrice == null || effectivePrice.signum() <= 0) {
            throw new IllegalArgumentException("El item no tiene precio asignado");
        }

        if (request.getPrice() != null) {
            item.setStatus(ItemStatus.RESERVED);
            item.setPrice(request.getPrice());
            itemRepository.save(item);
        }

        Reservation entity = new Reservation();
        entity.setItem(item);
        entity.setCustomer(customer);
        entity.setBranch(branch);
        entity.setLive(live);
        entity.setSalesChannel(salesChannel);
        entity.setSellerUserId(resolveSellerUserId(request.getSellerUserId(), userId));
        entity.setPrice(effectivePrice);
        entity.setNotes(request.getNotes());
        entity.setStatus(ReservationStatus.ACTIVE);
        if (live != null) {
            entity.setLiveOperationalStatus(LiveReservationOperationalStatus.RESERVED);
            entity.setLiveOperationalStatusUpdatedAt(LocalDateTime.now());
            entity.setLiveOperationalStatusUpdatedByUserId(userId);
        }

        Reservation saved = saveCreatedReservation(entity);

        CustomerOrder order = customerOrderService.addReservationToOpenOrder(saved);
        customerOrderService.refreshStatus(order.getId());

        if (saved.getLive() != null) {
            liveEventService.record(
                    saved.getLive(),
                    LiveEventType.LIVE_RESERVATION_CREATED,
                    userId,
                    "RESERVATION",
                    saved.getId(),
                    "{\"reservationId\":" + saved.getId()
                            + ",\"itemId\":" + saved.getItem().getId()
                            + ",\"customerId\":" + saved.getCustomer().getId()
                            + ",\"operationalStatus\":\"" + saved.getLiveOperationalStatus().name() + "\"}"
            );
        }

        markIdempotencyCompleted(idempotencyRecord, saved.getId());

        return toResponse(saved);
    }

    private ReservationIdempotencyRecord findExistingIdempotency(Long companyId,
                                                                 Long branchId,
                                                                 Long userId,
                                                                 String idempotencyKey,
                                                                 CreateReservationRequest request) {
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        if (normalizedKey == null) {
            return null;
        }

        String requestHash = hashReservationRequest(request);
        ReservationIdempotencyRecord existing = idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        companyId,
                        branchId,
                        userId,
                        RESERVATION_CREATE_OPERATION,
                        normalizedKey
                )
                .orElse(null);

        if (existing != null && !requestHash.equals(existing.getRequestHash())) {
            throw new ConflictException("La llave de idempotencia ya fue usada con datos distintos");
        }

        return existing;
    }

    private ReservationIdempotencyRecord createIdempotencyRecord(Long companyId,
                                                                 Long branchId,
                                                                 Long userId,
                                                                 String idempotencyKey,
                                                                 CreateReservationRequest request) {
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        if (normalizedKey == null) {
            return null;
        }

        ReservationIdempotencyRecord record = new ReservationIdempotencyRecord();
        record.setCompanyId(companyId);
        record.setBranchId(branchId);
        record.setUserId(userId);
        record.setOperation(RESERVATION_CREATE_OPERATION);
        record.setIdempotencyKey(normalizedKey);
        record.setRequestHash(hashReservationRequest(request));
        record.setStatus(ReservationIdempotencyStatus.IN_PROGRESS);
        record.setExpiresAt(LocalDateTime.now().plusHours(24));

        try {
            return idempotencyRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException(
                    "La solicitud de reserva con esta llave ya esta en proceso. Intenta de nuevo en unos segundos."
            );
        }
    }

    private ReservationResponse resolveExistingIdempotency(ReservationIdempotencyRecord record) {
        if (record.getStatus() == ReservationIdempotencyStatus.COMPLETED
                && record.getReservationId() != null) {
            return toResponse(findEntityById(record.getReservationId()));
        }

        if (record.getStatus() == ReservationIdempotencyStatus.IN_PROGRESS) {
            throw new ConflictException(
                    "La solicitud de reserva con esta llave sigue en proceso. Intenta de nuevo en unos segundos."
            );
        }

        throw new ConflictException(
                "La solicitud de reserva con esta llave quedo en estado ambiguo. Genera un nuevo intento."
        );
    }

    private void markIdempotencyCompleted(ReservationIdempotencyRecord record, Long reservationId) {
        if (record == null) {
            return;
        }

        record.setReservationId(reservationId);
        record.setStatus(ReservationIdempotencyStatus.COMPLETED);
        record.setErrorMessage(null);
        idempotencyRepository.save(record);
    }

    private Reservation saveCreatedReservation(Reservation entity) {
        try {
            return repository.saveAndFlush(entity);
        } catch (DataIntegrityViolationException ex) {
            if (isActiveReservationConstraintViolation(ex)) {
                throw new ConflictException("El item ya tiene una reserva activa");
            }
            throw ex;
        }
    }

    private boolean isActiveReservationConstraintViolation(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains("uq_reservations_active_item")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        String normalized = idempotencyKey.trim();
        if (normalized.length() > IDEMPOTENCY_KEY_MAX_LENGTH) {
            throw new IllegalArgumentException("La llave de idempotencia excede 120 caracteres");
        }

        return normalized;
    }

    private String hashReservationRequest(CreateReservationRequest request) {
        return sha256(
                "itemId=" + valuePart(request.getItemId()) + "\n"
                        + "customerId=" + valuePart(request.getCustomerId()) + "\n"
                        + "branchId=" + valuePart(request.getBranchId()) + "\n"
                        + "liveId=" + valuePart(request.getLiveId()) + "\n"
                        + "salesChannelId=" + valuePart(request.getSalesChannelId()) + "\n"
                        + "sellerUserId=" + valuePart(request.getSellerUserId()) + "\n"
                        + "price=" + amountPart(request.getPrice()) + "\n"
                        + "notes=" + valuePart(request.getNotes())
        );
    }

    private String valuePart(Object value) {
        if (value == null) {
            return "";
        }

        return value.toString().trim();
    }

    private String amountPart(BigDecimal value) {
        if (value == null) {
            return "";
        }

        return value.stripTrailingZeros().toPlainString();
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
            throw new IllegalStateException("No se pudo calcular hash de idempotencia", ex);
        }
    }

    public ReservationResponse assignBox(Long reservationId, Long boxId) {
        Long userId = currentUser.getUserId();

        Reservation existing = findEntityById(reservationId);

        validateReservationManagementAccess(userId, existing);

        Box box = boxRepository.findById(boxId)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada"));
        tenantAccessGuard.requireBranch(box.getBranch().getId(), "La caja no pertenece a la sucursal activa");

        if (!box.getBranch().getId().equals(existing.getBranch().getId())) {
            throw new IllegalArgumentException("La caja no pertenece a la misma sucursal de la reserva");
        }

        existing.setBox(box);
        return toResponse(repository.save(existing));
    }

    public ReservationResponse removeBox(Long reservationId) {
        Long userId = currentUser.getUserId();

        Reservation existing = findEntityById(reservationId);

        validateReservationManagementAccess(userId, existing);

        existing.setBox(null);
        return toResponse(repository.save(existing));
    }

    public ReservationResponse cancel(Long reservationId, String reason) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.CANCEL_RESERVATION);

        Reservation existing = findEntityById(reservationId);

        if (existing.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se pueden cancelar reservas activas");
        }

        existing.setStatus(ReservationStatus.CANCELLED);
        existing.setCancelledAt(LocalDateTime.now());
        existing.setCancelReason(reason);
        existing.setCancelledByUserId(userId);
        if (existing.getLive() != null) {
            LiveReservationOperationalStatus previousOperationalStatus = existing.getLiveOperationalStatus();
            existing.setLiveOperationalStatus(LiveReservationOperationalStatus.CANCELLED);
            existing.setLiveOperationalStatusUpdatedAt(LocalDateTime.now());
            existing.setLiveOperationalStatusUpdatedByUserId(userId);
            existing.setLiveOperationalStatusReason(reason);
            recordLiveReservationStatusChange(
                    existing,
                    userId,
                    previousOperationalStatus,
                    LiveReservationOperationalStatus.CANCELLED
            );
        }

        Item item = existing.getItem();
        item.setStatus(ItemStatus.AVAILABLE);
        itemRepository.save(item);

        Reservation saved = repository.save(existing);
        return toResponse(saved);
    }

    public ReservationResponse updateLiveOperationalStatus(
            Long reservationId,
            UpdateLiveOperationalStatusRequest request
    ) {
        Long userId = currentUser.getUserId();
        Reservation existing = findEntityById(reservationId);

        if (existing.getLive() == null || !ChannelCode.LIVE.equals(existing.getSalesChannel().getCode())) {
            throw new IllegalArgumentException("La reserva no pertenece a una transmision En vivo");
        }

        validateReservationManagementAccess(userId, existing);

        LiveReservationOperationalStatus nextStatus = request.getStatus();
        if (nextStatus == null) {
            throw new IllegalArgumentException("Estado operativo requerido");
        }

        LiveReservationOperationalStatus previousStatus = existing.getLiveOperationalStatus();
        existing.setLiveOperationalStatus(nextStatus);
        existing.setLiveOperationalStatusUpdatedAt(LocalDateTime.now());
        existing.setLiveOperationalStatusUpdatedByUserId(userId);
        existing.setLiveOperationalStatusReason(request.getReason());

        Reservation saved = repository.save(existing);
        recordLiveReservationStatusChange(saved, userId, previousStatus, nextStatus);
        return toResponse(saved);
    }

    private void recordLiveReservationStatusChange(Reservation reservation,
                                                   Long actorUserId,
                                                   LiveReservationOperationalStatus previousStatus,
                                                   LiveReservationOperationalStatus nextStatus) {
        if (reservation.getLive() == null || nextStatus == null) {
            return;
        }

        String payload = "{\"reservationId\":" + reservation.getId()
                + ",\"previousStatus\":\"" + statusName(previousStatus)
                + "\",\"newStatus\":\"" + nextStatus.name() + "\"}";

        liveEventService.record(
                reservation.getLive(),
                LiveEventType.LIVE_RESERVATION_STATUS_CHANGED,
                actorUserId,
                "RESERVATION",
                reservation.getId(),
                payload
        );

        if (nextStatus == LiveReservationOperationalStatus.OPERATIONAL_SOLD) {
            liveEventService.record(
                    reservation.getLive(),
                    LiveEventType.LIVE_OPERATIONAL_SOLD,
                    actorUserId,
                    "RESERVATION",
                    reservation.getId(),
                    payload
            );
        }

        if (nextStatus == LiveReservationOperationalStatus.CANCELLED) {
            liveEventService.record(
                    reservation.getLive(),
                    LiveEventType.LIVE_RESERVATION_CANCELLED,
                    actorUserId,
                    "RESERVATION",
                    reservation.getId(),
                    payload
            );
        }
    }

    private String statusName(LiveReservationOperationalStatus status) {
        return status == null ? "null" : status.name();
    }

    private void validateReservationCreateAccess(Long userId, String salesChannelCode, Long branchId) {
        if (ChannelCode.LIVE.equals(salesChannelCode)) {
            accessService.assertCan(
                    userId,
                    PermissionCode.DO_LIVE_RESERVATION,
                    ChannelCode.LIVE,
                    branchId
            );
            return;
        }

        if (ChannelCode.DOOR_RESERVATION.equals(salesChannelCode)) {
            accessService.assertCan(
                    userId,
                    PermissionCode.DO_DOOR_RESERVATION,
                    ChannelCode.DOOR_RESERVATION,
                    branchId
            );
            return;
        }

        throw new IllegalArgumentException("Canal no permitido para crear reservas: " + salesChannelCode);
    }

    private void validateReservationManagementAccess(Long userId, Reservation reservation) {
        String salesChannelCode = reservation.getSalesChannel().getCode();
        Long branchId = reservation.getBranch().getId();

        if (ChannelCode.LIVE.equals(salesChannelCode)) {
            accessService.assertCan(
                    userId,
                    PermissionCode.DO_LIVE_RESERVATION,
                    ChannelCode.LIVE,
                    branchId
            );
            return;
        }

        if (ChannelCode.DOOR_RESERVATION.equals(salesChannelCode)) {
            accessService.assertCan(
                    userId,
                    PermissionCode.DO_DOOR_RESERVATION,
                    ChannelCode.DOOR_RESERVATION,
                    branchId
            );
            return;
        }

        throw new IllegalArgumentException("Canal no permitido para administrar reservas: " + salesChannelCode);
    }

    private Long resolveSellerUserId(Long requestSellerUserId, Long currentUserId) {
        if (requestSellerUserId != null) {
            return requestSellerUserId;
        }

        return currentUserId;
    }

    private Reservation findEntityById(Long id) {
        Reservation reservation = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con id: " + id));
        tenantAccessGuard.requireBranch(reservation.getBranch().getId(), "La reserva no pertenece a la sucursal activa");
        return reservation;
    }

    private ReservationResponse toResponse(Reservation entity) {
        return new ReservationResponse(
                entity.getId(),
                entity.getItem().getId(),
                entity.getItem().getCode(),
                entity.getCustomer().getId(),
                entity.getCustomer().getName(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                customerOrderService.findOrderIdByReservationId(entity.getId()),
                entity.getLive() != null ? entity.getLive().getId() : null,
                entity.getLive() != null ? entity.getLive().getStatus().name() : null,
                entity.getLive() != null ? entity.getLive().getNotes() : null,
                entity.getSalesChannel().getId(),
                entity.getSalesChannel().getCode(),
                entity.getSellerUserId(),
                findUserName(entity.getSellerUserId()),
                entity.getBox() != null ? entity.getBox().getId() : null,
                entity.getBox() != null ? entity.getBox().getCode() : null,
                entity.getPrice(),
                entity.getNotes(),
                entity.getStatus().name(),
                entity.getLiveOperationalStatus() != null ? entity.getLiveOperationalStatus().name() : null,
                entity.getLiveOperationalStatusUpdatedAt(),
                entity.getLiveOperationalStatusUpdatedByUserId(),
                entity.getLiveOperationalStatusReason(),
                entity.getCreatedAt(),
                entity.getCancelledAt(),
                entity.getCancelReason(),
                entity.getCancelledByUserId()
        );
    }

    private String findUserName(Long userId) {
        if (userId == null) {
            return null;
        }

        List<String> names = jdbcTemplate.query(
                "SELECT name FROM users WHERE id = ? LIMIT 1",
                (rs, rowNum) -> rs.getString("name"),
                userId
        );

        return names.isEmpty() ? null : names.get(0);
    }

    public static class CreateReservationRequest {
        private Long itemId;
        private Long customerId;
        private Long branchId;
        private Long liveId;
        private Long salesChannelId;
        private Long sellerUserId;
        private BigDecimal price;
        private String notes;

        public Long getItemId() {
            return itemId;
        }

        public void setItemId(Long itemId) {
            this.itemId = itemId;
        }

        public Long getCustomerId() {
            return customerId;
        }

        public void setCustomerId(Long customerId) {
            this.customerId = customerId;
        }

        public Long getBranchId() {
            return branchId;
        }

        public void setBranchId(Long branchId) {
            this.branchId = branchId;
        }

        public Long getLiveId() {
            return liveId;
        }

        public void setLiveId(Long liveId) {
            this.liveId = liveId;
        }

        public Long getSalesChannelId() {
            return salesChannelId;
        }

        public void setSalesChannelId(Long salesChannelId) {
            this.salesChannelId = salesChannelId;
        }

        public Long getSellerUserId() {
            return sellerUserId;
        }

        public void setSellerUserId(Long sellerUserId) {
            this.sellerUserId = sellerUserId;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class UpdateLiveOperationalStatusRequest {
        private LiveReservationOperationalStatus status;
        private String reason;

        public LiveReservationOperationalStatus getStatus() {
            return status;
        }

        public void setStatus(LiveReservationOperationalStatus status) {
            this.status = status;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
