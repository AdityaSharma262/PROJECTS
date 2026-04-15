import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster.jsx";
import { Toaster as Sonner } from "@/components/ui/sonner.jsx";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { config } from "./lib/web3.js";
import Index from "./pages/Index.jsx";
import Discover from "./pages/Discover.jsx";
import Register from "./pages/Register.jsx";
import Manage from "./pages/Manage.jsx";
import Identity from "./pages/Identity.jsx";
import Ecosystem from "./pages/Ecosystem.jsx";
import Build from "./pages/Build.jsx";
import NotFound from "./pages/NotFound.jsx";
import Renew from "./pages/Renew.jsx";

const queryClient = new QueryClient();
const EDGE_WARNING_FLAG = "edgeWarningShown";
const EDGE_WARNING_MESSAGE = [
  "⚠️ Notice:",
  "",
  "Microsoft Edge has limited Web3 wallet support and may cause errors during registration.",
  "For the best experience, please use Chrome, Brave, or Firefox.",
].join("\n");

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldWarn = () => {
      const isEdge = typeof navigator !== "undefined" && navigator.userAgent?.includes("Edg/");
      const alreadyShown = window.localStorage.getItem(EDGE_WARNING_FLAG) === "true";
      return Boolean(isEdge && !alreadyShown);
    };

    const triggerWarning = () => {
      if (!shouldWarn()) return;
      window.alert(EDGE_WARNING_MESSAGE);
      window.localStorage.setItem(EDGE_WARNING_FLAG, "true");
    };

    const handleClick = (event) => {
      if (!event?.target || typeof event.target.closest !== "function") return;
      const el = event.target.closest('[data-edge-warning="trigger"]');
      if (el) {
        triggerWarning();
      }
    };

    // Fire once on initial visit.
    triggerWarning();

    window.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  // Debug: Check config
  console.log('Wagmi config:', config);
  console.log('Project ID in config:', config.projectId);
  
  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RainbowKitProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/renew" element={<Renew />} />
                  <Route path="/manage" element={<Manage />} />
                  <Route path="/identity" element={<Identity />} />
                  <Route path="/ecosystem" element={<Ecosystem />} />
                  <Route path="/build" element={<Build />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </RainbowKitProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};

export default App;