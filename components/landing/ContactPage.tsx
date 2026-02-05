import React, { useState, useEffect, useRef } from 'react';
import {
    PhoneIcon,
    GlobeAltIcon,
    EnvelopeIcon,
    MapPinIcon,
    ClockIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    QuestionMarkCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { addLead } from '../../hooks/useLeads';
import { LeadPipelineStatus } from '../../types';
import { USERS } from '../../constants';

// Animation Hook
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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '+91 ',
        company: '',
        projectType: '',
        budget: '',
        timeline: '',
        subject: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');

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
                        notes: `Email: ${formData.email} | Phone: ${formData.phone} | Company: ${formData.company} | Type: ${formData.projectType} | Budget: ${formData.budget} | Timeline: ${formData.timeline} | Msg: ${formData.message}`
                    }
                ],
                tasks: {},
                reminders: [],
                priority: 'Medium' as const,
            };

            await addLead(newLead);
            setFormStatus('success');
            setFormData({ name: '', email: '', phone: '+91 ', company: '', projectType: '', budget: '', timeline: '', subject: '', message: '' });
            setTimeout(() => setFormStatus('idle'), 5000);
        }, 1500);
    };

    return (
        <div className="bg-background min-h-screen pt-20">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary to-primary-hover text-white py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <FadeInSection>
                        <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Connect With Us</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-medium mt-6 mb-6">Get In Touch</h1>
                        <p className="text-gray-300 text-lg font-light max-w-3xl mx-auto leading-relaxed">
                            Whether you have a question, want to start a project, or just want to connect — we'd love to hear from you. Our team is ready to bring your vision to life.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* Contact Methods Grid */}
            <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <FadeInSection delay="100ms">
                        <a 
                            href="https://maps.google.com/?q=VJQG+JWF,+Begur+Rd,+Maruthi+Layout,+Mico+Layout,+Hongasandra,+Bengaluru,+Karnataka+560114"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-700 transform hover:scale-105 border border-border cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                <MapPinIcon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary/90 mb-2">Visit Us</h3>
                            <p className="text-sm text-text-secondary font-light leading-relaxed">
                                Experience our showroom and discuss your project in person
                            </p>
                            <p className="text-xs text-primary mt-3 font-medium">
                                Click to open in Maps →
                            </p>
                        </a>
                    </FadeInSection>

                    <FadeInSection delay="200ms">
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-700 transform hover:scale-105 border border-border">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                <PhoneIcon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary/90 mb-2">Call Us</h3>
                            <p className="text-sm text-text-secondary font-light leading-relaxed">
                                Speak directly with our design consultants
                            </p>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay="300ms">
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-700 transform hover:scale-105 border border-border">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                <EnvelopeIcon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary/90 mb-2">Email Us</h3>
                            <p className="text-sm text-text-secondary font-light leading-relaxed">
                                Send us your detailed requirements and specifications
                            </p>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay="400ms">
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-700 transform hover:scale-105 border border-border">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                <ChatBubbleLeftRightIcon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary/90 mb-2">Live Chat</h3>
                            <p className="text-sm text-text-secondary font-light leading-relaxed">
                                Get instant answers to your quick questions
                            </p>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Main Content: Form + Contact Details */}
            <section className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column - Contact Details */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Headquarters */}
                        <FadeInSection>
                            <div className="bg-gradient-to-br from-primary to-primary-hover text-white p-8 rounded-2xl shadow-lg">
                                <div className="flex items-center space-x-3 mb-6">
                                    <BuildingOfficeIcon className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-serif font-bold">Headquarters</h3>
                                </div>
                                <div className="space-y-4 text-sm font-light">
                                    <a 
                                        href="https://maps.google.com/?q=VJQG+JWF,+Begur+Rd,+Maruthi+Layout,+Mico+Layout,+Hongasandra,+Bengaluru,+Karnataka+560114"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-300 leading-relaxed hover:text-white transition-colors cursor-pointer block"
                                    >
                                        VJQG+JWF, Begur Rd<br />
                                        Maruthi Layout, Mico Layout<br />
                                        Hongasandra, Bengaluru<br />
                                        Karnataka 560114, India
                                        <span className="block mt-2 text-xs text-gray-400 hover:text-white">
                                            📍 Click to open in Google Maps
                                        </span>
                                    </a>
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Phone</p>
                                        <p className="text-white">+91 (555) 123-4567</p>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Email</p>
                                        <p className="text-white">projects@makemyoffice.com</p>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* Working Hours */}
                        <FadeInSection delay="100ms">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-border">
                                <div className="flex items-center space-x-3 mb-6">
                                    <ClockIcon className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-serif font-bold text-text-primary/90">Working Hours</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary">Monday - Friday</span>
                                        <span className="font-bold text-text-primary/90">9:00 AM - 7:00 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary">Saturday</span>
                                        <span className="font-bold text-text-primary/90">10:00 AM - 5:00 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary">Sunday</span>
                                        <span className="font-bold text-red-600">Closed</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-border">
                                    <p className="text-xs text-text-secondary">
                                        <CheckCircleIcon className="w-4 h-4 inline text-green-600 mr-1" />
                                        Response within 24 hours
                                    </p>
                                </div>
                            </div>
                        </FadeInSection>

                        

                        {/* FAQ Quick Links */}
                        <FadeInSection delay="300ms">
                            <div className="bg-subtle-background p-8 rounded-2xl border border-border">
                                <div className="flex items-center space-x-3 mb-4">
                                    <QuestionMarkCircleIcon className="w-6 h-6 text-primary" />
                                    <h3 className="text-lg font-bold text-text-primary/90">Quick Questions?</h3>
                                </div>
                                <p className="text-sm text-text-secondary mb-4">Common inquiries we receive:</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start space-x-2">
                                        <span className="text-primary">•</span>
                                        <span className="text-text-secondary">What's your typical project timeline?</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="text-primary">•</span>
                                        <span className="text-text-secondary">Do you handle turnkey projects?</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="text-primary">•</span>
                                        <span className="text-text-secondary">Can I see your portfolio?</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="text-primary">•</span>
                                        <span className="text-text-secondary">What's the minimum project size?</span>
                                    </li>
                                </ul>
                            </div>
                        </FadeInSection>
                    </div>

                    {/* Right Column - Enhanced Form */}
                    <div className="lg:col-span-2">
                        <FadeInSection delay="400ms">
                            <div className="bg-white p-10 lg:p-12 rounded-2xl shadow-2xl border border-border">
                                <h2 className="text-3xl font-serif font-bold text-text-primary/90 mb-3">Send Us a Message</h2>
                                <p className="text-text-secondary font-light mb-8">Fill out the form below with your project details, and our team will get back to you within 24 hours.</p>

                                {formStatus === 'success' ? (
                                    <div className="bg-green-50 border-2 border-green-500 text-green-800 p-10 text-center rounded-xl animate-fade-in">
                                        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                        <h4 className="text-2xl font-bold mb-3">Message Sent Successfully!</h4>
                                        <p className="text-green-700 leading-relaxed">Thank you for reaching out. Our design team will review your requirements and contact you within 24 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Personal Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Company Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.company}
                                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                    placeholder="Your Company Ltd."
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Email Address *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                    placeholder="john@company.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                        </div>

                                        {/* Project Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Project Type</label>
                                                <select
                                                    value={formData.projectType}
                                                    onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                >
                                                    <option value="">Select type</option>
                                                    <option value="Office Interior">Office Interior</option>
                                                    <option value="Commercial Space">Commercial Space</option>
                                                    <option value="Home Interior">Home Interior</option>
                                                    <option value="Custom Furniture">Custom Furniture</option>
                                                    <option value="Consultation">Consultation Only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Budget Range</label>
                                                <select
                                                    value={formData.budget}
                                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                >
                                                    <option value="">Select budget</option>
                                                    <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                                                    <option value="₹5 - 10 Lakhs">₹5 - 10 Lakhs</option>
                                                    <option value="₹10 - 25 Lakhs">₹10 - 25 Lakhs</option>
                                                    <option value="₹25 - 50 Lakhs">₹25 - 50 Lakhs</option>
                                                    <option value="Above ₹50 Lakhs">Above ₹50 Lakhs</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Timeline</label>
                                                <select
                                                    value={formData.timeline}
                                                    onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                >
                                                    <option value="">Select timeline</option>
                                                    <option value="Urgent (Within 1 month)">Urgent (Within 1 month)</option>
                                                    <option value="1-3 months">1-3 months</option>
                                                    <option value="3-6 months">3-6 months</option>
                                                    <option value="Flexible">Flexible</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Subject</label>
                                                <input
                                                    type="text"
                                                    value={formData.subject}
                                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                    placeholder="e.g., Office Renovation"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Your Message *</label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.message}
                                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                                                placeholder="Tell us about your project requirements, timeline expectations, and any specific design preferences..."
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={formStatus === 'submitting'}
                                                className="w-full md:w-auto px-10 py-4 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                            >
                                                {formStatus === 'submitting' ? (
                                                    <span className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Sending Message...
                                                    </span>
                                                ) : (
                                                    'Send Message'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="bg-subtle-background py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeInSection>
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <div className="w-full rounded-xl overflow-hidden">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248914.50260281313!2d77.33877182006835!3d12.889122517505701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae155f93c70e19%3A0x6989d36fd97ed3a1!2sMakeMyOffice.Online!5e0!3m2!1sen!2sin!4v1770228951428!5m2!1sen!2sin" 
                                    width="100%" 
                                    height="450" 
                                    style={{ border: 0 }} 
                                    allowFullScreen={true}
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="MakeMyOffice Location"
                                />
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
