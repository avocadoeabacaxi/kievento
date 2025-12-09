import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "./_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PublicHome from "./pages/PublicHome";
import ProfilePage from "./pages/ProfilePage";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import RegisterPage from "./pages/RegisterPage";
import TicketPage from "./pages/TicketPage";
import ScannerPage from "./pages/ScannerPage";
import AdminDashboard from "./pages/AdminDashboard";
import SiteSettings from "./pages/SiteSettings";
import EmailSettingsPage from "./pages/EmailSettingsPage";
import AcceptInvite from "./pages/AcceptInvite";
import CheckinPage from "./pages/CheckinPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import MyTickets from "./pages/MyTickets";
import PublicEvent from "./pages/PublicEvent";
import NotFound from "./pages/NotFound";

function Router() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Verificar se há inscrição pendente após login
    if (isAuthenticated) {
      const pendingData = sessionStorage.getItem('pendingRegistration');
      if (pendingData) {
        // Remover dados do sessionStorage
        sessionStorage.removeItem('pendingRegistration');
        
        // Processar inscrição automaticamente
        const { eventId, formData, ticketTypeId } = JSON.parse(pendingData);
        
        // Redirecionar para a página de inscrição com parâmetro para processar
        sessionStorage.setItem('autoSubmitRegistration', pendingData);
        setLocation(`/register/${eventId}`);
        return;
      }
      
      // Verificar se há redirecionamento pendente após login
      const cookies = document.cookie.split('; ');
      const redirectCookie = cookies.find(c => c.startsWith('redirectAfterLogin='));
      if (redirectCookie) {
        const redirectPath = decodeURIComponent(redirectCookie.split('=')[1]);
        // Remover cookie
        document.cookie = 'redirectAfterLogin=; path=/; max-age=0';
        setLocation(redirectPath);
      }
    }
  }, [isAuthenticated, setLocation]);

  return (
    <Switch>
      <Route path={"/"} component={PublicHome} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/settings" component={SiteSettings} />
      <Route path="/admin/email-settings" component={EmailSettingsPage} />
        <Route path="/invite/:token" component={AcceptInvite} />
        <Route path="/events/:id/checkin" component={CheckinPage} />
      <Route path="/termos" component={TermsPage} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path={"/events/new"} component={CreateEvent} />
      <Route path={"/events/edit/:id"} component={CreateEvent} />
      <Route path="/e/:slug" component={PublicEvent} />
      <Route path="/events/:id" component={EventDetails} />
      <Route path="/events/:id/scan" component={ScannerPage} />
      <Route path="/register/:id" component={RegisterPage} />
      <Route path="/ticket/:qrCode" component={TicketPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
