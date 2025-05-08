import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";

// Tratamento de erros global
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("🔴 Erro na renderização:", error);
    return (
      <div style={{ 
        padding: '20px', 
        margin: '20px', 
        border: '1px solid red',
        borderRadius: '8px',
        backgroundColor: '#fff1f0',
        color: '#cf1322'
      }}>
        <h2>Ocorreu um erro na aplicação</h2>
        <p>Por favor, verifique o console para mais detalhes.</p>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          {error instanceof Error ? error.stack : String(error)}
        </pre>
      </div>
    );
  }
};

// Registrar manipuladores de erro globais
window.addEventListener('error', (event) => {
  console.error('🔴 Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Promise rejeitada não tratada:', event.reason);
});

// Registra informações do ambiente
console.log('🔧 Ambiente:', process.env.NODE_ENV);
console.log('📁 Raiz do documento:', document.location.href);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Elemento root não encontrado!');
} else {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="terrafe-theme">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
