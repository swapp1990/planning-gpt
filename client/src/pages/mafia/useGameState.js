import { useState, useEffect } from "react";
import { generateEvent, applySkillEffects } from "./utils";
import {
  INITIAL_SKILLS,
  TURNS_PER_PHASE,
  EVENTS_PER_TURN,
  PHASE_GOAL,
} from "./constants";

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    territory: 0,
    currentTurn: 1,
    currentEvent: null,
    eventsResolved: 0,
    gamePhase: "Early",
    resolutionScreen: null,
    phaseComplete: false,
    skills: INITIAL_SKILLS,
    skillPoints: 0,
    playerStatus: {
      territory: 0,
      money: 1000,
      influence: 5,
      heat: 0,
      manpower: 2,
    },
  });

  useEffect(async () => {
    if (
      !gameState.currentEvent &&
      !gameState.resolutionScreen &&
      !gameState.phaseComplete
    ) {
      if (gameState.eventsResolved < EVENTS_PER_TURN * TURNS_PER_PHASE) {
        const newEvent = await generateEvent(gameState.playerStatus);
        if (newEvent != null) {
          setGameState((prevState) => ({
            ...prevState,
            currentEvent: newEvent,
          }));
        }
        // console.log(newEvent);
      } else {
        setGameState((prevState) => ({ ...prevState, phaseComplete: true }));
      }
    }
  }, [gameState]);

  const checkPhaseCompletion = (newTerritory) => {
    return newTerritory >= PHASE_GOAL;
  };

  const handleChoice = (choice) => {
    const modifiedChoice = applySkillEffects(choice, gameState.skills);
    // const modifiedChoice = choice;
    console.log(modifiedChoice);
    const success = Math.random() < modifiedChoice.successProbability;
    const outcome = success
      ? modifiedChoice.outcomes.success
      : modifiedChoice.outcomes.failure;

    const newTerritory = Math.min(
      100,
      gameState.territory + outcome.consequences.territory
    );
    const phaseComplete = checkPhaseCompletion(newTerritory);

    setGameState((prevState) => {
      const newState = {
        ...prevState,
        territory: newTerritory,
        // money: prevState.money + outcome.consequences.money,
        // influence: prevState.influence + outcome.consequences.influence,
        // heat: prevState.heat + outcome.consequences.heat,
        // manpower: prevState.manpower + outcome.consequences.manpower,
        skillPoints: prevState.skillPoints + 1,
        resolutionScreen: {
          success,
          chosenOption: modifiedChoice,
          description: outcome.description,
          consequences: outcome.consequences,
        },
        phaseComplete: phaseComplete,
      };

      // Update character relationships
      // outcome.consequences.characterRelationships.forEach((relationship) => {
      //   if (newState.relationships[relationship.character]) {
      //     newState.relationships[relationship.character] += relationship.change;
      //   } else {
      //     newState.relationships[relationship.character] = relationship.change;
      //   }
      // });

      return newState;
    });
  };

  const closeResolution = () => {
    setGameState((prevState) => {
      const newEventsResolved = prevState.eventsResolved + 1;
      const newTurn =
        newEventsResolved % EVENTS_PER_TURN === 0
          ? prevState.currentTurn + 1
          : prevState.currentTurn;
      const phaseComplete =
        newEventsResolved >= EVENTS_PER_TURN * TURNS_PER_PHASE;

      return {
        ...prevState,
        eventsResolved: newEventsResolved,
        currentTurn: newTurn,
        currentEvent: null,
        resolutionScreen: null,
        phaseComplete,
      };
    });
  };

  const handlePhaseEnd = () => {
    setGameState((prevState) => ({
      ...prevState,
      gamePhase:
        prevState.territory >= PHASE_GOAL
          ? prevState.gamePhase === "Early"
            ? "Mid"
            : "Late"
          : prevState.gamePhase,
      territory: 0,
      currentTurn: 1,
      currentEvent: null,
      eventsResolved: 0,
      resolutionScreen: null,
      phaseComplete: false,
    }));
  };

  const upgradeSkill = (skillName) => {
    if (gameState.skillPoints > 0) {
      setGameState((prevState) => ({
        ...prevState,
        skills: {
          ...prevState.skills,
          [skillName]: prevState.skills[skillName] + 1,
        },
        skillPoints: prevState.skillPoints - 1,
      }));
    }
  };

  return {
    gameState,
    handleChoice,
    closeResolution,
    handlePhaseEnd,
    upgradeSkill,
  };
};
