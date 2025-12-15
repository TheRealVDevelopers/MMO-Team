
import React, { useEffect, useRef, useState } from 'react';
import { 
    ChevronRightIcon,
    PaintBrushIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
    BriefcaseIcon,
    ArrowUpRightIcon,
    CheckCircleIcon,
    StarIcon,
    ClockIcon,
    UserGroupIcon,
    LightBulbIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';

interface HomePageProps {
    onNavigate: (page: string) => void;
}

// --- Animation Hook ---
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

// --- Reusable Fade Section ---
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

// --- Animated Counter Hook ---
const useCounter = (end: number, duration: number = 2000, start: boolean) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        if (!start) return;
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, start]);

    return count;
};

// --- 1. HERO SECTION (Image Slider) ---
const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const slides = [
        {
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop",
            title: "Designing Workspaces That Define Success",
            subtitle: "From conceptual design to flawless execution, we craft environments that embody your legacy."
        },
        {
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2301&auto=format&fit=crop",
            title: "Precision Engineering Meets Luxury Design",
            subtitle: "State-of-the-art manufacturing ensuring every detail is perfect."
        },
        {
            image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2301&auto=format&fit=crop",
            title: "Where Culture Meets Architecture",
            subtitle: "Building offices that inspire teams and impress clients."
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000); // 6 seconds per slide
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative h-screen min-h-[800px] flex items-center bg-kurchi-espresso-950 overflow-hidden">
            {slides.map((slide, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img
                        src={slide.image}
                        alt="Hero Background"
                        className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${index === currentSlide ? 'scale-105' : 'scale-100'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
                </div>
            ))}

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20">
                <div className="max-w-3xl">
                    <div className="overflow-hidden">
                        <p className="text-kurchi-gold-500 text-xs md:text-sm uppercase tracking-[0.3em] font-bold mb-6 animate-luxury-reveal opacity-0" style={{ animationDelay: '200ms' }}>
                            Premium Interior Solutions
                        </p>
                    </div>
                    {/* Text only appears once to avoid jarring re-animations on slide change, or can subtly crossfade if desired. Keeping it static for stability as per prompt "Text appears once". */}
                    <div className="animate-luxury-reveal opacity-0" style={{ animationDelay: '400ms' }}>
                        <h1 className="text-5xl md:text-7xl font-serif font-medium text-white leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
                            {slides[currentSlide].title}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed mb-10 max-w-2xl drop-shadow-md">
                            {slides[currentSlide].subtitle}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-6 animate-luxury-reveal opacity-0" style={{ animationDelay: '800ms' }}>
                        <button onClick={() => onNavigate('portfolio')} className="px-10 py-4 bg-white text-kurchi-espresso-900 font-bold text-sm uppercase tracking-widest hover:bg-kurchi-gold-500 hover:text-white transition-all duration-500 shadow-luxury">
                            Explore Our Work
                        </button>
                        <button onClick={() => onNavigate('contact')} className="px-10 py-4 border border-white text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all duration-500 backdrop-blur-sm">
                            Schedule A Visit
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- 3. BRAND INTRODUCTION ---
const BrandIntroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <FadeInSection className="relative h-[600px]">
                    <div className="absolute top-0 left-0 w-full h-full bg-subtle-background translate-x-4 translate-y-4 rounded-sm"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop" 
                        alt="Kurchi Studio" 
                        className="relative w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-luxury shadow-lg rounded-sm"
                    />
                </FadeInSection>
                <div>
                    <FadeInSection delay="200ms">
                        <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Who We Are</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-medium text-kurchi-espresso-900 mt-4 mb-8 leading-tight">
                            Beyond Design.<br/>
                            <span className="text-text-secondary italic font-light">We Are Makers.</span>
                        </h2>
                        <p className="text-text-secondary text-lg font-light leading-relaxed mb-8">
                            In a fragmented industry of designers, contractors, and vendors, quality often gets lost. We chose a different path. We are not just architects; we are manufacturers.
                        </p>
                        <p className="text-text-secondary text-lg font-light leading-relaxed mb-10">
                            With our own 25,000 sq. ft. facility and in-house execution teams, we control every edge, finish, and deadline. The vision we present is the reality we deliver.
                        </p>
                        <button onClick={() => onNavigate('about')} className="text-kurchi-espresso-900 font-bold text-sm uppercase tracking-widest border-b-2 border-kurchi-gold-500 pb-1 hover:text-kurchi-gold-500 transition-colors">
                            Know More About Us
                        </button>
                    </FadeInSection>
                </div>
            </div>
        </div>
    </section>
);

// --- 4. TRUST & CREDIBILITY (Running Numbers) ---
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

const TrustSection: React.FC = () => (
    <section className="py-20 bg-subtle-background border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <AnimatedStat value={18} label="Years Experience" />
                    <AnimatedStat value={500} label="Projects Completed" />
                    <AnimatedStat value={12} label="Cities Served" suffix="" />
                    <AnimatedStat value={25000} label="Sq. Ft. Factory" suffix="" />
                </div>
            </FadeInSection>
        </div>
    </section>
);

// --- 5. WHAT WE DO (Services) ---
const ServicesSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-20 max-w-3xl mx-auto">
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Our Expertise</span>
                <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">Holistic Interior Solutions</h2>
                <p className="text-text-secondary font-light mt-4">We handle everything from the first sketch to the final key handover.</p>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Interior Design", icon: <PaintBrushIcon/>, desc: "Concept to 3D visualization tailored to your brand." },
                    { title: "Manufacturing", icon: <CubeIcon/>, desc: "Bespoke furniture from our German-tech facility." },
                    { title: "Execution", icon: <WrenchScrewdriverIcon/>, desc: "Civil, HVAC, and electrical work by in-house teams." },
                    { title: "Turnkey Solutions", icon: <BriefcaseIcon/>, desc: "Single-point responsibility for the entire project." }
                ].map((s, i) => (
                    <FadeInSection key={i} delay={`${i * 100}ms`} className="h-full">
                        <div className="group p-8 bg-surface border border-transparent hover:border-border hover:shadow-luxury transition-all duration-500 rounded-lg h-full flex flex-col">
                            <div className="w-10 h-10 text-kurchi-gold-500 mb-6 group-hover:scale-110 transition-transform duration-500">{s.icon}</div>
                            <h3 className="text-xl font-serif font-medium text-kurchi-espresso-900 mb-3">{s.title}</h3>
                            <p className="text-text-secondary font-light text-sm leading-relaxed mb-6 flex-grow">{s.desc}</p>
                            <span className="text-xs font-bold uppercase tracking-widest text-kurchi-espresso-900 flex items-center group-hover:text-kurchi-gold-500 transition-colors cursor-pointer" onClick={() => onNavigate('services')}>
                                Explore <ChevronRightIcon className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform"/>
                            </span>
                        </div>
                    </FadeInSection>
                ))}
            </div>
            <div className="text-center mt-16">
                <button onClick={() => onNavigate('services')} className="px-8 py-3 border border-kurchi-espresso-900 text-kurchi-espresso-900 text-xs font-bold uppercase tracking-widest hover:bg-kurchi-espresso-900 hover:text-white transition-all duration-300">
                    View All Services
                </button>
            </div>
        </div>
    </section>
);

