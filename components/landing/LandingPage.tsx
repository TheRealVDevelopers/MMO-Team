
import React, { useState, useEffect } from 'react';
import { PhoneIcon, GlobeAltIcon, EnvelopeIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LoginModal from './LoginModal';
import { User } from '../../types';
import HomePage from './HomePage';
import PortfolioPage from './PortfolioPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import ServicesPage from './ServicesPage';
import StartProjectPage from './StartProjectPage';
import ClientLoginPage from './ClientLoginPage';
import ClientDashboardPage from './ClientDashboardPage';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'services' | 'portfolio' | 'about' | 'contact' | 'start-project' | 'client-login' | 'client-dashboard'>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [clientProjectId, setClientProjectId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleClientLogin = (projectId: string) => {
      setClientProjectId(projectId);
      setCurrentView('client-dashboard');
  };

  const handleClientLogout = () => {
      setClientProjectId('');
      setCurrentView('home');
  };

  const renderContent = () => {
      switch(currentView) {
          case 'services': return <ServicesPage onNavigate={handleNavigate} />;
          case 'portfolio': return <PortfolioPage onNavigate={handleNavigate} />;
          case 'about': return <AboutPage onNavigate={handleNavigate} />;
          case 'contact': return <ContactPage />;
          case 'start-project': return <StartProjectPage />;
          case 'client-login': return <ClientLoginPage onLoginSuccess={handleClientLogin} />;
          case 'client-dashboard': return <ClientDashboardPage projectId={clientProjectId} onLogout={handleClientLogout} />;
          default: return <HomePage onNavigate={handleNavigate} />;
      }
  };

  const NavLink = ({ view, label }: { view: string, label: string }) => (
      <button 
        onClick={() => setCurrentView(view as any)} 
        className={`text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 relative group px-2 py-1 ${
            currentView === view 
            ? 'text-kurchi-gold-500' 
            : 'text-text-primary hover:text-kurchi-gold-500'
        }`}
      >
        {label}
        <span className={`absolute -bottom-1 left-0 w-full h-[1px] bg-kurchi-gold-500 transform scale-x-0 transition-transform duration-500 ease-luxury group-hover:scale-x-100 ${currentView === view ? 'scale-x-100' : ''}`}></span>
      </button>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans overflow-x-hidden flex flex-col selection:bg-kurchi-gold-500 selection:text-white">
      
      {/* 1. HEADER + TOP BAR - Hide on client dashboard */}
      {currentView !== 'client-dashboard' && (
        <nav 
          className={`fixed top-0 w-full z-50 bg-surface border-b border-border/50 transition-all duration-500 ${
              isScrolled ? 'py-4 shadow-luxury' : 'py-6'
          }`}
        >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => setCurrentView('home')}>
              <div className="w-10 h-10 flex items-center justify-center font-serif font-bold text-xl bg-kurchi-espresso-900 text-white transition-colors duration-500 group-hover:bg-kurchi-gold-500">
                K
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-lg font-serif font-bold tracking-wide leading-none text-kurchi-espresso-900">KURCHI</span>
                <span className="text-[0.6rem] uppercase tracking-[0.3em] text-text-secondary font-medium mt-0.5">Interior Studio</span>
              </div>
            </div>

            {/* Navigation - Centered - Hidden on mobile */}
            <div className="hidden lg:flex space-x-8 items-center">
              <NavLink view="home" label="Home" />
              <NavLink view="about" label="Studio" />
              <NavLink view="services" label="Services" />
              <NavLink view="portfolio" label="Works" />
              <NavLink view="contact" label="Contact" />
            </div>

            {/* Actions - Right - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-6">
              <button 
                onClick={() => setCurrentView('client-login')}
                className="text-xs font-medium text-kurchi-gold-500 hover:text-kurchi-espresso-900 transition-colors"
              >
                Client Login
              </button>
              
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-xs font-medium text-text-secondary hover:text-kurchi-gold-500 transition-colors"
              >
                Staff Login
              </button>

              <button 
                onClick={() => setCurrentView('start-project')} 
                className="px-6 py-3 bg-kurchi-espresso-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-500 shadow-lg hover:shadow-kurchi-gold-500/20"
              >
                Start Your Project
              </button>
            </div>
            
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-kurchi-espresso-900 hover:bg-kurchi-gold-500/10 transition-all"
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
          <div className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-surface border-l border-border dark:border-border shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-border dark:border-border bg-gradient-to-r from-kurchi-gold-500 to-kurchi-espresso-900">
                <div>
                  <h2 className="text-lg font-bold text-white">Menu</h2>
                  <p className="text-xs text-white/80 mt-0.5">Kurchi Interior Studio</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
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
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                          currentView === item.view
                            ? 'bg-gradient-to-r from-kurchi-gold-500 to-kurchi-gold-600 text-white shadow-lg'
                            : 'text-text-primary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
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
                      onClick={() => setCurrentView('start-project')}
                      className="w-full px-4 py-4 bg-kurchi-espresso-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-300 rounded-xl shadow-lg"
                    >
                      Start Your Project
                    </button>
                    <button
                      onClick={() => { setCurrentView('client-login'); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 border-2 border-kurchi-gold-500 text-kurchi-gold-600 text-sm font-semibold hover:bg-kurchi-gold-500 hover:text-white transition-all duration-300 rounded-xl"
                    >
                      Client Login
                    </button>
                    <button
                      onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 border border-border text-text-secondary text-sm font-medium hover:border-kurchi-gold-500 hover:text-kurchi-gold-600 transition-all duration-300 rounded-xl"
                    >
                      Staff Login
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
                    <a href="tel:+915551234567" className="flex items-center space-x-3 text-sm text-text-primary dark:text-text-primary hover:text-kurchi-gold-600 transition-colors">
                      <PhoneIcon className="w-5 h-5 text-kurchi-gold-600" />
                      <span>+91 (555) 123-4567</span>
                    </a>
                    <a href="mailto:projects@kurchi.com" className="flex items-center space-x-3 text-sm text-text-primary dark:text-text-primary hover:text-kurchi-gold-600 transition-colors">
                      <EnvelopeIcon className="w-5 h-5 text-kurchi-gold-600" />
                      <span>projects@kurchi.com</span>
                    </a>
                    <div className="flex items-start space-x-3 text-sm text-text-secondary dark:text-text-secondary">
                      <GlobeAltIcon className="w-5 h-5 text-kurchi-gold-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">Cyber City, Sector 18<br/>Gurgaon, Haryana 122002</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border dark:border-border">
                  <p className="text-xs text-text-secondary dark:text-text-secondary text-center">
                    © 2025 Kurchi - Make My Office
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
      <footer className="bg-kurchi-espresso-950 pt-24 pb-12 text-white/80 border-t-4 border-kurchi-gold-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                
                {/* Brand Column */}
                <div className="space-y-6">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-kurchi-gold-500 flex items-center justify-center text-white font-serif font-bold text-lg">K</div>
                        <span className="ml-3 text-2xl font-serif font-bold text-white tracking-wide">KURCHI</span>
                    </div>
                    <p className="text-sm font-light leading-relaxed text-gray-400">
                        Bridging the gap between aesthetic vision and engineering precision. We create workspaces that define legacies.
                    </p>
                </div>

                {/* Explore */}
                <div>
                    <h3 className="text-white font-serif text-lg mb-6">Explore</h3>
                    <ul className="space-y-3 text-sm font-light text-gray-400">
                        <li><button onClick={() => setCurrentView('home')} className="hover:text-kurchi-gold-500 transition-colors duration-300">Home</button></li>
                        <li><button onClick={() => setCurrentView('about')} className="hover:text-kurchi-gold-500 transition-colors duration-300">Our Studio</button></li>
                        <li><button onClick={() => setCurrentView('portfolio')} className="hover:text-kurchi-gold-500 transition-colors duration-300">Selected Works</button></li>
                        <li><button onClick={() => setCurrentView('services')} className="hover:text-kurchi-gold-500 transition-colors duration-300">Expertise</button></li>
                    </ul>
                </div>

                {/* Services */}
                <div>
                    <h3 className="text-white font-serif text-lg mb-6">Services</h3>
                    <ul className="space-y-3 text-sm font-light text-gray-400">
                        <li><a href="#" className="hover:text-kurchi-gold-500 transition-colors duration-300">Turnkey Interiors</a></li>
                        <li><a href="#" className="hover:text-kurchi-gold-500 transition-colors duration-300">Custom Manufacturing</a></li>
                        <li><a href="#" className="hover:text-kurchi-gold-500 transition-colors duration-300">Corporate Fit-outs</a></li>
                        <li><a href="#" className="hover:text-kurchi-gold-500 transition-colors duration-300">Design Consultancy</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-white font-serif text-lg mb-6">Contact</h3>
                    <ul className="space-y-4 text-sm font-light text-gray-400">
                        <li className="flex items-start group">
                            <GlobeAltIcon className="w-5 h-5 text-kurchi-gold-500 mt-0.5 group-hover:text-white transition-colors"/>
                            <span className="ml-3">123 Design District, Metro City</span>
                        </li>
                        <li className="flex items-center group">
                            <PhoneIcon className="w-5 h-5 text-kurchi-gold-500 group-hover:text-white transition-colors"/>
                            <span className="ml-3">+91 (555) 123-4567</span>
                        </li>
                        <li className="flex items-center group">
                            <EnvelopeIcon className="w-5 h-5 text-kurchi-gold-500 group-hover:text-white transition-colors"/>
                            <span className="ml-3">projects@kurchi.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs font-light text-gray-500">
                <p>&copy; 2025 Kurchi Interiors. All rights reserved.</p>
                <div className="flex space-x-8 mt-4 md:mt-0">
                    <a href="#" className="hover:text-kurchi-gold-500">Privacy Policy</a>
                    <a href="#" className="hover:text-kurchi-gold-500">Terms of Use</a>
                </div>
            </div>
        </div>
      </footer>
      )}
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={onLogin} 
      />
    </div>
  );
};

export default LandingPage;
