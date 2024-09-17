import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import Modal from "./Modal";

const DeleteButton = ({ onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleConfirmDelete = () => {
    onDelete();
    handleCloseModal();
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Delete"
      >
        <FaTrash className="w-5 h-5" />
      </button>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item?"
      />
    </>
  );
};

export default DeleteButton;
