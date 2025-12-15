
import React, { useState, useEffect } from 'react';
import { PhoneIcon, GlobeAltIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import LoginModal from './LoginModal';
import { User } from '../../types';
import HomePage from './HomePage';
import PortfolioPage from './PortfolioPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import ServicesPage from './ServicesPage';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'services' | 'portfolio' | 'about' | 'contact'>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (page: string) => {
      setCurrentView(page as any);
  };

  const renderContent = () => {
      switch(currentView) {
          case 'services': return <ServicesPage onNavigate={handleNavigate} />;
          case 'portfolio': return <PortfolioPage onNavigate={handleNavigate} />;
          case 'about': return <AboutPage onNavigate={handleNavigate} />;
          case 'contact': return <ContactPage />;
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
      
      {/* 1. HEADER + TOP BAR */}
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

            {/* Navigation - Centered */}
            <div className="hidden md:flex space-x-8 items-center">
              <NavLink view="home" label="Home" />
              <NavLink view="about" label="Studio" />
              <NavLink view="services" label="Services" />
              <NavLink view="portfolio" label="Works" />
              <NavLink view="contact" label="Contact" />
            </div>

            {/* Actions - Right */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-xs font-medium text-text-secondary hover:text-kurchi-gold-500 transition-colors"
              >
                Staff Login
              </button>

              <button 
                onClick={() => setCurrentView('contact')} 
                className="px-6 py-3 bg-kurchi-espresso-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-500 shadow-lg hover:shadow-kurchi-gold-500/20"
              >
                Book Consultation
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
          {renderContent()}
      </main>

      {/* 14. FOOTER */}
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
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={onLogin} 
      />
    </div>
  );
};

export default LandingPage;
