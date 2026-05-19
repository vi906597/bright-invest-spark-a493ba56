import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import SIPCalculator from "./pages/SIPCalculator";
import TransactionHistory from "./pages/TransactionHistory";
import Portfolio from "./pages/Portfolio";
import MorePage from "./pages/MorePage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculator" element={<SIPCalculator />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/secure-admin-92/login" element={<AdminLogin />} />
          <Route path="/secure-admin-92" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
