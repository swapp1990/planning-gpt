// File: src/components/MafiaGame/components/PhaseComplete.js

import React from "react";
import { TURNS_PER_PHASE, EVENTS_PER_TURN } from "./constants";

const PhaseComplete = ({ gameState, handlePhaseEnd, PHASE_GOAL }) => {
  const { territory, gamePhase, eventsResolved } = gameState;
  const isGoalAchieved = territory >= PHASE_GOAL;
  const earlyCompletion = eventsResolved < EVENTS_PER_TURN * TURNS_PER_PHASE;
  const progressPercentage = Math.min(100, (territory / PHASE_GOAL) * 100);

  const renderTerritoryInfo = () => (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Final Territory</span>
        <span className="font-bold">Goal: {PHASE_GOAL}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full ${
            isGoalAchieved ? "bg-green-600" : "bg-red-600"
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>Achieved: {territory}%</span>
        {territory > PHASE_GOAL && (
          <span className="text-green-600 font-bold">Goal Exceeded!</span>
        )}
      </div>
    </div>
  );

  const renderPhaseSummary = () => (
    <div className="mb-4 p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-2">Phase Summary</h3>
      <p>Turns Completed: {TURNS_PER_PHASE}</p>
      <p>Events Resolved: {EVENTS_PER_TURN * TURNS_PER_PHASE}</p>
      <p>Territory Gained: {territory}%</p>
      <p>Goal Achieved: {isGoalAchieved ? "Yes" : "No"}</p>
    </div>
  );

  const renderAchievementMessage = () => (
    <div
      className={`p-4 rounded-lg mb-4 ${
        isGoalAchieved
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {isGoalAchieved ? (
        <p className="font-bold">
          Congratulations! You've achieved the phase goal.
        </p>
      ) : (
        <p className="font-bold">
          Unfortunately, you didn't reach the phase goal.
        </p>
      )}
    </div>
  );

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">{gamePhase} Phase Completed</h2>

      {renderTerritoryInfo()}
      {renderAchievementMessage()}
      {renderPhaseSummary()}

      <button
        onClick={handlePhaseEnd}
        className={`mt-4 p-2 text-white rounded w-full transition-colors ${
          isGoalAchieved
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isGoalAchieved ? "Advance to Next Phase" : "Retry Phase"}
      </button>

      {!isGoalAchieved && (
        <p className="mt-2 text-sm text-gray-600 text-center">
          Don't give up! Try adjusting your strategy and upgrading your skills.
        </p>
      )}
    </div>
  );
};

export default PhaseComplete;
