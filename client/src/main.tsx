import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";

// Logging para diagnóstico
console.log("Inicializando aplicação TerraFé Dashboard...");

// Função para renderização segura
const renderApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Elemento root não encontrado!");
    return;
  }
  
  try {
    console.log("Renderizando aplicação...");
    
    createRoot(rootElement).render(
      <StrictMode>
        <ThemeProvider defaultTheme="light" storageKey="terrafe-theme">
          <App />
        </ThemeProvider>
      </StrictMode>
    );
    
    console.log("Renderização concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante renderização:", error);
    
    // Mostrar mensagem de erro visual
    rootElement.innerHTML = `
      <div style="padding: 20px; margin: 20px; border: 1px solid red; border-radius: 5px; background-color: #ffeeee; color: red; font-family: monospace;">
        <h2>Erro durante renderização:</h2>
        <pre>${error instanceof Error ? error.message : 'Erro desconhecido'}</pre>
        <h3>Stack:</h3>
        <pre>${error instanceof Error ? error.stack : ''}</pre>
      </div>
    `;
  }
};

// Executar renderização
renderApp();
