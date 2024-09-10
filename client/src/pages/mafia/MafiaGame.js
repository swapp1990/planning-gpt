import React from "react";
import { useGameState } from "./useGameState";
import { useSkillEffects } from "./useSkillEffects";
import SidePanel from "./SidePanel";
import GameBoard from "./GameBoard";
import PhaseComplete from "./PhaseComplete";
import { PHASE_GOAL } from "./constants";

const MafiaGame = () => {
  const {
    gameState,
    handleChoice,
    closeResolution,
    handlePhaseEnd,
    upgradeSkill,
  } = useGameState();

  const skillEffects = useSkillEffects(gameState.skills);

  const renderGameContent = () => {
    if (gameState.phaseComplete) {
      return (
        <PhaseComplete
          gameState={gameState}
          handlePhaseEnd={handlePhaseEnd}
          PHASE_GOAL={PHASE_GOAL}
        />
      );
    }

    return (
      <>
        <SidePanel
          territory={gameState.territory}
          skillPoints={gameState.skillPoints}
          skills={gameState.skills}
          upgradeSkill={upgradeSkill}
          skillEffects={skillEffects}
        />
        <GameBoard
          gameState={gameState}
          handleChoice={handleChoice}
          closeResolution={closeResolution}
        />
      </>
    );
  };

  return <div className="p-4 flex">{renderGameContent()}</div>;
};

export default MafiaGame;
