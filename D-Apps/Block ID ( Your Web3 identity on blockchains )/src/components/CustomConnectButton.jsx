import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUserDomain } from "@/hooks/useUserDomain.js";

/**
 * Custom ConnectButton component that displays the user's primary domain name
 * instead of the truncated wallet address.
 * 
 * Uses ConnectButton.Custom to override only the display text while keeping
 * all RainbowKit functionality (dropdown, disconnect, account details, chain switch).
 */
const CustomConnectButton = () => {
  // Debug: Check if environment variable is loaded
  console.log('VITE_WALLETCONNECT_PROJECT_ID:', import.meta.env.VITE_WALLETCONNECT_PROJECT_ID);
  console.log('Project ID in web3.js:', globalThis.projectId);
  
  // Check if projectId is valid
  if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || import.meta.env.VITE_WALLETCONNECT_PROJECT_ID === 'YOUR_WALLETCONNECT_PROJECT_ID') {
    console.error('Invalid WalletConnect Project ID!');
    return (
      <button 
        disabled
        style={{
          padding: '10px 20px',
          borderRadius: '12px',
          backgroundColor: '#ef4444',
          color: 'white',
          cursor: 'not-allowed',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Wallet Config Error
      </button>
    );
  }
  
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        // Get domain name from resolver
        const { domainName, isLoading: isLoadingDomain } = useUserDomain(account?.address);

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="rk-connect-button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#0072f2',
                      color: 'hsl(var(--primary-foreground))',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button" 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Wrong network
                  </button>
                );
              }

              // Determine display text: domain name if available, otherwise address
              const shortenAddress = (addr) => {
                if (!addr) return "";
                return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
              };

              const displayText = !isLoadingDomain && domainName && domainName.trim() !== '' 
                ? domainName.trim() 
                : (account?.displayName || shortenAddress(account?.address));

              return (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Chain selector button */}
                  {chain.hasIcon && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
                      }}
                    >
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                      {chain.name}
                    </button>
                  )}

                  {/* Account button - always show to expose disconnect in RainbowKit */}
                  <div
                    onClick={openAccountModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openAccountModal();
                      }
                    }}
                    style={{
                      border: '1px solid white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'transparent',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {displayText || 'Account'}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;