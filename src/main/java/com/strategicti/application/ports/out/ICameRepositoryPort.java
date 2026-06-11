package com.strategicti.application.ports.out;

import com.strategicti.domain.model.CameAction;
import com.strategicti.domain.model.CameQuadrant;

import java.util.List;

public interface ICameRepositoryPort {
    List<CameAction> findByPlanId(Long planId);
    List<CameAction> findByPlanIdAndQuadrant(Long planId, CameQuadrant quadrant);
    List<CameAction> replaceByPlanIdAndQuadrant(Long planId, CameQuadrant quadrant, List<CameAction> actions);
}
