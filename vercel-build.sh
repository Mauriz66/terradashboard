#!/bin/bash
set -e

echo "✅ Iniciando build no Vercel..."

# Instalar dependências na raiz
echo "✅ Instalando dependências na raiz..."
npm install

# Entrar na pasta client e instalar as dependências específicas
echo "✅ Entrando na pasta client e instalando dependências..."
cd client

# Verificar se temos o package.json, se não, criar
if [ ! -f package.json ]; then
  echo "⚠️ Não encontramos o package.json do client, criando..."
  cat > package.json << 'EOL'
{
  "name": "terrafe-dashboard-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.60.5",
    "recharts": "^2.15.2",
    "lucide-react": "^0.453.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  }
}
EOL
fi

npm install

# Criar arquivo de configuração Tailwind
echo "✅ Configurando TailwindCSS..."
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOL

# Configurar PostCSS
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Modificar arquivo CSS para corrigir o erro border-border
mkdir -p src
if [ -f src/index.css ]; then
  # Substituir a linha com border-border
  sed -i 's/@apply border-border;/@apply border-0;/g' src/index.css
  echo "✅ Corrigido arquivo index.css"
fi

# Criar manualmente o arquivo de components theme provider caso não exista
mkdir -p src/components
if [ ! -f src/components/theme-provider.tsx ]; then
  echo "⚠️ Não encontramos o ThemeProvider, criando..."
  cat > src/components/theme-provider.tsx << 'EOL'
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "terrafe-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
EOL
fi

# Criar um vite.config.js específico para o build
echo "✅ Configurando Vite para o build..."
cat > vite.config.ts << 'EOL'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});
EOL

# Executar o build do cliente
echo "✅ Executando build do cliente..."
npm run build

# Voltar para a raiz e construir o servidor
echo "✅ Voltando para a raiz e construindo o servidor..."
cd ..

# Certificar que a pasta dist existe
mkdir -p dist

# Criar a pasta api que o Vercel espera
mkdir -p api

# Executar o build do servidor e colocar na pasta api
echo "✅ Construindo a API para a pasta api/..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=api/index.js

echo "✅ Build concluído com sucesso!" 