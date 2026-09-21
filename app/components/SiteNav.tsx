"use client";

import { useState } from "react";

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <a href="#top" className="logo-link">
        <span className="brand-mark">
          <span>NEXU</span>CON
        </span>
        <small>
          ENGINEERING THE
          <br />
          INTELLIGENT ENTERPRISE
        </small>
      </a>
      <button
        className="nav-hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`nav-links${open ? " nav-open" : ""}`}>
        <a href="#work" onClick={() => setOpen(false)}>
          Overview
        </a>
        <a href="#capabilities" onClick={() => setOpen(false)}>
          Services
        </a>
        <a href="#approach" onClick={() => setOpen(false)}>
          AI &amp; Automation
        </a>
        <a href="#industries" onClick={() => setOpen(false)}>
          Industries
        </a>
      </div>
      <div className="nav-actions">
        <a href="#contact">
          Advisory <span>↗</span>
          <br />
          Contact
        </a>
        <a href="#contact" className="nav-cta">
          Connect with
          <br />
          an Architect{" "}
          <span aria-hidden="true" className="arrow">
            ↗
          </span>
        </a>
      </div>
    </nav>
  );
}
