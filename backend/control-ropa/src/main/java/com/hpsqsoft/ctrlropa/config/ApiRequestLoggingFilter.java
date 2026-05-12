package com.hpsqsoft.ctrlropa.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiRequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        long startedAt = System.currentTimeMillis();
        String method = request.getMethod();
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String requestTarget = query == null ? path : path + "?" + query;

        try {
            filterChain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException ex) {
            long durationMs = System.currentTimeMillis() - startedAt;
            log.error("API {} {} -> ERROR after {}ms: {}", method, requestTarget, durationMs, ex.getMessage(), ex);
            throw ex;
        } finally {
            long durationMs = System.currentTimeMillis() - startedAt;
            log.info("API {} {} -> {} {}ms", method, requestTarget, response.getStatus(), durationMs);
        }
    }
}
