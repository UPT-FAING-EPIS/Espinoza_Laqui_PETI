package com.strategicti.infrastructure.security;

import com.strategicti.application.ports.out.IAuthTokenPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class JwtTokenService implements IAuthTokenPort {
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private final String secret;
    private final long expirationSeconds;
    private final Clock clock;

    @Autowired
    public JwtTokenService(
            @Value("${security.jwt.secret:strategicti-dev-secret-change-this-value-before-production-2026}") String secret,
            @Value("${security.jwt.expiration-minutes:120}") long expirationMinutes
    ) {
        this(secret, expirationMinutes, Clock.systemUTC());
    }

    public JwtTokenService(String secret, long expirationMinutes, Clock clock) {
        this.secret = secret;
        this.expirationSeconds = expirationMinutes * 60;
        this.clock = clock;
    }

    @Override
    public String issue(UserAccount user) {
        Instant now = Instant.now(clock);
        String header = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = encode("""
                {"sub":"%s","uid":%d,"role":"%s","iat":%d,"exp":%d}
                """.formatted(
                escape(user.email()),
                user.id(),
                user.role().name(),
                now.getEpochSecond(),
                now.plusSeconds(expirationSeconds).getEpochSecond()
        ).trim());
        String unsigned = header + "." + payload;
        return unsigned + "." + sign(unsigned);
    }

    @Override
    public Optional<AuthenticatedUser> validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String unsigned = parts[0] + "." + parts[1];
            if (!constantTimeEquals(sign(unsigned), parts[2])) {
                return Optional.empty();
            }

            Map<String, String> claims = parseClaims(decode(parts[1]));
            long expiration = Long.parseLong(claims.getOrDefault("exp", "0"));
            if (Instant.now(clock).getEpochSecond() >= expiration) {
                return Optional.empty();
            }

            return Optional.of(new AuthenticatedUser(
                    Long.parseLong(claims.get("uid")),
                    claims.get("sub"),
                    SystemRole.valueOf(claims.get("role"))
            ));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    @Override
    public long expiresInSeconds() {
        return expirationSeconds;
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo firmar el token.", exception);
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Map<String, String> parseClaims(String payload) {
        Map<String, String> claims = new LinkedHashMap<>();
        String body = payload.trim();
        if (body.startsWith("{")) {
            body = body.substring(1);
        }
        if (body.endsWith("}")) {
            body = body.substring(0, body.length() - 1);
        }
        if (body.isBlank()) {
            return claims;
        }

        for (String pair : body.split(",")) {
            String[] parts = pair.split(":", 2);
            if (parts.length == 2) {
                claims.put(unquote(parts[0].trim()), unquote(parts[1].trim()));
            }
        }
        return claims;
    }

    private String unquote(String value) {
        String text = value;
        if (text.startsWith("\"") && text.endsWith("\"") && text.length() >= 2) {
            text = text.substring(1, text.length() - 1);
        }
        return text.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
