package com.strategicti.domain.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public record PlanningGroup(
        Long id,
        String name,
        String description,
        List<GroupMember> members,
        Instant createdAt,
        Instant updatedAt
) {
    public static PlanningGroup create(String name, String description) {
        Instant now = Instant.now();
        return new PlanningGroup(null, name, description, List.of(), now, now);
    }

    public PlanningGroup update(String name, String description) {
        return new PlanningGroup(id, name, description, members, createdAt, Instant.now());
    }

    public PlanningGroup addMember(UserAccount user, GroupRole role) {
        if (containsUser(user.id())) {
            throw new IllegalStateException("El usuario ya pertenece al grupo.");
        }

        List<GroupMember> nextMembers = new ArrayList<>(members);
        if (role == GroupRole.LIDER) {
            nextMembers = new ArrayList<>(demoteCurrentLeaders(nextMembers));
        }
        nextMembers.add(GroupMember.from(user, role));
        return withMembers(nextMembers);
    }

    public PlanningGroup updateMemberRole(Long userId, GroupRole role) {
        if (!containsUser(userId)) {
            throw new IllegalArgumentException("El usuario no pertenece al grupo.");
        }
        if (role == GroupRole.EDITOR && isOnlyLeader(userId)) {
            throw new IllegalStateException("Debe asignar otro lider antes de cambiar este miembro a editor.");
        }

        List<GroupMember> nextMembers = role == GroupRole.LIDER
                ? demoteCurrentLeaders(new ArrayList<>(members))
                : new ArrayList<>(members);

        nextMembers = nextMembers.stream()
                .map(member -> member.userId().equals(userId) ? member.changeRole(role) : member)
                .toList();
        return withMembers(nextMembers);
    }

    public PlanningGroup removeMember(Long userId) {
        if (!containsUser(userId)) {
            throw new IllegalArgumentException("El usuario no pertenece al grupo.");
        }
        if (isOnlyLeader(userId)) {
            throw new IllegalStateException("Debe asignar otro lider antes de retirar este miembro.");
        }

        List<GroupMember> nextMembers = members.stream()
                .filter(member -> !member.userId().equals(userId))
                .toList();
        return withMembers(nextMembers);
    }

    public boolean hasMember(Long userId) {
        return containsUser(userId);
    }

    public boolean isLeader(Long userId) {
        return members.stream()
                .anyMatch(member -> member.userId().equals(userId) && member.role() == GroupRole.LIDER);
    }

    private PlanningGroup withMembers(List<GroupMember> nextMembers) {
        return new PlanningGroup(id, name, description, List.copyOf(nextMembers), createdAt, Instant.now());
    }

    private boolean containsUser(Long userId) {
        return members.stream().anyMatch(member -> member.userId().equals(userId));
    }

    private boolean isOnlyLeader(Long userId) {
        long leaderCount = members.stream()
                .filter(member -> member.role() == GroupRole.LIDER)
                .count();
        return leaderCount == 1 && members.stream()
                .anyMatch(member -> member.userId().equals(userId) && member.role() == GroupRole.LIDER);
    }

    private List<GroupMember> demoteCurrentLeaders(List<GroupMember> currentMembers) {
        return currentMembers.stream()
                .map(member -> member.role() == GroupRole.LIDER ? member.changeRole(GroupRole.EDITOR) : member)
                .toList();
    }
}
