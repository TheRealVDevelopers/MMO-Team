
import React, { useEffect, useRef, useState } from 'react';
import { 
    UserGroupIcon, 
    BuildingOffice2Icon,
    LightBulbIcon,
    HeartIcon,
    BriefcaseIcon,
    WrenchScrewdriverIcon,
    CubeIcon,
    ClipboardDocumentCheckIcon,
    CurrencyRupeeIcon,
    TruckIcon,
    SparklesIcon,
    ShieldCheckIcon,
    PaintBrushIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface AboutPageProps {
    onNavigate: (page: string) => void;
}

// --- Animation Hook (Duplicated for standalone reliability) ---
const useOnScreen = (options: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect(); 
            }
        }, options);

        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, [ref, options]);

    return [ref, isVisible] as const;
};

// --- Fade In Component ---
const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ children, delay = '0ms', className = '' }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    return (
        <div 
            ref={ref}
            style={{ animationDelay: delay }}
            className={`${className} ${isVisible ? 'animate-luxury-reveal opacity-100' : 'opacity-0 translate-y-8'}`}
        >
            {children}
        </div>
    );
};

// --- Counter Hook ---
const useCounter = (end: number, duration: number = 2000, start: boolean) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [end, duration, start]);
    return count;
};

const AnimatedStat: React.FC<{ value: number; label: string; suffix?: string }> = ({ value, label, suffix = '+' }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.5 });
    const count = useCounter(value, 2000, isVisible);
    return (
        <div ref={ref} className="group">
            <p className="text-4xl md:text-5xl font-serif font-medium text-kurchi-espresso-900 mb-2 group-hover:text-kurchi-gold-500 transition-colors duration-500">
                {count}{suffix}
            </p>
            <p className="text-xs uppercase tracking-widest text-text-secondary">{label}</p>
        </div>
    );
};

// --- SECTIONS ---

const HeroSection = () => (
    <div className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-kurchi-espresso-950">
        <div className="absolute inset-0">
            <img 
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2301&auto=format&fit=crop" 
                alt="Corporate Leadership" 
                className="w-full h-full object-cover opacity-40 animate-image-settle"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-kurchi-espresso-950 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
            <FadeInSection>
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
                    Architecting Corporate Legacies
                </h1>
                <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
                    We are more than interior designers. We are a complete infrastructure partner, bridging the gap between aesthetic vision and engineering precision.
                </p>
            </FadeInSection>
        </div>
    </div>
);

const OverviewSection = () => (
    <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <FadeInSection>
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">About Kurchi</span>
                    <h2 className="text-4xl font-serif font-bold text-kurchi-espresso-900 mt-4 mb-8">
                        The Integrated Advantage
                    </h2>
                    <p className="text-text-secondary text-lg font-light leading-relaxed mb-6">
                        Established in 2005, Kurchi (Make My Office) was founded to solve a critical industry problem: fragmentation. Traditionally, clients had to juggle architects, vendors, carpenters, and project managers.
                    </p>
                    <p className="text-text-secondary text-lg font-light leading-relaxed">
                        We disrupted this by bringing everything under one roof. With our own manufacturing units and in-house execution teams, we don't just design offices—we engineer them. From the first sketch to the final chair, we control every detail.
                    </p>
                </FadeInSection>
                <FadeInSection delay="200ms" className="relative h-[500px]">
                    <div className="absolute top-4 -right-4 w-full h-full border-2 border-kurchi-gold-500 rounded-sm z-0"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop" 
                        alt="Team Collaboration" 
                        className="relative z-10 w-full h-full object-cover rounded-sm shadow-xl grayscale hover:grayscale-0 transition-all duration-700"
                    />
                </FadeInSection>
            </div>
        </div>
    </section>
);

const VisionSection = () => (
    <section className="py-20 bg-subtle-background text-center">
        <div className="max-w-4xl mx-auto px-6">
            <FadeInSection>
                <LightBulbIcon className="w-12 h-12 text-kurchi-gold-500 mx-auto mb-6" />
                <h3 className="text-2xl font-serif font-bold text-kurchi-espresso-900 mb-4">Our Vision</h3>
                <p className="text-xl text-text-secondary italic font-light leading-relaxed">
                    "To redefine the Indian workspace by merging global design standards with local manufacturing excellence, creating environments that inspire productivity and culture."
                </p>
            </FadeInSection>
        </div>
    </section>
);

