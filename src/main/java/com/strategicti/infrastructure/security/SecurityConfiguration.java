package com.strategicti.infrastructure.security;

import com.strategicti.domain.model.SystemRole;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfiguration {
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "unauthorized", "Debe iniciar sesion."))
                        .accessDeniedHandler((request, response, exception) ->
                                writeError(response, HttpServletResponse.SC_FORBIDDEN, "forbidden", "No tiene permisos para esta operacion."))
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/bootstrap-admin").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/groups/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/groups/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/groups/*/plan").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/groups/*/plan").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/groups/*/plan/identity").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/groups/*/plan/identity").authenticated()
                        .requestMatchers("/api/groups/*/plan/diagnostics/**").authenticated()
                        .requestMatchers("/api/groups/*/plan/phases/**").authenticated()
                        .requestMatchers("/api/groups/**").hasRole(SystemRole.ADMINISTRADOR.name())
                        .requestMatchers("/api/users/**").hasRole(SystemRole.ADMINISTRADOR.name())
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/me/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }

    private void writeError(HttpServletResponse response, int status, String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("""
                {"code":"%s","message":"%s"}
                """.formatted(code, message).trim());
    }
}
