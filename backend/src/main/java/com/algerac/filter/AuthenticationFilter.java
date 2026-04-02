package com.algerac.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * Filtre d'authentification basé sur les sessions HTTP.
 * Vérifie que l'utilisateur est authentifié pour les endpoints protégés.
 * Les routes publiques (auth, plaintes publiques) sont exclues.
 */
@Component
@Order(1)
@Slf4j
public class AuthenticationFilter implements Filter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/verify-otp",
            "/api/auth/reset-password",
            "/api/auth/signup/expert",
            "/api/auth/signup/oec",
            "/api/complaints/public"
    );

    private static final Set<String> PUBLIC_PREFIXES = Set.of(
            "/api/auth/"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // Skip non-API requests
        if (!path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        // Allow OPTIONS for CORS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        // Allow public paths
        if (isPublicPath(path)) {
            chain.doFilter(request, response);
            return;
        }

        // Check session authentication
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendUnauthorized(httpResponse, "Authentification requise");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        if (PUBLIC_PATHS.contains(path)) return true;
        for (String prefix : PUBLIC_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        return false;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        Map<String, Object> body = Map.of(
                "success", false,
                "error", message,
                "timestamp", LocalDateTime.now().toString()
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
