package com.strategicti.infrastructure.security;

import com.strategicti.application.ports.out.IAuthTokenPort;
import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.domain.model.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final IAuthTokenPort tokenPort;
    private final IUserAccountRepositoryPort userRepository;

    public JwtAuthenticationFilter(IAuthTokenPort tokenPort, IUserAccountRepositoryPort userRepository) {
        this.tokenPort = tokenPort;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        tokenPort.validate(header.substring(7))
                .filter(this::isActiveUser)
                .ifPresent(this::authenticate);

        filterChain.doFilter(request, response);
    }

    private boolean isActiveUser(AuthenticatedUser principal) {
        return userRepository.findById(principal.id())
                .filter(user -> user.status() == UserStatus.ACTIVO)
                .isPresent();
    }

    private void authenticate(AuthenticatedUser principal) {
        var authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + principal.role().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
