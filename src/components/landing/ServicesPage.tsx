
import React, { useRef, useState, useEffect } from 'react';
import {
    PaintBrushIcon,
    WrenchScrewdriverIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    BuildingOfficeIcon,
    CubeIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface ServicesPageProps {
    onNavigate: (page: string) => void;
}

// Reusing local hook and component for standalone consistency
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
    const [ref, isVisible] = useOnScreen({ threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    return (
        <div ref={ref} style={{ animationDelay: delay }} className={`${className} ${isVisible ? 'animate-luxury-reveal opacity-100' : 'opacity-0 translate-y-8'}`}>
            {children}
        </div>
    );
};

const ServiceDetail: React.FC<{
    title: string;
    description: string;
    features: string[];
    image: string;
    icon: React.ReactNode;
    reversed?: boolean;
}> = ({ title, description, features, image, icon, reversed = false }) => (
    <div className={`flex flex-col lg:flex-row gap-16 items-center py-24 border-b border-border last:border-0 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
        <div className="lg:w-1/2 relative group">
            <FadeInSection className="h-full w-full">
                <div className={`absolute top-6 ${reversed ? 'right-6' : 'left-6'} w-full h-full border-2 border-primary/30 z-0 transition-transform duration-1000 ease-luxury group-hover:translate-x-0 group-hover:translate-y-0 translate-x-2 translate-y-2`}></div>
                <div className="relative z-10 overflow-hidden h-full shadow-xl">
                    <img src={image} alt={title} className="w-full h-[500px] object-cover brightness-[0.8] group-hover:brightness-105 saturate-[0.8] group-hover:saturate-100 transition-all duration-1000 ease-luxury group-hover:scale-110" />
                </div>
            </FadeInSection>
        </div>
        <div className="lg:w-1/2 px-4 lg:px-8">
            <FadeInSection delay="200ms">
                <div className="w-16 h-16 bg-white border border-border shadow-md flex items-center justify-center rounded-full mb-8 text-primary">
                    {icon}
                </div>
                <h3 className="text-4xl font-serif font-bold text-text-primary mb-6">{title}</h3>
                <p className="text-text-secondary text-lg leading-relaxed mb-10 font-light">
                    {description}
                </p>
                <div className="space-y-4">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                            <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="text-base font-medium text-text-primary">{feature}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </FadeInSection>
        </div>
    </div>
);

const ValuePropCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-surface p-8 border border-border shadow-sm hover:shadow-luxury hover:border-primary transition-all duration-300 group">
        <div className="text-text-secondary group-hover:text-primary transition-colors mb-4">{icon}</div>
        <h4 className="text-xl font-bold text-text-primary mb-3">{title}</h4>
        <p className="text-text-secondary font-light text-sm leading-relaxed">{desc}</p>
    </div>
);

const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
    return (
        <div className="bg-background pt-20">
            {/* Header */}
            <div className="relative h-[60vh] bg-background flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
                        alt="Services Hero"
                        className="w-full h-full object-cover opacity-40 animate-image-settle"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/95 to-background"></div>
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
                    <FadeInSection>
                        <span className="text-primary uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Expertise</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">Comprehensive Solutions</h1>
                        <p className="text-gray-300 text-lg font-light max-w-2xl mx-auto leading-relaxed">
                            From the first sketch to the final polish, we handle every aspect of creating your ideal workspace with precision and artistry.
                        </p>
                    </FadeInSection>
                </div>
            </div>

            {/* Value Props */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-16 relative z-20">
                <FadeInSection delay="300ms">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ValuePropCard
                            icon={<ClockIcon className="w-8 h-8" />}
                            title="On-Time Delivery"
                            desc="We respect your timelines. Our integrated project management ensures zero delays."
                        />
                        <ValuePropCard
                            icon={<CurrencyRupeeIcon className="w-8 h-8" />}
                            title="Cost Transparency"
                            desc="No hidden costs. Detailed BOQs ensuring you know exactly what you pay for."
                        />
                        <ValuePropCard
                            icon={<ShieldCheckIcon className="w-8 h-8" />}
                            title="Quality Warranty"
                            desc="We stand by our work. Post-handover support and warranties on all fittings."
                        />
                    </div>
                </FadeInSection>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <ServiceDetail
                    title="Interior Design & Planning"
                    description="We don't just fill spaces; we curate experiences. Our design team blends aesthetic brilliance with functional ergonomics to create offices that boost productivity and reflect your brand's unique identity. We use advanced 3D modeling to let you walk through your office before a single brick is laid."
                    features={['Space Optimization Analysis', '3D Visualization & VR Walkthroughs', 'Brand Identity Integration', 'Lighting & Acoustic Planning']}
                    image="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"
                    icon={<PaintBrushIcon className="w-8 h-8" />}
                />

                <ServiceDetail
                    title="Custom Furniture Manufacturing"
                    description="Quality is non-negotiable. That's why we manufacture our own furniture. Using premium materials and precision engineering at our 25,000 sq ft facility, we create bespoke workstations, cabins, and storage solutions that stand the test of time and usage."
                    features={['In-House Manufacturing Unit', 'Ergonomic Workstations & Chairs', 'Premium Executive Cabins', 'Sustainable Materials Sourcing']}
                    image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80"
                    icon={<CubeIcon className="w-8 h-8" />}
                    reversed
                />

                <ServiceDetail
                    title="Turnkey Execution"
                    description="Leave the complexity to us. Our turnkey solutions cover everything from civil work and HVAC to electricals and finishing. We act as your single point of accountability, coordinating diverse teams to ensure your project is delivered on time, within budget, and to the highest standards."
                    features={['End-to-End Project Management', 'Civil, MEP & HVAC Works', ' rigorous Quality Assurance Checks', 'On-Time Handover Guarantee']}
                    image="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"
                    icon={<BriefcaseIcon className="w-8 h-8" />}
                />

                <ServiceDetail
                    title="Corporate Fit-Outs"
                    description="Whether you're a startup needing agility or an enterprise requiring scale, our fit-out services are adaptable. We transform bare shells into vibrant, ready-to-work environments efficiently, ensuring your business operations can start without a hitch."
                    features={['Rapid Deployment Strategies', 'Modular Solutions for Flexibility', 'Scalable Layouts for Growth', 'Comprehensive Post-Handover Support']}
                    image="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
                    icon={<BuildingOfficeIcon className="w-8 h-8" />}
                    reversed
                />
            </div>

            {/* CTA */}
            <section className="bg-text-primary py-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <FadeInSection>
                        <h2 className="text-4xl font-serif font-bold text-white mb-6">Ready to Build Your Vision?</h2>
                        <p className="text-gray-300 mb-10 font-light text-lg">
                            Let's discuss how our expertise can transform your workspace into a productivity powerhouse.
                        </p>
                        <button onClick={() => onNavigate('contact')} className="px-10 py-4 bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-text-primary transition-all duration-300 transform active:scale-95 shadow-lg">
                            Start a Project
                        </button>
                    </FadeInSection>
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;
