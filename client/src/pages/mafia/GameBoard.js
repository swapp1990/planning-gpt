import React from "react";
import EventPanel from "./EventPanel";
import { TURNS_PER_PHASE, EVENTS_PER_TURN, PHASE_GOAL } from "./constants";

const TerritoryInfo = ({ territory, gamePhase, phaseGoal }) => {
  const progressPercentage = Math.min(100, (territory / phaseGoal) * 100);

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Phase: {gamePhase}</span>
        <span className="font-bold">Goal: {phaseGoal}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-green-600 h-2.5 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm">
        <span>Territory: {territory}%</span>
        {territory > phaseGoal && (
          <span className="text-green-600">Goal Exceeded!</span>
        )}
      </div>
    </div>
  );
};

const TurnIndicators = ({ currentTurn, turnsPerPhase }) => {
  return (
    <div className="flex justify-between mb-4">
      {[...Array(turnsPerPhase)].map((_, index) => (
        <div
          key={index}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            index + 1 < currentTurn
              ? "bg-green-500"
              : index + 1 === currentTurn
              ? "bg-blue-500"
              : "bg-gray-300"
          } text-white font-bold`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
};

const GameBoard = ({ gameState, handleChoice, closeResolution }) => {
  const {
    territory,
    currentTurn,
    eventsResolved,
    gamePhase,
    currentEvent,
    resolutionScreen,
  } = gameState;

  const renderProgressBar = () => {
    const totalEvents = TURNS_PER_PHASE * EVENTS_PER_TURN;
    const progress = (eventsResolved / totalEvents) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="ml-4 flex-grow">
      <h2 className="text-xl font-bold mb-4">Territory Expansion Game</h2>

      <TerritoryInfo
        territory={territory}
        gamePhase={gamePhase}
        phaseGoal={PHASE_GOAL}
      />

      <TurnIndicators
        currentTurn={currentTurn}
        turnsPerPhase={TURNS_PER_PHASE}
      />

      <div className="mb-4">
        <div className="font-bold">Turn Progress</div>
        {renderProgressBar()}
        <div className="flex justify-between text-sm">
          <span>
            Turn {currentTurn}/{TURNS_PER_PHASE}
          </span>
          <span>
            Event {(eventsResolved % EVENTS_PER_TURN) + 1}/{EVENTS_PER_TURN}
          </span>
        </div>
      </div>

      <EventPanel
        currentEvent={currentEvent}
        resolutionScreen={resolutionScreen}
        handleChoice={handleChoice}
        closeResolution={closeResolution}
        skills={gameState.skills}
      />
    </div>
  );
};

export default GameBoard;
