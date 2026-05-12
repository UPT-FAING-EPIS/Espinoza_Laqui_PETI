package com.strategicti.application.service;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.application.usecase.AssignGroupMemberCommand;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePlanningGroupCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.GroupMemberSummary;
import com.strategicti.application.usecase.PlanningGroupSummary;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.UpdateGroupMemberRoleCommand;
import com.strategicti.application.usecase.UpdatePlanningGroupCommand;
import com.strategicti.domain.model.GroupMember;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.UserStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class PlanningGroupService {
    private final IPlanningGroupRepositoryPort groupRepository;
    private final IUserAccountRepositoryPort userRepository;

    public PlanningGroupService(
            IPlanningGroupRepositoryPort groupRepository,
            IUserAccountRepositoryPort userRepository
    ) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PlanningGroupSummary createGroup(CreatePlanningGroupCommand command) {
        String name = clean(command.name());
        assertNameAvailable(name);
        PlanningGroup group = PlanningGroup.create(name, clean(command.description()));
        return toSummary(groupRepository.save(group));
    }

    @Transactional(readOnly = true)
    public List<PlanningGroupSummary> listGroups() {
        return groupRepository.findAll().stream()
                .sorted(Comparator.comparing(PlanningGroup::id))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlanningGroupSummary> listGroupsForUser(Long userId) {
        return groupRepository.findByMemberUserId(userId).stream()
                .sorted(Comparator.comparing(PlanningGroup::id))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanningGroupSummary getGroup(Long id) {
        return toSummary(findGroup(id));
    }

    @Transactional(readOnly = true)
    public PlanningGroupSummary getGroupForViewer(Long id, AuthenticatedUser viewer) {
        PlanningGroup group = findGroup(id);
        if (viewer.role() == SystemRole.ADMINISTRADOR || group.hasMember(viewer.id())) {
            return toSummary(group);
        }
        throw new ForbiddenOperationException("No pertenece al grupo solicitado.");
    }

    @Transactional
    public PlanningGroupSummary updateGroup(Long id, UpdatePlanningGroupCommand command) {
        PlanningGroup current = findGroup(id);
        String name = clean(command.name());
        if (groupRepository.existsByNameAndIdNot(name, id)) {
            throw new IllegalStateException("Ya existe un grupo con ese nombre.");
        }

        return toSummary(groupRepository.save(current.update(name, clean(command.description()))));
    }

    @Transactional
    public PlanningGroupSummary assignMember(Long groupId, AssignGroupMemberCommand command) {
        PlanningGroup group = findGroup(groupId);
        UserAccount user = findAssignableUser(command.userId());
        GroupRole role = command.role() == null ? GroupRole.EDITOR : command.role();
        return toSummary(groupRepository.save(group.addMember(user, role)));
    }

    @Transactional
    public PlanningGroupSummary updateMemberRole(
            Long groupId,
            Long userId,
            UpdateGroupMemberRoleCommand command
    ) {
        PlanningGroup group = findGroup(groupId);
        return toSummary(groupRepository.save(group.updateMemberRole(userId, command.role())));
    }

    @Transactional
    public PlanningGroupSummary removeMember(Long groupId, Long userId) {
        PlanningGroup group = findGroup(groupId);
        return toSummary(groupRepository.save(group.removeMember(userId)));
    }

    private PlanningGroup findGroup(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el grupo solicitado."));
    }

    private UserAccount findAssignableUser(Long userId) {
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el usuario solicitado."));
        if (user.status() != UserStatus.ACTIVO) {
            throw new IllegalStateException("No se puede asignar un usuario deshabilitado.");
        }
        return user;
    }

    private void assertNameAvailable(String name) {
        if (groupRepository.existsByName(name)) {
            throw new IllegalStateException("Ya existe un grupo con ese nombre.");
        }
    }

    private PlanningGroupSummary toSummary(PlanningGroup group) {
        return new PlanningGroupSummary(
                group.id(),
                group.name(),
                group.description(),
                group.members().stream()
                        .sorted(Comparator.comparing(GroupMember::joinedAt))
                        .map(this::toMemberSummary)
                        .toList(),
                group.createdAt(),
                group.updatedAt()
        );
    }

    private GroupMemberSummary toMemberSummary(GroupMember member) {
        return new GroupMemberSummary(
                member.userId(),
                member.firstName(),
                member.lastName(),
                member.email(),
                member.role(),
                member.joinedAt()
        );
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
