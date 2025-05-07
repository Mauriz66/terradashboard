import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Cache de dados para evitar requisições desnecessárias
const dataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Função para verificar se os dados em cache estão expirados
const isCacheExpired = (key: string): boolean => {
  const cached = dataCache.get(key);
  if (!cached) return true;
  
  const now = Date.now();
  return (now - cached.timestamp) > CACHE_DURATION;
};

// Função para obter dados, buscando do cache primeiro se disponível
export const fetchWithCache = async (url: string): Promise<any> => {
  // Se não estiver em cache ou o cache expirou, buscar novos dados
  if (isCacheExpired(url)) {
    try {
      const response = await fetch(url, { credentials: "include" });
      await throwIfResNotOk(response);
      const data = await response.json();
      
      // Atualizar o cache
      dataCache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Em caso de erro, tentar usar o cache mesmo que expirado
      const cached = dataCache.get(url);
      if (cached) {
        console.warn(`Falha ao buscar dados atualizados de ${url}, usando cache expirado.`);
        return cached.data;
      }
      throw error;
    }
  }
  
  // Retornar dados do cache
  return dataCache.get(url)!.data;
};

// Limpar o cache
export const clearCache = (url?: string) => {
  if (url) {
    dataCache.delete(url);
  } else {
    dataCache.clear();
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      return await fetchWithCache(url);
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.message?.includes("401")) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
    },
    mutations: {
      retry: false,
      // Limpar cache relacionado quando uma mutação for bem-sucedida
      onSuccess: () => {
        // Dados provavelmente mudaram, limpar cache relacionado
        clearCache('/api/orders');
        clearCache('/api/campaigns');
      },
    },
  },
});
