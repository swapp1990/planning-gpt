// src/components/NewBookWizard.js
import React, { useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBook,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import SuggestableInput from "../../components/SuggestableInput";
import CharacterInput from "./CharacterInput";
import { useEbook } from "../../context/EbookContext";

const steps = [
  { name: "Premise", icon: FaBook },
  { name: "Title", icon: FaBook },
  { name: "Genre", icon: FaBook },
  { name: "Setting", icon: FaBook },
  { name: "Main Characters", icon: FaUser },
  { name: "Supporting Characters", icon: FaUsers },
];

const NewBookWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookData, setBookData] = useState({
    premise: "",
    title: "",
    genre: "",
    setting: { time: "", place: "" },
    mainCharacters: [{ name: "", age: "", occupation: "" }],
    supportingCharacters: [{ name: "", age: "", occupation: "" }],
  });
  const [direction, setDirection] = useState("next");
  const { ebookActions } = useEbook();

  const handleInputChange = (key, value) => {
    setBookData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection("next");
      setCurrentStep(currentStep + 1);
    } else {
      console.log("here");
      ebookActions.createNewEbook(bookData);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection("prev");
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepInstructions = (step) => {
    switch (step) {
      case 0:
        return "Provide a brief overview of your book's main idea or plot.";
      case 1:
        return "Choose a catchy and relevant title for your book.";
      case 2:
        return "Select the genre that best fits your book's style and content.";
      case 3:
        return "Describe the time and place where your story unfolds.";
      case 4:
        return "Add the main characters of your story. These are the central figures driving the plot.";
      case 5:
        return "Include supporting characters that enrich your narrative and interact with the main characters.";
      default:
        return "";
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SuggestableInput
            label="Premise"
            value={bookData.premise}
            onChange={(value) => handleInputChange("premise", value)}
            context={bookData}
            multiline
          />
        );
      case 1:
        return (
          <SuggestableInput
            label="Title"
            value={bookData.title}
            onChange={(value) => handleInputChange("title", value)}
            context={bookData}
          />
        );
      case 2:
        return (
          <SuggestableInput
            label="Genre"
            value={bookData.genre}
            onChange={(value) => handleInputChange("genre", value)}
            context={bookData}
          />
        );
      case 3:
        return (
          <div className="space-y-4">
            <SuggestableInput
              label="Time"
              value={bookData.setting.time}
              onChange={(value) =>
                handleInputChange("setting", {
                  ...bookData.setting,
                  time: value,
                })
              }
              context={bookData}
            />
            <SuggestableInput
              label="Place"
              value={bookData.setting.place}
              onChange={(value) =>
                handleInputChange("setting", {
                  ...bookData.setting,
                  place: value,
                })
              }
              context={bookData}
            />
          </div>
        );
      case 4:
        return (
          <div>
            {bookData.mainCharacters.map((character, index) => (
              <CharacterInput
                key={index}
                character={character}
                onChange={(updatedCharacter) => {
                  const newMainCharacters = [...bookData.mainCharacters];
                  newMainCharacters[index] = updatedCharacter;
                  handleInputChange("mainCharacters", newMainCharacters);
                }}
                isMainCharacter={true}
              />
            ))}
            <button
              onClick={() =>
                handleInputChange("mainCharacters", [
                  ...bookData.mainCharacters,
                  { name: "", age: "", occupation: "" },
                ])
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
            >
              Add Another Main Character
            </button>
          </div>
        );
      case 5:
        return (
          <div>
            {bookData.supportingCharacters.map((character, index) => (
              <CharacterInput
                key={index}
                character={character}
                onChange={(updatedCharacter) => {
                  const newSupportingCharacters = [
                    ...bookData.supportingCharacters,
                  ];
                  newSupportingCharacters[index] = updatedCharacter;
                  handleInputChange(
                    "supportingCharacters",
                    newSupportingCharacters
                  );
                }}
                isMainCharacter={false}
              />
            ))}
            <button
              onClick={() =>
                handleInputChange("supportingCharacters", [
                  ...bookData.supportingCharacters,
                  { name: "", age: "", occupation: "" },
                ])
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
            >
              Add Another Supporting Character
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-100 rounded-lg shadow-lg overflow-hidden">
      <div className="md:w-3/4 p-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Create Your New Book
        </h1>
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round((currentStep / (steps.length - 1)) * 100)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300 ease-in-out"
              ></div>
            </div>
          </div>
        </div>
        <div
          className={`transition-opacity duration-300 ease-in-out ${
            direction === "next" ? "animate-fadeInRight" : "animate-fadeInLeft"
          }`}
        >
          <div className="flex items-center space-x-2 text-2xl font-bold text-gray-800 mb-4">
            {React.createElement(steps[currentStep].icon, {
              className: "text-blue-500",
            })}
            <h2>{steps[currentStep].name}</h2>
          </div>
          <p className="text-gray-600 mb-4">
            {getStepInstructions(currentStep)}
          </p>
          {getStepContent()}
        </div>
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-md"
          >
            <FaArrowLeft className="mr-2 inline" /> Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-500 text-white rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-md"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}{" "}
            <FaArrowRight className="ml-2 inline" />
          </button>
        </div>
      </div>
      <div className="md:w-1/4 bg-gray-800 p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Summary</h3>
        <div className="space-y-4">
          {Object.entries(bookData).map(([key, value]) => (
            <div key={key}>
              <h4 className="font-semibold capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              {key === "setting" ? (
                <p className="text-sm text-gray-300">
                  Time: {value.time}
                  <br />
                  Place: {value.place}
                </p>
              ) : Array.isArray(value) ? (
                <ul className="list-disc list-inside text-sm text-gray-300">
                  {value.map((item, index) => (
                    <li key={index}>
                      {item.name} {item.age ? `(${item.age})` : ""} -{" "}
                      {item.occupation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-300">{value || "Not set"}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewBookWizard;
