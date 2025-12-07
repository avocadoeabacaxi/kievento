import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
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
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={PublicHome} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path={"/events/new"} component={CreateEvent} />
      <Route path={"/events/edit/:id"} component={CreateEvent} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
