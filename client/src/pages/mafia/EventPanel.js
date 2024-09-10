import React from "react";
import { applySkillEffects } from "./utils";

const EventPanel = ({
  currentEvent,
  resolutionScreen,
  handleChoice,
  closeResolution,
  skills,
}) => {
  const renderChoiceWithSkillEffects = (choice, index) => {
    const modifiedChoice = applySkillEffects(choice, skills);
    console.log(modifiedChoice);
    // const modifiedChoice = choice;
    return (
      <button
        key={index}
        onClick={() => handleChoice(modifiedChoice)}
        className="mt-4 p-4 bg-gray-800 text-white rounded w-full text-left hover:bg-gray-700 transition-colors"
      >
        <span className="font-bold text-lg">{modifiedChoice.title}</span>
        <p className="mt-2 text-sm text-gray-300">
          {modifiedChoice.description}
        </p>
        <div className="mt-2 flex justify-between text-sm">
          <span>Difficulty:</span>
          <span className="font-bold">{modifiedChoice.difficulty}/5</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>Probability:</span>
          <span className="font-bold">
            {choice.successProbability}%
            {modifiedChoice.skillBonus.negotiation > 0 && (
              <span className="text-green-300">
                {" "}
                +{modifiedChoice.skillBonus.negotiation}%
              </span>
            )}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span>Potential Outcome:</span>
          <span className="font-bold">
            {choice.outcomes.success.consequences.territory > 0 ? "+" : ""}
            {choice.outcomes.success.consequences.territory}% Territory
            {modifiedChoice.skillBonus.resourceManagement > 0 && (
              <span className="text-green-300">
                {" "}
                +{modifiedChoice.skillBonus.resourceManagement}%
              </span>
            )}
          </span>
        </div>
      </button>
    );
  };

  const renderConsequences = (consequences) => {
    return (
      <div className="mt-2 text-sm">
        <p>Consequences:</p>
        <ul className="list-disc list-inside">
          {consequences.territory !== 0 && (
            <li>
              Territory: {consequences.territory > 0 ? "+" : ""}
              {consequences.territory}%
            </li>
          )}
          {consequences.money !== 0 && <li>Money: ${consequences.money}</li>}
          {consequences.influence !== 0 && (
            <li>
              Influence: {consequences.influence > 0 ? "+" : ""}
              {consequences.influence}
            </li>
          )}
          {consequences.heat !== 0 && (
            <li>
              Heat: {consequences.heat > 0 ? "+" : ""}
              {consequences.heat}
            </li>
          )}
          {consequences.manpower !== 0 && (
            <li>
              Manpower: {consequences.manpower > 0 ? "+" : ""}
              {consequences.manpower}
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="mt-4 p-6 border rounded bg-gray-900 text-white">
      {resolutionScreen ? (
        <div className="space-y-4">
          <h3 className="font-bold text-2xl mb-4">Event Resolution</h3>
          <p
            className={
              resolutionScreen.success
                ? "text-green-400 font-bold text-xl"
                : "text-red-400 font-bold text-xl"
            }
          >
            {resolutionScreen.success ? "Success!" : "Failure!"}
          </p>
          <p className="text-lg">{resolutionScreen.description}</p>
          {renderConsequences(resolutionScreen.consequences)}
          <button
            onClick={closeResolution}
            className="mt-6 p-3 bg-blue-600 text-white rounded w-full hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      ) : currentEvent ? (
        <div className="space-y-4">
          <h3 className="font-bold text-2xl mb-2">{currentEvent.trigger}</h3>
          <p className="text-lg">{currentEvent.narrative}</p>
          <div className="mt-6 space-y-4">
            {currentEvent.choices.map(renderChoiceWithSkillEffects)}
          </div>
        </div>
      ) : (
        <p className="text-lg">Preparing next event...</p>
      )}
    </div>
  );
};

export default EventPanel;
