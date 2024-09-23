import React from "react";
import { MdLocationOn, MdAccessTime, MdDescription } from "react-icons/md";

const SceneSettings = ({ scene }) => (
  <div className="mb-4 space-y-2">
    <p className="flex items-center text-gray-700">
      <MdLocationOn className="mr-2" />
      <span className="font-semibold">Location:</span>
      <span className="ml-2">{scene.setting.location}</span>
    </p>
    <p className="flex items-center text-gray-700">
      <MdAccessTime className="mr-2" />
      <span className="font-semibold">Time:</span>
      <span className="ml-2">{scene.setting.time}</span>
    </p>
    <p className="flex items-center text-gray-700">
      <MdDescription className="mr-2" />
      <span className="font-semibold">Description:</span>
      <span className="ml-2">{scene.setting.description}</span>
    </p>
  </div>
);

export default SceneSettings;
