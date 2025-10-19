'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import type { AssetFormData, ManualEntryCategory, EntryType } from '@/lib/interfaces/asset';
import {
  HomeIcon,
  TruckIcon,
  BriefcaseIcon,
  SparklesIcon,
  EllipsisHorizontalCircleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ChartPieIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CategoryConfig = {
  value: ManualEntryCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const ASSET_CATEGORIES: CategoryConfig[] = [
  {
    value: 'real_estate',
    label: 'Real Estate',
    icon: HomeIcon,
    description: 'Property, land, or housing',
  },
  {
    value: 'vehicle',
    label: 'Vehicle',
    icon: TruckIcon,
    description: 'Cars, motorcycles, boats',
  },
  {
    value: 'cash',
    label: 'Cash',
    icon: BanknotesIcon,
    description: 'Physical cash, safe holdings',
  },
  {
    value: 'investment',
    label: 'Investment',
    icon: ChartPieIcon,
    description: 'Stocks, mutual funds, ETFs',
  },
  {
    value: 'private_stock',
    label: 'Private Stock',
    icon: ChartBarIcon,
    description: 'Private equity, RSUs, ESPP',
  },
  {
    value: 'bonds',
    label: 'Bonds',
    icon: BuildingLibraryIcon,
    description: 'Savings bonds, T-bills, notes',
  },
  {
    value: 'p2p_lending',
    label: 'P2P Lending',
    icon: ReceiptPercentIcon,
    description: 'Lending Club, Prosper, etc.',
  },
  {
    value: 'collectibles',
    label: 'Collectibles',
    icon: SparklesIcon,
    description: 'Art, watches, memorabilia',
  },
  {
    value: 'other',
    label: 'Other Assets',
    icon: EllipsisHorizontalCircleIcon,
    description: 'Anything else of value',
  },
];

const LIABILITY_CATEGORIES: CategoryConfig[] = [
  {
    value: 'mortgage',
    label: 'Mortgage',
    icon: HomeIcon,
    description: 'Home loan, property mortgage',
  },
  {
    value: 'personal_loan',
    label: 'Personal Loan',
    icon: DocumentTextIcon,
    description: 'Loans from family, friends',
  },
  {
    value: 'business_debt',
    label: 'Business Debt',
    icon: BriefcaseIcon,
    description: 'Business loans, obligations',
  },
  {
    value: 'credit_debt',
    label: 'Credit / IOU',
    icon: CreditCardIcon,
    description: 'Personal credit, IOUs',
  },
  {
    value: 'other_debt',
    label: 'Other Debt',
    icon: EllipsisHorizontalCircleIcon,
    description: 'Any other liabilities',
  },
];

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [entryType, setEntryType] = useState<EntryType>('asset');
  const [formData, setFormData] = useState<AssetFormData>({
    asset_name: '',
    current_value: 0,
    category: 'other',
    entry_type: 'asset',
    notes: '',
  });
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current categories based on entry type
  const currentCategories = entryType === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  // Format number with commas
  const formatNumberWithCommas = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted string to number
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Handle value input change
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove all non-digit and non-decimal characters
    const cleaned = input.replace(/[^\d.]/g, '');

    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned;

    // Parse to number
    const numericValue = parseFloat(formatted) || 0;

    // Update form data with numeric value
    setFormData({ ...formData, current_value: numericValue });

    // Update display value
    setDisplayValue(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create asset');
      }

      // Reset form
      setFormData({
        asset_name: '',
        current_value: 0,
        category: 'other',
        entry_type: 'asset',
        notes: '',
      });
      setDisplayValue('');
      setEntryType('asset');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setFormData({
        asset_name: '',
        current_value: 0,
        category: 'other',
        entry_type: 'asset',
        notes: '',
      });
      setDisplayValue('');
      setEntryType('asset');
      onClose();
    }
  };

  // Handler for entry type toggle
  const handleEntryTypeChange = (newType: EntryType) => {
    setEntryType(newType);
    // Reset category to appropriate default when switching types
    const defaultCategory = newType === 'asset' ? 'other' : 'other_debt';
    setFormData({
      ...formData,
      entry_type: newType,
      category: defaultCategory as ManualEntryCategory,
    });
  };

  // Format display value with commas on blur
  const handleValueBlur = () => {
    if (displayValue) {
      const parts = displayValue.split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formatted = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
      setDisplayValue(formatted);
    }
  };

  // Remove commas on focus for easier editing
  const handleValueFocus = () => {
    if (displayValue) {
      setDisplayValue(displayValue.replace(/,/g, ''));
    }
  };

  const modalFooter = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200
                   rounded-xl hover:bg-gray-50 hover:border-gray-300
                   focus:outline-none focus:ring-4 focus:ring-gray-200/50
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="add-asset-form"
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-white
                   bg-gradient-to-r from-[#004D40] to-[#00695C]
                   border-2 border-transparent rounded-xl
                   hover:shadow-lg hover:scale-105
                   focus:outline-none focus:ring-4 focus:ring-[#004D40]/30
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                   transition-all duration-200 shadow-md"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding...
          </span>
        ) : (
          `Add ${entryType === 'asset' ? 'Asset' : 'Liability'}`
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={entryType === 'asset' ? 'Add Manual Asset' : 'Add Manual Liability'}
      footer={modalFooter}
    >
      <form id="add-asset-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r-lg shadow-sm">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Entry Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            What are you adding? <span className="text-[#FFC107]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleEntryTypeChange('asset')}
              disabled={isSubmitting}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200 font-semibold
                ${
                  entryType === 'asset'
                    ? 'border-[#004D40] bg-[#004D40]/5 text-[#004D40] shadow-md'
                    : 'border-gray-200 text-gray-600 hover:border-[#004D40]/40 hover:bg-gray-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span className="text-2xl mb-1 block">📈</span>
              Asset
              <p className="text-xs font-normal mt-1 opacity-75">
                Things you own
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleEntryTypeChange('liability')}
              disabled={isSubmitting}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200 font-semibold
                ${
                  entryType === 'liability'
                    ? 'border-[#004D40] bg-[#004D40]/5 text-[#004D40] shadow-md'
                    : 'border-gray-200 text-gray-600 hover:border-[#004D40]/40 hover:bg-gray-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span className="text-2xl mb-1 block">📉</span>
              Liability
              <p className="text-xs font-normal mt-1 opacity-75">
                Things you owe
              </p>
            </button>
          </div>
        </div>

        {/* Entry Name */}
        <div className="group">
          <label htmlFor="asset_name" className="block text-sm font-semibold text-gray-900 mb-2">
            {entryType === 'asset' ? 'Asset Name' : 'Liability Name'}{' '}
            <span className="text-[#FFC107]">*</span>
          </label>
          <input
            id="asset_name"
            type="text"
            required
            value={formData.asset_name}
            onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200
                       focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/10
                       hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed
                       placeholder:text-gray-400"
            placeholder={
              entryType === 'asset'
                ? 'e.g., 2019 Tesla Model 3'
                : 'e.g., Personal loan from family'
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Current Value */}
        <div className="group">
          <label htmlFor="current_value" className="block text-sm font-semibold text-gray-900 mb-2">
            Current Value <span className="text-[#FFC107]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#004D40]">
              $
            </span>
            <input
              id="current_value"
              type="text"
              inputMode="decimal"
              required
              value={displayValue}
              onChange={handleValueChange}
              onFocus={handleValueFocus}
              onBlur={handleValueBlur}
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200
                         focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/10
                         hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed
                         text-lg font-medium placeholder:text-gray-400"
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Category - Grid Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Category <span className="text-[#FFC107]">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {currentCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  disabled={isSubmitting}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      isSelected
                        ? 'border-[#004D40] bg-[#004D40]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#004D40]/40 hover:bg-gray-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      p-2 rounded-lg transition-colors
                      ${isSelected ? 'bg-[#004D40] text-white' : 'bg-gray-100 text-gray-600'}
                    `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-[#004D40]' : 'text-gray-900'}`}>
                        {cat.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full bg-[#FFC107]"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="group">
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
            Notes <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200
                       focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/10
                       hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed
                       placeholder:text-gray-400 resize-none"
            placeholder="Add any additional details about this asset..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddAssetModal;
