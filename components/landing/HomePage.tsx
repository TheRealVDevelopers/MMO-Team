
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
    BuildingOffice2Icon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge tailwind classes
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HomePageProps {
    onNavigate: (page: string) => void;
}

// --- Animation Variants ---
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

// --- components ---

const SectionHeader: React.FC<{
    badge: string;
    title: string;
    description?: string;
    light?: boolean;
}> = ({ badge, title, description, light }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="text-center mb-16 px-4"
    >
        <motion.span
            variants={fadeInUp}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
        >
            {badge}
        </motion.span>
        <motion.h2
            variants={fadeInUp}
            className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[1.1] mb-6",
                light ? "text-white" : "text-text-primary"
            )}
        >
            {title}
        </motion.h2>
        {description && (
            <motion.p
                variants={fadeInUp}
                className={cn(
                    "text-lg font-light max-w-3xl mx-auto leading-relaxed",
                    light ? "text-white/70" : "text-text-secondary"
                )}
            >
                {description}
            </motion.p>
        )}
    </motion.div>
);

// --- 1. HERO SECTION ---
const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const slides = [
        {
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop",
            title: "Elevate Your Workspace Identity",
            subtitle: "Where architectural precision meets human-centric design. We build the future of work."
        },
        {
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2301&auto=format&fit=crop",
            title: "Craftsmanship That Inspires",
            subtitle: "In-house manufacturing ensures every detail reflects excellence and durability."
        },
        {
            image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2301&auto=format&fit=crop",
            title: "Seamless Transformation",
            subtitle: "End-to-end turnkey solutions for visionaries and industry leaders."
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 800], [0, 200]);

    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                >
                    <motion.div style={{ y: y1 }} className="absolute inset-0">
                        <img
                            src={slides[currentSlide].image}
                            alt="Background"
                            className="w-full h-full object-cover brightness-[0.4]"
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

            <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="max-w-4xl mx-auto"
                >
                    <motion.p
                        variants={fadeInUp}
                        className="text-primary text-xs md:text-sm font-black uppercase tracking-[0.5em] mb-8"
                    >
                        Pioneering Modern Interiors
                    </motion.p>

                    <motion.h1
                        key={`title-${currentSlide}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-tight mb-8"
                    >
                        {slides[currentSlide].title.split(' ').map((word, i) => (
                            <span key={i} className="inline-block mr-4">
                                {word}
                            </span>
                        ))}
                    </motion.h1>

                    <motion.p
                        key={`sub-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-white/60 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        {slides[currentSlide].subtitle}
                    </motion.p>

                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row gap-6 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('portfolio')}
                            className="px-10 py-4 bg-primary text-white font-bold text-[10px] uppercase tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(var(--color-primary),0.4)]"
                        >
                            Explore Our Work
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('contact')}
                            className="px-10 py-4 border border-white/20 text-white font-bold text-[10px] uppercase tracking-[0.3em] rounded-full backdrop-blur-md"
                        >
                            Start A Project
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-4">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className="group py-4 px-2"
                    >
                        <div className={cn(
                            "h-[2px] transition-all duration-500 rounded-full",
                            i === currentSlide ? "w-12 bg-primary" : "w-6 bg-white/20 group-hover:bg-white/40"
                        )} />
                    </button>
                ))}
            </div>
        </section>
    );
};

// --- 2. BRAND INTRODUCTION ---
const BrandSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-32 relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col lg:flex-row items-center gap-20">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="lg:w-1/2 relative"
            >
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop" alt="Studio" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className="lg:w-1/2 space-y-8"
            >
                <div className="space-y-4">
                    <span className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">Our Philosophy</span>
                    <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                        We Don't Just Design.<br />
                        <span className="text-primary italic font-light italic">We Manifest Excellence.</span>
                    </h2>
                </div>
                <p className="text-text-secondary text-lg font-light leading-relaxed">
                    Kurchi Interior Studio was born from a singular vision: to bridge the gap between abstract design and flawless implementation. We observed a market where design was detached from reality—we changed that.
                </p>
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-border/50">
                    <div>
                        <p className="text-2xl font-serif font-bold text-text-primary">25,000</p>
                        <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">Sq Ft Facility</p>
                    </div>
                    <div>
                        <p className="text-2xl font-serif font-bold text-text-primary">500+</p>
                        <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">Projects Delivered</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ x: 10 }}
                    onClick={() => onNavigate('about')}
                    className="flex items-center gap-4 text-primary font-bold text-xs uppercase tracking-[0.2em] group"
                >
                    Discover Our Story
                    <ArrowRightIcon className="w-4 h-4" />
                </motion.button>
            </motion.div>
        </div>
    </section>
);

