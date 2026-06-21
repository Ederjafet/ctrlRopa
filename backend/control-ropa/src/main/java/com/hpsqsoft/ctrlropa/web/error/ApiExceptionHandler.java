package com.hpsqsoft.ctrlropa.web.error;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        String path = request.getRequestURI();
        String requiredPermission = extractRequiredPermission(ex.getMessage());
        String message = requiredPermission != null
                ? "No tienes permiso para realizar esta accion."
                : path.equals("/api/auth/login")
                ? "Credenciales invalidas o usuario bloqueado temporalmente."
                : "No tienes permisos para acceder a este recurso.";

        Map<String, Object> body = baseBody(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                message,
                path
        );
        if (requiredPermission != null) {
            body.put("requiredPermission", requiredPermission);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<Map<String, String>> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();

        Map<String, Object> body = baseBody(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "La solicitud contiene datos inválidos.",
                request.getRequestURI()
        );
        body.put("fieldErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        List<Map<String, String>> violations = ex.getConstraintViolations()
                .stream()
                .map(this::toViolation)
                .toList();

        Map<String, Object> body = baseBody(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "La solicitud contiene datos inválidos.",
                request.getRequestURI()
        );
        body.put("violations", violations);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "El cuerpo de la solicitud es inválido o tiene un formato incorrecto.",
                request.getRequestURI()
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            BadRequestException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                defaultMessage(ex.getMessage(), "La solicitud es inválida."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            NotFoundException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                defaultMessage(ex.getMessage(), "El recurso solicitado no fue encontrado."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(
            ConflictException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "CONFLICT",
                defaultMessage(ex.getMessage(), "La operación entra en conflicto con el estado actual."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(
            EntityNotFoundException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                defaultMessage(ex.getMessage(), "El recurso solicitado no fue encontrado."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "CONFLICT",
                defaultMessage(ex.getMessage(), "La operación no se puede completar en el estado actual."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = resolveIllegalArgumentStatus(ex.getMessage());
        String error = switch (status) {
            case NOT_FOUND -> "NOT_FOUND";
            case CONFLICT -> "CONFLICT";
            case UNAUTHORIZED -> "UNAUTHORIZED";
            default -> "BAD_REQUEST";
        };

        return buildResponse(
                status,
                error,
                defaultMessage(ex.getMessage(), "La solicitud es inválida."),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        String rawMessage = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        HttpStatus status = HttpStatus.BAD_REQUEST;
        String error = "BAD_REQUEST";
        String message = "La operación viola una restricción de datos.";

        if (rawMessage != null) {
            String normalized = rawMessage.toLowerCase(Locale.ROOT);

            if (normalized.contains("duplicate entry")
                    || normalized.contains("duplicado")
                    || normalized.contains("unique")
                    || normalized.contains("uk_")) {
                status = HttpStatus.CONFLICT;
                error = "CONFLICT";
                message = "Ya existe un registro con esos datos únicos.";
            } else if (normalized.contains("cannot be null")
                    || normalized.contains("doesn't have a default value")
                    || normalized.contains("not-null")) {
                status = HttpStatus.BAD_REQUEST;
                error = "BAD_REQUEST";
                message = "Faltan campos obligatorios para completar la operación.";
            }
        }

        return buildResponse(status, error, message, request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error(
                "Error interno no controlado. method={}, path={}",
                request.getMethod(),
                request.getRequestURI(),
                ex
        );

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "Ocurrió un error interno inesperado.",
                request.getRequestURI()
        );
    }

    private HttpStatus resolveIllegalArgumentStatus(String message) {
        if (message == null || message.isBlank()) {
            return HttpStatus.BAD_REQUEST;
        }

        String normalized = message.toLowerCase(Locale.ROOT);

        if (normalized.contains("token de sesión")) {
            return HttpStatus.UNAUTHORIZED;
        }

        if (normalized.contains("no encontrado")
                || normalized.contains("no encontrada")
                || normalized.contains("not found")
                || normalized.contains("inexistente")) {
            return HttpStatus.NOT_FOUND;
        }

        if (normalized.contains("ya existe")
                || normalized.contains("duplicado")
                || normalized.contains("duplicada")
                || normalized.contains("conflicto")
                || normalized.contains("ya fue revertido")
                || normalized.contains("ya fue cancelado")
                || normalized.contains("ya fue anulado")) {
            return HttpStatus.CONFLICT;
        }

        return HttpStatus.BAD_REQUEST;
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status,
            String error,
            String message,
            String path
    ) {
        return ResponseEntity.status(status).body(baseBody(status, error, message, path));
    }

    private Map<String, Object> baseBody(
            HttpStatus status,
            String error,
            String message,
            String path
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        return body;
    }

    private Map<String, String> toFieldError(FieldError error) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("field", error.getField());
        item.put("message", error.getDefaultMessage() != null
                ? error.getDefaultMessage()
                : "Valor inválido");
        return item;
    }

    private Map<String, String> toViolation(ConstraintViolation<?> violation) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("field", violation.getPropertyPath() != null
                ? violation.getPropertyPath().toString()
                : "unknown");
        item.put("message", violation.getMessage());
        return item;
    }

    private String defaultMessage(String actual, String fallback) {
        return (actual != null && !actual.isBlank()) ? actual : fallback;
    }

    private String extractRequiredPermission(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }

        String marker = "Permiso requerido:";
        int markerIndex = message.indexOf(marker);
        if (markerIndex < 0) {
            return null;
        }

        String permission = message.substring(markerIndex + marker.length()).trim();
        return permission.isBlank() ? null : permission;
    }
}
