import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { KPIData, OrderData, CampaignData } from "@/types";

interface DashboardContextType {
  salesData: any[];
  adsData: any[];
  kpis: KPIData;
  isLoading: boolean;
  setSalesData: (data: any[]) => void;
  setAdsData: (data: any[]) => void;
  setKpis: (data: KPIData) => void;
  setIsLoading: (loading: boolean) => void;
}

const defaultKPIs: KPIData = {
  totalSales: 0,
  totalOrders: 0,
  roi: 0,
  cac: 0,
  conversionRate: 0,
  institutePercentage: 0,
  ecommercePercentage: 0,
  instituteSales: 0,
  ecommerceSales: 0
};

const DashboardContext = createContext<DashboardContextType>({
  salesData: [],
  adsData: [],
  kpis: defaultKPIs,
  isLoading: true,
  setSalesData: () => {},
  setAdsData: () => {},
  setKpis: () => {},
  setIsLoading: () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [adsData, setAdsData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<KPIData>(defaultKPIs);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <DashboardContext.Provider
      value={{
        salesData,
        adsData,
        kpis,
        isLoading,
        setSalesData,
        setAdsData,
        setKpis,
        setIsLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => useContext(DashboardContext);
