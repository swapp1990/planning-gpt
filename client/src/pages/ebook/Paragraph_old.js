// import React, { useState } from "react";
// import {
//   FaPen,
//   FaPlus,
//   FaTrash,
//   FaShareAlt,
//   FaCheck,
//   FaTimes,
//   FaUndo,
//   FaEye,
//   FaExclamationCircle,
// } from "react-icons/fa";
// import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import { computeDiff } from "../../utils/paragraphDiff";
// import { useBook } from "./BookContext";
// import RewritePanel from "./RewritePanel";

// const ParagraphMenu = ({ content, chapterId, paragraphId, onClose }) => {
//   const {
//     handleDeleteParagraph,
//     handleRewriteParagraph,
//     handleInsertParagraph,
//     handleReviewApply,
//   } = useBook();
//   const [rewritePrompt, setRewritePrompt] = React.useState("");
//   const [rewriteResponse, setRewriteResponse] = React.useState(null);
//   const [insertParaPrompt, setInsertParaPrompt] = useState("");
//   const [isRewriteOpen, setIsRewriteOpen] = useState(false);
//   const [isInsertParaOpen, setisInsertParaOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isRewriteReviewOpen, setIsRewriteReviewOpen] = useState(false);

//   const handleRewriteClick = () => {
//     setIsRewriteOpen(!isRewriteOpen);
//     setisInsertParaOpen(false);
//   };

//   const onInsertParaClick = () => {
//     setisInsertParaOpen(!isInsertParaOpen);
//     setIsRewriteOpen(false);
//   };

//   const handleSubmitRewrite = async (finalInstruction) => {
//     setIsLoading(true);
//     let response = await handleRewriteParagraph(
//       chapterId,
//       paragraphId,
//       finalInstruction
//     );
//     if (response.newParagraph) {
//       setIsRewriteOpen(false);
//       setRewritePrompt("");
//       setIsLoading(false);
//       setRewriteResponse(response.newParagraph);
//       setIsRewriteReviewOpen(true);
//       setError(null);
//     } else {
//       setError("An error occurred. Please try again later.");
//       setIsLoading(false);
//     }
//   };

//   const onRewriteCancel = () => {
//     setIsLoading(false);
//     setIsRewriteOpen(false);
//     setRewritePrompt("");
//     setRewriteResponse("");
//     setError(null);
//     setIsRewriteReviewOpen(false);
//   };

//   const onInsertParaSubmit = async () => {
//     setIsLoading(true);
//     let response = await handleInsertParagraph(
//       chapterId,
//       paragraphId,
//       insertParaPrompt
//     );
//     if (response.newParagraph) {
//       setisInsertParaOpen(false);
//       setInsertParaPrompt("");
//       setIsLoading(false);
//     } else {
//       setError("An error occurred. Please try again later.");
//       setIsLoading(false);
//     }
//   };

//   const onInsertParaCancel = () => {
//     setIsRewriteOpen(false);
//     setisInsertParaOpen(false);
//     setRewritePrompt("");
//     setInsertParaPrompt("");
//   };

//   const onDeleteParagraph = () => {
//     handleDeleteParagraph(chapterId, paragraphId);
//   };

//   const onReviewSave = (newParagraph) => {
//     setIsRewriteReviewOpen(false);
//     handleReviewApply(chapterId, paragraphId, newParagraph);
//   };

//   const onReviewCancel = () => {
//     setIsRewriteReviewOpen(false);
//   };

//   return (
//     <div className="bg-gray-100 p-2 rounded-b-lg border-t border-gray-200">
//       <div className="flex space-x-2 mb-2">
//         <button
//           onClick={handleRewriteClick}
//           className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
//             isRewriteOpen || isRewriteReviewOpen ? "bg-blue-200" : ""
//           }`}
//           title="Rewrite"
//         >
//           <FaPen className="text-blue-500" />
//         </button>
//         <button
//           onClick={onInsertParaClick}
//           className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
//             isInsertParaOpen ? "bg-green-100" : ""
//           }`}
//           title="Continue Paragraph"
//         >
//           <FaPlus className="text-green-500" />
//         </button>
//         <button
//           onClick={onDeleteParagraph}
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
//           title="Delete"
//         >
//           <FaTrash className="text-red-500" />
//         </button>
//         <button
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
//           title="Share"
//         >
//           <FaShareAlt className="text-purple-500" />
//         </button>
//         <button
//           onClick={onClose}
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
//           title="Close"
//         >
//           &times;
//         </button>
//       </div>
//       {isRewriteOpen && (
//         <RewritePanel
//           content={content}
//           isLoading={isLoading}
//           onSubmit={handleSubmitRewrite}
//           onCancel={onRewriteCancel}
//         />
//       )}
//       {isRewriteReviewOpen && (
//         <ParagraphReview
//           original={content}
//           edited={rewriteResponse}
//           onSave={onReviewSave}
//           onCancel={onReviewCancel}
//         />
//       )}
//       {isInsertParaOpen && (
//         <div className="mt-2">
//           <textarea
//             className="w-full p-2 border rounded-md"
//             rows="3"
//             placeholder="Enter content for the new paragraph..."
//             value={insertParaPrompt}
//             onChange={(e) => setInsertParaPrompt(e.target.value)}
//           />
//           <div className="flex justify-end mt-2 space-x-2">
//             <button
//               onClick={onInsertParaCancel}
//               className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onInsertParaSubmit}
//               className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <span className="animate-spin mr-2">&#9696;</span>
//               ) : (
//                 <FaCheck size={16} className="mr-1" />
//               )}
//               {isLoading ? "Adding..." : "Submit"}
//             </button>
//           </div>
//         </div>
//       )}
//       {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
//     </div>
//   );
// };

// const Paragraph = ({
//   content,
//   isSelected,
//   isStreaming,
//   onCloseMenu,
//   chapterId,
//   paragraphIndex,
// }) => {
//   const { handleParagraphSelect } = useBook();
//   return (
//     <div className={`mb-0 ${isSelected ? "bg-blue-50 rounded-t-lg" : ""}`}>
//       <p
//         className={`p-2 rounded-t-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer`}
//         onClick={() => handleParagraphSelect(chapterId, paragraphIndex)}
//       >
//         {content}
//         {isStreaming && (
//           <AiOutlineLoading3Quarters className="inline-block ml-1 animate-spin text-gray-500" />
//         )}
//       </p>
//       {isSelected && (
//         <ParagraphMenu
//           content={content}
//           paragraphId={paragraphIndex}
//           chapterId={chapterId}
//           onClose={() => onCloseMenu(chapterId)}
//         />
//       )}
//     </div>
//   );
// };

// export default Paragraph;
