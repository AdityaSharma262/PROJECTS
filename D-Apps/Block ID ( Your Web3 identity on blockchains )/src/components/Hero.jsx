import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SUPPORTED_TLDS,
  parseDomainInput,
  fetchDomainQuote,
  formatPrice,
} from "@/lib/apolloId.js";

const Hero = () => {
  const [searchInput, setSearchInput] = useState("");
  const [selectedTld, setSelectedTld] = useState("bnb");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const formatExpiryDate = (expirySeconds) => {
    if (!expirySeconds) return "-";
    const ms = Number(expirySeconds) * 1000;
    if (Number.isNaN(ms)) return "-";
    return new Date(ms).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isDomainExpired = (expirySeconds) => {
    if (!expirySeconds) return false;
    const ms = Number(expirySeconds) * 1000;
    if (Number.isNaN(ms)) return false;
    return ms < Date.now();
  };

  const onSearch = async () => {
    try {
      setIsSearching(true);
      setSearchError(null);
      setSearchResult(null);
      const parsed = parseDomainInput(searchInput, selectedTld);
      const quote = await fetchDomainQuote({ label: parsed.label, tld: parsed.tld, years: 1, isRegistration: true });
      setSearchResult({
        ...quote,
        status: quote.available ? "available" : "unavailable",
      });
    } catch (err) {
      setSearchError(err?.message || "Unable to check domain");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateToRegister = () => {
    if (!searchResult) return;
    const params = new URLSearchParams({
      name: searchResult.label,
      tld: searchResult.tld,
    });
    navigate(`/register?${params.toString()}`);
  };

  return (
    <section className="slider relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-5 lg:py-8" style={{paddingTop: '5rem', paddingBottom: '8rem'}}>
        <div className="mx-auto text-center">
          {/* Badge */}
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="sltitle text-4xl md:text-6xl font-bold" style={{lineHeight: '1.2'}}
          >
            Decentralized Identity Protocol
            <br></br>
            <span>Build trustless digital identities on blockchain</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="sloge text-lg text-muted-foreground mx-auto" style={{maxWidth: '70rem'}}
          >
            Verify credentials, manage reputation, and control your data without intermediaries. Your identity, your rules, your blockchain.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto w-full"
          >
            <div className="searchbox flex flex-col gap-3 p-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-lg mt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="srchd flex-grow flex items-center gap-6 px-3 border rounded-xl bg-background">
                  <Search className="searchbox text-muted-foreground" style={{width: '1.25rem', height: '1.25rem'}} />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search for your domain"
                    className="searchdiv flex-1 min-w-0 bg-transparent border-0 outline-none text-foreground"
                  />
                </div>
                <select
                  className="p-2 bg-background border rounded text-lg uppercase font-semibold"
                  value={selectedTld}
                  onChange={(e) => setSelectedTld(e.target.value)}
                >
                  {SUPPORTED_TLDS.map((tld) => (
                    <option key={tld} value={tld}>
                      .{tld}
                    </option>
                  ))}
                </select>
                 
              
             <Button
               variant="hero"
               size="lg"
               className="Searchbtn w-100"
               onClick={onSearch}
               disabled={isSearching}
               data-edge-warning="trigger"
             >
                {isSearching ? "Checking..." : "Search"} 
              </Button>
              </div>
            </div>
            {searchError && (
              <div className="mt-3">
                <span className="text-warning font-semibold">{searchError}</span>
              </div>
            )}
            {searchResult && (
              <div className="mt-3 p-3 border rounded-2xl bg-card/70 text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="mb-0 text-muted-foreground">Normalized Name</p>
                    <h5 className="mb-0 text-foreground">{searchResult.label}.{searchResult.tld}</h5>
                  </div>
                  <div>
                    <p className="mb-0 text-muted-foreground">Status</p>
                    <span className={`font-semibold ${searchResult.status === "available" ? "text-success" : "text-danger"}`}>
                      {searchResult.status === "available" ? "✔ Available" : "❌ Not Available"}
                    </span>
                  </div>
                  <div>
                    <p className="mb-0 text-muted-foreground">Price / Year</p>
                    <span className="font-semibold text-primary">{formatPrice(searchResult.pricePerYear, searchResult.tld)}</span>
                  </div>
                  {searchResult.status === "available" && (
                    <Button
                      variant="electric"
                      size="lg"
                      onClick={handleNavigateToRegister}
                      data-edge-warning="trigger"
                    >
                      Register {searchResult.label}.{searchResult.tld}
                    </Button>
                  )}
                </div>
                {searchResult.status === "unavailable" && (
                  <div className="mt-3">
                    <p className="text-warning small mb-1">This domain is already registered.</p>
                    {searchResult.expiry && (
                      <p className="text-muted small mb-0">
                        {isDomainExpired(searchResult.expiry) ? (
                          <span className="text-danger">This domain has expired and can be claimed.</span>
                        ) : (
                          <>
                            Expiration date:{" "}
                            <span className="font-semibold">{formatExpiryDate(searchResult.expiry)}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
          </motion.div>

         
        </div>
      </div>
      {/* Animated Gradient Orbs */}
    </section>
  );
};

export default Hero;