const LeadershipSection = () => (
    <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-16">
                <h2 className="text-4xl font-serif font-bold text-kurchi-espresso-900">Leadership</h2>
                <p className="text-text-secondary mt-4">Guided by experience, driven by innovation.</p>
            </FadeInSection>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                    { name: "Rajesh Khanna", role: "Managing Director", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop", desc: "25+ years in civil engineering and infrastructure development." },
                    { name: "Priya Sharma", role: "Design Director", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop", desc: "Award-winning architect with a focus on sustainable workspaces." },
                    { name: "Amit Patel", role: "Operations Head", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop", desc: "Expert in supply chain optimization and project delivery." }
                ].map((leader, i) => (
                    <FadeInSection key={i} delay={`${i*100}ms`}>
                        <div className="group text-center">
                            <div className="overflow-hidden rounded-lg mb-6 aspect-[3/4]">
                                <img src={leader.img} alt={leader.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" />
                            </div>
                            <h3 className="text-xl font-bold text-kurchi-espresso-900">{leader.name}</h3>
                            <p className="text-kurchi-gold-500 text-xs uppercase tracking-widest font-bold mb-2">{leader.role}</p>
                            <p className="text-sm text-text-secondary font-light max-w-xs mx-auto">{leader.desc}</p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

const OrgStructureSection = () => (
    <section className="py-24 bg-kurchi-espresso-950 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="mb-16">
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Our Backbone</span>
                <h2 className="text-4xl font-serif font-bold mt-4">Organizational Structure</h2>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Design Studio", icon: <PaintBrushIcon/>, desc: "Architects, 3D Visualizers, and Space Planners." },
                    { title: "Sales & BD", icon: <BriefcaseIcon/>, desc: "Consultants who understand client business needs." },
                    { title: "Project Execution", icon: <WrenchScrewdriverIcon/>, desc: "Site Engineers, Supervisors, and Safety Officers." },
                    { title: "Manufacturing", icon: <CubeIcon/>, desc: "Factory Managers, Carpenters, and Machine Operators." },
                    { title: "Accounts & Finance", icon: <CurrencyRupeeIcon/>, desc: "Ensuring transparent billing and vendor payments." },
                    { title: "Procurement", icon: <TruckIcon/>, desc: "Sourcing high-quality materials globally." },
                    { title: "Quality Control", icon: <ClipboardDocumentCheckIcon/>, desc: "Dedicated team for material and finish checks." },
                    { title: "Client Support", icon: <HeartIcon/>, desc: "Post-handover maintenance and warranty support." },
                ].map((dept, i) => (
                    <FadeInSection key={i} delay={`${i*50}ms`}>
                        <div className="p-6 border border-white/10 rounded-lg hover:bg-white/5 transition-colors h-full">
                            <div className="w-10 h-10 text-kurchi-gold-500 mb-4">{dept.icon}</div>
                            <h3 className="text-lg font-bold mb-2">{dept.title}</h3>
                            <p className="text-sm text-gray-400 font-light">{dept.desc}</p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

const DesignTeamSpotlight = () => (
    <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInSection className="order-2 lg:order-1">
                <div className="relative h-[600px] grid grid-cols-2 gap-4">
                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover rounded-lg mt-12" alt="Sketching"/>
                    <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover rounded-lg mb-12" alt="Material Selection"/>
                </div>
            </FadeInSection>
            <FadeInSection className="order-1 lg:order-2">
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">The Creative Engine</span>
                <h2 className="text-4xl font-serif font-bold text-kurchi-espresso-900 mt-4 mb-6">Design That Works</h2>
                <p className="text-text-secondary text-lg font-light leading-relaxed mb-6">
                    Our design team doesn't just make things look good. They solve spatial problems. Using advanced VR technology and BIM (Building Information Modeling), they ensure that every inch of your office is optimized for workflow and employee well-being.
                </p>
                <ul className="space-y-3">
                    {["Concept Development", "3D Visualization", "Material Boards", "Technical Drawings"].map(item => (
                        <li key={item} className="flex items-center text-kurchi-espresso-900 font-medium">
                            <div className="w-2 h-2 bg-kurchi-gold-500 rounded-full mr-3"></div> {item}
                        </li>
                    ))}
                </ul>
            </FadeInSection>
        </div>
    </section>
);

const SalesTeamSpotlight = () => (
    <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Client Consultation</span>
                <h2 className="text-4xl font-serif font-bold text-kurchi-espresso-900 mt-4 mb-6">Partners, Not Vendors</h2>
                <p className="text-text-secondary text-lg font-light leading-relaxed mb-6">
                    Our sales team consists of industry veterans who understand business needs, not just sales targets. We act as consultants, helping you navigate budget allocation, timeline planning, and feasibility studies before you even sign a contract.
                </p>
                <p className="text-text-secondary font-light">
                    Transparency is our currency. We provide detailed BOQs (Bill of Quantities) so you know exactly what you are paying for—down to the last screw.
                </p>
            </FadeInSection>
            <FadeInSection>
                <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop" alt="Consultation" className="w-full h-[500px] object-cover rounded-sm shadow-xl" />
            </FadeInSection>
        </div>
    </section>
);

const FactorySection = () => (
    <section className="py-32 relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-30" alt="Factory" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <FadeInSection>
                <span className="border border-kurchi-gold-500 text-kurchi-gold-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Our Strength</span>
                <h2 className="text-5xl font-serif font-bold mt-8 mb-6">Precision Manufacturing</h2>
                <p className="text-xl font-light text-gray-300 max-w-3xl mx-auto mb-12">
                    25,000 Sq. Ft. Facility. German Machinery. Zero Tolerance for Error.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-white/10 p-6 backdrop-blur-sm rounded-lg">
                        <h4 className="font-bold text-lg mb-2 text-kurchi-gold-500">Automated Production</h4>
                        <p className="text-sm text-gray-300">CNC machines ensure millimeter-perfect cutting and edge-banding.</p>
                    </div>
                    <div className="bg-white/10 p-6 backdrop-blur-sm rounded-lg">
                        <h4 className="font-bold text-lg mb-2 text-kurchi-gold-500">Quality Lab</h4>
                        <p className="text-sm text-gray-300">Rigorous testing for durability, load-bearing, and finish quality.</p>
                    </div>
                    <div className="bg-white/10 p-6 backdrop-blur-sm rounded-lg">
                        <h4 className="font-bold text-lg mb-2 text-kurchi-gold-500">Customization</h4>
                        <p className="text-sm text-gray-300">Bespoke furniture tailored exactly to your office layout.</p>
                    </div>
                </div>
            </FadeInSection>
        </div>
    </section>
);

const ProcessSection = () => (
    <section className="py-24 bg-subtle-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-16">
                <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900">How We Work</h2>
            </FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["Discovery", "Design", "Manufacturing", "Execution", "Handover"].map((step, i) => (
                    <FadeInSection key={i} delay={`${i*100}ms`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-kurchi-gold-500 flex items-center justify-center text-xl font-bold text-kurchi-espresso-900 shadow-md mb-4 relative z-10">
                                {i + 1}
                            </div>
                            {i < 4 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border -z-0"></div>}
                            <h3 className="font-bold text-kurchi-espresso-900">{step}</h3>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

const ValuesSection = () => (
    <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { icon: <ShieldCheckIcon/>, title: "Transparency", desc: "No hidden costs. Honest timelines." },
                    { icon: <SparklesIcon/>, title: "Quality First", desc: "Premium materials, guaranteed." },
                    { icon: <ClockIcon/>, title: "On-Time", desc: "We respect your opening date." },
                    { icon: <UserGroupIcon/>, title: "Client Focus", desc: "Dedicated managers for every site." },
                ].map((val, i) => (
                    <FadeInSection key={i} delay={`${i*100}ms`}>
                        <div className="text-center p-6 border border-border rounded-lg hover:border-kurchi-gold-500 transition-colors">
                            <div className="w-10 h-10 text-kurchi-gold-500 mx-auto mb-4">{val.icon}</div>
                            <h3 className="font-bold text-lg text-kurchi-espresso-900 mb-2">{val.title}</h3>
                            <p className="text-sm text-text-secondary">{val.desc}</p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

const MetricsSection = () => (
    <section className="py-20 bg-kurchi-gold-500 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <AnimatedStat value={18} label="Years of Excellence" />
            <AnimatedStat value={500} label="Projects Delivered" />
            <AnimatedStat value={12} label="Cities Covered" suffix="" />
            <AnimatedStat value={150} label="Team Members" />
        </div>
    </section>
);

const CTASection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-24 bg-surface text-center">
        <div className="max-w-3xl mx-auto px-6">
            <FadeInSection>
                <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-6">Serious about your workspace? So are we.</h2>
                <p className="text-lg text-text-secondary font-light mb-10">
                    Invite us for a consultation. Let's explore what's possible for your office.
                </p>
                <button onClick={() => onNavigate('contact')} className="px-10 py-4 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-300 shadow-lg">
                    Get In Touch
                </button>
            </FadeInSection>
        </div>
    </section>
);

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
    return (
        <div className="bg-background overflow-x-hidden pt-20">
            <HeroSection />
            <OverviewSection />
            <VisionSection />
            <LeadershipSection />
            <OrgStructureSection />
            <DesignTeamSpotlight />
            <SalesTeamSpotlight />
            <FactorySection />
            <ProcessSection />
            <ValuesSection />
            <MetricsSection />
            <CTASection onNavigate={onNavigate} />
        </div>
    );
};

export default AboutPage;
