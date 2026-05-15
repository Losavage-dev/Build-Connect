import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireCompleteProfile from "@/components/RequireCompleteProfile";
import SupabaseConfigGuard from "@/components/SupabaseConfigGuard";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import CompanyProfile from "./pages/CompanyProfile";
import ManageCompany from "./pages/ManageCompany";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CompleteProfile from "./pages/CompleteProfile";
import CreateCompany from "./pages/CreateCompany";
import Tenders from "./pages/Tenders";
import Services from "./pages/Services";
import Materials from "./pages/Materials";
import Chat from "./pages/Chat";
import PromoFeed from "./pages/PromoFeed";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";
import Contacts from "./pages/Contacts";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Moderation from "./pages/Moderation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SupabaseConfigGuard>
        <Toaster />
        <Sonner position="bottom-right" />
        <BrowserRouter>
          <RequireCompleteProfile>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<PromoFeed />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/services" element={<Services />} />
            <Route path="/materials" element={<Materials />} />

            {/* Onboarding (только авторизованные) */}
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

            {/* Protected routes (any authenticated user) */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat/:requestId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            {/* Protected routes (contractors & suppliers only) */}
            <Route
              path="/create-company"
              element={
                <ProtectedRoute allowedRoles={["client", "contractor", "supplier"]}>
                  <CreateCompany />
                </ProtectedRoute>
              }
            />
            <Route path="/company/:id/manage" element={<ProtectedRoute><ManageCompany /></ProtectedRoute>} />
            <Route
              path="/moderation"
              element={
                <ProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <Moderation />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </RequireCompleteProfile>
        </BrowserRouter>
        </SupabaseConfigGuard>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
