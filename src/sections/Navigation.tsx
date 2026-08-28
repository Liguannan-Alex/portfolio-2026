import { useEffect, useState } from 'react';
import { siteConfig, navigationConfig } from '../config';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!siteConfig.brandName && navigationConfig.links.length === 0) {
    return null;
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-colors duration-500"
      style={{
        height: 80,
        padding: '0 5vw',
        backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
      }}
    >
      <a
        href="#hero"
        onClick={(e) => handleClick(e, '#hero')}
        className="text-white no-underline"
        style={{
          fontFamily: "'GeistMono', monospace",
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: '-0.5px',
        }}
      >
        {siteConfig.brandName}
      </a>

      <div className="hidden md:flex items-center" style={{ gap: 'clamp(18px, 2.4vw, 40px)' }}>
        {navigationConfig.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleClick(e, link.href)}
            className="nav-link"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center" style={{ gap: 16 }}>
        {navigationConfig.ctaText && (
          <a
            href="#footer"
            onClick={(e) => handleClick(e, '#footer')}
            className="nav-link hidden xl:inline-block"
          >
            {navigationConfig.ctaText}
          </a>
        )}

        {navigationConfig.radarCtaText && (
          <a
            href={navigationConfig.radarCtaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta-button"
            aria-label="打开横店剧组招商线索雷达演示页（新窗口）"
          >
            {navigationConfig.radarCtaText}
          </a>
        )}
      </div>
    </nav>
  );
}
