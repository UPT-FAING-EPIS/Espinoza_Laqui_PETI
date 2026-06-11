package com.strategicti.support;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.domain.model.PlanningGroup;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class InMemoryPlanningGroupRepository implements IPlanningGroupRepositoryPort {
    private final Map<Long, PlanningGroup> groups = new LinkedHashMap<>();
    private long sequence;

    @Override
    public Optional<PlanningGroup> findById(Long id) {
        return Optional.ofNullable(groups.get(id));
    }

    @Override
    public List<PlanningGroup> findAll() {
        return new ArrayList<>(groups.values());
    }

    @Override
    public List<PlanningGroup> findByMemberUserId(Long userId) {
        return groups.values().stream()
                .filter(group -> group.members().stream().anyMatch(member -> member.userId().equals(userId)))
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return groups.values().stream().anyMatch(group -> group.name().equals(name));
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long id) {
        return groups.values().stream()
                .anyMatch(group -> group.name().equals(name) && !group.id().equals(id));
    }

    @Override
    public PlanningGroup save(PlanningGroup group) {
        Long id = group.id() == null ? ++sequence : group.id();
        PlanningGroup persisted = new PlanningGroup(
                id,
                group.name(),
                group.description(),
                group.members(),
                group.createdAt(),
                group.updatedAt()
        );
        groups.put(id, persisted);
        return persisted;
    }
}
