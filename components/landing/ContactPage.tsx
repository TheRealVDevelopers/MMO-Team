
import React, { useState, useEffect, useRef } from 'react';
import { PhoneIcon, GlobeAltIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { addLead } from '../../hooks/useLeads';
import { LeadPipelineStatus } from '../../types';
import { USERS } from '../../constants';

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

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');

        // Simulate network delay for effect
        setTimeout(async () => {
            const newLead = {
                clientName: formData.name,
                projectName: formData.subject || 'New Website Inquiry',
                status: LeadPipelineStatus.NEW_NOT_CONTACTED,
                lastContacted: 'Just now',
                assignedTo: USERS[2].id, 
                inquiryDate: new Date(),
                value: 0,
                source: 'Contact Page',
                history: [
                    {
                        action: 'Inquiry Received',
                        user: 'System',
                        timestamp: new Date(),
                        notes: `Email: ${formData.email} | Phone: ${formData.phone} | Msg: ${formData.message}`
                    }
                ],
                tasks: {},
                reminders: [],
                priority: 'Medium' as const,
            };

            await addLead(newLead);
            setFormStatus('success');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            setTimeout(() => setFormStatus('idle'), 5000);
        }, 1500);
    };

    return (
        <div className="bg-background min-h-screen pt-20">
            {/* Hero Text */}
            <section className="bg-kurchi-espresso-950 text-white py-24 px-6 lg:px-12 text-center">
                <FadeInSection>
                    <span className="text-kurchi-gold-500 font-bold uppercase tracking-[0.2em] text-xs">Get In Touch</span>
                    <h1 className="text-5xl md:text-7xl font-serif font-medium mt-6 mb-6">Let's Create Together</h1>
                    <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto leading-relaxed">
                        Whether you are looking to renovate an existing office or build a new headquarters from the ground up, our team is ready to realize your vision.
                    </p>
                </FadeInSection>
            </section>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-16 pb-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    
                    {/* Contact Info Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <FadeInSection delay="100ms">
                            <div className="bg-kurchi-espresso-900 text-white p-10 h-full shadow-2xl flex flex-col justify-between min-h-[500px]">
                                <div>
                                    <h3 className="text-2xl font-serif mb-8">Contact Information</h3>
                                    
                                    <div className="space-y-8">
                                        <div className="flex items-start">
                                            <MapPinIcon className="w-6 h-6 text-kurchi-gold-500 mt-1 flex-shrink-0" />
                                            <div className="ml-4">
                                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Visit Us</p>
                                                <p className="font-light">123 Design District<br/>Cyber City, Gurgaon<br/>Haryana 122002</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <PhoneIcon className="w-6 h-6 text-kurchi-gold-500 mt-1 flex-shrink-0" />
                                            <div className="ml-4">
                                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Call Us</p>
                                                <p className="font-light">+91 (555) 123-4567</p>
                                                <p className="font-light text-sm text-gray-500 mt-1">Mon-Sat, 9am - 7pm</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <EnvelopeIcon className="w-6 h-6 text-kurchi-gold-500 mt-1 flex-shrink-0" />
                                            <div className="ml-4">
                                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Email Us</p>
                                                <p className="font-light">projects@kurchi.com</p>
                                                <p className="font-light text-sm text-gray-500 mt-1">careers@kurchi.com</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <div className="w-full h-40 bg-white/5 rounded-sm flex items-center justify-center border border-white/10">
                                        <span className="text-xs uppercase tracking-widest text-gray-500">[ Map Placeholder ]</span>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>
                    </div>

                    {/* Form Column */}
                    <div className="lg:col-span-3">
                        <FadeInSection delay="300ms">
                            <div className="bg-surface p-10 lg:p-16 h-full shadow-luxury border border-border">
                                <h3 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Send a Message</h3>
                                <p className="text-text-secondary font-light mb-10">Fill out the form below, and our design team will contact you within 24 hours.</p>

                                {formStatus === 'success' ? (
                                    <div className="bg-green-50 border border-green-200 text-green-800 p-8 text-center rounded-sm animate-fade-in">
                                        <h4 className="text-xl font-bold mb-2">Message Sent Successfully</h4>
                                        <p>Thank you for reaching out. We look forward to building your legacy.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="group">
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 group-focus-within:text-kurchi-gold-500 transition-colors">Full Name</label>
                                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-kurchi-gold-500 outline-none transition-all placeholder-gray-300" placeholder="John Doe" />
                                            </div>
                                            <div className="group">
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 group-focus-within:text-kurchi-gold-500 transition-colors">Phone Number</label>
                                                <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-kurchi-gold-500 outline-none transition-all placeholder-gray-300" placeholder="+91 98765 43210" />
                                            </div>
                                        </div>
                                        
                                        <div className="group">
                                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 group-focus-within:text-kurchi-gold-500 transition-colors">Email Address</label>
                                            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-kurchi-gold-500 outline-none transition-all placeholder-gray-300" placeholder="john@company.com" />
                                        </div>

                                        <div className="group">
                                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 group-focus-within:text-kurchi-gold-500 transition-colors">Project Type / Subject</label>
                                            <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-kurchi-gold-500 outline-none transition-all placeholder-gray-300" placeholder="e.g. Corporate Office Fit-out" />
                                        </div>

                                        <div className="group">
                                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 group-focus-within:text-kurchi-gold-500 transition-colors">Message</label>
                                            <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-kurchi-gold-500 outline-none transition-all placeholder-gray-300" placeholder="Tell us about your requirements, timeline, and estimated budget..." />
                                        </div>

                                        <div className="pt-4">
                                            <button 
                                                type="submit" 
                                                disabled={formStatus === 'submitting'}
                                                className="w-full md:w-auto px-10 py-4 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-kurchi-gold-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                                            >
                                                {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
