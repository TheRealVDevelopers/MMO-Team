
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

interface PortfolioPageProps {
    onNavigate: (page: string) => void;
}

const projects = [
    {
        id: 1,
        title: "TechSpace Hub",
        category: "Technology",
        location: "Bangalore",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        size: "45,000 Sq. Ft."
    },
    {
        id: 2,
        title: "Nexus Law Firm",
        category: "Corporate",
        location: "Mumbai",
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
        size: "12,000 Sq. Ft."
    },
    {
        id: 3,
        title: "Creative Pulse Studio",
        category: "Creative",
        location: "Delhi",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        size: "8,000 Sq. Ft."
    },
    {
        id: 4,
        title: "GreenEnergy HQ",
        category: "Sustainable",
        location: "Hyderabad",
        image: "https://images.unsplash.com/photo-1518560617781-33eb37a06853?auto=format&fit=crop&w=800&q=80",
        size: "25,000 Sq. Ft."
    },
    {
        id: 5,
        title: "Apex Finance",
        category: "Corporate",
        location: "Gurgaon",
        image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=800&q=80",
        size: "18,000 Sq. Ft."
    },
    {
        id: 6,
        title: "Zenith Coworking",
        category: "Coworking",
        location: "Pune",
        image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
        size: "30,000 Sq. Ft."
    },
    {
        id: 7,
        title: "BlueSky Aviation",
        category: "Corporate",
        location: "Delhi",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
        size: "15,000 Sq. Ft."
    },
    {
        id: 8,
        title: "Urban Loft",
        category: "Creative",
        location: "Mumbai",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        size: "5,000 Sq. Ft."
    }
];

const categories = ["All", "Corporate", "Technology", "Creative", "Sustainable", "Coworking"];

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

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onNavigate }) => {
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredProjects = activeFilter === "All"
        ? projects
        : projects.filter(p => p.category === activeFilter);

    return (
        <div className="bg-background pt-20">
            {/* Header */}
            <section className="bg-surface py-20 border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
                    <FadeInSection>
                        <span className="text-kurchi-gold-500 font-bold uppercase tracking-[0.2em] text-xs">Our Portfolio</span>
                        <h1 className="text-5xl font-serif font-bold text-kurchi-espresso-900 mt-6 mb-6">Curated Excellence</h1>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            A showcase of workspaces where engineering meets art. Each project is a testament to our integrated design-build philosophy.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* Filter Bar - Sticky */}
            <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 overflow-x-auto scrollbar-hide">
                    <div className="flex justify-center space-x-8 min-w-max">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`text-xs uppercase tracking-[0.15em] font-bold transition-all py-2 border-b-2 ${activeFilter === cat
                                        ? 'text-kurchi-gold-500 border-kurchi-gold-500'
                                        : 'text-text-secondary border-transparent hover:text-text-primary hover:border-gray-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map((project, index) => (
                        <FadeInSection key={project.id} delay={`${index * 50}ms`}>
                            <div className="group cursor-pointer">
                                <div className="overflow-hidden mb-5 relative aspect-[4/3] rounded-sm bg-gray-100">
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-center justify-center">
                                        <button className="text-white border border-white px-6 py-2 text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors transform translate-y-4 group-hover:translate-y-0 duration-500">
                                            View Project
                                        </button>
                                    </div>
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-105 saturate-[0.8] group-hover:saturate-100 transition-all duration-1000 ease-luxury group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-kurchi-gold-500 uppercase tracking-widest font-bold mb-1">{project.category}</p>
                                        <h3 className="text-xl font-serif font-bold text-kurchi-espresso-900 group-hover:text-kurchi-gold-500 transition-colors">{project.title}</h3>
                                        <p className="text-xs text-text-secondary mt-1">{project.location} • {project.size}</p>
                                    </div>
                                    <ArrowUpRightIcon className="w-5 h-5 text-text-secondary group-hover:text-kurchi-gold-500 transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1 duration-300" />
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-24 text-text-secondary font-light">
                        No projects found in this category.
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <section className="bg-kurchi-espresso-900 py-24 relative overflow-hidden text-center">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <FadeInSection>
                        <h2 className="text-4xl font-serif font-bold text-white mb-6">Ready to Start Your Project?</h2>
                        <p className="text-gray-300 mb-10 font-light text-lg max-w-2xl mx-auto">
                            Whether it's a corporate HQ or a boutique studio, we bring the same level of precision and passion to every space.
                        </p>
                        <button onClick={() => onNavigate('contact')} className="px-10 py-4 bg-kurchi-gold-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-kurchi-espresso-900 transition-all duration-300 transform active:scale-95 shadow-lg">
                            Get In Touch
                        </button>
                    </FadeInSection>
                </div>
            </section>
        </div>
    );
};

export default PortfolioPage;
