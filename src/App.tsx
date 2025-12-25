import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Applications from "@/pages/admin/Applications";
import Members from "@/pages/admin/Members";
import Templates from "@/pages/admin/Templates";
import PriorityInviteList from "@/pages/admin/PriorityInviteList";
import AgendaEditor from "@/pages/admin/AgendaEditor";
import PerksEditor from "@/pages/admin/PerksEditor";
import CheckIn from "@/pages/admin/CheckIn";
import PassPage from "@/pages/member/PassPage";
import SharePage from "@/pages/member/SharePage";
import ClaimPage from "@/pages/ClaimPage";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="applications" element={<Applications />} />
              <Route path="members" element={<Members />} />
              <Route path="templates" element={<Templates />} />
              <Route path="priority-invites" element={<PriorityInviteList />} />
              <Route path="agenda" element={<AgendaEditor />} />
              <Route path="perks" element={<PerksEditor />} />
              <Route path="check-in" element={<CheckIn />} />
            </Route>

            {/* Public Pass Route */}
            <Route path="/pass/:id" element={<PassPage />} />
            {/* Public Share Route */}
            <Route path="/p/:id" element={<SharePage />} />
            {/* Claim Invite Route */}
            <Route path="/claim/:token" element={<ClaimPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
