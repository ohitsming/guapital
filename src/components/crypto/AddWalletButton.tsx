'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import AddWalletModal from './AddWalletModal';

interface AddWalletButtonProps {
  onWalletAdded: () => void;
}

const AddWalletButton: React.FC<AddWalletButtonProps> = ({ onWalletAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    onWalletAdded();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
      >
        <PlusIcon className="h-5 w-5" />
        Add Wallet
      </button>

      <AddWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default AddWalletButton;
