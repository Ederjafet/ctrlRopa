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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ReservationService {

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
                              LiveEventService liveEventService) {
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
        Long userId = currentUser.getUserId();
        tenantAccessGuard.requireBranch(request.getBranchId(), "La sucursal de la reserva no pertenece al tenant activo");

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        tenantAccessGuard.requireBranch(item.getBranch().getId(), "El item no pertenece a la sucursal activa");

        if (item.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("El item no está disponible");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        tenantAccessGuard.requireBranch(customer.getBranch().getId(), "El cliente no pertenece a la sucursal activa");

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        SalesChannel salesChannel = salesChannelRepository.findById(request.getSalesChannelId())
                .orElseThrow(() -> new IllegalArgumentException("Canal de venta no encontrado"));

        if (!item.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El item no pertenece a la sucursal indicada");
        }

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

        Reservation saved = repository.save(entity);

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

        return toResponse(saved);
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