// --- 3. SERVICES SECTION ---
const ServicesSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const services = [
        {
            title: "Interior Architecture",
            description: "Advanced space planning and photorealistic 3D visualization that captures every nuance of your brand's physical identity.",
            icon: <PaintBrushIcon className="w-8 h-8" />,
            image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop"
        },
        {
            title: "Precision Manufacturing",
            description: "German-engineered CNC precision meets artisanal craftsmanship in our state-of-the-art facility for bespoke furniture solutions.",
            icon: <CubeIcon className="w-8 h-8" />,
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop"
        },
        {
            title: "Integrated Execution",
            description: "A single point of truth. Our in-house teams manage civil, MEP, and finish work with absolute synchronization and quality control.",
            icon: <WrenchScrewdriverIcon className="w-8 h-8" />,
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1000&auto=format&fit=crop"
        },
        {
            title: "Consultant Advisory",
            description: "Strategic consulting for large-scale corporate relocations, feasibility studies, and workplace efficiency optimization.",
            icon: <BriefcaseIcon className="w-8 h-8" />,
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop"
        }
    ];

    return (
        <section className="py-32 bg-subtle-background">
            <SectionHeader
                badge="Expertise"
                title="Holistic Workplace Solutions"
                description="We orchestrate every dimension of your interior environment, ensuring a seamless flow from conceptual vision to tangible reality."
            />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.map((service, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative h-[400px] rounded-[2rem] overflow-hidden cursor-pointer"
                        onClick={() => onNavigate('services')}
                    >
                        <img
                            src={service.image}
                            alt={service.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute inset-0 p-10 flex flex-col justify-end">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white mb-6 transform transition-all duration-500 group-hover:bg-primary group-hover:scale-110">
                                {service.icon}
                            </div>
                            <h3 className="text-3xl font-serif text-white mb-4">{service.title}</h3>
                            <p className="text-white/70 font-light leading-relaxed max-w-sm transform transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                                {service.description}
                            </p>
                        </div>

                        <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-luxury">
                                <ArrowUpRightIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// --- 4. PROJECTS CAROUSEL ---
const FeaturedProjects: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const projects = [
        { title: "FinTech HQ", type: "Corporate", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop" },
        { title: "Nexus Law", type: "Prestigious", img: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop" },
        { title: "Zenith Co-Work", type: "Dynamic", img: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=800&auto=format&fit=crop" },
        { title: "Creative Pulse", type: "Bespoke", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" }
    ];

    const ref = useRef<HTMLDivElement>(null);

    return (
        <section className="py-32 bg-background overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="max-w-xl text-left">
                    <span className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">Work</span>
                    <h2 className="text-4xl md:text-5xl font-serif mt-4">Curated Portfolio</h2>
                    <p className="text-text-secondary mt-6 font-light">A selection of workspaces that have redefined the standards of productivity and aesthetic excellence across India.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onNavigate('portfolio')}
                    className="px-8 py-3 bg-text-primary text-background text-[10px] font-bold uppercase tracking-[0.2em] rounded-full"
                >
                    View All Works
                </motion.button>
            </div>

            <div
                ref={ref}
                className="flex gap-8 overflow-x-auto px-6 lg:px-[calc((100vw-80rem)/2)] pb-20 scrollbar-hide snap-x"
            >
                {projects.map((p, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -10 }}
                        className="relative min-w-[320px] md:min-w-[450px] aspect-[4/5] rounded-[2.5rem] overflow-hidden snap-center cursor-pointer group shadow-xl"
                        onClick={() => onNavigate('portfolio')}
                    >
                        <img
                            src={p.img}
                            alt={p.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-10 w-full">
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] block mb-3">{p.type}</span>
                            <h3 className="text-3xl font-serif text-white mb-2">{p.title}</h3>
                            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] transform transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                                Detailed Case Study
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// --- 5. PROCESS SECTION ---
const ProcessSection: React.FC = () => {
    const steps = [
        {
            id: "01",
            title: "Discovery",
            desc: "Immersion into your company culture and spatial needs. We define the psychological and functional requirements of your future workspace.",
            image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=800&auto=format&fit=crop"
        },
        {
            id: "02",
            title: "Creation",
            desc: "Photorealistic 3D visualization and material mapping. Witness your vision manifested in high-fidelity before a single brick is laid.",
            image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=800&auto=format&fit=crop"
        },
        {
            id: "03",
            title: "Assembly",
            desc: "Precision factory manufacturing with German CNC tech. Our in-house facility crafts bespoke elements that bridge design and reality.",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop"
        },
        {
            id: "04",
            title: "Activation",
            desc: "Synchronized site execution and turnkey installation. Our project managers orchestrate all trades with surgical precision and on-time delivery.",
            image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop"
        },
        {
            id: "05",
            title: "Elevation",
            desc: "Final curation and the official opening of your legacy. A space designed to inspire your team and amplify your brand's presence.",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
        }
    ];

    return (
        <section className="py-32 bg-subtle-background overflow-hidden px-4">
            <SectionHeader
                badge="Methodology"
                title="The Kurchi Protocol"
                description="Our rigorous five-phase approach replaces uncertainty with architectural precision and world-class implementation."
            />

            <div className="max-w-7xl mx-auto px-6 space-y-24">
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={cn(
                            "flex flex-col items-center gap-12 lg:gap-20",
                            i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                        )}
                    >
                        {/* Image Column */}
                        <div className="w-full lg:w-1/2 group relative">
                            <div className="aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
                                <motion.img
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                            {/* Decorative background number */}
                            <div className={cn(
                                "absolute -top-10 -z-0 opacity-10 text-[12rem] font-serif font-black transition-colors duration-500 group-hover:text-primary/30",
                                i % 2 === 1 ? "right-10" : "left-10"
                            )}>
                                {step.id}
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-4 text-primary font-bold text-xs uppercase tracking-[0.4em]">
                                <span className="w-8 h-[2px] bg-primary/30" />
                                Phase {step.id}
                            </div>
                            <h3 className="text-4xl font-serif font-bold text-text-primary leading-tight">
                                {step.title}
                            </h3>
                            <p className="text-xl text-text-secondary font-light leading-relaxed">
                                {step.desc}
                            </p>
                            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest pt-4">
                                <CheckCircleIcon className="w-5 h-5" />
                                Guaranteed Standard Quality
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32 flex justify-center px-6"
            >
                <div className="bg-surface backdrop-blur-md border border-border p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <ClockIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-serif font-black text-text-primary">45-60 Days</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-bold">Average Project Timeline</p>
                        </div>
                    </div>
                    <div className="w-px h-16 bg-border hidden md:block" />
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
                            <CheckCircleIcon className="w-8 h-8 text-secondary" />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-serif font-black text-text-primary">98% On-Time</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-bold">Precision Success Rate</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

// --- 6. TESTIMONIALS ---
const Testimonials: React.FC = () => {
    const clients = [
        {
            quote: "Kurchi didn't just build an office; they translated our company culture into a physical space.",
            author: "Vikram Singh",
            company: "Enterprise Suites",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"
        },
        {
            quote: "Phenomenal experience. Boardroom table delivered exactly as visualized, on budget, and 2 days early.",
            author: "Priya Sharma",
            company: "Legal Associates",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
        }
    ];

    const [current, setCurrent] = useState(0);

    return (
        <section className="py-32 bg-background relative overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-12"
                    >
                        <StarIcon className="w-10 h-10 text-primary mx-auto opacity-50" />
                        <blockquote className="text-3xl md:text-4xl lg:text-5xl font-serif italic leading-tight text-text-primary">
                            "{clients[current].quote}"
                        </blockquote>
                        <div className="flex items-center justify-center gap-6">
                            <img
                                src={clients[current].image}
                                alt={clients[current].author}
                                className="w-20 h-20 rounded-full object-cover border-4 border-subtle-background shadow-xl"
                            />
                            <div className="text-left">
                                <p className="font-serif font-black text-xl">{clients[current].author}</p>
                                <p className="text-secondary text-[10px] font-bold uppercase tracking-widest">{clients[current].company}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-4 mt-16">
                    {clients.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                "h-2 transition-all duration-500 rounded-full",
                                i === current ? "w-12 bg-primary" : "w-2 bg-border hover:bg-primary/30"
                            )}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- 7. CTA SECTION ---
const CTASection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <section className="py-20 px-6">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto rounded-[3rem] bg-gradient-to-br from-primary via-secondary to-primary/80 p-12 md:p-24 text-center text-white relative overflow-hidden shadow-[0_20px_50px_rgba(var(--color-primary),0.3)]"
        >
            <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-5xl md:text-7xl font-serif leading-tight mb-8">Ready to Build Your<br /><span className="italic font-light opacity-80">Workspace Legacy?</span></h2>
                <p className="text-xl text-white/70 font-light mb-12">Download our 2025 Lookbook or schedule a visit to our experiential studio in Gurgaon.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('contact')}
                        className="px-12 py-5 bg-white text-primary font-bold text-[10px] uppercase tracking-[0.4em] rounded-full shadow-2xl"
                    >
                        Book Consultation
                    </motion.button>
                </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </motion.div>
    </section>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="bg-background pt-[80px]"> {/* Offset for fixed nav */}
            <HeroSection onNavigate={onNavigate} />
            <BrandSection onNavigate={onNavigate} />
            <ServicesSection onNavigate={onNavigate} />
            <FeaturedProjects onNavigate={onNavigate} />
            <ProcessSection />
            <Testimonials />
            <CTASection onNavigate={onNavigate} />

            {/* Footer-like bottom padding */}
            <div className="h-20" />
        </div>
    );
};

export default HomePage;
