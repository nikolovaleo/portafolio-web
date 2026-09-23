import Link from "next/link";

export function SiteNav() {
  return <>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="site-header">
      <nav className="container site-nav" aria-label="Primary">
        <Link className="wordmark" href="/" aria-label="Leonardo Ureña, home">
          <span className="wordmark-mark" aria-hidden="true">LU<span>+</span></span>
          <span className="wordmark-name" aria-hidden="true">Leonardo Ureña</span>
        </Link>
        <div className="nav-links">
          <Link href="/#labs">Labs</Link>
          <Link className="nav-optional" href="/#expertise">Expertise</Link>
          <Link className="nav-optional" href="/#experience">Experience</Link>
          <a href="/Leonardo-Urena-CV.pdf">Résumé</a>
          <a className="nav-cta" href="mailto:nikolovaleo@gmail.com">Contact</a>
        </div>
      </nav>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="site-footer" id="contact">
    <div className="container footer-inner">
      <div className="footer-cta">
        <p className="eyebrow">Get in touch</p>
        <h2>Let’s talk about your next<br />data or AI problem.</h2>
        <p>Based in Escazú, Costa Rica · Working in English, Spanish, and Russian.</p>
      </div>
      <ul className="footer-links">
        <li><a href="mailto:nikolovaleo@gmail.com"><span>Email</span>nikolovaleo@gmail.com<i aria-hidden="true">↗</i></a></li>
        <li><a href="https://www.linkedin.com/in/nikolovaleo/" target="_blank" rel="noreferrer"><span>LinkedIn</span>in/nikolovaleo<i aria-hidden="true">↗</i></a></li>
        <li><a href="https://github.com/nikolovaleo" target="_blank" rel="noreferrer"><span>GitHub</span>github.com/nikolovaleo<i aria-hidden="true">↗</i></a></li>
        <li><a href="/Leonardo-Urena-CV.pdf" download><span>Résumé</span>Download PDF<i aria-hidden="true">↓</i></a></li>
      </ul>
      <p className="copyright">© 2026 Leonardo Ureña Nikolova. The interactive labs are personal projects built on synthetic data; they are not employer systems.</p>
    </div>
  </footer>;
}
