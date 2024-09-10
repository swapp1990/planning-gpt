import { EVENT_CATEGORIES } from "./constants";

export const generateEvent = (playerTerritory) => {
  const category =
    EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)];
  const difficulty = Math.floor(Math.random() * 5) + 1;

  const event = {
    category,
    description: `Opportunity for ${category}`,
    options: [
      {
        name: "Cautious Approach",
        territoryGain: Math.floor(Math.random() * 5) + 3,
        difficulty: Math.max(1, difficulty - 1),
      },
      {
        name: "Balanced Strategy",
        territoryGain: Math.floor(Math.random() * 5) + 5,
        difficulty: difficulty,
      },
      {
        name: "Aggressive Push",
        territoryGain: Math.floor(Math.random() * 5) + 7,
        difficulty: Math.min(5, difficulty + 1),
      },
    ],
    difficulty,
  };

  event.options.forEach((option) => {
    option.probability = calculateProbability(
      option.difficulty,
      playerTerritory
    );
  });

  return event;
};

export const applySkillEffects = (option, skills) => {
  let modifiedOption = { ...option };

  const negotiationBonus = skills.negotiation * 0.05;
  const resourceBonus = Math.floor(skills.resourceManagement * 0.5);

  modifiedOption.probability += negotiationBonus;
  modifiedOption.territoryGain += resourceBonus;

  return {
    ...modifiedOption,
    negotiationBonus,
    resourceBonus,
  };
};

export const calculateProbability = (difficulty, playerTerritory) => {
  const baseProbability = Math.max(0, 0.8 - (difficulty - 1) * 0.1);
  const territoryBonus = Math.min(0.2, Math.floor(playerTerritory / 10) * 0.05);
  return Math.min(1, baseProbability + territoryBonus);
};
