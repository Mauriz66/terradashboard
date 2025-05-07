import React, { createContext, useContext, useState, ReactNode } from "react";
import { FilterState, DateRangeType } from "@/types";

interface FilterContextType {
  filters: FilterState;
  updateFilters: (filters: FilterState) => void;
}

const defaultDateRange: DateRangeType = {
  from: new Date('2025-04-01'),
  to: new Date('2025-04-30')
};

const defaultFilters: FilterState = {
  dateRange: defaultDateRange,
  category: 'all',
  product: '',
  state: 'all',
  orderStatus: 'all'
};

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  updateFilters: () => {},
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilterContext = () => useContext(FilterContext);
