import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/contexts/WalletContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Portfolio from "./pages/Portfolio";
import AssetDetail from "./pages/AssetDetail";
import Admin from "./pages/Admin";
import Transactions from "./pages/Transactions";
import Trade from "./pages/Trade";
import KYC from "./pages/KYC";
import Tokenize from "./pages/Tokenize";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/asset/:id" element={<AssetDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/kyc" element={<KYC />} />
                <Route path="/tokenize" element={<Tokenize />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WalletProvider>
  </ThemeProvider>
);

export default App;
