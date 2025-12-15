
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
const BrandIntroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.3 });
    
    return (
        <section className="py-32 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <FadeInSection className="relative h-[600px] group">
                        <div className="absolute top-0 left-0 w-full h-full bg-subtle-background translate-x-4 translate-y-4 rounded-sm transition-transform duration-700 group-hover:translate-x-6 group-hover:translate-y-6"></div>
                        <div className="relative w-full h-full overflow-hidden rounded-sm shadow-lg">
                            <img 
                                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop" 
                                alt="Kurchi Studio" 
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-kurchi-espresso-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
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
};

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

// --- 5. HOLISTIC INTERIOR SOLUTIONS (Complete Redesign) ---
const ServicesSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [activeService, setActiveService] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const services = [
        { 
            title: "Interior Design & Conceptualization", 
            icon: <PaintBrushIcon className="w-12 h-12"/>, 
            desc: "Transform your vision into reality with our award-winning design team. We create bespoke interior concepts tailored to your brand identity, workflow requirements, and aesthetic preferences.",
            image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop",
            features: [
                "3D Photorealistic Visualizations",
                "Space Planning & Optimization",
                "Brand-Aligned Color Schemes",
                "Mood Boards & Material Palette"
            ],
            color: "from-blue-500/20 to-purple-500/20"
        },
        { 
            title: "Premium Furniture Manufacturing", 
            icon: <CubeIcon className="w-12 h-12"/>, 
            desc: "Our 25,000 sq.ft facility houses German CNC technology and skilled craftsmen who bring designs to life. Every piece is custom-made to exact specifications with precision engineering.",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
            features: [
                "Custom Workstations & Desks",
                "Executive Cabins & Boardrooms",
                "Reception & Waiting Areas",
                "Storage Solutions & Partitions"
            ],
            color: "from-amber-500/20 to-orange-500/20"
        },
        { 
            title: "Complete Site Execution", 
            icon: <WrenchScrewdriverIcon className="w-12 h-12"/>, 
            desc: "Our in-house execution teams handle all aspects of site work - from false ceilings and flooring to electrical, plumbing, and HVAC systems. Zero coordination hassles for you.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1000&auto=format&fit=crop",
            features: [
                "Civil & Structural Work",
                "Electrical & Lighting Installation",
                "HVAC & Climate Control",
                "Flooring & False Ceiling"
            ],
            color: "from-green-500/20 to-teal-500/20"
        },
        { 
            title: "Turnkey Project Management", 
            icon: <BriefcaseIcon className="w-12 h-12"/>, 
            desc: "Single-point responsibility from concept to completion. Our dedicated project managers ensure on-time delivery, transparent communication, and quality control at every stage.",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
            features: [
                "Dedicated Project Manager",
                "Weekly Progress Reports",
                "Transparent Cost Breakdown",
                "5-Year Warranty Coverage"
            ],
            color: "from-rose-500/20 to-pink-500/20"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveService((prev) => (prev + 1) % services.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [services.length]);

    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                {/* Header */}
                <FadeInSection className="text-center mb-20">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Our Expertise</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-kurchi-espresso-900 mt-4 mb-6">
                        Holistic Interior Solutions
                    </h2>
                    <p className="text-text-secondary text-lg font-light max-w-3xl mx-auto leading-relaxed">
                        From the first sketch to the final key handover, we orchestrate every element of your workspace transformation with precision, creativity, and uncompromising quality.
                    </p>
                </FadeInSection>

                {/* Main Feature Display */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Image Side */}
                        <FadeInSection className="order-2 lg:order-1">
                            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
                                {services.map((service, i) => (
                                    <div
                                        key={i}
                                        className={`absolute inset-0 transition-all duration-1000 ${
                                            i === activeService ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                        }`}
                                    >
                                        <img 
                                            src={service.image} 
                                            alt={service.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} mix-blend-overlay`}></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                    </div>
                                ))}
                                
                                {/* Floating Icon Badge */}
                                <div className="absolute top-8 right-8 w-20 h-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-luxury flex items-center justify-center text-kurchi-gold-500 transform hover:scale-110 transition-transform duration-500">
                                    {services[activeService].icon}
                                </div>

                                {/* Bottom Info Bar */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                                    <h3 className="text-white font-serif text-2xl md:text-3xl font-bold mb-2">
                                        {services[activeService].title}
                                    </h3>
                                    <div className="flex items-center text-kurchi-gold-500 text-sm">
                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                        <span>Industry-Leading Excellence</span>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* Content Side */}
                        <FadeInSection delay="200ms" className="order-1 lg:order-2">
                            <div className="space-y-6">
                                {services.map((service, i) => (
                                    <div
                                        key={i}
                                        className={`transition-all duration-700 ${
                                            i === activeService ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'
                                        }`}
                                    >
                                        <p className="text-text-secondary text-lg font-light leading-relaxed mb-8">
                                            {service.desc}
                                        </p>

                                        {/* Features List */}
                                        <div className="space-y-4">
                                            <h4 className="text-kurchi-espresso-900 font-serif font-bold text-xl mb-4">Key Offerings:</h4>
                                            {service.features.map((feature, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="flex items-start group/feature cursor-pointer"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kurchi-gold-500/20 flex items-center justify-center mt-0.5 group-hover/feature:bg-kurchi-gold-500 transition-colors duration-300">
                                                        <CheckCircleIcon className="w-4 h-4 text-kurchi-gold-500 group-hover/feature:text-white transition-colors" />
                                                    </div>
                                                    <span className="ml-4 text-text-primary font-medium group-hover/feature:text-kurchi-gold-500 transition-colors">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => onNavigate('services')}
                                            className="mt-8 inline-flex items-center px-8 py-4 bg-kurchi-espresso-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl group"
                                        >
                                            Learn More
                                            <ArrowUpRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </FadeInSection>
                    </div>

                    {/* Service Navigation Pills */}
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        {services.map((service, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveService(i)}
                                className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-500 ${
                                    i === activeService 
                                        ? 'bg-kurchi-gold-500 text-white shadow-lg scale-105' 
                                        : 'bg-surface text-text-secondary hover:bg-subtle-background border border-border'
                                }`}
                            >
                                {service.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Services Grid - Compact Overview */}
                <FadeInSection delay="400ms">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onClick={() => setActiveService(i)}
                                className={`group relative p-8 bg-surface border-2 rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                                    i === activeService 
                                        ? 'border-kurchi-gold-500 shadow-luxury' 
                                        : 'border-transparent hover:border-border'
                                }`}
                            >
                                {/* Number Badge */}
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-kurchi-espresso-900 text-white rounded-full flex items-center justify-center font-serif font-bold text-sm shadow-lg">
                                    {String(i + 1).padStart(2, '0')}
                                </div>

                                {/* Icon */}
                                <div className={`w-16 h-16 mb-6 transition-all duration-500 ${
                                    hoveredIndex === i || i === activeService 
                                        ? 'text-kurchi-gold-500 scale-110' 
                                        : 'text-text-secondary'
                                }`}>
                                    {service.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-serif font-bold text-kurchi-espresso-900 mb-3 leading-tight">
                                    {service.title}
                                </h3>

                                {/* Short Description */}
                                <p className="text-text-secondary text-sm font-light leading-relaxed mb-4 line-clamp-3">
                                    {service.desc}
                                </p>

                                {/* Hover Arrow */}
                                <div className={`flex items-center text-kurchi-gold-500 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                    hoveredIndex === i ? 'translate-x-2 opacity-100' : 'opacity-0'
                                }`}>
                                    Explore <ChevronRightIcon className="w-3 h-3 ml-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeInSection>

                {/* Call to Action */}
                <FadeInSection delay="600ms" className="text-center mt-20">
                    <div className="inline-block">
                        <p className="text-text-secondary text-sm mb-6">
                            <span className="font-bold text-kurchi-espresso-900">Integrated Approach:</span> Design + Manufacturing + Execution = Your Perfect Workspace
                        </p>
                        <button 
                            onClick={() => onNavigate('services')} 
                            className="px-12 py-4 border-2 border-kurchi-espresso-900 text-kurchi-espresso-900 text-sm font-bold uppercase tracking-widest hover:bg-kurchi-espresso-900 hover:text-white transition-all duration-500 rounded-lg shadow-lg hover:shadow-2xl group"
                        >
                            View Complete Service Portfolio
                            <ArrowUpRightIcon className="inline-block w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

// --- 6. FEATURED PROJECTS (Auto-Sliding Carousel) ---
const FeaturedProjects: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const projects = [
        { title: "FinTech HQ", type: "Corporate Office", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", desc: "Modern 15,000 sq.ft corporate headquarters with sleek workstations" },
        { title: "Nexus Law", type: "Legal Firm", img: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop", desc: "Prestigious law office combining tradition with contemporary design" },
        { title: "Zenith Co-Work", type: "Workspace", img: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=800&auto=format&fit=crop", desc: "Dynamic co-working space with flexible zones for collaboration" },
        { title: "Creative Pulse", type: "Studio", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop", desc: "Inspiring creative studio with innovative meeting spaces" },
        { title: "Tech Innovation Hub", type: "Startup Office", img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=800&auto=format&fit=crop", desc: "Vibrant startup office promoting innovation and creativity" },
        { title: "Executive Suite", type: "CEO Office", img: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?q=80&w=800&auto=format&fit=crop", desc: "Luxurious executive office with premium finishes" }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % projects.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [projects.length]);

    useEffect(() => {
        if (scrollRef.current) {
            const cardWidth = scrollRef.current.children[0]?.clientWidth || 500;
            scrollRef.current.scrollTo({
                left: currentIndex * (cardWidth + 24),
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

    return (
        <section className="py-32 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 flex justify-between items-end">
                <FadeInSection>
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Portfolio</span>
                    <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">Selected Works</h2>
                    <p className="text-text-secondary text-sm mt-3 max-w-xl">Explore our portfolio of meticulously crafted spaces that blend functionality with aesthetic excellence</p>
                </FadeInSection>
                <button onClick={() => onNavigate('portfolio')} className="hidden md:flex items-center text-xs font-bold uppercase tracking-widest hover:text-kurchi-gold-500 transition-colors">
                    View Full Portfolio <ArrowUpRightIcon className="w-4 h-4 ml-2" />
                </button>
            </div>

            <div ref={scrollRef} className="flex space-x-6 overflow-x-auto pb-12 px-6 lg:px-12 scrollbar-hide snap-x">
                {projects.map((p, i) => (
                    <div key={i} className="relative min-w-[350px] md:min-w-[500px] h-[450px] group cursor-pointer snap-center rounded-lg overflow-hidden flex-shrink-0" onClick={() => onNavigate('portfolio')}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700 z-10"></div>
                        <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-all duration-700 transform group-hover:scale-105" />
                        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20">
                            <p className="text-kurchi-gold-500 text-xs font-bold uppercase tracking-widest mb-1">{p.type}</p>
                            <h3 className="text-white font-serif text-2xl mb-2">{p.title}</h3>
                            <p className="text-gray-300 text-sm font-light">{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
                {projects.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            i === currentIndex ? 'w-8 bg-kurchi-gold-500' : 'w-1 bg-border hover:bg-kurchi-gold-500/50'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
};

// --- 7. THE KURCHI STANDARD (Redesigned with Professional Animations) ---
const ProcessSection: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

    const steps = [
        {
            number: "01",
            title: "Consultation",
            desc: "We begin by understanding your vision, brand identity, and functional requirements through detailed discussions with key stakeholders.",
            fullDesc: "Our expert consultants conduct comprehensive site visits and stakeholder interviews to understand your workflow, brand aesthetics, and budget parameters. We analyze your team's needs and create a custom brief that aligns with your organizational goals.",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
            icon: <UserGroupIcon className="w-8 h-8" />
        },
        {
            number: "02",
            title: "Design",
            desc: "Our architects create detailed 3D visualizations and technical drawings that bring your space to life with precision and creativity.",
            fullDesc: "Using cutting-edge software, we develop photo-realistic 3D renders, detailed floor plans, and material specifications. You'll see exactly how your office will look before a single piece of furniture is manufactured.",
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop",
            icon: <LightBulbIcon className="w-8 h-8" />
        },
        {
            number: "03",
            title: "Manufacturing",
            desc: "Precision crafting in our 25,000 sq.ft facility using German CNC technology and premium materials sourced globally.",
            fullDesc: "Each piece is custom-manufactured in our state-of-the-art facility. From solid wood workstations to executive cabins, we use advanced machinery and skilled craftsmanship to ensure perfection in every detail.",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
            icon: <CubeIcon className="w-8 h-8" />
        },
        {
            number: "04",
            title: "Execution",
            desc: "Our skilled teams handle complete site execution including civil work, HVAC, electrical systems, and on-site assembly.",
            fullDesc: "From flooring to false ceilings, electrical wiring to HVAC installation, our in-house teams coordinate all trades seamlessly. Daily progress reports keep you informed at every stage.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
            icon: <WrenchScrewdriverIcon className="w-8 h-8" />
        },
        {
            number: "05",
            title: "Handover",
            desc: "Final quality checks and seamless handover - your office is ready to inspire your team from day one with full warranty coverage.",
            fullDesc: "We conduct thorough quality inspections, address any snagging issues, and hand over a space that's ready for immediate occupancy. All backed by our comprehensive 5-year warranty.",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop",
            icon: <CheckCircleIcon className="w-8 h-8" />
        }
    ];

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setActiveStep((prev) => (prev + 1) % steps.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [isVisible, steps.length]);

    return (
        <section ref={ref} className="py-32 bg-subtle-background relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                {/* Header */}
                <FadeInSection className="text-center mb-20">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">The Journey</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-kurchi-espresso-900 mt-4 mb-6">The Kurchi Standard</h2>
                    <p className="text-text-secondary text-lg font-light max-w-3xl mx-auto leading-relaxed">
                        Our proven 5-step process ensures exceptional results, on time and within budget. Experience the difference of working with a team that controls every aspect of your project.
                    </p>
                </FadeInSection>

                {/* Featured Step Display */}
                <FadeInSection delay="200ms" className="mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden">
                        {/* Image Side with Smooth Transitions */}
                        <div className="order-2 lg:order-1 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
                            {steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`absolute inset-0 transition-all duration-1000 ease-out ${
                                        i === activeStep ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                    }`}
                                >
                                    <img 
                                        src={step.image} 
                                        alt={step.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Subtle Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                </div>
                            ))}
                            
                            {/* Floating Number Badge */}
                            <div className="absolute top-6 left-6 w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center transform transition-all duration-500">
                                <span className="text-kurchi-espresso-900 font-serif font-bold text-2xl">{steps[activeStep].number}</span>
                            </div>

                            {/* Icon Badge */}
                            <div className="absolute bottom-6 right-6 w-14 h-14 bg-kurchi-gold-500 rounded-xl shadow-xl flex items-center justify-center text-white transition-all duration-500">
                                {steps[activeStep].icon}
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="order-1 lg:order-2 space-y-6">
                            {steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`transition-all duration-700 ${
                                        i === activeStep ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'
                                    }`}
                                >
                                    <div className="inline-block px-4 py-2 bg-kurchi-gold-500/10 rounded-full mb-4">
                                        <span className="text-kurchi-gold-500 font-bold text-xs uppercase tracking-widest">Step {step.number}</span>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-kurchi-espresso-900 mb-4">
                                        {step.title}
                                    </h3>
                                    <p className="text-text-primary text-lg font-medium leading-relaxed mb-4">
                                        {step.desc}
                                    </p>
                                    <p className="text-text-secondary text-base font-light leading-relaxed">
                                        {step.fullDesc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Navigation */}
                    <div className="flex justify-center gap-3 mt-8">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveStep(i)}
                                className={`transition-all duration-300 rounded-full ${
                                    i === activeStep 
                                        ? 'w-12 h-3 bg-kurchi-gold-500' 
                                        : 'w-3 h-3 bg-border hover:bg-kurchi-gold-500/50'
                                }`}
                                aria-label={`Go to step ${i + 1}`}
                            />
                        ))}
                    </div>
                </FadeInSection>

                {/* All Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {steps.map((step, i) => (
                        <FadeInSection key={i} delay={`${i * 100}ms`}>
                            <div 
                                onClick={() => setActiveStep(i)}
                                className={`group cursor-pointer h-full transition-all duration-500 ${
                                    i === activeStep ? 'scale-105' : ''
                                }`}
                            >
                                {/* Image with Subtle Hover Effect */}
                                <div className="relative h-56 mb-6 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-500">
                                    <img 
                                        src={step.image} 
                                        alt={step.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className={`absolute inset-0 transition-opacity duration-500 ${
                                        i === activeStep 
                                            ? 'bg-kurchi-gold-500/20 opacity-100' 
                                            : 'bg-black/20 opacity-0 group-hover:opacity-100'
                                    }`}></div>
                                    
                                    {/* Icon */}
                                    <div className="absolute bottom-4 left-4 text-white drop-shadow-lg">
                                        {step.icon}
                                    </div>
                                    
                                    {/* Number Badge */}
                                    <div className={`absolute top-4 right-4 w-10 h-10 rounded-full shadow-xl flex items-center justify-center transition-all duration-500 ${
                                        i === activeStep 
                                            ? 'bg-kurchi-gold-500 text-white scale-110' 
                                            : 'bg-white text-kurchi-espresso-900'
                                    }`}>
                                        <span className="font-serif font-bold text-sm">{step.number}</span>
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="text-center px-2">
                                    <h4 className={`text-lg font-serif font-bold mb-2 transition-colors duration-300 ${
                                        i === activeStep ? 'text-kurchi-gold-500' : 'text-kurchi-espresso-900 group-hover:text-kurchi-gold-500'
                                    }`}>
                                        {step.title}
                                    </h4>
                                    <p className="text-text-secondary text-xs font-light leading-relaxed line-clamp-2">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>

                {/* Timeline Stats */}
                <FadeInSection delay="500ms" className="mt-20 pt-12 border-t border-border">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="flex items-center space-x-4">
                            <ClockIcon className="w-8 h-8 text-kurchi-gold-500" />
                            <div>
                                <p className="text-2xl font-serif font-bold text-kurchi-espresso-900">45-60 Days</p>
                                <p className="text-sm text-text-secondary">Average Project Timeline</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-border"></div>
                        <div className="flex items-center space-x-4">
                            <CheckCircleIcon className="w-8 h-8 text-kurchi-gold-500" />
                            <div>
                                <p className="text-2xl font-serif font-bold text-kurchi-espresso-900">98% On-Time</p>
                                <p className="text-sm text-text-secondary">Delivery Success Rate</p>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

// --- 8. WHY CHOOSE US (Enhanced) ---
const WhyChooseUs: React.FC = () => {
    const reasons = [
        { 
            title: "Direct Manufacturer", 
            desc: "No middlemen, no markups. We own our 25,000 sq.ft factory equipped with German CNC machinery, ensuring cost benefits and uncompromising quality control passed directly to you.", 
            img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
            icon: <BuildingOffice2Icon className="w-12 h-12" />
        },
        { 
            title: "On-Time Delivery Guarantee", 
            desc: "We adhere to strict timelines with military precision. Our integrated project management and in-house execution teams ensure no delays in your office inauguration - a promise we've kept for 500+ projects.", 
            img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop",
            icon: <ClockIcon className="w-12 h-12" />
        },
        { 
            title: "Turnkey Solutions", 
            desc: "From concept visualization to final handover, one team manages everything - interior design, custom furniture manufacturing, civil work, HVAC, electrical, and project management. Single point of accountability.", 
            img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
            icon: <BriefcaseIcon className="w-12 h-12" />
        },
        { 
            title: "Premium Craftsmanship", 
            desc: "Every piece is a masterpiece. We use sustainably sourced solid wood, imported veneers, European hardware, and precision engineering to create furniture that lasts generations, not just years.", 
            img: "https://images.unsplash.com/photo-1618221639263-fee99c74dc9d?q=80&w=800&auto=format&fit=crop",
            icon: <PaintBrushIcon className="w-12 h-12" />
        }
    ];

    return (
        <section className="py-32 bg-surface">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <FadeInSection className="text-center mb-20">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Differentiation</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-kurchi-espresso-900 mt-4">Why Leaders Choose Kurchi</h2>
                    <p className="text-text-secondary text-lg font-light mt-4 max-w-3xl mx-auto">
                        We don't just design offices - we create environments that elevate your brand, inspire your team, and impress your clients.
                    </p>
                </FadeInSection>

                <div className="space-y-24">
                    {reasons.map((item, i) => (
                        <FadeInSection key={i} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                            <div className="lg:w-1/2 relative h-[400px] md:h-[500px] w-full group">
                                <div className="absolute -inset-4 bg-kurchi-gold-500/10 rounded-lg transform group-hover:scale-105 transition-transform duration-700"></div>
                                <div className="relative w-full h-full rounded-lg overflow-hidden shadow-luxury">
                                    <img 
                                        src={item.img} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-kurchi-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                </div>
                                <div className={`absolute top-8 ${i % 2 === 1 ? 'right-8' : 'left-8'} w-20 h-20 bg-white rounded-full shadow-luxury flex items-center justify-center text-kurchi-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
                                    {item.icon}
                                </div>
                            </div>
                            <div className="lg:w-1/2">
                                <div className="inline-block px-4 py-2 bg-kurchi-gold-500/10 rounded-full mb-6">
                                    <span className="text-kurchi-gold-500 font-bold text-xs uppercase tracking-widest">Feature {i + 1}</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-serif font-bold text-kurchi-espresso-900 mb-6">{item.title}</h3>
                                <p className="text-text-secondary text-lg font-light leading-relaxed mb-8">{item.desc}</p>
                                <div className="flex items-center text-kurchi-gold-500">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">Trusted by 500+ businesses across 12 cities</span>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>

                {/* Stats Bar */}
                <FadeInSection delay="300ms" className="mt-24 pt-16 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <p className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">100%</p>
                            <p className="text-xs uppercase tracking-widest text-text-secondary">Quality Assurance</p>
                        </div>
                        <div>
                            <p className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">5 Years</p>
                            <p className="text-xs uppercase tracking-widest text-text-secondary">Warranty</p>
                        </div>
                        <div>
                            <p className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">24/7</p>
                            <p className="text-xs uppercase tracking-widest text-text-secondary">Support</p>
                        </div>
                        <div>
                            <p className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Zero</p>
                            <p className="text-xs uppercase tracking-widest text-text-secondary">Hidden Costs</p>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

// --- 9. MATERIALS & CRAFTSMANSHIP (Enhanced) ---
const MaterialsSection: React.FC = () => {
    const materials = [
        { 
            name: "Solid Wood", 
            image: "https://images.unsplash.com/photo-1611486212557-79be6fbdd718?q=80&w=600&auto=format&fit=crop",
            desc: "Premium teak, oak, and walnut"
        },
        { 
            name: "Natural Stone", 
            image: "https://images.unsplash.com/photo-1618221639263-fee99c74dc9d?q=80&w=600&auto=format&fit=crop",
            desc: "Marble and granite accents"
        },
        { 
            name: "Luxury Fabrics", 
            image: "https://images.unsplash.com/photo-1520038410233-7141dd182f6d?q=80&w=600&auto=format&fit=crop",
            desc: "Italian leather and premium upholstery"
        },
        { 
            name: "Metal Finishes", 
            image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop",
            desc: "Brushed brass and steel details"
        },
        { 
            name: "Glass & Acrylic", 
            image: "https://images.unsplash.com/photo-1544306094-e2dcf9479da3?q=80&w=600&auto=format&fit=crop",
            desc: "Tempered glass and modern acrylics"
        },
        { 
            name: "Engineered Wood", 
            image: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?q=80&w=600&auto=format&fit=crop",
            desc: "German-imported veneers and laminates"
        }
    ];

    return (
        <section className="py-32 bg-kurchi-espresso-950 text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <FadeInSection className="text-center mb-16">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Craftmanship</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mt-4">Materiality & Detail</h2>
                    <p className="text-gray-400 mt-4 font-light max-w-3xl mx-auto text-lg">
                        Luxury isn't just visual; it's tactile. We source the finest materials from around the world - sustainably sourced woods, imported veneers, European hardware, and premium finishes that age gracefully.
                    </p>
                </FadeInSection>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {materials.map((material, i) => (
                        <FadeInSection key={i} delay={`${i * 100}ms`}>
                            <div className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-500">
                                <img 
                                    src={material.image} 
                                    alt={material.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                                    <h4 className="text-white font-serif text-xl font-bold mb-1">{material.name}</h4>
                                    <p className="text-kurchi-gold-500 text-sm font-light">{material.desc}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>

                <FadeInSection delay="400ms" className="mt-16 text-center">
                    <div className="inline-block px-8 py-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <p className="text-gray-300 text-sm font-light">
                            <span className="text-kurchi-gold-500 font-bold">Quality Commitment:</span> Every material is tested for durability, sustainability, and aesthetic excellence before integration.
                        </p>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

// --- 10. CLIENT EXPERIENCE FLOW (Enhanced) ---
const ClientFlowSection: React.FC = () => {
    const steps = [
        { 
            title: "Discovery Call", 
            desc: "We start with a detailed consultation to understand your brand story, team size, workflow requirements, and budget parameters. This 1-hour session lays the foundation for everything that follows.",
            image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=600&auto=format&fit=crop"
        },
        { 
            title: "Design Proposal", 
            desc: "Within 7 days, receive photo-realistic 3D visualizations, mood boards, material samples, and a transparent cost breakdown. No hidden fees, ever.",
            image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=600&auto=format&fit=crop"
        },
        { 
            title: "Creation & Manufacturing", 
            desc: "Once approved, our factory begins precision manufacturing while you track progress through weekly photo updates and site visits to our facility.",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop"
        },
        { 
            title: "Site Execution", 
            desc: "Our project manager coordinates all trades - civil, electrical, HVAC - with military precision. You get daily updates and a dedicated helpline.",
            image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"
        },
        { 
            title: "Welcome Home", 
            desc: "Final walkthrough, snagging, and handover. Your team moves into a space designed to inspire, with a 5-year warranty and lifetime support.",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop"
        }
    ];

    return (
        <section className="py-32 bg-surface">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <FadeInSection className="text-center mb-20">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Experience</span>
                    <h2 className="text-4xl font-serif font-bold text-kurchi-espresso-900 mb-6">The Client Journey</h2>
                    <p className="text-text-secondary text-lg font-light max-w-2xl mx-auto">
                        From first conversation to final handover, we've refined every touchpoint to be seamless, transparent, and stress-free.
                    </p>
                </FadeInSection>

                <div className="space-y-16">
                    {steps.map((step, i) => (
                        <FadeInSection key={i} delay={`${i * 100}ms`}>
                            <div className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                                <div className="lg:w-1/2 relative">
                                    <div className="aspect-video rounded-lg overflow-hidden shadow-luxury group">
                                        <img 
                                            src={step.image} 
                                            alt={step.title} 
                                            className="w-full h-full object-cover transition-all duration-700 transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-kurchi-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    </div>
                                </div>
                                <div className="lg:w-1/2">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 rounded-full bg-kurchi-gold-500 text-white flex items-center justify-center font-serif font-bold text-lg mr-4">
                                            {i + 1}
                                        </div>
                                        <h4 className="text-2xl font-serif font-bold text-kurchi-espresso-900">{step.title}</h4>
                                    </div>
                                    <p className="text-text-secondary text-lg font-light leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>

                <FadeInSection delay="300ms" className="mt-20 text-center">
                    <div className="inline-flex items-center space-x-3 px-8 py-4 bg-kurchi-gold-500/10 rounded-full">
                        <CheckCircleIcon className="w-6 h-6 text-kurchi-gold-500" />
                        <p className="text-kurchi-espresso-900 font-medium">
                            <span className="font-bold">Guaranteed:</span> No surprises, no delays, no compromises on quality
                        </p>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

// --- 11. TESTIMONIALS (Auto-Sliding Carousel) ---
const TestimonialsSection: React.FC = () => {
    const testimonials = [
        {
            quote: "Kurchi didn't just build an office; they translated our company culture into a physical space. The attention to detail in the executive cabins is unmatched. Every client who walks in is impressed.",
            author: "Vikram Singh",
            position: "CEO, Enterprise Suites",
            company: "Technology Firm",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"
        },
        {
            quote: "The fact that they own their manufacturing facility made all the difference. Custom boardroom table delivered exactly as visualized, on budget, and 2 days ahead of schedule. Phenomenal experience.",
            author: "Priya Sharma",
            position: "Partner",
            company: "Legal Associates",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
        },
        {
            quote: "In 18 years, I've worked with dozens of contractors. Kurchi stands alone. They understand that an office isn't just furniture - it's a tool for productivity and a statement of values.",
            author: "Rajesh Kumar",
            position: "Founder",
            company: "Startup Hub",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
        },
        {
            quote: "Transparent pricing, beautiful 3D renders before production, and a project manager who actually answered calls. This is how interior design should be done. Highly recommended for any business.",
            author: "Anjali Mehta",
            position: "Director of Operations",
            company: "FinTech Solutions",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop"
        }
    ];

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <section className="py-32 bg-subtle-background relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
            <div className="max-w-5xl mx-auto px-6 relative z-10">
                <FadeInSection className="text-center mb-16">
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Testimonials</span>
                    <h2 className="text-4xl font-serif font-medium text-kurchi-espresso-900 mt-4">What Our Clients Say</h2>
                </FadeInSection>

                <div className="relative min-h-[400px]">
                    {testimonials.map((testimonial, i) => (
                        <div
                            key={i}
                            className={`absolute inset-0 transition-all duration-1000 ${
                                i === currentTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                            }`}
                        >
                            <div className="text-center">
                                <StarIcon className="w-8 h-8 text-kurchi-gold-500 mx-auto mb-8" />
                                <blockquote className="text-xl md:text-2xl font-serif italic text-kurchi-espresso-900 leading-relaxed mb-12 px-4">
                                    "{testimonial.quote}"
                                </blockquote>
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg">
                                        <img 
                                            src={testimonial.image} 
                                            alt={testimonial.author} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <cite className="not-italic text-base font-bold text-text-primary block">
                                            {testimonial.author}
                                        </cite>
                                        <span className="text-sm text-text-secondary">{testimonial.position}</span>
                                        <span className="text-xs text-kurchi-gold-500 block mt-1">{testimonial.company}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-3 mt-12">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentTestimonial(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                i === currentTestimonial ? 'w-12 bg-kurchi-gold-500' : 'w-2 bg-border hover:bg-kurchi-gold-500/50'
                            }`}
                            aria-label={`View testimonial ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Star Rating Visual */}
                <div className="flex justify-center gap-1 mt-8">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-kurchi-gold-500 fill-kurchi-gold-500" />
                    ))}
                </div>
                <p className="text-center text-sm text-text-secondary mt-2 font-light">
                    Rated 5.0/5.0 based on 200+ verified client reviews
                </p>
            </div>
        </section>
    );
};

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
                        <div className="group">
                            <div className="aspect-[3/4] bg-gray-200 mb-4 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                                <img src={item.img} alt="Team Member" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <p className="font-bold text-kurchi-espresso-900">Name Surname</p>
                            <p className="text-xs text-text-secondary uppercase">{item.role}</p>
                        </div>
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
