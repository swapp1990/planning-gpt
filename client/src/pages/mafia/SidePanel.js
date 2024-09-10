import React, { useMemo } from "react";

const SkillItem = ({ name, level, upgradeSkill, skillPoints, description }) => {
  return (
    <div className="bg-white p-3 rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">
          {name} (Lv. {level})
        </span>
        <button
          onClick={upgradeSkill}
          disabled={skillPoints === 0}
          className="px-2 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          Upgrade
        </button>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${(level / 10) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

const SidePanel = ({ territory, skillPoints, skills, upgradeSkill }) => {
  return (
    <div className="w-64 bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Player Stats</h3>

      <div className="mb-4">
        <p>
          <strong>Territory:</strong> {territory}%
        </p>
        <p>
          <strong>Skill Points:</strong> {skillPoints}
        </p>
      </div>

      <h4 className="font-bold mb-2">Skills</h4>
      <div className="space-y-4">
        <SkillItem
          name="Negotiation"
          level={skills.negotiation}
          upgradeSkill={() => upgradeSkill("negotiation")}
          skillPoints={skillPoints}
          description={`+${(skills.negotiation * 5).toFixed(
            1
          )}% success chance`}
        />
        <SkillItem
          name="Resource Management"
          level={skills.resourceManagement}
          upgradeSkill={() => upgradeSkill("resourceManagement")}
          skillPoints={skillPoints}
          description={`+${Math.floor(
            skills.resourceManagement * 0.5
          )}% territory gain`}
        />
      </div>
    </div>
  );
};

export default SidePanel;
