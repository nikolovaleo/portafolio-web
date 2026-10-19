import Link from "next/link";
import { NavLinks } from "@/components/section-nav";
import { email, links, resumePath } from "@/lib/profile";

export function SiteNav() {
  return <>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="site-header">
      <nav className="container site-nav" aria-label="Primary">
        <Link className="wordmark" href="/" aria-label="Leonardo Urena, home">
          <span className="wordmark-mark" aria-hidden="true">LU</span>
          <span className="wordmark-name" aria-hidden="true">Leonardo Urena</span>
        </Link>
        <NavLinks />
      </nav>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="site-footer" id="contact">
    <div className="container footer-inner">
      <div className="footer-cta">
        <h2>Hiring for AI/ML engineering or data science? Let’s talk.</h2>
        <p>Open to Senior AI/ML Engineer and Lead Data Scientist roles, remote or with relocation. Based in Escazú, Costa Rica. English, Spanish, and Russian.</p>
        <a className="button" href={`mailto:${email}`}>Contact</a>
      </div>
      <ul className="footer-links">
        <li><a href={`mailto:${email}`}><span>Email</span>{email}<i aria-hidden="true">↗</i></a></li>
        <li><a href={links.linkedin} target="_blank" rel="noreferrer"><span>LinkedIn</span>in/nikolovaleo<i aria-hidden="true">↗</i></a></li>
        <li><a href={links.github} target="_blank" rel="noreferrer"><span>GitHub</span>github.com/nikolovaleo<i aria-hidden="true">↗</i></a></li>
        <li><a href={resumePath} download><span>Résumé</span>Download PDF<i aria-hidden="true">↓</i></a></li>
      </ul>
      <p className="copyright">© 2026 Leonardo Urena Nikolova. Lab data is synthetic; no employer code or data is used on this site.</p>
    </div>
  </footer>;
}
