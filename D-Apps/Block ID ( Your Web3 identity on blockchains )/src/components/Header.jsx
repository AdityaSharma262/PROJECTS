import { Button } from "@/components/ui/button.jsx";
import { Wallet, Menu, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Link } from "react-router-dom";
import CustomConnectButton from "./CustomConnectButton.jsx";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import { useTheme } from "@/contexts/ThemeContext.jsx";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Get connected address from RainbowKit (if using WalletConnect)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  
  // Use our custom hook that works with all wallet providers
  const { address: customAddress, isConnected: customConnected } = useWalletAddress();
  
  // Prefer wagmi address if connected, otherwise use custom wallet address
  const connectedAddress = wagmiConnected ? wagmiAddress : customAddress;
  const isConnected = wagmiConnected || customConnected;

  const navItems = [
    { label: "Home", href: "/" },
    // { label: "Discover", href: "/discover" },
    { label: "Register", href: "/register" },
    { label: "Renew", href: "/renew" },
    { label: "Manage", href: "/manage" },
    // { label: "Identity", href: "/identity" },

    // { label: "Build/API", href: "/build" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-border bg-background/80 backdrop-blur-lg">
      <div className="w-full px-4 mx-auto">
        <div className="flex items-center justify-between" 
     style={{height: '6rem', marginLeft: 'auto'}}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-0"
          >
            <div className="flex items-center py-2">
             <a href="/">
               <img 
                 src="/bitethwork.png" 
                 alt="Bitethwork Logo" 
                 className="h-16 w-auto object-contain "
               />
             </a>
          
            </div>
           
          </motion.div>

          {/* Desktop Navigation */}
         

          {/* Wallet Connect Button and Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
                       
            <div className="ConnectButton hidden sm:flex items-center gap-6">
              <nav className="hidden lg:flex items-center gap-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 no-underline"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-muted transition-colors duration-200"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" />
                )}
              </Button>

              <div className="ml-4">
                {import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? (
                  <CustomConnectButton />
                ) : (
                  <Button
                    onClick={async () => {
                      // Use the same provider detection logic
                      const injected = window.apolloWallet || window.myCustomWallet || window.ethereum;
                      if (!injected) return;
                      try {
                        await injected.request({ method: "eth_requestAccounts" });
                        const accounts = await injected.request({ method: "eth_accounts" });
                        // The useWalletAddress hook will automatically update the state
                      } catch (_) {}
                    }}
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
            
            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              {/* Mobile Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="lg:hidden rounded-full hover:bg-muted transition-colors duration-200"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" />
                )}
              </Button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-foreground"
              >
                <Menu className="" style={{width: '1.5rem', height: '1.5rem'}} />
              </button>
            </div>
          </motion.div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden py-4 gap-3 border-t border-border flex flex-col"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2 no-underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="w-full sm:hidden">
              {import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? (
                <CustomConnectButton />
              ) : (
                <Button
                  onClick={async () => {
                    // Use the same provider detection logic
                    const injected = window.apolloWallet || window.myCustomWallet || window.ethereum;
                    if (!injected) return;
                    try {
                      await injected.request({ method: "eth_requestAccounts" });
                      const accounts = await injected.request({ method: "eth_accounts" });
                      // The useWalletAddress hook will automatically update the state
                    } catch (_) {}
                  }}
                  className="w-100"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  );
};

export default Header;