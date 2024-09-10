import { EVENT_CATEGORIES } from "./constants";

export const generateEvent = async (playerStatus, gamePhase = "Early") => {
  const apiUrl = "http://localhost:5000/mafia/event";

  const requestBody = {
    context: {
      trigger_action: "Territory Expansion",
      game_phase: gamePhase,
      player_status: {
        territory: playerStatus.territory,
        money: playerStatus.money,
        influence: playerStatus.influence,
        heat: playerStatus.heat,
        manpower: playerStatus.manpower,
      },
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return null;
  }
};

export const applySkillEffects = (choice, skills) => {
  let modifiedChoice = JSON.parse(JSON.stringify(choice));

  const negotiationBonus = skills.negotiation * 0.05;
  const resourceBonus = Math.floor(skills.resourceManagement * 0.5);

  const currentProbability = 0.5;
  modifiedChoice.successProbability = Math.min(
    1,
    currentProbability + negotiationBonus
  );
  modifiedChoice.outcomes.success.consequences.territory += resourceBonus;
  modifiedChoice.skillBonus = {
    negotiation: negotiationBonus,
    resourceManagement: resourceBonus,
  };
  return modifiedChoice;

  // return {
  //   ...modifiedChoice,
  //   skillBonus: {
  //     negotiation: negotiationBonus,
  //     resourceManagement: resourceBonus,
  //   },
  // };
};

export const calculateProbability = (difficulty, playerTerritory) => {
  const baseProbability = Math.max(0, 0.8 - (difficulty - 1) * 0.1);
  const territoryBonus = Math.min(0.2, Math.floor(playerTerritory / 10) * 0.05);
  return Math.min(1, baseProbability + territoryBonus);
};
