import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo_vetical_black.png";

const links = [
  { href: "/dtf", label: "DTF Print Software" },
  { href: "/DTG", label: "DTG Print Software" },
  { href: "/Sublimation", label: "Sublimation Print Software" },
  { href: "/Analytics", label: "Analytics" },
  { href: "/inventory-management", label: "Inventory Management" },
  { href: "/Shipping", label: "Shipping" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <Link href="/">
          <Image
            src={Logo}
            alt="Pythias Technologies"
            width={120}
            height={60}
            priority
          />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="navbar-desktop">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="navbar-link">
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile Menu Toggle */}
      <input type="checkbox" id="menu-toggle" className="menu-toggle" />
      <label htmlFor="menu-toggle" className="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </label>

      {/* Mobile Navigation */}
      <div className="navbar-mobile">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="navbar-mobile-link">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
