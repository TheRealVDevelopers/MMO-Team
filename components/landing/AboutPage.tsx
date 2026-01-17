
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
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
    ClockIcon,
    ArrowRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AboutPageProps {
    onNavigate: (page: string) => void;
}

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ children, delay = '0ms', className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

    return (
        <div
            ref={ref}
            className={`${className} transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
            style={{ transitionDelay: delay }}
        >
            {children}
        </div>
    );
};

// --- Components ---

const HeroSection = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-background">
            <motion.div
                style={{ y: y1, opacity }}
                className="absolute inset-0 z-0"
            >
                <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop"
                    alt="Premium Corporate Space"
                    className="w-full h-full object-cover opacity-50 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
            </motion.div>

            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-block text-primary font-bold uppercase tracking-[0.3em] text-xs mb-8"
                    >
                        Since 2005
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 leading-[1.1] tracking-tight"
                    >
                        Defining the <br />
                        <span className="text-primary italic">Art of Workspace</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed"
                    >
                        Make My Office was born from a singular vision: to bridge the gap between abstract design and flawless implementation.
                    </motion.p>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Scroll to Explore</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
            </motion.div>
        </section>
    );
};

const IntegratedAdvantage = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

    return (
        <section ref={targetRef} className="py-32 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.span variants={fadeInUp} className="text-primary font-bold uppercase tracking-widest text-xs">Our Edge</motion.span>
                        <motion.h2 variants={fadeInUp} className="text-5xl font-serif font-bold text-text-primary mt-6 mb-10 leading-tight">
                            One Roof. <br />Infinite Possibilities.
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-text-secondary text-lg font-light leading-relaxed mb-8">
                            The traditional workspace project is fragmented—archietcts, vendors, and managers working in silos. We broke that pattern.
                        </motion.p>
                        <motion.div variants={fadeInUp} className="space-y-6">
                            {[
                                { title: "End-to-End Control", desc: "From conceptual sketches to final installation." },
                                { title: "In-House Manufacturing", desc: "Bespose furnitures crafted in our own 25,000 sq.ft facility." },
                                { title: "Direct Execution", desc: "Our own site engineers and supervisors ensure zero compromise." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                                        <CheckCircleIcon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary">{item.title}</h4>
                                        <p className="text-sm text-text-secondary font-light">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        style={{ x }}
                        className="relative"
                    >
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2301&auto=format&fit=crop"
                                alt="Modern Office"
                                className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-105 group-hover:scale-105 transition-all duration-1000 ease-luxury"
                            />
                            <div className="absolute inset-0 bg-text-primary/10 mix-blend-overlay"></div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-2/3 aspect-video bg-background text-white p-8 rounded-xl shadow-2xl hidden md:block">
                            <span className="text-primary text-xs font-bold uppercase tracking-widest">Our Mission</span>
                            <p className="mt-4 font-serif text-xl italic leading-relaxed">
                                "Merging global design standards with Indian manufacturing excellence."
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};


const BentoStructure = () => {
    const items = [
        {
            title: "Design Studio",
            icon: <PaintBrushIcon />,
            size: "col-span-2 row-span-2",
            color: "bg-primary/5",
            desc: "Architects and visualizers creating 3D realities.",
            image: "https://images.unsplash.com/photo-1542621334-a254cf47733d?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Project Force",
            icon: <WrenchScrewdriverIcon />,
            size: "col-span-1 row-span-1",
            color: "bg-surface",
            desc: "Site engineers and safety officers.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop"
        },
        {
            title: "Factory",
            icon: <CubeIcon />,
            size: "col-span-1 row-span-2",
            color: "bg-background text-white",
            desc: "Precision manufacturing at scale.",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop"
        },
        {
            title: "Sourcing",
            icon: <TruckIcon />,
            size: "col-span-1 row-span-1",
            color: "bg-surface",
            desc: "Global sourcing network.",
            image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop"
        },
        {
            title: "Client Success",
            icon: <HeartIcon />,
            size: "col-span-2 row-span-1",
            color: "bg-primary text-white",
            desc: "Post-handover maintenance and relationship management.",
            image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop"
        },
    ];

    return (
        <section className="py-32 bg-background">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="text-center mb-20">
                    <span className="text-primary font-bold uppercase tracking-widest text-xs">The Backbone</span>
                    <h2 className="text-4xl font-serif font-bold text-text-primary mt-4">Organizational Ecosystem</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
                    {items.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`${item.size} ${item.color} rounded-3xl overflow-hidden relative group hover:shadow-luxury-hover transition-all duration-500 border border-border/50`}
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000 ease-luxury pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                            <div className="relative p-8 flex flex-col justify-between h-full z-10">
                                <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm opacity-70 font-light">{item.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ImageGallery = () => {
    const images = [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800",
        "https://images.unsplash.com/photo-1542621334-a254cf47733d?q=80&w=800",
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800"
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollXProgress } = useScroll({
        container: containerRef,
    });

    return (
        <section className="py-40 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20 text-center">
                <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Gallery</span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-text-primary mt-4">Atelier of Innovation</h2>
            </div>

            <div
                ref={containerRef}
                className="flex gap-10 overflow-x-auto px-[10vw] pb-20 pt-10 scrollbar-hide snap-x perspective-[1000px] cursor-grab active:cursor-grabbing"
            >
                {images.concat(images).map((img, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -20, rotateY: 10, scale: 1.05 }}
                        className="relative min-w-[300px] md:min-w-[450px] aspect-[4/5] rounded-[2.5rem] overflow-hidden snap-center shadow-2xl transition-all duration-700 ease-luxury"
                    >
                        <img
                            src={img}
                            alt={`Gallery ${i}`}
                            className="absolute inset-0 w-full h-full object-cover brightness-95 group-hover:brightness-110 saturate-[0.8] group-hover:saturate-100 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center mt-10">
                <div className="flex gap-2 items-center">
                    <div className="w-20 h-[1px] bg-primary/30"></div>
                    <span className="text-primary/50 font-black text-[10px] uppercase tracking-widest">Swipe to Explore</span>
                    <div className="w-20 h-[1px] bg-primary/30"></div>
                </div>
            </div>
        </section>
    );
};


const LeadershipRedefined = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const leaders = [
        { name: "Rajesh Khanna", role: "Managing Director", bio: "25+ years of architectural excellence and strategic vision.", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop" },
        { name: "Priya Sharma", role: "Design Director", bio: "Pioneering minimalist workspace aesthetics in modern India.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" },
        { name: "Amit Patel", role: "Operations Head", bio: "Ensuring precision and safety across ultra-scale projects.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop" }
    ];

    return (
        <section className="py-40 bg-background overflow-hidden relative">
            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Image Stage */}
                    <div className="relative aspect-[3/4] md:aspect-square overflow-hidden rounded-[3rem] shadow-3xl bg-surface/5 group">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                src={leaders[activeIndex].img}
                                alt={leaders[activeIndex].name}
                                className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-1000"
                            />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>

                        {/* Decorative Badge */}
                        <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <span className="text-white font-black text-[10px] tracking-widest uppercase">Lead</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col justify-center">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-primary font-black uppercase tracking-[0.5em] text-xs mb-8"
                        >
                            Executive Board
                        </motion.span>

                        <div className="min-h-[300px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                >
                                    <h2 className="text-6xl md:text-8xl font-serif font-bold text-white mb-6 leading-tight">
                                        {leaders[activeIndex].name.split(' ')[0]} <br />
                                        <span className="text-primary italic">{leaders[activeIndex].name.split(' ')[1]}</span>
                                    </h2>
                                    <p className="text-primary font-bold uppercase tracking-widest text-sm mb-8">{leaders[activeIndex].role}</p>
                                    <p className="text-gray-400 text-xl font-light leading-relaxed max-w-md">
                                        "{leaders[activeIndex].bio}"
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Thumbnail Selectors */}
                        <div className="flex gap-6 mt-16">
                            {leaders.map((leader, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIndex(i)}
                                    className={`relative w-20 h-20 rounded-2xl overflow-hidden transition-all duration-500 ${activeIndex === i ? 'ring-2 ring-primary scale-110' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={leader.img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 2 }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const isInView = useInView(countRef, { once: true });

    // Parse the numeric part and suffix
    const numericPart = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = numericPart;
            if (start === end) return;

            let totalMiliseconds = duration * 1000;
            let incrementTime = totalMiliseconds / end;

            let timer = setInterval(() => {
                start += 1;
                setCount(start);
                if (start === end) clearInterval(timer);
            }, incrementTime);

            return () => clearInterval(timer);
        }
    }, [isInView, numericPart, duration]);

    return (
        <span ref={countRef}>
            {count}{suffix}
        </span>
    );
};

