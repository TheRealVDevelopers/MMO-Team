
import React, { useState, useEffect } from 'react';
import { PhoneIcon, GlobeAltIcon, EnvelopeIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LoginModal from './LoginModal';
import { User, Vendor } from '../../types';
import HomePage from './HomePage';
import PortfolioPage from './PortfolioPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import ServicesPage from './ServicesPage';
import StartProjectPage from './StartProjectPage';
import ClientLoginPage from './ClientLoginPage';
import ClientDashboardPage from './ClientDashboardPage';
import ClientChangePasswordPage from '../client-portal/ClientChangePasswordPage';
import ClientProjectSelector from '../client-portal/ClientProjectSelector';

/**
 * Utility function to merge tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LandingPageProps {
  onLogin: (user: User | Vendor, type?: 'staff' | 'vendor') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'staff' | 'vendor'>('staff');
  // Initialize view based on localStorage existence to prevent flash (optional optimization)
  const [currentView, setCurrentView] = useState<'home' | 'services' | 'portfolio' | 'about' | 'contact' | 'start-project' | 'client-login' | 'client-dashboard' | 'client-change-password' | 'client-project-selector'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('mmo-client-user')) {
      return 'client-dashboard';
    }
    return 'home';
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [clientUser, setClientUser] = useState<{ uid: string, email: string, isFirstLogin: boolean, cases?: any[], selectedCaseId?: string | null } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize client user from localStorage
  useEffect(() => {
    const savedClient = localStorage.getItem('mmo-client-user');
    if (savedClient) {
      try {
        const parsedClient = JSON.parse(savedClient);
        setClientUser(parsedClient);
        // Restore view based on client state
        if (parsedClient.cases && parsedClient.cases.length > 1 && !parsedClient.selectedCaseId) {
          setCurrentView('client-project-selector');
        } else {
          setCurrentView('client-dashboard');
        }
      } catch (e) {
        console.error("Failed to restore client session", e);
        localStorage.removeItem('mmo-client-user');
      }
    }
  }, []);

  // Persist client user to localStorage
  useEffect(() => {
    if (clientUser) {
      localStorage.setItem('mmo-client-user', JSON.stringify(clientUser));
    } else {
      localStorage.removeItem('mmo-client-user');
    }
  }, [clientUser]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  }, [currentView]);

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleNavigate = (page: string) => {
    setCurrentView(page as any);
  };

  const handleClientLogin = async (user: any, isFirstLogin: boolean) => {
    // Fetch client's cases
    const { getClientCases } = await import('../../services/authService');
    const cases = await getClientCases(user.uid);

    setClientUser({
      uid: user.uid,
      email: user.email,
      isFirstLogin,
      cases,
      selectedCaseId: cases.length === 1 ? cases[0].id : null
    });

    if (isFirstLogin) {
      setCurrentView('client-change-password');
    } else if (cases.length > 1) {
      setCurrentView('client-project-selector');
    } else {
      setCurrentView('client-dashboard');
    }
  };

  const handleClientPasswordChanged = () => {
    if (clientUser) {
      setClientUser({ ...clientUser, isFirstLogin: false });
      if (clientUser.cases && clientUser.cases.length > 1) {
        setCurrentView('client-project-selector');
      } else {
        setCurrentView('client-dashboard');
      }
    }
  };

  const handleClientProjectSelect = (caseId: string) => {
    if (clientUser) {
      setClientUser({ ...clientUser, selectedCaseId: caseId });
      setCurrentView('client-dashboard');
    }
  };

  const handleClientLogout = () => {
    setClientUser(null);
    setCurrentView('home');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'services': return <ServicesPage onNavigate={handleNavigate} />;
      case 'portfolio': return <PortfolioPage onNavigate={handleNavigate} />;
      case 'about': return <AboutPage onNavigate={handleNavigate} />;
      case 'contact': return <ContactPage />;
      case 'start-project': return <StartProjectPage />;
      case 'client-login': return <ClientLoginPage onLoginSuccess={handleClientLogin} />;
      case 'client-change-password':
        return <ClientChangePasswordPage onPasswordChanged={handleClientPasswordChanged} />;
      case 'client-project-selector':
        return <ClientProjectSelector
          projects={clientUser?.cases || []}
          onSelectProject={handleClientProjectSelect}
          clientName={clientUser?.email}
        />;
      case 'client-dashboard':
        return <ClientDashboardPage
          clientUser={clientUser}
          onLogout={handleClientLogout}
        />;
      default: return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const NavLink = ({ view, label }: { view: string, label: string }) => (
    <button
      onClick={() => setCurrentView(view as any)}
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 relative group px-3 py-2",
        currentView === view
          ? 'text-primary'
          : 'text-text-primary/70 hover:text-primary'
      )}
    >
      <span className="relative z-10">{label}</span>
      {currentView === view && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-0 bg-primary/5 rounded-full -z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className={cn(
        "absolute -bottom-1 left-3 right-3 h-[2px] bg-primary transform scale-x-0 transition-transform duration-500 ease-luxury group-hover:scale-x-100",
        currentView === view ? 'scale-x-100' : ''
      )}></span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans overflow-x-hidden flex flex-col selection:bg-primary selection:text-white">

      {/* 1. HEADER + TOP BAR - Hide on client dashboard */}
      {currentView !== 'client-dashboard' && (
        <nav
          className={cn(
            "fixed top-0 w-full z-50 transition-all duration-500",
            isScrolled
              ? "py-3 bg-surface/80 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
              : "py-6 bg-transparent"
          )}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex justify-between items-center">

              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center cursor-pointer group"
                onClick={() => setCurrentView('home')}
              >
                <img
                  src="/mmo-logo.png"
                  alt="Make My Office"
                  className="h-10 w-auto object-contain transition-all duration-500 group-hover:opacity-80"
                />
              </motion.div>

              {/* Navigation - Centered - Hidden on mobile */}
              <div className="hidden lg:flex space-x-8 items-center">
                <NavLink view="home" label="Home" />
                <NavLink view="about" label="Studio" />
                <NavLink view="services" label="Services" />
                <NavLink view="portfolio" label="Portfolio" />
                <NavLink view="contact" label="Contact" />
              </div>

              {/* Actions - Right - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView('client-login')}
                  className="text-[10px] uppercase tracking-[0.1em] font-bold text-primary hover:text-secondary transition-colors"
                >
                  Client Login
                </button>

                <button
                  onClick={() => {
                    setLoginModalType('staff');
                    setIsLoginModalOpen(true);
                  }}
                  className="text-[10px] uppercase tracking-[0.1em] font-bold text-text-secondary hover:text-primary transition-colors"
                >
                  Staff Login
                </button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(var(--color-primary), 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('start-project')}
                  className="px-6 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-500 rounded-full"
                >
                  Start Your Project
                </motion.button>
              </div>

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-text-primary hover:bg-primary/10 transition-all"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Slide-in Menu */}
      {currentView !== 'client-dashboard' && (
        <>
          {/* Backdrop */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Slide-in Menu */}
          <div className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-surface border-l border-border dark:border-border shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary to-secondary">
                <div className="flex items-center">
                  <img
                    src="/mmo-logo.png"
                    alt="Make My Office"
                    className="h-8 w-auto object-contain brightness-0 invert"
                  />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <div className="mb-8">
                  <p className="px-4 mb-4 text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider">
                    Navigation
                  </p>
                  <nav className="space-y-2">
                    {[
                      { view: 'home', label: 'Home' },
                      { view: 'about', label: 'Our Studio' },
                      { view: 'services', label: 'Services' },
                      { view: 'portfolio', label: 'Portfolio' },
                      { view: 'contact', label: 'Contact Us' }
                    ].map(item => (
                      <button
                        key={item.view}
                        onClick={() => setCurrentView(item.view as any)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-300",
                          currentView === item.view
                            ? 'bg-primary text-white shadow-luxury'
                            : 'text-text-primary hover:bg-primary/5 hover:text-primary'
                        )}
                      >
                        <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Actions */}
                <div className="pt-6 border-t border-border dark:border-border">
                  <p className="px-4 mb-4 text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider">
                    Quick Actions
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => { setCurrentView('start-project'); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 rounded-xl shadow-luxury"
                    >
                      Start Your Project
                    </button>
                    <button
                      onClick={() => { setCurrentView('client-login'); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-300 rounded-xl text-center"
                    >
                      Client Portal
                    </button>
                    <button
                      onClick={() => { setLoginModalType('staff'); setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 border border-border text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all duration-300 rounded-xl"
                    >
                      Staff Access
                    </button>

                  </div>
                </div>
              </div>

              {/* Footer Contact Info */}
              <div className="border-t border-border dark:border-border bg-subtle-background dark:bg-background p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider mb-3">
                    Contact Us
                  </p>
                  <div className="space-y-3">
                    <a href="tel:+915551234567" className="flex items-center space-x-3 text-sm text-text-primary hover:text-primary transition-colors">
                      <PhoneIcon className="w-5 h-5 text-primary/50" />
                      <span className="font-light">+91 (555) 123-4567</span>
                    </a>
                    <a href="mailto:projects@makemyoffice.com" className="flex items-center space-x-3 text-sm text-text-primary hover:text-primary transition-colors">
                      <EnvelopeIcon className="w-5 h-5 text-primary/50" />
                      <span className="font-light">projects@makemyoffice.com</span>
                    </a>
                    <div className="flex items-start space-x-3 text-sm text-text-secondary">
                      <GlobeAltIcon className="w-5 h-5 text-primary/50 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-light">Cyber City, Sector 18<br />Gurgaon, Haryana 122002</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border dark:border-border">
                  <p className="text-xs text-text-secondary dark:text-text-secondary text-center">
                    © 2025 Make My Office - MMO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {renderContent()}
      </main>

      {/* 14. FOOTER - Hide on client dashboard and client login */}
      {currentView !== 'client-dashboard' && currentView !== 'client-login' && (
        <footer className="bg-surface pt-24 pb-12 text-text-primary border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">

              {/* Brand Column */}
              <div className="space-y-6">
                <div className="flex items-center">
                  <img
                    src="/mmo-logo.png"
                    alt="Make My Office"
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <p className="text-sm font-light leading-relaxed text-text-secondary max-w-xs">
                  Bridging the gap between aesthetic vision and engineering precision. We create workspaces that define legacies and empower minds.
                </p>
              </div>

              {/* Explore */}
              <div>
                <h3 className="text-text-primary font-serif font-bold text-lg mb-6">Explore</h3>
                <ul className="space-y-3 text-sm font-medium text-text-secondary">
                  <li><button onClick={() => setCurrentView('home')} className="hover:text-primary transition-colors duration-300">Home</button></li>
                  <li><button onClick={() => setCurrentView('about')} className="hover:text-primary transition-colors duration-300">Our Studio</button></li>
                  <li><button onClick={() => setCurrentView('portfolio')} className="hover:text-primary transition-colors duration-300">Selected Works</button></li>
                  <li><button onClick={() => setCurrentView('services')} className="hover:text-primary transition-colors duration-300">Expertise</button></li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-text-primary font-serif font-bold text-lg mb-6">Services</h3>
                <ul className="space-y-3 text-sm font-medium text-text-secondary">
                  <li><a href="#" className="hover:text-primary transition-colors duration-300">Turnkey Interiors</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors duration-300">Custom Manufacturing</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors duration-300">Corporate Fit-outs</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors duration-300">Design Consultancy</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-text-primary font-serif font-bold text-lg mb-6">Contact</h3>
                <ul className="space-y-4 text-sm font-medium text-text-secondary">
                  <li className="flex items-start group">
                    <GlobeAltIcon className="w-7 h-7 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="ml-3">1VJQG+JWF, Begur Rd, Maruthi Layout, Mico Layout, Hongasandra, Bengaluru, Karnataka 560114</span>
                  </li>
                  <li className="flex items-center group">
                    <PhoneIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="ml-3">+9740072666</span>
                  </li>
                  <li className="flex items-center group">
                    <EnvelopeIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="ml-3">Sales@makemyoffice.com</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-text-secondary/50">
              <p>&copy; 2025 Make My Office Interiors. All rights reserved.</p>
              <div className="flex space-x-8 mt-4 md:mt-0">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Use</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={onLogin}
        initialType={loginModalType}
      />
    </div>
  );
};

export default LandingPage;
