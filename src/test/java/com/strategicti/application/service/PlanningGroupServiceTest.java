package com.strategicti.application.service;

import com.strategicti.application.usecase.AssignGroupMemberCommand;
import com.strategicti.application.usecase.CreatePlanningGroupCommand;
import com.strategicti.application.usecase.PlanningGroupSummary;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.support.InMemoryPlanningGroupRepository;
import com.strategicti.support.InMemoryUserAccountRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlanningGroupServiceTest {
    private final InMemoryPlanningGroupRepository groupRepository = new InMemoryPlanningGroupRepository();
    private final InMemoryUserAccountRepository userRepository = new InMemoryUserAccountRepository();
    private final PlanningGroupService service = new PlanningGroupService(groupRepository, userRepository);

    @Test
    void createGroupTrimsNameAndDescription() {
        PlanningGroupSummary group = service.createGroup(new CreatePlanningGroupCommand(
                "  Grupo PETI  ",
                "  Equipo principal  "
        ));

        assertEquals("Grupo PETI", group.name());
        assertEquals("Equipo principal", group.description());
    }

    @Test
    void assigningNewLeaderDemotesPreviousLeader() {
        UserAccount first = saveUser("Ana", "admin@test.com");
        UserAccount second = saveUser("Luis", "luis@test.com");
        PlanningGroupSummary group = service.createGroup(new CreatePlanningGroupCommand("Grupo PETI", "Equipo"));

        service.assignMember(group.id(), new AssignGroupMemberCommand(first.id(), GroupRole.LIDER));
        PlanningGroupSummary updated = service.assignMember(group.id(), new AssignGroupMemberCommand(second.id(), GroupRole.LIDER));

        assertEquals(GroupRole.EDITOR, roleOf(updated, first.id()));
        assertEquals(GroupRole.LIDER, roleOf(updated, second.id()));
    }

    @Test
    void assigningDisabledUserFails() {
        UserAccount user = userRepository.save(saveUser("Ana", "ana@test.com").disable());
        PlanningGroupSummary group = service.createGroup(new CreatePlanningGroupCommand("Grupo PETI", "Equipo"));

        assertThrows(IllegalStateException.class, () ->
                service.assignMember(group.id(), new AssignGroupMemberCommand(user.id(), GroupRole.EDITOR))
        );
    }

    @Test
    void listGroupsForUserOnlyReturnsAssignedGroups() {
        UserAccount user = saveUser("Ana", "ana@test.com");
        UserAccount other = saveUser("Luis", "luis@test.com");
        PlanningGroupSummary first = service.createGroup(new CreatePlanningGroupCommand("Grupo A", "A"));
        PlanningGroupSummary second = service.createGroup(new CreatePlanningGroupCommand("Grupo B", "B"));

        service.assignMember(first.id(), new AssignGroupMemberCommand(user.id(), GroupRole.EDITOR));
        service.assignMember(second.id(), new AssignGroupMemberCommand(other.id(), GroupRole.EDITOR));

        List<PlanningGroupSummary> groups = service.listGroupsForUser(user.id());

        assertEquals(1, groups.size());
        assertEquals("Grupo A", groups.getFirst().name());
    }

    private UserAccount saveUser(String firstName, String email) {
        return userRepository.save(UserAccount.create(
                firstName,
                "Usuario",
                email,
                "hash",
                SystemRole.USUARIO
        ));
    }

    private GroupRole roleOf(PlanningGroupSummary group, Long userId) {
        return group.members().stream()
                .filter(member -> member.userId().equals(userId))
                .findFirst()
                .orElseThrow()
                .role();
    }
}
