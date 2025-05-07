import { Route, Switch } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

// Componente básico para testar renderização
const TestPage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>TerraFé Dashboard</h1>
    <p style={{ marginBottom: '1rem' }}>Se você está vendo esta mensagem, a renderização básica está funcionando!</p>
    <p>Verifique o console para mais detalhes sobre possíveis erros.</p>
    
    <div style={{ marginTop: '2rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '0.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Estado do Projeto</h2>
      <p>Estamos fazendo ajustes para resolver os problemas de renderização.</p>
      <ul style={{ listStyleType: 'disc', paddingLeft: '2rem' }}>
        <li>Simplificamos o layout para diagnóstico</li>
        <li>Removemos componentes problemáticos temporariamente</li>
        <li>Em breve o dashboard completo estará disponível</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="terrafe-theme">
      <Switch>
        <Route path="/" component={TestPage} />
        <Route component={NotFound} />
      </Switch>
    </ThemeProvider>
  );
}

export default App;
