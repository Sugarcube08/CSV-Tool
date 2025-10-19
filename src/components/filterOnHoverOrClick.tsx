import { useState, useEffect, useCallback } from "react";
import React from 'react';

// --- Type Definitions ---

/** Defines the criteria structure sent from a filter component to the parent. */
export type FilterCriteria = {
    type: string;
    // value can be a single string/date/number, or an array for category multi-select.
    value: string | string[] | null; 
};

/** Defines the callback function used by the parent to receive filter criteria. */
export type FilterChangeCallback = (criteria: FilterCriteria) => void;

/** Base props structure for most filters. */
interface FilterProps {
    onFilterChange: FilterChangeCallback;
    initialType?: string;
    initialValue?: string;
}

/** Specific Props for Category Filter (Requires Options) */
interface CategoryFilterProps extends FilterProps {
    categories: string[]; 
}

/** Define the type for the column data (an array of values for a single column). */
export type ColumnData = (string | number | Date | null | undefined)[];

// ----------------------------------------------------
// --- Date Filter Component ---
// ----------------------------------------------------

const DateFilter = ({ onFilterChange, initialType = 'equals', initialValue = '' }: FilterProps) => {
    const [filterType, setFilterType] = useState<string>(initialType);
    const [dateValue, setDateValue] = useState<string>(initialValue);

    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';
    
    // Auto-fire callback on state change
    useEffect(() => {
        const valueToSend = isValueRequired ? (dateValue || null) : null;
        onFilterChange({
            type: filterType,
            value: valueToSend
        });
    }, [filterType, dateValue, onFilterChange, isValueRequired]);


    const handleClear = () => {
        setFilterType('equals');
        setDateValue('');
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Date</h3>

            <div className="flex flex-col gap-3">
                {/* Comparison Dropdown */}
                <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setDateValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md"
                >
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="after">After</option>
                    <option value="before">Before</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>

                {/* Date Input Field */}
                <input
                    type="date"
                    placeholder="Select Date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>

            {/* Clear Filter Button */}
            <button
                onClick={handleClear}
                className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg"
            >
                Clear Filter
            </button>
        </div>
    );
};

// ----------------------------------------------------
// --- Number Filter Component ---
// ----------------------------------------------------

const NumberFilter = ({ onFilterChange, initialType = 'equals', initialValue = '' }: FilterProps) => {
    const [filterType, setFilterType] = useState<string>(initialType);
    const [numberValue, setNumberValue] = useState<string>(initialValue);

    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';

    // Auto-fire callback on state change
    useEffect(() => {
        const valueToSend = isValueRequired ? (numberValue || null) : null;
        onFilterChange({
            type: filterType,
            value: valueToSend
        });
    }, [filterType, numberValue, onFilterChange, isValueRequired]);

    const handleClear = () => {
        setFilterType('equals');
        setNumberValue('');
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Number</h3>

            <div className="flex flex-col gap-3">
                {/* Comparison Dropdown */}
                <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setNumberValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md"
                >
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="greater than">Greater Than</option>
                    <option value="less than">Less Than</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>

                {/* Number Input Field */}
                <input
                    type="number"
                    placeholder="Enter Number"
                    value={numberValue}
                    onChange={(e) => setNumberValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>

            {/* Clear Filter Button */}
            <button
                onClick={handleClear}
                className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg"
            >
                Clear Filter
            </button>
        </div>
    );
};

// ----------------------------------------------------
// --- String Filter Component ---
// ----------------------------------------------------

const StringFilter = ({ onFilterChange, initialType = 'contains', initialValue = '' }: FilterProps) => {
    const [filterType, setFilterType] = useState<string>(initialType);
    const [stringValue, setStringValue] = useState<string>(initialValue);
    
    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';
    
    // Auto-fire callback on state change
    useEffect(() => {
        const valueToSend = isValueRequired ? (stringValue || null) : null;
        onFilterChange({
            type: filterType,
            value: valueToSend
        });
    }, [filterType, stringValue, onFilterChange, isValueRequired]);
    
    const handleClear = () => {
        setFilterType('contains'); // Default for string is usually 'contains'
        setStringValue('');
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">            
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Text</h3>
            <div className="flex flex-col gap-3">
                {/* Comparison Dropdown */}
                <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setStringValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md"
                >
                    <option value="contains">Contains</option>
                    <option value="not contains">Not Contains</option>
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="starts with">Starts With</option>
                    <option value="ends with">Ends With</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>
                {/* String Input Field */}
                <input
                    type="text"
                    placeholder="Enter Text"
                    value={stringValue}
                    onChange={(e) => setStringValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>
            {/* Clear Filter Button */}
            <button
                onClick={handleClear}
                className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg"
            >
                Clear Filter
            </button>
        </div>
    );
};

// ----------------------------------------------------
// --- Category Filter Component (Multi-Select) ---
// ----------------------------------------------------

const CategoryFilter = ({ onFilterChange, categories }: CategoryFilterProps) => {
    // Only one filter type needed for multi-select: 'in'
    const filterType = 'in'; 
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    
    // FIX APPLIED: Added filterType to the dependency array.
    useEffect(() => {
        // Send back the array of selected items
        onFilterChange({
            type: filterType,
            value: selectedValues.length > 0 ? selectedValues : null
        });
    }, [selectedValues, onFilterChange, filterType]);

    const handleToggleCategory = useCallback((category: string) => {
        setSelectedValues(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category) // Remove
                : [...prev, category] // Add
        );
    }, []);

    const handleClear = () => {
        setSelectedValues([]);
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">            
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Category (Select Multiple)</h3>
            
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                {/* Use the dynamically passed 'categories' prop */}
                {categories.map((category) => (
                    <label 
                        key={category} 
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition duration-150 hover:bg-gray-700/50"
                    >
                        <input
                            type="checkbox"
                            checked={selectedValues.includes(category)}
                            onChange={() => handleToggleCategory(category)}
                            className="form-checkbox text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">{category}</span>
                    </label>
                ))}
            </div>

            {/* Clear Filter Button */}
            <button
                onClick={handleClear}
                className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg"
            >
                Clear Filter
            </button>
        </div>
    );
};

// ----------------------------------------------------
// --- Filter Classifier Logic ---
// ----------------------------------------------------

// Helper function to check if a value is a non-empty string
const isString = (val: any): val is string => typeof val === 'string' && val.trim().length > 0;
const filterClassifier = (columnData: ColumnData, onFilterChange: FilterChangeCallback): React.ReactElement => {
  const values = columnData.filter((v) => v !== null && v !== undefined);
  const total = values.length;

  if (total === 0) {
    return <StringFilter onFilterChange={onFilterChange} />;
  }
  const isAllNumbers = values.every((val) => !isNaN(Number(val)) && typeof val !== 'boolean');  
  if (isAllNumbers) {
    return <NumberFilter onFilterChange={onFilterChange} />;
  }
  const isMostlyDates = values.filter((val) => !isNaN(Date.parse(String(val)))).length / total > 0.9;
  if (isMostlyDates) {
    return <DateFilter onFilterChange={onFilterChange} />;
  }
  const stringValues = values.filter(isString);
  const stringCount = stringValues.length;
  
  if (stringCount / total > 0.8) { 
    const uniqueValues = Array.from(new Set(stringValues));
    if (uniqueValues.length > 1 && uniqueValues.length / stringCount < 0.2) {
      return <CategoryFilter onFilterChange={onFilterChange} categories={uniqueValues} />;
    }
  }
  return <StringFilter onFilterChange={onFilterChange} />;
};

export default filterClassifier;