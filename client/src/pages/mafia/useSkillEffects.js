import React, { useMemo } from "react";

export const useSkillEffects = (skills) => {
  const skillEffects = useMemo(
    () => ({
      negotiationBonus: skills.negotiation * 0.05,
      resourceManagementBonus: Math.floor(skills.resourceManagement * 0.5),
    }),
    [skills.negotiation, skills.resourceManagement]
  );

  return skillEffects;
};
