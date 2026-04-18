import React from "react";

const Footer = () => {
  const links = {
    product: [
      { label: "Discover", href: "#discover" },
      { label: "Register", href: "#register" },
      { label: "Manage", href: "#manage" },
      { label: "Identity", href: "#identity" },
    ],
    company: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
  };

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Links Section */}
        <div className="footer-links-grid">
          {/* Brand */}
          <div className="brand">
            <div className="brand-title">
              <div className="site-title bg-gradient-electric bg-clip-text text-transparent">
                 CROSSLINK
              </div>
              <span className="brand-subtitle">
                Cross-chain bridge for seamless token transfers.
              </span>
            </div>
          </div>

          {/* Product & Company */}
          <div className="footer-menu-grid">
            {/* Product */}
            <div className="footer-links">
              <h3>Product</h3>
              <ul>
                {links.product.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="footer-links">
              <h3>Company</h3>
              <ul>
                {links.company.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              © {new Date().getFullYear()} CROSSLINK. All rights reserved.
            </p>
          </div>

          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
