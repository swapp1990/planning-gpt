import React from "react";
import { applySkillEffects } from "./utils";

const EventPanel = ({
  currentEvent,
  resolutionScreen,
  handleChoice,
  closeResolution,
  skills,
}) => {
  const renderOptionWithSkillEffects = (option, index) => {
    const modifiedOption = applySkillEffects(option, skills);
    return (
      <button
        key={index}
        onClick={() => handleChoice(option)}
        className="mt-2 p-2 bg-blue-500 text-white rounded w-full text-left"
      >
        <span className="font-bold">{modifiedOption.name}</span>
        <br />
        <div className="flex justify-between">
          <span>Potential Gain:</span>
          <span>
            {option.territoryGain}%
            {modifiedOption.resourceBonus > 0 && (
              <span className="text-green-300">
                {" "}
                +{modifiedOption.resourceBonus}%
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Difficulty:</span>
          <span>{modifiedOption.difficulty}/5</span>
        </div>
        <div className="flex justify-between">
          <span>Success Probability:</span>
          <span>
            {(option.probability * 100).toFixed(1)}%
            {modifiedOption.negotiationBonus > 0 && (
              <span className="text-green-300">
                {" "}
                +{(modifiedOption.negotiationBonus * 100).toFixed(1)}%
              </span>
            )}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="mt-4 p-4 border rounded">
      {resolutionScreen ? (
        <>
          <h3 className="font-bold mb-2">Event Resolution</h3>
          <p
            className={
              resolutionScreen.success
                ? "text-green-600 font-bold"
                : "text-red-600 font-bold"
            }
          >
            {resolutionScreen.success ? "Success!" : "Failure!"}
          </p>
          <p>Chosen Strategy: {resolutionScreen.chosenOption.name}</p>
          <p>Territory Gained: {resolutionScreen.territoryGained}%</p>
          <p>New Territory: {resolutionScreen.newTerritory}%</p>
          <button
            onClick={closeResolution}
            className="mt-4 p-2 bg-blue-500 text-white rounded w-full"
          >
            Continue
          </button>
        </>
      ) : currentEvent ? (
        <>
          <h3 className="font-bold">{currentEvent.category}</h3>
          <p>{currentEvent.description}</p>
          <p>Event Difficulty: {currentEvent.difficulty}/5</p>
          {currentEvent.options.map(renderOptionWithSkillEffects)}
        </>
      ) : (
        <p>Preparing next event...</p>
      )}
    </div>
  );
};

export default EventPanel;
