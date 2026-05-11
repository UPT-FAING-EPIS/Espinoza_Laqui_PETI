package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.GroupMember;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.infrastructure.persistence.entity.GroupMemberJpaEntity;
import com.strategicti.infrastructure.persistence.entity.PlanningGroupJpaEntity;
import com.strategicti.infrastructure.persistence.entity.UserAccountJpaEntity;
import com.strategicti.infrastructure.persistence.repository.SpringDataUserAccountRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class PlanningGroupPersistenceFactory {
    private final SpringDataUserAccountRepository userRepository;

    public PlanningGroupPersistenceFactory(SpringDataUserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PlanningGroupJpaEntity toEntity(PlanningGroup group, PlanningGroupJpaEntity entity) {
        entity.setName(group.name());
        entity.setDescription(group.description());
        entity.setCreatedAt(group.createdAt());
        entity.setUpdatedAt(group.updatedAt());
        Set<Long> nextUserIds = group.members().stream()
                .map(GroupMember::userId)
                .collect(Collectors.toSet());
        entity.getMembers().removeIf(member -> !nextUserIds.contains(member.getUser().getId()));

        for (GroupMember member : group.members()) {
            GroupMemberJpaEntity memberEntity = findMemberEntity(entity, member.userId());
            memberEntity.setRole(member.role());
            memberEntity.setJoinedAt(member.joinedAt());
        }

        return entity;
    }

    public PlanningGroup toDomain(PlanningGroupJpaEntity entity) {
        return new PlanningGroup(
                entity.getId(),
                emptyIfNull(entity.getName()),
                emptyIfNull(entity.getDescription()),
                members(entity),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private List<GroupMember> members(PlanningGroupJpaEntity entity) {
        return entity.getMembers().stream()
                .map(member -> new GroupMember(
                        member.getUser().getId(),
                        emptyIfNull(member.getUser().getFirstName()),
                        emptyIfNull(member.getUser().getLastName()),
                        emptyIfNull(member.getUser().getEmail()),
                        member.getRole() == null ? GroupRole.EDITOR : member.getRole(),
                        member.getJoinedAt()
                ))
                .toList();
    }

    private GroupMemberJpaEntity findMemberEntity(PlanningGroupJpaEntity groupEntity, Long userId) {
        return groupEntity.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(userId))
                .findFirst()
                .orElseGet(() -> createMemberEntity(groupEntity, userId));
    }

    private GroupMemberJpaEntity createMemberEntity(PlanningGroupJpaEntity groupEntity, Long userId) {
        UserAccountJpaEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("No se encontro el usuario del miembro."));
        GroupMemberJpaEntity memberEntity = new GroupMemberJpaEntity();
        memberEntity.setGroup(groupEntity);
        memberEntity.setUser(user);
        groupEntity.getMembers().add(memberEntity);
        return memberEntity;
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
