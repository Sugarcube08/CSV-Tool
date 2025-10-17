import { createContext, useContext, useState, ReactNode } from 'react';

type CSVContent = {
  json: object[];
  array: (string | number | null)[][];
};

type CSVData = {
  file: File | null;
  content: CSVContent | null;
};

type CSVContextType = {
  csvData: CSVData;
  setCSVData: (data: CSVData) => void;
};


const CSVContext = createContext<CSVContextType | undefined>(undefined);

export const useCSV = () => {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSV must be used within a CSVProvider');
  }
  return context;
};

export const CSVProvider = ({ children }: { children: ReactNode }) => {
  const [csvData, setCSVData] = useState<CSVData>({ file: null, content: null });

  return (
    <CSVContext.Provider value={{ csvData, setCSVData }}>
      {children}
    </CSVContext.Provider>
  );
};