// --- 6. FEATURED PROJECTS (Carousel) ---
const FeaturedProjects: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const projects = [
        { title: "FinTech HQ", type: "Corporate Office", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop" },
        { title: "Nexus Law", type: "Legal Firm", img: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop" },
        { title: "Zenith Co-Work", type: "Workspace", img: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=800&auto=format&fit=crop" },
        { title: "Creative Pulse", type: "Studio", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" },
    ];

    return (
        <section className="py-32 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 flex justify-between items-end">
                <FadeInSection>
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Portfolio</span>
                    <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">Selected Works</h2>
                </FadeInSection>
                <button onClick={() => onNavigate('portfolio')} className="hidden md:flex items-center text-xs font-bold uppercase tracking-widest hover:text-kurchi-gold-500 transition-colors">
                    View Full Portfolio <ArrowUpRightIcon className="w-4 h-4 ml-2" />
                </button>
            </div>

            <div className="flex space-x-6 overflow-x-auto pb-12 px-6 lg:px-12 scrollbar-hide snap-x">
                {projects.map((p, i) => (
                    <div key={i} className="relative min-w-[350px] md:min-w-[500px] h-[400px] group cursor-pointer snap-center rounded-lg overflow-hidden" onClick={() => onNavigate('portfolio')}>
                        <FadeInSection delay={`${i * 150}ms`} className="h-full w-full">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                            <img src={p.img} alt={p.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-luxury transform group-hover:scale-105" />
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent z-20">
                                <p className="text-kurchi-gold-500 text-xs font-bold uppercase tracking-widest mb-1">{p.type}</p>
                                <h3 className="text-white font-serif text-2xl">{p.title}</h3>
                            </div>
                        </FadeInSection>
                    </div>
                ))}
            </div>
        </section>
    );
};

// --- 7. PROCESS SECTION ---
const ProcessSection: React.FC = () => (
    <section className="py-32 bg-subtle-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-20">
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">The Journey</span>
                <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">The Kurchi Standard</h2>
            </FadeInSection>

            <div className="relative">
                <div className="hidden lg:block absolute top-12 left-0 w-full h-[1px] bg-border z-0"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
                    {["Consultation", "Design", "Manufacturing", "Execution", "Handover"].map((step, i) => (
                        <FadeInSection key={i} delay={`${i * 150}ms`}>
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full border-2 border-surface bg-white shadow-luxury flex items-center justify-center text-xl font-serif font-bold text-kurchi-espresso-900 z-10 mb-6 group-hover:border-kurchi-gold-500 group-hover:text-kurchi-gold-500 transition-all duration-500">
                                    0{i + 1}
                                </div>
                                <h4 className="text-lg font-bold text-kurchi-espresso-900 mb-2">{step}</h4>
                                <p className="text-text-secondary text-xs font-light max-w-[150px]">
                                    {i === 0 && "Understanding your needs."}
                                    {i === 1 && "Visualizing the future."}
                                    {i === 2 && "Precision crafting."}
                                    {i === 3 && "On-site assembly."}
                                    {i === 4 && "Ready to work."}
                                </p>
                            </div>
                        </FadeInSection>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// --- 8. WHY CHOOSE US ---
const WhyChooseUs: React.FC = () => (
    <section className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="mb-16">
                <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Differentiation</span>
                <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">Why Leaders Choose Kurchi</h2>
            </FadeInSection>

            <div className="space-y-24">
                {[
                    { title: "Direct Manufacturer", desc: "No middlemen. We own the factory, ensuring cost benefits and quality control passed directly to you.", img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" },
                    { title: "On-Time Delivery", desc: "We adhere to strict timelines. Our integrated project management ensures no delays in your office inauguration.", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop" }
                ].map((item, i) => (
                    <FadeInSection key={i} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                        <div className="lg:w-1/2 relative h-[400px] w-full">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover rounded-lg shadow-lg grayscale hover:grayscale-0 transition-all duration-1000" />
                        </div>
                        <div className="lg:w-1/2">
                            <h3 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-6">{item.title}</h3>
                            <p className="text-text-secondary text-lg font-light leading-relaxed">{item.desc}</p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

// --- 9. MATERIALS & CRAFTSMANSHIP ---
const MaterialsSection: React.FC = () => (
    <section className="py-32 bg-kurchi-espresso-950 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-16">
                <h2 className="text-3xl font-serif font-medium text-white">Materiality & Detail</h2>
                <p className="text-gray-400 mt-4 font-light max-w-2xl mx-auto">Luxury isn't just visual; it's tactile. We source the finest woods, metals, and fabrics.</p>
            </FadeInSection>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["https://images.unsplash.com/photo-1611486212557-79be6fbdd718?q=80&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618221639263-fee99c74dc9d?q=80&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1520038410233-7141dd182f6d?q=80&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop"].map((img, i) => (
                    <FadeInSection key={i} delay={`${i * 100}ms`}>
                        <div className="aspect-[3/4] overflow-hidden rounded-sm">
                            <img src={img} alt="Texture" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000 ease-luxury opacity-80 hover:opacity-100" />
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

// --- 10. CLIENT EXPERIENCE FLOW ---
const ClientFlowSection: React.FC = () => (
    <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <FadeInSection>
                <h2 className="text-2xl font-serif font-bold text-kurchi-espresso-900 mb-12">The Client Experience</h2>
                <div className="space-y-8 relative border-l-2 border-border ml-6 pl-8 text-left">
                    {[
                        { title: "Discovery", desc: "We listen to your brand story and requirements." },
                        { title: "Proposal", desc: "Transparent costing and timeline commitment." },
                        { title: "Creation", desc: "Regular updates as your space takes shape." },
                        { title: "Welcome", desc: "Walk into your ready-to-use office." }
                    ].map((step, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 border-kurchi-gold-500"></div>
                            <h4 className="text-lg font-bold text-kurchi-espresso-900">{step.title}</h4>
                            <p className="text-text-secondary font-light">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </FadeInSection>
        </div>
    </section>
);

// --- 11. TESTIMONIALS ---
const TestimonialsSection: React.FC = () => (
    <section className="py-32 bg-subtle-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <FadeInSection>
                <StarIcon className="w-8 h-8 text-kurchi-gold-500 mx-auto mb-6" />
                <blockquote className="text-2xl md:text-3xl font-serif italic text-kurchi-espresso-900 leading-relaxed mb-8">
                    "Kurchi didn't just build an office; they translated our company culture into a physical space. The attention to detail in the executive cabins is unmatched."
                </blockquote>
                <cite className="not-italic text-sm font-bold text-text-primary uppercase tracking-widest block">
                    Vikram Singh
                </cite>
                <span className="text-xs text-text-secondary">CEO, Enterprise Suites</span>
            </FadeInSection>
        </div>
    </section>
);

// --- 12. TEAM PREVIEW ---
const TeamSection: React.FC = () => (
    <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <FadeInSection className="text-center mb-16">
                <h2 className="text-3xl font-serif font-medium text-kurchi-espresso-900">Meet The Creators</h2>
            </FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { role: "Principal Architect", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" },
                    { role: "Head of Design", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" },
                    { role: "Project Lead", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" },
                    { role: "Furniture Expert", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop" }
                ].map((item, i) => (
                    <FadeInSection key={i} delay={`${i * 100}ms`}>
                        <div className="aspect-[3/4] bg-gray-200 mb-4 rounded-lg overflow-hidden">
                             <img src={item.img} alt="Team Member" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                        </div>
                        <p className="font-bold text-kurchi-espresso-900">Name Surname</p>
                        <p className="text-xs text-text-secondary uppercase">{item.role}</p>
                    </FadeInSection>
                ))}
            </div>
        </div>
    </section>
);

// --- 13. PRIMARY CTA SECTION ---
const CTASection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
            <FadeInSection>
                <h2 className="text-5xl md:text-6xl font-serif font-medium text-kurchi-espresso-900 mb-8 leading-tight">
                    Let's Build Your<br/>
                    <span className="text-kurchi-gold-500 italic">Legacy.</span>
                </h2>
                <p className="text-xl text-text-secondary font-light max-w-2xl mx-auto mb-12">
                    Your office environment is your most powerful asset. Let's make it count.
                </p>
                <button onClick={() => onNavigate('contact')} className="px-12 py-5 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest shadow-luxury hover:bg-kurchi-gold-500 hover:shadow-luxury-hover transition-all duration-300 transform active:scale-95 rounded-sm">
                    Schedule a Consultation
                </button>
            </FadeInSection>
        </div>
    </section>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="overflow-x-hidden pt-20"> {/* pt-20 added to offset fixed header */}
            <HeroSection onNavigate={onNavigate} />
            <BrandIntroSection onNavigate={onNavigate} />
            <TrustSection />
            <ServicesSection onNavigate={onNavigate} />
            <FeaturedProjects onNavigate={onNavigate} />
            <ProcessSection />
            <WhyChooseUs />
            <MaterialsSection />
            <ClientFlowSection />
            <TestimonialsSection />
            <TeamSection />
            <CTASection onNavigate={onNavigate} />
        </div>
    );
};

export default HomePage;
