package com.strategicti.application.ports.out;

import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.domain.model.UserAccount;

import java.util.Optional;

public interface IAuthTokenPort {
    String issue(UserAccount user);

    Optional<AuthenticatedUser> validate(String token);

    long expiresInSeconds();
}
