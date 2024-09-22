import React from "react";
import SceneParagraphs from "./SceneParagraphs";

const ParagraphView = ({ scenes, chapterId, sectionIndex, onUpdateScene }) => {
  const handleUpdateParagraphs = (sceneIndex, updatedParagraphs) => {
    const updatedScene = {
      ...scenes[sceneIndex],
      paragraphs: updatedParagraphs,
    };
    console.log(updatedScene);
    onUpdateScene(
      scenes.map((scene, index) =>
        index === sceneIndex ? updatedScene : scene
      )
    );
  };

  return (
    <div>
      {scenes.map((scene, index) => (
        <SceneParagraphs
          key={index}
          scene={scene}
          chapterId={chapterId}
          sectionIndex={sectionIndex}
          sceneIndex={index}
          onUpdateParagraphs={(updatedParagraphs) =>
            handleUpdateParagraphs(index, updatedParagraphs)
          }
        />
      ))}
    </div>
  );
};

export default ParagraphView;
