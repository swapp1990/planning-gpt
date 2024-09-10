import React, { useState, useEffect } from "react";

const TURNS_PER_PHASE = 3;
const EVENTS_PER_TURN = 2;
const PHASE_GOAL = 30;

const eventCategories = [
  "Peaceful Expansion",
  "Aggressive Takeover",
  "Economic Influence",
];

const calculateProbability = (difficulty, playerTerritory) => {
  const baseProbability = Math.max(0, 0.8 - (difficulty - 1) * 0.1);
  const territoryBonus = Math.min(0.2, Math.floor(playerTerritory / 10) * 0.05);
  return Math.min(1, baseProbability + territoryBonus);
};

const generateEvent = (playerTerritory) => {
  const category =
    eventCategories[Math.floor(Math.random() * eventCategories.length)];
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

const MafiaGame = () => {
  const [territory, setTerritory] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventsResolved, setEventsResolved] = useState(0);
  const [gamePhase, setGamePhase] = useState("Early");
  const [resolutionScreen, setResolutionScreen] = useState(null);
  const [phaseComplete, setPhaseComplete] = useState(false);

  // ... (keep all the existing functions like resetPhase, handleChoice, closeResolution, handlePhaseEnd)

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

  const renderTurnIndicators = () => {
    return (
      <div className="flex justify-between mb-4">
        {[...Array(TURNS_PER_PHASE)].map((_, index) => (
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

  if (phaseComplete) {
    // ... (keep existing phase complete screen)
  }

  if (resolutionScreen) {
    // ... (keep existing resolution screen)
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Territory Expansion Game</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Phase: {gamePhase}</span>
          <span className="font-bold">Goal: {PHASE_GOAL}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{ width: `${(territory / PHASE_GOAL) * 100}%` }}
          ></div>
        </div>
        <div className="text-right">Territory: {territory}%</div>
      </div>

      {renderTurnIndicators()}

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

      {currentEvent && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold">{currentEvent.category}</h3>
          <p>{currentEvent.description}</p>
          <p>Event Difficulty: {currentEvent.difficulty}/5</p>
          {currentEvent.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleChoice(option)}
              className="mt-2 p-2 bg-blue-500 text-white rounded w-full text-left"
            >
              <span className="font-bold">{option.name}</span>
              <br />
              Potential Gain: {option.territoryGain}%<br />
              Difficulty: {option.difficulty}/5
              <br />
              Success Probability: {(option.probability * 100).toFixed(1)}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MafiaGame;
