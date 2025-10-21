import { useState, useEffect, useCallback } from "react";
import React from 'react';

export type FilterCriteria = {
    type: string;
    value: string | string[] | null; 
};

export type FilterChangeCallback = (criteria: FilterCriteria) => void;
export type ColumnData = (string | number | Date | null | undefined)[];
type RowType = (string | number | null)[];

interface FilterProps {
    onFilterChange: FilterChangeCallback;
    currentCriteria?: FilterCriteria; 
}

interface CategoryFilterProps extends FilterProps { 
    categories: string[]; 
}

// --- Constants & Utilities ---
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GSHEETS_DATE_OFFSET = new Date(1899, 11, 30).getTime();

const gsheetsToDate = (value: number): string => {
    const date = new Date(GSHEETS_DATE_OFFSET + value * MS_PER_DAY);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// --- FILTER COMPONENTS ---

const DateFilter = ({ onFilterChange, currentCriteria }: FilterProps) => {
    const initialRawValue = currentCriteria?.value ? String(currentCriteria.value) : '';
    const initialType = currentCriteria?.type || 'equals';

    const [filterType, setFilterType] = useState<string>(initialType);
    const initialDateString = initialRawValue ? gsheetsToDate(Number(initialRawValue)).split(' ')[0] : '';
    const [dateValue, setDateValue] = useState<string>(initialDateString);
    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';

    useEffect(() => {
        let valueToSend: string | null = null;
        if (isValueRequired && dateValue) {
            const filterDate = new Date(dateValue);
            const filterSerial = (filterDate.getTime() - GSHEETS_DATE_OFFSET) / MS_PER_DAY;
            valueToSend = String(filterSerial); 
        }
        onFilterChange({ type: filterType, value: valueToSend });
    }, [filterType, dateValue, onFilterChange, isValueRequired]);

    const handleClear = () => { setFilterType('equals'); setDateValue(''); };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Date</h3>
            <div className="flex flex-col gap-3">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setDateValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md">
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="after">After (Start of Day)</option>
                    <option value="before">Before (Start of Day)</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>
                <input type="date" placeholder="Select Date" value={dateValue} onChange={(e) => setDateValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>
            <button onClick={handleClear} className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg">Clear Filter</button>
        </div>
    );
};

const NumberFilter = ({ onFilterChange, currentCriteria }: FilterProps) => {
    const initialType = currentCriteria?.type || 'equals';
    const initialValue = currentCriteria?.value ? String(currentCriteria.value) : '';

    const [filterType, setFilterType] = useState<string>(initialType);
    const [numberValue, setNumberValue] = useState<string>(initialValue);
    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';

    useEffect(() => {
        const valueToSend = isValueRequired ? (numberValue || null) : null;
        onFilterChange({ type: filterType, value: valueToSend });
    }, [filterType, numberValue, onFilterChange, isValueRequired]);

    const handleClear = () => { setFilterType('equals'); setNumberValue(''); };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Number</h3>
            <div className="flex flex-col gap-3">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setNumberValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md">
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="greater than">Greater Than</option>
                    <option value="less than">Less Than</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>
                <input type="number" placeholder="Enter Number" value={numberValue} onChange={(e) => setNumberValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>
            <button onClick={handleClear} className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg">Clear Filter</button>
        </div>
    );
};

const StringFilter = ({ onFilterChange, currentCriteria }: FilterProps) => {
    const initialType = currentCriteria?.type || 'contains';
    const initialValue = currentCriteria?.value ? String(currentCriteria.value) : '';

    const [filterType, setFilterType] = useState<string>(initialType);
    const [stringValue, setStringValue] = useState<string>(initialValue);
    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';
    
    useEffect(() => {
        const valueToSend = isValueRequired ? (stringValue || null) : null;
        onFilterChange({ type: filterType, value: valueToSend });
    }, [filterType, stringValue, onFilterChange, isValueRequired]);
    
    const handleClear = () => { setFilterType('contains'); setStringValue(''); };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">            
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Text</h3>
            <div className="flex flex-col gap-3">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setStringValue(''); }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-md">
                    <option value="contains">Contains</option>
                    <option value="not contains">Not Contains</option>
                    <option value="equals">Equals</option>
                    <option value="not equals">Not Equals</option>
                    <option value="starts with">Starts With</option>
                    <option value="ends with">Ends With</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                </select>
                <input type="text" placeholder="Enter Text" value={stringValue} onChange={(e) => setStringValue(e.target.value)}
                    className={`bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-md ${!isValueRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isValueRequired}
                />
            </div>
            <button onClick={handleClear} className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg">Clear Filter</button>
        </div>
    );
};

const CategoryFilter = ({ onFilterChange, categories, currentCriteria }: CategoryFilterProps) => {
    const initialSelected = Array.isArray(currentCriteria?.value) ? currentCriteria.value.map(String) : [];
    const filterType = 'in'; 
    const [selectedValues, setSelectedValues] = useState<string[]>(initialSelected);
    
    useEffect(() => {
        onFilterChange({ type: filterType, value: selectedValues.length > 0 ? selectedValues : null });
    }, [selectedValues, onFilterChange]);

    const handleToggleCategory = useCallback((category: string) => {
        setSelectedValues(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    }, []);

    const handleClear = () => { setSelectedValues([]); };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">            
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Category (Select Multiple)</h3>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                {categories.map(category => (
                    <label key={category} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition duration-150 hover:bg-gray-700/50">
                        <input type="checkbox" checked={selectedValues.includes(category)} onChange={() => handleToggleCategory(category)}
                            className="form-checkbox text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">{category}</span>
                    </label>
                ))}
            </div>
            <button onClick={handleClear} className="bg-blue-600 text-white rounded-lg p-2 text-sm font-medium hover:bg-blue-700 transition duration-200 shadow-lg">Clear Filter</button>
        </div>
    );
};

// --- FILTER LOGIC ---

const isGSheetsSerial = (val: any): val is number => {
    if (typeof val !== 'number') return false;
    if (val < 1 || val > 70000) return false;
    if (Number.isInteger(val) && val < 500) return false; 
    return val % 1 !== 0 || val > 500;
};

const filterClassifier = (columnData: ColumnData, currentCriteria: FilterCriteria | undefined, onFilterChange: FilterChangeCallback): React.ReactElement => {
    const rawValues = columnData.filter(v => v !== null && v !== undefined);
    const total = rawValues.length;
    const baseProps = { onFilterChange, currentCriteria };

    if (total === 0) return <StringFilter {...baseProps} />;

    const gsheetsCount = rawValues.filter(isGSheetsSerial).length;
    if (gsheetsCount / total > 0.9) return <DateFilter {...baseProps} />;

    const uniqueValues = Array.from(new Set(rawValues.map(String))).filter(s => s.trim().length > 0) as string[];
    if (uniqueValues.length > 1 && uniqueValues.length <= 50) return <CategoryFilter {...baseProps as CategoryFilterProps} categories={uniqueValues} />;

    const isAllNumbers = rawValues.every(val => !isNaN(Number(val)) && typeof val !== 'boolean');
    if (isAllNumbers) return <NumberFilter {...baseProps} />;

    return <StringFilter {...baseProps} />;
};

const applyFilter = (row: RowType, colIndex: number, criteria: FilterCriteria) => {
    const cellValue = row[colIndex];
    const { type, value } = criteria;

    const isCellEmpty = cellValue === null || cellValue === '';
    if (type === 'empty') return isCellEmpty;
    if (type === 'not empty') return !isCellEmpty;
    if (isCellEmpty) return false;

    const cellStr = String(cellValue).toLowerCase();
    const cellNum = Number(cellValue);

    let filterValue: string | string[] | null = null;
    if (value !== null) {
        filterValue = Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : String(value).toLowerCase();
    }

    const isDateOperation = type === 'after' || type === 'before';
    const cellValueForComparison: number = isDateOperation ? cellNum : cellNum;

    switch (type) {
        case 'contains': return cellStr.includes(filterValue as string);
        case 'not contains': return !cellStr.includes(filterValue as string);
        case 'starts with': return cellStr.startsWith(filterValue as string);
        case 'ends with': return cellStr.endsWith(filterValue as string);
        case 'equals': return cellStr === filterValue;
        case 'not equals': return cellStr !== filterValue;
        case 'in': return Array.isArray(filterValue) && filterValue.includes(cellStr);
        case 'greater than': return !isNaN(cellNum) && cellNum > Number(value);
        case 'less than': return !isNaN(cellNum) && cellNum < Number(value);
        case 'after': return cellValueForComparison > Number(value);
        case 'before': return cellValueForComparison < Number(value);
        default: return true;
    }
};

export { filterClassifier, applyFilter };
