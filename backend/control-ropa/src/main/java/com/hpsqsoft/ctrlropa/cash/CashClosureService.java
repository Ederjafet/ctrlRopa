package com.hpsqsoft.ctrlropa.cash;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CashClosureService {

    private final CashClosureRepository closureRepository;
    private final CashExpenseRepository expenseRepository;
    private final BranchRepository branchRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public CashClosureService(CashClosureRepository closureRepository,
                              CashExpenseRepository expenseRepository,
                              BranchRepository branchRepository,
                              JdbcTemplate jdbcTemplate,
                              AccessService accessService,
                              CurrentUser currentUser) {
        this.closureRepository = closureRepository;
        this.expenseRepository = expenseRepository;
        this.branchRepository = branchRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public CashClosureResponse create(CreateCashClosureRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.MANAGE_CASH_CLOSURES);

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        if (closureRepository.existsByBranchIdAndClosureDateAndStatusIn(
                branch.getId(),
                request.getClosureDate(),
                List.of(CashClosureStatus.OPEN, CashClosureStatus.CLOSED)
        )) {
            throw new IllegalArgumentException("Ya existe un cierre de caja abierto o cerrado para esa sucursal y fecha");
        }

        BigDecimal expectedCash = calculateExpectedCash(branch.getId(), request.getClosureDate());
        BigDecimal deliveredCash = safe(request.getDeliveredCash());
        BigDecimal expensesTotal = BigDecimal.ZERO;
        BigDecimal difference = deliveredCash.subtract(expectedCash.subtract(expensesTotal));

        CashClosure closure = new CashClosure();
        closure.setBranch(branch);
        closure.setClosureDate(request.getClosureDate());
        closure.setExpectedCash(expectedCash);
        closure.setExpensesTotal(expensesTotal);
        closure.setDeliveredCash(deliveredCash);
        closure.setDifference(difference);
        closure.setNotes(cleanNullable(request.getNotes()));
        closure.setStatus(CashClosureStatus.OPEN);
        closure.setCreatedByUserId(userId);

        return toResponse(closureRepository.save(closure));
    }

    @Transactional(readOnly = true)
    public CashClosureResponse findById(Long id) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CASH_CLOSURES);

        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public CashClosureResponse findByBranchAndDate(Long branchId, LocalDate date) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = closureRepository.findByBranchIdAndClosureDate(branchId, date)
                .orElseThrow(() -> new IllegalArgumentException("Cierre de caja no encontrado"));

        return toResponse(closure);
    }

    @Transactional(readOnly = true)
    public List<CashClosureResponse> findByBranch(Long branchId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CASH_CLOSURES);

        return closureRepository.findByBranchIdOrderByClosureDateDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CashClosureResponse update(Long id, UpdateCashClosureRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = findEntity(id);

        if (closure.getStatus() != CashClosureStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden modificar cierres OPEN");
        }

        if (request.getDeliveredCash() != null) {
            closure.setDeliveredCash(safe(request.getDeliveredCash()));
        }

        if (request.getNotes() != null) {
            closure.setNotes(cleanNullable(request.getNotes()));
        }

        refreshAmounts(closure);

        return toResponse(closureRepository.save(closure));
    }

    public CashClosureResponse addExpense(Long closureId, AddCashExpenseRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = findEntity(closureId);

        if (closure.getStatus() != CashClosureStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden agregar gastos a cierres OPEN");
        }

        validatePositiveAmount(request.getAmount());

        CashExpense expense = new CashExpense();
        expense.setCashClosure(closure);
        expense.setBranch(closure.getBranch());
        expense.setExpenseDate(closure.getClosureDate());
        expense.setConcept(cleanRequired(request.getConcept(), "concept"));
        expense.setAmount(request.getAmount());
        expense.setNotes(cleanNullable(request.getNotes()));
        expense.setStatus(CashExpenseStatus.ACTIVE);
        expense.setCreatedByUserId(userId);

        expenseRepository.save(expense);

        refreshAmounts(closure);

        closureRepository.save(closure);

        return toResponse(closure);
    }

    public CashClosureResponse cancelExpense(Long closureId,
                                             Long expenseId,
                                             CancelCashExpenseRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = findEntity(closureId);

        if (closure.getStatus() != CashClosureStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden cancelar gastos en cierres OPEN");
        }

        CashExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado"));

        if (!expense.getCashClosure().getId().equals(closure.getId())) {
            throw new IllegalArgumentException("El gasto no pertenece a este cierre");
        }

        if (expense.getStatus() == CashExpenseStatus.CANCELLED) {
            throw new IllegalArgumentException("El gasto ya está cancelado");
        }

        expense.setStatus(CashExpenseStatus.CANCELLED);
        expense.setCancelledAt(LocalDateTime.now());
        expense.setCancelledByUserId(userId);
        expense.setCancelReason(cleanRequired(request.getReason(), "reason"));

        expenseRepository.save(expense);

        refreshAmounts(closure);

        closureRepository.save(closure);

        return toResponse(closure);
    }

    public CashClosureResponse close(Long id, CloseCashClosureRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = findEntity(id);

        if (closure.getStatus() != CashClosureStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden cerrar cierres OPEN");
        }

        validateNonNegativeAmount(request.getDeliveredCash());

        closure.setDeliveredCash(request.getDeliveredCash());

        if (request.getNotes() != null) {
            closure.setNotes(cleanNullable(request.getNotes()));
        }

        refreshAmounts(closure);

        closure.setStatus(CashClosureStatus.CLOSED);
        closure.setClosedAt(LocalDateTime.now());
        closure.setClosedByUserId(request.getClosedByUserId());

        return toResponse(closureRepository.save(closure));
    }

    public CashClosureResponse cancel(Long id, CancelCashClosureRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.MANAGE_CASH_CLOSURES);

        CashClosure closure = findEntity(id);

        if (closure.getStatus() == CashClosureStatus.CANCELLED) {
            throw new IllegalArgumentException("El cierre ya está cancelado");
        }

        closure.setStatus(CashClosureStatus.CANCELLED);
        closure.setCancelledAt(LocalDateTime.now());
        closure.setCancelledByUserId(userId);
        closure.setCancelReason(cleanRequired(request.getReason(), "reason"));

        return toResponse(closureRepository.save(closure));
    }

    private CashClosure findEntity(Long id) {
        return closureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cierre de caja no encontrado con id: " + id));
    }

    private void refreshAmounts(CashClosure closure) {
        BigDecimal expectedCash = calculateExpectedCash(
                closure.getBranch().getId(),
                closure.getClosureDate()
        );

        BigDecimal expensesTotal = expenseRepository
                .findByCashClosureIdOrderByCreatedAtAsc(closure.getId())
                .stream()
                .filter(expense -> expense.getStatus() == CashExpenseStatus.ACTIVE)
                .map(CashExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveredCash = safe(closure.getDeliveredCash());
        BigDecimal difference = deliveredCash
                .subtract(expectedCash.subtract(expensesTotal));

        closure.setExpectedCash(expectedCash);
        closure.setExpensesTotal(expensesTotal);
        closure.setDeliveredCash(deliveredCash);
        closure.setDifference(difference);
    }

    private BigDecimal calculateExpectedCash(Long branchId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        BigDecimal cash = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(p.received_amount), 0)
                FROM payments p
                JOIN payment_methods pm ON pm.id = p.payment_method_id
                WHERE p.branch_id = ?
                  AND p.status = 'ACTIVE'
                  AND pm.code = 'CASH'
                  AND p.created_at >= ?
                  AND p.created_at < ?
                """,
                BigDecimal.class,
                branchId,
                start,
                end
        );

        return safe(cash);
    }

    private CashClosureResponse toResponse(CashClosure closure) {
        List<CashClosureResponse.ExpenseLine> expenses = expenseRepository
                .findByCashClosureIdOrderByCreatedAtAsc(closure.getId())
                .stream()
                .map(this::toExpenseLine)
                .toList();

        return new CashClosureResponse(
                closure.getId(),
                closure.getBranch().getId(),
                closure.getBranch().getCode(),
                closure.getBranch().getName(),
                closure.getClosureDate(),
                closure.getExpectedCash(),
                closure.getExpensesTotal(),
                closure.getDeliveredCash(),
                closure.getDifference(),
                closure.getNotes(),
                closure.getStatus().name(),
                closure.getCreatedAt(),
                closure.getCreatedByUserId(),
                closure.getClosedAt(),
                closure.getClosedByUserId(),
                closure.getCancelledAt(),
                closure.getCancelledByUserId(),
                closure.getCancelReason(),
                expenses
        );
    }

    private CashClosureResponse.ExpenseLine toExpenseLine(CashExpense expense) {
        return new CashClosureResponse.ExpenseLine(
                expense.getId(),
                expense.getConcept(),
                expense.getAmount(),
                expense.getNotes(),
                expense.getStatus().name(),
                expense.getCreatedAt(),
                expense.getCreatedByUserId(),
                expense.getCancelledAt(),
                expense.getCancelledByUserId(),
                expense.getCancelReason()
        );
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
    
    private void validateNonNegativeAmount(BigDecimal amount) {
        if (amount == null || amount.signum() < 0) {
            throw new IllegalArgumentException("deliveredCash debe ser mayor o igual a 0");
        }
    }
}