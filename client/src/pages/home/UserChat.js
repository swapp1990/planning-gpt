import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import VersionedText from "../../components/VersionedText";
import useVersionedState from "../../utils/useVersionedState";

export default function UserChat({ paragraphs }) {
  const [userMsg, setUserMsg, prevUserMsg] = useVersionedState(
    paragraphs.join("\n\n")
  );
  const [rewritePopupVisible, setRewritePopupVisible] = useState(false);

  return (
    <div className={`mb-4 w-50 text-right`}>
      <div
        className={`inline-block p-4 pr-10 w-[90%] lg:w-[50%] rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg relative `}
      >
        <VersionedText text={{ current: userMsg, previous: prevUserMsg }} />
        <button
          className="absolute bottom-4 right-4 p-3 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition duration-300 ease-in-out shadow-md"
          onClick={() => setRewritePopupVisible(true)}
        >
          <FaEdit size={20} />
        </button>
      </div>

      {/* <InputPopup
			position={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }} // Center the popup
			visible={rewritePopupVisible}
			onClose={() => setRewritePopupVisible(false)}
			onSubmit={handleRewritePromptSubmit}
			promptValue={instruction}
			setPromptValue={setInstruction}
			placeholder="Enter your instruction to rewrite the passage"
			submitLabel="Rewrite"
			cancelLabel="Cancel"
		  /> */}
    </div>
  );
}
