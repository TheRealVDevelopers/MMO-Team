import React, { useState, useEffect, useRef } from 'react';
import { 
    XMarkIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon,
    ArrowUpRightIcon,
    BuildingOfficeIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Animation Hook (same as ContactPage)
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

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ 
    children, 
    delay = '0ms', 
    className = '' 
}) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    return (
        <div
            ref={ref}
            style={{ 
                animationDelay: delay,
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className={`${className} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
            {children}
        </div>
    );
};

// Portfolio Data
interface Project {
    id: string;
    name: string;
    description: string;
    industry: string;
    coverImage: string;
    images: string[];
    services: string[];
    highlights: string[];
}

const portfolioProjects: Project[] = [
    {
        id: 'olar',
        name: 'Olar',
        description: 'Modern workspace interiors designed for productivity and comfort.',
        industry: 'Corporate',
        coverImage: 'data:image/png;base64,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',
        images: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200',
            'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Open-plan workspace with ergonomic furniture',
            'Natural lighting integration for enhanced productivity',
            'Sustainable materials and energy-efficient systems'
        ]
    },
    {
        id: 'ola',
        name: 'Ola',
        description: 'Corporate interior execution with clean layouts and functional design.',
        industry: 'Corporate',
        coverImage: 'data:image/png;base64,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',
        images: [
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Seamless blend of modern aesthetics and functionality',
            'Smart technology integration for efficient operations',
            'Collaborative zones with acoustic optimization'
        ]
    },
    {
        id: 'dezy-dental',
        name: 'Dezy Dental',
        description: 'Clinic interiors focused on hygiene, efficiency, and patient experience.',
        industry: 'Healthcare',
        coverImage: 'data:image/png;base64,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',
        images: [
            'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200',
            'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200',
            'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Sterile and calming environment with premium finishes',
            'Advanced ventilation and lighting systems',
            'Patient-centric design with comfortable waiting areas'
        ]
    },
    {
        id: 'parthma-motor',
        name: 'Pratham Motors',
        description: 'Automobile showroom interiors with bold branding and smart layouts.',
        industry: 'Automotive',
        coverImage: 'https://res.cloudinary.com/jerrick/image/upload/v1725879572/66ded513999921001e2b5679.png',
        images: [
            'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200',
            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
            'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Premium display zones with dramatic lighting',
            'Customer lounge with luxury materials',
            'Brand-focused design with impactful visuals'
        ]
    },
    {
        id: 'hong-sau-resorts',
        name: 'Hong sau Resorts',
        description: 'Luxury hospitality interiors blending nature, comfort, and elegance.',
        industry: 'Hospitality',
        coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        images: [
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Nature-inspired design with sustainable materials',
            'Spa-like ambiance with premium amenities',
            'Seamless indoor-outdoor living spaces'
        ]
    },
    {
        id: 'apna-mart',
        name: 'Apna Mart',
        description: 'Retail interiors optimized for customer flow and visual merchandising.',
        industry: 'Retail',
        coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNHeJxGtTjLDh7EGJhOk3IGaFtmvYHRSuq5A&s',
        images: [
            'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200',
            'https://images.unsplash.com/photo-1555529902-5261145633bf?w=1200',
            'https://images.unsplash.com/photo-1603986211815-36ab03e4c07e?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Strategic layout for optimal customer journey',
            'Eye-catching product display systems',
            'Efficient checkout zones with modern POS integration'
        ]
    },
    {
        id: 'team-lease',
        name: 'TeamLease Digital',
        description: 'Flexible office interiors designed for shared workspaces, team productivity, and scalable business growth.',
        industry: 'Co-working / Corporate',
        coverImage: 'data:image/png;base64,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',
        images: [
            'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=1200',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200'
        ],
        services: ['Design', 'Execution', 'Furniture', 'Electrical', 'Flooring'],
        highlights: [
            'Flexible workspace design for scalable teams',
            'Collaborative zones with hot-desking options',
            'Modular furniture systems for rapid reconfiguration'
        ]
    }
];

const PortfolioPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedProject) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedProject]);

    const closeModal = () => {
        setSelectedProject(null);
        setCurrentImageIndex(0);
    };

    const nextImage = () => {
        if (selectedProject) {
            setCurrentImageIndex((prev) => (prev + 1) % selectedProject.images.length);
        }
    };

    const prevImage = () => {
        if (selectedProject) {
            setCurrentImageIndex((prev) => 
                prev === 0 ? selectedProject.images.length - 1 : prev - 1
            );
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary/5 via-background to-background py-32 px-6 overflow-hidden">
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <FadeInSection>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                            Portfolio
                        </span>
                        <h1 className="text-5xl md:text-7xl font-serif font-medium text-text-primary mb-6 leading-[1.1]">
                            Projects That Speak Quality
                        </h1>
                        <p className="text-lg text-text-secondary font-light max-w-3xl mx-auto leading-relaxed mb-12">
                            We partner with brands across industries to design, build, and execute complete interior solutions — from concept to completion.
                        </p>
                    </FadeInSection>

                    {/* Scroll Indicator */}
                    <FadeInSection delay="400ms" className="mt-16">
                        <div className="inline-flex flex-col items-center gap-2 text-text-tertiary">
                            <span className="text-xs font-light uppercase tracking-widest">Scroll to explore</span>
                            <div className="w-[1px] h-12 bg-gradient-to-b from-text-tertiary to-transparent animate-pulse" />
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Portfolio Grid Section */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {portfolioProjects.map((project, index) => (
                        <FadeInSection key={project.id} delay={`${index * 100}ms`}>
                            <div 
                                className="group cursor-pointer"
                                onClick={() => setSelectedProject(project)}
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-700 transform hover:-translate-y-2">
                                    {/* Cover Image */}
                                    <div className="relative h-64 overflow-hidden bg-subtle-background">
                                        <img 
                                            src={project.coverImage}
                                            alt={project.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {/* Overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end justify-center pb-8">
                                            <span className="text-white font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                                                View Project
                                                <ArrowUpRightIcon className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6">
                                        {/* Industry Tag */}
                                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
                                            {project.industry}
                                        </span>

                                        {/* Company Name */}
                                        <h3 className="text-2xl font-serif font-bold text-text-primary mb-2">
                                            {project.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-text-secondary font-light leading-relaxed">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>
            </section>

            {/* Trust Section */}
            <section className="bg-subtle-background py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeInSection>
                        <div className="text-center mb-12">
                            <p className="text-lg text-text-secondary font-light leading-relaxed max-w-4xl mx-auto">
                                Trusted by growing brands across <span className="font-medium text-text-primary">retail, hospitality, healthcare,</span> and <span className="font-medium text-text-primary">corporate spaces.</span>
                            </p>
                        </div>

                        {/* Counters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="text-center">
                                <div className="text-5xl font-serif font-bold text-primary mb-2">150+</div>
                                <div className="text-sm text-text-tertiary uppercase tracking-wider">Projects Delivered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif font-bold text-primary mb-2">2M+</div>
                                <div className="text-sm text-text-tertiary uppercase tracking-wider">Sq Ft Designed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif font-bold text-primary mb-2">50+</div>
                                <div className="text-sm text-text-tertiary uppercase tracking-wider">Happy Clients</div>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Call To Action */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <FadeInSection>
                    <div className="bg-gradient-to-br from-primary to-primary-hover text-white rounded-3xl p-12 md:p-16 text-center shadow-2xl">
                        <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6">
                            Have a space in mind?
                        </h2>
                        <p className="text-lg font-light text-white/80 mb-8 max-w-2xl mx-auto">
                            Let's bring your vision to life with our expertise in design, execution, and complete turnkey solutions.
                        </p>
                        <button
                            onClick={() => onNavigate('start-project')}
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            Start Your Project
                            <ArrowUpRightIcon className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                        </button>
                    </div>
                </FadeInSection>
            </section>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                        >
                            <XMarkIcon className="w-6 h-6 text-text-primary" />
                        </button>

                        {/* Image Carousel */}
                        <div className="relative h-[400px] bg-subtle-background">
                            <img
                                src={selectedProject.images[currentImageIndex]}
                                alt={`${selectedProject.name} - ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Navigation Arrows */}
                            {selectedProject.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                                    >
                                        <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                                    >
                                        <ChevronRightIcon className="w-6 h-6 text-text-primary" />
                                    </button>

                                    {/* Image Counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                                        {currentImageIndex + 1} / {selectedProject.images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-8 md:p-12">
                            {/* Industry Tag */}
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-4">
                                {selectedProject.industry}
                            </span>

                            {/* Company Name */}
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-4">
                                {selectedProject.name}
                            </h2>

                            {/* Description */}
                            <p className="text-lg text-text-secondary font-light leading-relaxed mb-8">
                                {selectedProject.description}
                            </p>

                            {/* Services */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">
                                    Services Provided
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProject.services.map((service) => (
                                        <span
                                            key={service}
                                            className="px-4 py-2 bg-subtle-background text-text-primary text-sm font-medium rounded-lg"
                                        >
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Key Highlights */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">
                                    Key Highlights
                                </h3>
                                <div className="space-y-3">
                                    {selectedProject.highlights.map((highlight, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <p className="text-text-secondary font-light leading-relaxed">{highlight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => {
                                    closeModal();
                                    onNavigate('start-project');
                                }}
                                className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Request Similar Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioPage;
