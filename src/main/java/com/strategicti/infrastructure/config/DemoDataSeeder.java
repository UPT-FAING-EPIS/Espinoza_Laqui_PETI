package com.strategicti.infrastructure.config;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.demo.seed.enabled", havingValue = "true")
public class DemoDataSeeder {
    public static final String ADMIN_EMAIL = "admin@strategicti.test";
    public static final String ADMIN_PASSWORD = "Admin12345";
    public static final String USER_EMAIL = "usuario@strategicti.test";
    public static final String USER_PASSWORD = "Usuario12345";
    private static final String DEMO_GROUP_NAME = "Grupo PETI Demo";

    private final IUserAccountRepositoryPort userRepository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            IUserAccountRepositoryPort userRepository,
            IPlanningGroupRepositoryPort groupRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        UserAccount admin = findOrCreateUser(
                "Admin",
                "PETI",
                ADMIN_EMAIL,
                ADMIN_PASSWORD,
                SystemRole.ADMINISTRADOR
        );
        UserAccount user = findOrCreateUser(
                "Usuario",
                "Demo",
                USER_EMAIL,
                USER_PASSWORD,
                SystemRole.USUARIO
        );

        PlanningGroup group = findOrCreateGroup();
        group = addMemberIfMissing(group, admin, GroupRole.LIDER);
        addMemberIfMissing(group, user, GroupRole.EDITOR);
    }

    private UserAccount findOrCreateUser(
            String firstName,
            String lastName,
            String email,
            String password,
            SystemRole role
    ) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(UserAccount.create(
                        firstName,
                        lastName,
                        email,
                        passwordEncoder.encode(password),
                        role
                )));
    }

    private PlanningGroup findOrCreateGroup() {
        return groupRepository.findAll().stream()
                .filter(group -> group.name().equals(DEMO_GROUP_NAME))
                .findFirst()
                .orElseGet(() -> groupRepository.save(PlanningGroup.create(
                        DEMO_GROUP_NAME,
                        "Grupo de prueba para validar la asignacion y la vista Mis grupos."
                )));
    }

    private PlanningGroup addMemberIfMissing(PlanningGroup group, UserAccount user, GroupRole role) {
        boolean alreadyAssigned = group.members().stream()
                .anyMatch(member -> member.userId().equals(user.id()));
        if (alreadyAssigned) {
            return group;
        }
        return groupRepository.save(group.addMember(user, role));
    }
}
