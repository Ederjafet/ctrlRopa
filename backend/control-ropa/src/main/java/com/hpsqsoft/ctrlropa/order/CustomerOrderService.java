package com.hpsqsoft.ctrlropa.order;

import com.hpsqsoft.ctrlropa.balance.CustomerBalanceMovement;
import com.hpsqsoft.ctrlropa.balance.CustomerBalanceMovementRepository;
import com.hpsqsoft.ctrlropa.balance.CustomerBalanceMovementType;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.payment.Payment;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocation;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentStatus;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CustomerOrderService {

    private final CustomerOrderRepository repository;
    private final CustomerOrderItemRepository orderItemRepository;
    private final ReservationRepository reservationRepository;
    private final SaleRepository saleRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerBalanceMovementRepository balanceMovementRepository;

    public CustomerOrderService(CustomerOrderRepository repository,
                                CustomerOrderItemRepository orderItemRepository,
                                ReservationRepository reservationRepository,
                                SaleRepository saleRepository,
                                PaymentAllocationRepository paymentAllocationRepository,
                                PaymentRepository paymentRepository,
                                CustomerBalanceMovementRepository balanceMovementRepository) {
        this.repository = repository;
        this.orderItemRepository = orderItemRepository;
        this.reservationRepository = reservationRepository;
        this.saleRepository = saleRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.paymentRepository = paymentRepository;
        this.balanceMovementRepository = balanceMovementRepository;
    }

    public CustomerOrder findEntityById(Long orderId) {
        return repository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con id: " + orderId));
    }

    public CustomerOrder getOrderForReservation(Reservation reservation) {
        return orderItemRepository.findFirstByReservation_Id(reservation.getId())
                .map(CustomerOrderItem::getCustomerOrder)
                .orElseGet(() -> addReservationToOpenOrder(reservation));
    }

    public CustomerOrder getOrCreateOpenOrder(Customer customer, Branch branch) {
        if (customer == null || customer.getId() == null) {
            throw new IllegalArgumentException("Cliente inválido para pedido");
        }

        if (branch == null || branch.getId() == null) {
            throw new IllegalArgumentException("Sucursal inválida para pedido");
        }

        return repository
                .findFirstByCustomerIdAndBranchIdAndStatusOrderByCreatedAtDesc(
                        customer.getId(),
                        branch.getId(),
                        CustomerOrderStatus.OPEN
                )
                .orElseGet(() -> {
                    CustomerOrder order = new CustomerOrder();
                    order.setCustomer(customer);
                    order.setBranch(branch);
                    order.setStatus(CustomerOrderStatus.OPEN);
                    return repository.save(order);
                });
    }

    public CustomerOrder addReservationToOpenOrder(Reservation reservation) {
        if (reservation == null || reservation.getId() == null) {
            throw new IllegalArgumentException("Reserva inválida para pedido");
        }

        return orderItemRepository.findFirstByReservation_Id(reservation.getId())
                .map(CustomerOrderItem::getCustomerOrder)
                .orElseGet(() -> {
                    CustomerOrder order = getOrCreateOpenOrder(reservation.getCustomer(), reservation.getBranch());

                    CustomerOrderItem orderItem = new CustomerOrderItem();
                    orderItem.setCustomerOrder(order);
                    orderItem.setItem(reservation.getItem());
                    orderItem.setReservation(reservation);
                    orderItem.setSale(null);
                    orderItem.setPrice(reservation.getPrice());
                    orderItemRepository.save(orderItem);

                    return order;
                });
    }

    public CustomerOrder addSaleToOpenOrder(Sale sale) {
        if (sale == null || sale.getId() == null) {
            throw new IllegalArgumentException("Venta inválida para pedido");
        }

        return orderItemRepository.findFirstBySale_Id(sale.getId())
                .map(CustomerOrderItem::getCustomerOrder)
                .orElseGet(() -> {
                    CustomerOrder order;
                    if (sale.getCustomerOrderId() != null) {
                        order = repository.findById(sale.getCustomerOrderId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                        "Pedido no encontrado con id: " + sale.getCustomerOrderId()));
                    } else {
                        order = getOrCreateOpenOrder(sale.getCustomer(), sale.getBranch());
                        sale.setCustomerOrderId(order.getId());
                        saleRepository.save(sale);
                    }

                    validateSaleMatchesOrder(sale, order);

                    CustomerOrderItem orderItem = new CustomerOrderItem();
                    orderItem.setCustomerOrder(order);
                    orderItem.setItem(sale.getItem());
                    orderItem.setReservation(null);
                    orderItem.setSale(sale);
                    orderItem.setPrice(sale.getPrice());
                    orderItemRepository.save(orderItem);

                    return order;
                });
    }

    @Transactional(readOnly = true)
    public Long findOrderIdByReservationId(Long reservationId) {
        return orderItemRepository.findFirstByReservation_Id(reservationId)
                .map(item -> item.getCustomerOrder().getId())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Long findOrderIdBySaleId(Long saleId) {
        return orderItemRepository.findFirstBySale_Id(saleId)
                .map(item -> item.getCustomerOrder().getId())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrderResponse> findByCustomer(Long customerId) {
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .filter(order -> !orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(order.getId()).isEmpty())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerOrderPendingPaymentResponse> findPendingPaymentByBranch(Long branchId) {
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .filter(order -> order.getStatus() != CustomerOrderStatus.CANCELLED)
                .map(this::toPendingPaymentResponse)
                .filter(response -> response.getPending().compareTo(BigDecimal.ZERO) > 0)
                .filter(response -> response.getActiveReservationCount() > 0)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerOrderDetailResponse findDetail(Long orderId) {
        CustomerOrder order = repository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con id: " + orderId));

        List<CustomerOrderItem> orderItems = orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId);

        List<CustomerOrderDetailResponse.OrderLine> items = orderItems.stream()
                .map(this::toOrderLine)
                .toList();

        List<CustomerOrderDetailResponse.ReservationLine> reservations = orderItems.stream()
                .map(CustomerOrderItem::getReservation)
                .filter(reservation -> reservation != null)
                .map(this::toReservationLine)
                .toList();

        List<CustomerOrderDetailResponse.SaleLine> sales = orderItems.stream()
                .map(CustomerOrderItem::getSale)
                .filter(sale -> sale != null)
                .map(this::toSaleLine)
                .toList();

        BigDecimal total = calculateTotal(orderId);

        return new CustomerOrderDetailResponse(
                order.getId(),
                order.getCustomer().getId(),
                order.getCustomer().getName(),
                order.getBranch().getId(),
                order.getBranch().getCode(),
                order.getStatus().name(),
                order.getCreatedAt(),
                items,
                reservations,
                sales,
                total
        );
    }

    @Transactional(readOnly = true)
    public CustomerOrderSettlementResponse getSettlement(Long orderId) {
        CustomerOrder order = repository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con id: " + orderId));

        BigDecimal total = calculateTotal(orderId);
        BigDecimal directPaid = calculateDirectPaid(orderId);
        BigDecimal appliedBalance = calculateAppliedBalance(orderId);
        BigDecimal paid = directPaid.add(appliedBalance);
        BigDecimal pending = total.subtract(paid);

        if (pending.signum() < 0) {
            pending = BigDecimal.ZERO;
        }

        return new CustomerOrderSettlementResponse(
                order.getId(),
                total,
                directPaid,
                appliedBalance,
                paid,
                pending,
                order.getStatus().name()
        );
    }

    public void refreshStatus(Long orderId) {
        CustomerOrder order = repository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con id: " + orderId));

        if (order.getStatus() == CustomerOrderStatus.CANCELLED) {
            return;
        }

        List<CustomerOrderItem> items = orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId);
        if (items.isEmpty()) {
            order.setStatus(CustomerOrderStatus.OPEN);
            repository.save(order);
            return;
        }

        CustomerOrderSettlementResponse settlement = getSettlement(orderId);

        if (settlement.getPending().compareTo(BigDecimal.ZERO) > 0) {
            order.setStatus(CustomerOrderStatus.OPEN);
        } else {
            order.setStatus(CustomerOrderStatus.CLOSED);
        }

        repository.save(order);
    }

    private BigDecimal calculateTotal(Long orderId) {
        return orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(orderItem -> {
                    if (orderItem.getReservation() != null
                            && orderItem.getReservation().getStatus() == ReservationStatus.ACTIVE) {
                        return orderItem.getReservation().getPrice();
                    }

                    if (orderItem.getSale() != null
                            && orderItem.getSale().getStatus() == SaleStatus.ACTIVE) {
                        return orderItem.getSale().getPrice();
                    }

                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateDirectPaid(Long orderId) {
        List<CustomerOrderItem> orderItems = orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId);
        BigDecimal totalPaid = BigDecimal.ZERO;

        for (CustomerOrderItem orderItem : orderItems) {
            if (orderItem.getReservation() != null
                    && orderItem.getReservation().getStatus() != ReservationStatus.CANCELLED) {
                totalPaid = totalPaid.add(calculateActiveAppliedToReservation(orderItem.getReservation().getId()));
            }

            if (orderItem.getSale() != null
                    && orderItem.getSale().getStatus() == SaleStatus.ACTIVE) {
                totalPaid = totalPaid.add(calculateActiveAppliedToSale(orderItem.getSale().getId()));
            }
        }

        return totalPaid;
    }

    private BigDecimal calculateActiveAppliedToReservation(Long reservationId) {
        return paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
                .stream()
                .map(this::activeAllocationAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateActiveAppliedToSale(Long saleId) {
        return paymentAllocationRepository.findBySaleIdOrderByCreatedAtAsc(saleId)
                .stream()
                .map(this::activeAllocationAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal activeAllocationAmount(PaymentAllocation allocation) {
        Payment payment = paymentRepository.findById(allocation.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Pago no encontrado con id: " + allocation.getPaymentId()));

        return payment.getStatus() == PaymentStatus.ACTIVE ? allocation.getAmount() : BigDecimal.ZERO;
    }

    private BigDecimal calculateAppliedBalance(Long orderId) {
        return balanceMovementRepository
                .findByCustomerOrderIdAndTypeOrderByCreatedAtAsc(orderId, CustomerBalanceMovementType.APPLIED_TO_ORDER)
                .stream()
                .map(CustomerBalanceMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validateSaleMatchesOrder(Sale sale, CustomerOrder order) {
        if (!sale.getCustomer().getId().equals(order.getCustomer().getId())) {
            throw new IllegalArgumentException("La venta no pertenece al mismo cliente del pedido");
        }

        if (!sale.getBranch().getId().equals(order.getBranch().getId())) {
            throw new IllegalArgumentException("La venta no pertenece a la misma sucursal del pedido");
        }
    }

    private CustomerOrderResponse toResponse(CustomerOrder e) {
        return new CustomerOrderResponse(
                e.getId(),
                e.getCustomer().getId(),
                e.getCustomer().getName(),
                e.getBranch().getId(),
                e.getBranch().getCode(),
                e.getStatus().name(),
                e.getCreatedAt(),
                resolveOrderSalesChannelCode(e.getId())
        );
    }

    private CustomerOrderPendingPaymentResponse toPendingPaymentResponse(CustomerOrder order) {
        CustomerOrderSettlementResponse settlement = getSettlement(order.getId());
        List<CustomerOrderItem> orderItems = orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(order.getId());
        int activeReservationCount = (int) orderItems.stream()
                .map(CustomerOrderItem::getReservation)
                .filter(reservation -> reservation != null && reservation.getStatus() == ReservationStatus.ACTIVE)
                .count();

        return new CustomerOrderPendingPaymentResponse(
                order.getId(),
                order.getCustomer().getId(),
                order.getCustomer().getName(),
                order.getBranch().getId(),
                order.getBranch().getCode(),
                order.getStatus().name(),
                order.getCreatedAt(),
                resolveOrderSalesChannelCode(order.getId()),
                settlement.getTotal(),
                settlement.getPaid(),
                settlement.getPending(),
                orderItems.size(),
                activeReservationCount
        );
    }

    private String resolveOrderSalesChannelCode(Long orderId) {
        List<String> channels = orderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(orderItem -> {
                    if (orderItem.getSale() != null && orderItem.getSale().getSalesChannel() != null) {
                        return orderItem.getSale().getSalesChannel().getCode();
                    }

                    if (orderItem.getReservation() != null
                            && orderItem.getReservation().getSalesChannel() != null) {
                        return orderItem.getReservation().getSalesChannel().getCode();
                    }

                    return null;
                })
                .filter(code -> code != null && !code.isBlank())
                .distinct()
                .toList();

        if (channels.isEmpty()) {
            return null;
        }

        if (channels.size() == 1) {
            return channels.get(0);
        }

        return "MIXED";
    }

    private CustomerOrderDetailResponse.OrderLine toOrderLine(CustomerOrderItem orderItem) {
        Reservation reservation = orderItem.getReservation();
        Sale sale = orderItem.getSale();

        if (reservation != null) {
            return new CustomerOrderDetailResponse.OrderLine(
                    orderItem.getId(),
                    "RESERVATION",
                    reservation.getId(),
                    null,
                    reservation.getItem().getId(),
                    reservation.getItem().getCode(),
                    reservation.getSalesChannel().getId(),
                    reservation.getSalesChannel().getCode(),
                    reservation.getPrice(),
                    reservation.getStatus().name(),
                    null,
                    reservation.getCreatedAt()
            );
        }

        if (sale != null) {
            return new CustomerOrderDetailResponse.OrderLine(
                    orderItem.getId(),
                    "SALE",
                    null,
                    sale.getId(),
                    sale.getItem().getId(),
                    sale.getItem().getCode(),
                    sale.getSalesChannel().getId(),
                    sale.getSalesChannel().getCode(),
                    sale.getPrice(),
                    sale.getStatus().name(),
                    sale.getPaymentStatus().name(),
                    sale.getCreatedAt()
            );
        }

        return new CustomerOrderDetailResponse.OrderLine(
                orderItem.getId(),
                "UNKNOWN",
                null,
                null,
                orderItem.getItem().getId(),
                orderItem.getItem().getCode(),
                null,
                null,
                orderItem.getPrice(),
                "UNKNOWN",
                null,
                orderItem.getCreatedAt()
        );
    }

    private CustomerOrderDetailResponse.ReservationLine toReservationLine(Reservation reservation) {
        return new CustomerOrderDetailResponse.ReservationLine(
                reservation.getId(),
                reservation.getItem().getId(),
                reservation.getItem().getCode(),
                reservation.getSalesChannel().getId(),
                reservation.getSalesChannel().getCode(),
                reservation.getPrice(),
                reservation.getStatus().name(),
                reservation.getCreatedAt()
        );
    }

    private CustomerOrderDetailResponse.SaleLine toSaleLine(Sale sale) {
        return new CustomerOrderDetailResponse.SaleLine(
                sale.getId(),
                sale.getItem().getId(),
                sale.getItem().getCode(),
                sale.getSalesChannel().getId(),
                sale.getSalesChannel().getCode(),
                sale.getPrice(),
                sale.getStatus().name(),
                sale.getPaymentStatus().name(),
                sale.getCreatedAt()
        );
    }
}