const MetricsSection = () => {
    const metrics = [
        { value: "18+", label: "Years Experience" },
        { value: "500+", label: "Projects Completed" },
        { value: "12", label: "Cities Presence" },
        { value: "25k", label: "Sq.Ft Factory" }
    ];

    return (
        <section className="py-24 bg-background text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 skew-x-12 translate-x-1/2"></div>
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <h2 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-2">
                                <AnimatedCounter value={m.value} />
                            </h2>
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">{m.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ProcessTimeline = () => {
    const steps = [
        { title: "Discovery", desc: "Audit and spatial analysis" },
        { title: "Blueprint", desc: "Design and BIM simulation" },
        { title: "Synthesis", desc: "Manufacturing and assembly" },
        { title: "Execution", desc: "On-site precision installation" },
        { title: "Legacy", desc: "Handover and maintenance" }
    ];

    return (
        <section className="py-32 bg-surface relative overflow-hidden">
            {/* Background Decorative Image */}
            <div className="absolute inset-0 z-0 opacity-[0.03]">
                <img
                    src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000"
                    className="w-full h-full object-cover scale-150 rotate-12"
                    alt=""
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 items-center">
                    <div className="lg:col-span-1">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs">Our Workflow</span>
                        <h2 className="text-5xl font-serif font-bold text-text-primary mt-4 leading-tight">
                            The Precision <br />Pipeline
                        </h2>
                        <p className="mt-8 text-text-secondary font-light leading-relaxed">
                            We've optimized every phase of the project lifecycle to ensure your office is delivered on time, within budget, and above standards.
                        </p>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-border md:left-1/2"></div>
                            <div className="space-y-12">
                                {steps.map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        className={`flex items-center gap-8 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                                    >
                                        <div className="w-full md:w-1/2 md:px-12">
                                            <div className={`${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                                <h4 className="text-xl font-bold text-text-primary">{step.title}</h4>
                                                <p className="text-sm text-text-secondary font-light mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                        <div className="relative z-10 w-16 h-16 rounded-full bg-surface border-4 border-background flex items-center justify-center shadow-luxury">
                                            <span className="text-primary font-bold">{i + 1}</span>
                                        </div>
                                        <div className="hidden md:block w-1/2"></div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTASection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    return (
        <section className="py-32 bg-primary text-background relative overflow-hidden">
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute -top-64 -right-64 w-[600px] h-[600px] border-[1px] border-background/10 rounded-full"
            ></motion.div>

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl font-serif font-bold mb-8"
                >
                    Ready to build your masterpiece?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl font-medium opacity-80 mb-12"
                >
                    Let's discuss how we can transform your space into a productivity engine.
                </motion.p>
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    viewport={{ once: true }}
                    onClick={() => onNavigate('contact')}
                    className="px-12 py-5 bg-background text-white font-bold text-sm uppercase tracking-[0.2em] rounded-full shadow-2xl hover:bg-neutral-800 transition-colors"
                >
                    Start a Conversation
                </motion.button>
            </div>
        </section>
    );
};

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-background overflow-x-hidden selection:bg-primary selection:text-white">
            <HeroSection />
            <IntegratedAdvantage />
            <MetricsSection />
            <BentoStructure />
            <ImageGallery />
            <LeadershipRedefined />
            <ProcessTimeline />
            <CTASection onNavigate={onNavigate} />

            {/* Minimal Footer Spacer */}
            <div className="h-20 bg-surface"></div>
        </div>
    );
};

export default AboutPage;
