import { useState, useEffect, useCallback } from "react";
import React from 'react';

export type FilterCriteria = {
    type: string;
    // value can be a single string/date/number, or an array for category multi-select.
    value: string | string[] | null; 
};

/** Defines the callback function used by the parent to receive filter criteria. */
export type FilterChangeCallback = (criteria: FilterCriteria) => void;

/** Define the type for the column data (an array of values for a single column). */
export type ColumnData = (string | number | Date | null | undefined)[];

/** Base props structure for most filters. */
interface FilterProps {
    onFilterChange: FilterChangeCallback;
    // Optionally pass current criteria for re-initialization
    currentCriteria?: FilterCriteria; 
}

/** Specific Props for Category Filter (Requires Options) */
interface CategoryFilterProps extends FilterProps {
    categories: string[]; 
}
// --- FILTER COMPONENTS & LOGIC ---

type RowType = (string | number | null)[];
interface CategoryFilterProps extends FilterProps { categories: string[]; }



// --- FILTER COMPONENTS (Moved to be embedded) ---

const DateFilter = ({ onFilterChange, currentCriteria }: FilterProps) => {
    // The initial value from criteria will be the RAW GSheets serial number (a string of a number, e.g., "45514.5109...")
    const initialRawValue = typeof currentCriteria?.value === 'string' ? currentCriteria.value : '';
    const initialType = currentCriteria?.type || 'equals';

    const [filterType, setFilterType] = useState<string>(initialType);
    
    // Date input requires YYYY-MM-DD format. We convert the serial number to this format for the input field.
    const initialDateString = initialRawValue ? gsheetsToDate(Number(initialRawValue)).split(' ')[0] : '';
    const [dateValue, setDateValue] = useState<string>(initialDateString);
    
    const isValueRequired = filterType !== 'empty' && filterType !== 'not empty';
    
    // Auto-fire callback on state change
    useEffect(() => {
        let valueToSend: string | null = null;
        if (isValueRequired && dateValue) {
            // When setting the filter, we must convert the input date string back to the GSheets serial equivalent
            // for the `applyFilter` function to compare against the raw data.
            const filterDate = new Date(dateValue);
            // We use the UTC time to prevent timezone offset from shifting the date
            const filterSerial = (filterDate.getTime() - GSHEETS_DATE_OFFSET) / MS_PER_DAY;
            
            // Send the raw serial number as a string to maintain consistency in FilterCriteria
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
                    <option value="equals">Equals</option><option value="not equals">Not Equals</option>
                    <option value="after">After (Start of Day)</option><option value="before">Before (Start of Day)</option>
                    <option value="empty">Empty</option><option value="not empty">Not Empty</option>
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
    const initialValue = typeof currentCriteria?.value === 'string' ? currentCriteria.value : '';

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
                    <option value="equals">Equals</option><option value="not equals">Not Equals</option>
                    <option value="greater than">Greater Than</option><option value="less than">Less Than</option>
                    <option value="empty">Empty</option><option value="not empty">Not Empty</option>
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
    const initialValue = typeof currentCriteria?.value === 'string' ? currentCriteria.value : '';

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
                    <option value="contains">Contains</option><option value="not contains">Not Contains</option>
                    <option value="equals">Equals</option><option value="not equals">Not Equals</option>
                    <option value="starts with">Starts With</option><option value="ends with">Ends With</option>
                    <option value="empty">Empty</option><option value="not empty">Not Empty</option>
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
    }, [selectedValues, onFilterChange, filterType]);

    const handleToggleCategory = useCallback((category: string) => {
        setSelectedValues(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category) : [...prev, category]
        );
    }, []);

    const handleClear = () => { setSelectedValues([]); };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-xl w-72">            
            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Filter by Category (Select Multiple)</h3>
            
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                {categories.map((category) => (
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

// --- FILTER CLASSIFICATION LOGIC (Embedded) ---

const isString = (val: any): val is string => typeof val === 'string' && val.trim().length > 0;

/**
 * Checks if a value is a likely GSheets date serial number (number with decimals 
 * and within a plausible range for dates).
 */
const isGSheetsSerial = (val: any): val is number => {
    // 1. Must be a number (float or integer)
    if (typeof val !== 'number') return false;
    
    // 2. Must be in a plausible date serial range (1 to 70000 is generous, covering 1900 to ~2092)
    if (val < 1 || val > 70000) return false;

    // 3. Must not be a simple integer index (e.g., 1, 2, 3, 4, 5). This prevents small indices being classified as dates.
    // We only treat integers > 500 as potential dates, relying on the high density of dates for classification.
    if (Number.isInteger(val) && val < 500) return false; 
    
    // The presence of a fractional part (time component) strongly suggests a date
    if (val % 1 !== 0) return true;
    
    // If it's a large integer > 500, it's still possible it's an old date (like a year 1901 date serial).
    return true; 
};

/**
 * Classifies the type of filter appropriate for the given column data.
 */
const filterClassifier = (columnData: ColumnData, currentCriteria: FilterCriteria | undefined, onFilterChange: FilterChangeCallback): React.ReactElement => {
  const rawValues = columnData.filter((v) => v !== null && v !== undefined);
  const total = rawValues.length;
  const baseProps = { onFilterChange, currentCriteria }; 

  if (total === 0) return <StringFilter {...baseProps} />;
  
  // 1. Check for GSheets Date Serials (High Priority for numbers)
  const gsheetsCount = rawValues.filter(isGSheetsSerial).length;
  
  // Heuristic: If 90% or more of the non-null values look like GSheets serials, treat it as a Date column.
  if (gsheetsCount / total > 0.90) {
    return <DateFilter {...baseProps} />;
  }

  // 2. Check for Category (applies to low cardinality non-date/non-null values)
  const uniqueValues = Array.from(new Set(rawValues.map(String))).filter(s => String(s).trim().length > 0) as string[];
  const uniqueCount = uniqueValues.length;
  
  // Category Heuristic: Must have >1 unique value, <50 total categories.
  if (uniqueCount > 1 && uniqueCount <= 50) {
    return <CategoryFilter {...baseProps as CategoryFilterProps} categories={uniqueValues} />;
  }
  
  // 3. Check for pure numbers (Number Filter)
  const isAllNumbers = rawValues.every((val) => !isNaN(Number(val)) && typeof val !== 'boolean');  
  if (isAllNumbers) {
      return <NumberFilter {...baseProps} />;
  }
  
  // 4. Default to String Filter
  return <StringFilter {...baseProps} />;
};

/**
 * Applies a single column filter rule to a given row.
 */
const applyFilter = (row: RowType, colIndex: number, criteria: FilterCriteria) => {
    const cellValue = row[colIndex];
    const { type, value } = criteria;

    const isCellEmpty = cellValue === null || cellValue === '';
    if (type === 'empty') return isCellEmpty;
    if (type === 'not empty') return !isCellEmpty;
    if (isCellEmpty) return false;

    // Use string (lowercase) for text, category, and comparison matching
    const cellStr = String(cellValue).toLowerCase();
    const cellNum = Number(cellValue);

    let filterValue: string | string[] | null = null;
    if (value !== null) {
        filterValue = Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : String(value).toLowerCase();
    }

    // Determine if we should treat the cell value as a date serial for numerical comparisons
    const isDateOperation = type === 'after' || type === 'before';
    let cellValueForComparison: number | string = cellValue as number; 

    // Date serial logic: For date comparisons, we use the raw number.
    if (isDateOperation) {
        // The cellValue is the raw number (e.g., 45514.5109). We compare it numerically to the filter serial number.
        cellValueForComparison = cellNum;
    }


    switch (type) {
        // String/Text & General Equality Filters
        case 'contains': return cellStr.includes(filterValue as string);
        case 'not contains': return !cellStr.includes(filterValue as string);
        case 'starts with': return cellStr.startsWith(filterValue as string);
        case 'ends with': return cellStr.endsWith(filterValue as string);
        case 'equals': return cellStr === filterValue;
        case 'not equals': return cellStr !== filterValue;
        
        // Category Filter (works for low-cardinality values)
        case 'in': return Array.isArray(filterValue) && filterValue.includes(cellStr);
        
        // Number Filters
        case 'greater than': return !isNaN(cellNum) && cellNum > Number(value);
        case 'less than': return !isNaN(cellNum) && cellNum < Number(value);
        
        // Date Filters (Value is guaranteed to be a GSheets serial string/number at this point)
        case 'after': 
            // Compare the raw cell serial number against the filter serial number
            return (cellValueForComparison as number) > Number(value);
        case 'before': 
            return (cellValueForComparison as number) < Number(value);
            
        default: return true;
    }
}
// --- END FILTER COMPONENTS & LOGIC ---


export { filterClassifier, applyFilter };
