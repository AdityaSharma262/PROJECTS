const Header = ({ account, onConnect, onDisconnect, onNavigate, currentPage }) => {
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              BlockLance
            </span>
          </div>

          {/* Navigation */}
          {account && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('client')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'client'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Client Dashboard
              </button>
              <button
                onClick={() => onNavigate('freelancer')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'freelancer'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Freelancer Dashboard
              </button>
            </nav>
          )}

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {account ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                className="btn-primary text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Connect Wallet
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
