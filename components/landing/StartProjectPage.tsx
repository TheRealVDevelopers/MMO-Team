
import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronRightIcon,
    ChevronLeftIcon,
    BuildingOfficeIcon,
    BuildingStorefrontIcon,
    HomeIcon,
    CubeIcon,
    CheckCircleIcon,
    ArrowUpRightIcon,
    PhotoIcon,
    DocumentIcon,
    CalendarIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { addLead } from '../../hooks/useLeads';
import { addClientProject } from '../../hooks/useClientProjects';
import { createEnquiry, generateEnquiryId } from '../../hooks/useEnquiries';
import { LeadPipelineStatus, EnquiryStatus } from '../../types';
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

const StartProjectPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [projectId, setProjectId] = useState('');
    const [submitted, setSubmitted] = useState(false);
    
    const [formData, setFormData] = useState({
        // Step 1: Basic Details
        fullName: '',
        email: '',
        mobile: '+91 ',
        city: '',
        
        // Step 2: Project Type
        projectType: '',
        
        // Step 3: Space Details
        spaceType: '',
        area: '',
        numberOfZones: '',
        isRenovation: '',
        
        // Step 4: Design Preference
        designStyle: '',
        referenceImages: [] as File[],
        floorPlan: null as File | null,
        
        // Step 5: Budget & Timeline
        budgetRange: '',
        startTime: '',
        completionTimeline: '',
        
        // Step 6: Additional Notes
        additionalNotes: ''
    });

    const totalSteps = 6;

    // Generate unique project ID
    const generateProjectId = (type: string) => {
        const prefix = type === 'Office Interior' ? 'OFF' : 
                      type === 'Home Interior' ? 'HOM' : 
                      type === 'Commercial Space' ? 'COM' : 'CUS';
        const year = new Date().getFullYear();
        const random = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
        return `${prefix}-${year}-${random}`;
    };

    const projectTypes = [
        { 
            value: 'Office Interior', 
            icon: <BuildingOfficeIcon className="w-12 h-12" />,
            description: 'Corporate offices, workstations, cabins'
        },
        { 
            value: 'Commercial Space', 
            icon: <BuildingStorefrontIcon className="w-12 h-12" />,
            description: 'Retail, showrooms, restaurants'
        },
        { 
            value: 'Home Interior', 
            icon: <HomeIcon className="w-12 h-12" />,
            description: 'Residential spaces and apartments'
        },
        { 
            value: 'Custom Furniture Only', 
            icon: <CubeIcon className="w-12 h-12" />,
            description: 'Bespoke furniture manufacturing'
        }
    ];

    const designStyles = ['Modern', 'Minimal', 'Executive', 'Luxury', 'Open to Suggestions'];
    const budgetRanges = [
        'Under ₹5 Lakhs',
        '₹5 - 10 Lakhs',
        '₹10 - 25 Lakhs',
        '₹25 - 50 Lakhs',
        '₹50 Lakhs - 1 Crore',
        'Above ₹1 Crore'
    ];

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        // Generate enquiry ID (not project ID yet - that comes after conversion)
        const newEnquiryId = generateEnquiryId();
        setProjectId(newEnquiryId); // Show enquiry ID to user

        // Create enquiry entry in Firebase
        try {
            await createEnquiry({
                enquiryId: newEnquiryId,
                clientName: formData.fullName,
                email: formData.email,
                mobile: formData.mobile,
                city: formData.city,
                projectType: formData.projectType,
                spaceType: formData.spaceType,
                area: formData.area,
                numberOfZones: formData.numberOfZones,
                isRenovation: formData.isRenovation,
                designStyle: formData.designStyle,
                budgetRange: formData.budgetRange,
                startTime: formData.startTime,
                completionTimeline: formData.completionTimeline,
                additionalNotes: formData.additionalNotes,
                status: EnquiryStatus.NEW,
                viewedBy: [],
                isNew: true,
            });

            console.log('Enquiry created successfully:', newEnquiryId);
        } catch (error) {
            console.error('Error creating enquiry:', error);
        }

        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.fullName && formData.email && formData.mobile && formData.city;
            case 2:
                return formData.projectType;
            case 3:
                return formData.spaceType && formData.area && formData.isRenovation;
            case 4:
                return formData.designStyle;
            case 5:
                return formData.budgetRange && formData.startTime && formData.completionTimeline;
            case 6:
                return true; // Additional notes are optional
            default:
                return false;
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-6">
                <FadeInSection className="max-w-2xl w-full">
                    <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-kurchi-espresso-900 mb-4">
                            Enquiry Submitted Successfully!
                        </h1>
                        <div className="inline-block px-8 py-4 bg-kurchi-gold-500/10 rounded-xl mb-6">
                            <p className="text-sm text-text-secondary mb-2">Your Enquiry ID</p>
                            <p className="text-3xl font-serif font-bold text-kurchi-espresso-900">{projectId}</p>
                        </div>
                        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                            Thank you for your interest. Our sales team has received your enquiry and will contact you within 24 hours to discuss your project requirements.
                        </p>
                        <div className="space-y-4 text-left bg-subtle-background p-6 rounded-xl">
                            <h3 className="font-bold text-kurchi-espresso-900 mb-3">What happens next?</h3>
                            <div className="flex items-start space-x-3">
                                <CheckCircleIcon className="w-5 h-5 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-text-secondary">Dedicated consultant assigned within 24 hours</p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircleIcon className="w-5 h-5 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-text-secondary">Secure login credentials shared personally</p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircleIcon className="w-5 h-5 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-text-secondary">Initial consultation scheduled</p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircleIcon className="w-5 h-5 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-text-secondary">Track your project progress online</p>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-kurchi-espresso-950 to-kurchi-espresso-900 text-white py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeInSection>
                        <span className="text-kurchi-gold-500 font-bold uppercase tracking-widest text-xs">Project Onboarding</span>
                        <h1 className="text-5xl md:text-6xl font-serif font-medium mt-6 mb-6">
                            Let's Begin Your<br />Interior Journey
                        </h1>
                        <p className="text-gray-300 text-lg font-light max-w-2xl mx-auto leading-relaxed">
                            Share your vision with us. This comprehensive form helps our team understand your requirements better and kickstart your dream space transformation.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* Progress Bar */}
            <div className="bg-white border-b border-border sticky top-20 z-40">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-text-secondary">Step {currentStep} of {totalSteps}</span>
                        <span className="text-sm text-text-secondary">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-kurchi-gold-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                    
                    {/* Step 1: Basic Details */}
                    {currentStep === 1 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Basic Information</h2>
                            <p className="text-text-secondary mb-8">Let's start with your contact details</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Full Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.fullName} 
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Email Address *</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Mobile Number *</label>
                                        <input 
                                            type="tel" 
                                            required 
                                            value={formData.mobile} 
                                            onChange={e => setFormData({...formData, mobile: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">City / Location *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.city} 
                                        onChange={e => setFormData({...formData, city: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                        placeholder="Gurgaon, Haryana"
                                    />
                                </div>
                            </div>
                        </FadeInSection>
                    )}

                    {/* Step 2: Project Type */}
                    {currentStep === 2 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Project Type</h2>
                            <p className="text-text-secondary mb-8">What kind of space are you planning?</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projectTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setFormData({...formData, projectType: type.value})}
                                        className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-xl ${
                                            formData.projectType === type.value 
                                                ? 'border-kurchi-gold-500 bg-kurchi-gold-500/5 shadow-lg' 
                                                : 'border-gray-200 hover:border-kurchi-gold-500/50'
                                        }`}
                                    >
                                        <div className={`mb-4 transition-colors ${
                                            formData.projectType === type.value ? 'text-kurchi-gold-500' : 'text-gray-400 group-hover:text-kurchi-gold-500'
                                        }`}>
                                            {type.icon}
                                        </div>
                                        <h3 className="text-lg font-bold text-kurchi-espresso-900 mb-2">{type.value}</h3>
                                        <p className="text-sm text-text-secondary">{type.description}</p>
                                    </button>
                                ))}
                            </div>
                        </FadeInSection>
                    )}

                    {/* Step 3: Space Details */}
                    {currentStep === 3 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Space Details</h2>
                            <p className="text-text-secondary mb-8">Tell us about your space requirements</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Type of Space *</label>
                                    <select 
                                        value={formData.spaceType} 
                                        onChange={e => setFormData({...formData, spaceType: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                    >
                                        <option value="">Select type</option>
                                        <option value="Cabin">Cabin</option>
                                        <option value="Workspace">Workspace</option>
                                        <option value="Conference Room">Conference Room</option>
                                        <option value="Full Office">Full Office</option>
                                        <option value="Retail Space">Retail Space</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Approximate Area (sq ft) *</label>
                                        <input 
                                            type="number" 
                                            required 
                                            value={formData.area} 
                                            onChange={e => setFormData({...formData, area: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                            placeholder="2000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Number of Rooms / Zones</label>
                                        <input 
                                            type="number" 
                                            value={formData.numberOfZones} 
                                            onChange={e => setFormData({...formData, numberOfZones: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Is this a renovation or new space? *</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, isRenovation: 'New Space'})}
                                            className={`flex-1 px-6 py-3 rounded-xl border-2 transition-all ${
                                                formData.isRenovation === 'New Space' 
                                                    ? 'border-kurchi-gold-500 bg-kurchi-gold-500/5 text-kurchi-espresso-900 font-bold' 
                                                    : 'border-gray-200 text-text-secondary hover:border-kurchi-gold-500/50'
                                            }`}
                                        >
                                            New Space
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, isRenovation: 'Renovation'})}
                                            className={`flex-1 px-6 py-3 rounded-xl border-2 transition-all ${
                                                formData.isRenovation === 'Renovation' 
                                                    ? 'border-kurchi-gold-500 bg-kurchi-gold-500/5 text-kurchi-espresso-900 font-bold' 
                                                    : 'border-gray-200 text-text-secondary hover:border-kurchi-gold-500/50'
                                            }`}
                                        >
                                            Renovation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>
                    )}

                    {/* Step 4: Design Preference */}
                    {currentStep === 4 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Design Preference</h2>
                            <p className="text-text-secondary mb-8">Help us understand your aesthetic vision</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Preferred Style *</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {designStyles.map((style) => (
                                            <button
                                                key={style}
                                                type="button"
                                                onClick={() => setFormData({...formData, designStyle: style})}
                                                className={`px-6 py-3 rounded-xl border-2 transition-all ${
                                                    formData.designStyle === style 
                                                        ? 'border-kurchi-gold-500 bg-kurchi-gold-500/5 text-kurchi-espresso-900 font-bold' 
                                                        : 'border-gray-200 text-text-secondary hover:border-kurchi-gold-500/50'
                                                }`}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Reference Images (Optional)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-kurchi-gold-500 transition-colors cursor-pointer">
                                        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-text-secondary mb-1">Upload images that inspire you</p>
                                        <p className="text-xs text-gray-400">JPG, PNG up to 5MB each</p>
                                        <input type="file" multiple accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Floor Plan (Optional)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-kurchi-gold-500 transition-colors cursor-pointer">
                                        <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-text-secondary mb-1">Upload floor plan if available</p>
                                        <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
                                        <input type="file" accept=".pdf,image/*" className="hidden" />
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>
                    )}

                    {/* Step 5: Budget & Timeline */}
                    {currentStep === 5 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Budget & Timeline</h2>
                            <p className="text-text-secondary mb-8">Help us plan your project effectively</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Estimated Budget Range *</label>
                                    <select 
                                        value={formData.budgetRange} 
                                        onChange={e => setFormData({...formData, budgetRange: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                    >
                                        <option value="">Select budget range</option>
                                        {budgetRanges.map(range => (
                                            <option key={range} value={range}>{range}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">When would you like to start? *</label>
                                    <select 
                                        value={formData.startTime} 
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                    >
                                        <option value="">Select timeframe</option>
                                        <option value="Immediately">Immediately</option>
                                        <option value="Within 1 month">Within 1 month</option>
                                        <option value="1-3 months">1-3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="Not decided">Not decided yet</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Expected Completion Timeline *</label>
                                    <select 
                                        value={formData.completionTimeline} 
                                        onChange={e => setFormData({...formData, completionTimeline: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                    >
                                        <option value="">Select completion timeline</option>
                                        <option value="1 month">1 month</option>
                                        <option value="2 months">2 months</option>
                                        <option value="3 months">3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="Flexible">Flexible</option>
                                    </select>
                                </div>
                            </div>
                        </FadeInSection>
                    )}

                    {/* Step 6: Additional Notes */}
                    {currentStep === 6 && (
                        <FadeInSection>
                            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Additional Information</h2>
                            <p className="text-text-secondary mb-8">Any special requirements or questions?</p>
                            
                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
                                <textarea 
                                    rows={6} 
                                    value={formData.additionalNotes} 
                                    onChange={e => setFormData({...formData, additionalNotes: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors"
                                    placeholder="Tell us anything else that might help us understand your requirements better..."
                                />
                            </div>

                            <div className="mt-8 p-6 bg-kurchi-gold-500/5 rounded-xl border border-kurchi-gold-500/20">
                                <h4 className="font-bold text-kurchi-espresso-900 mb-3">Review Your Information</h4>
                                <div className="space-y-2 text-sm text-text-secondary">
                                    <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                                    <p><span className="font-medium">Mobile:</span> {formData.mobile}</p>
                                    <p><span className="font-medium">City:</span> {formData.city}</p>
                                    <p><span className="font-medium">Project Type:</span> {formData.projectType}</p>
                                    <p><span className="font-medium">Budget:</span> {formData.budgetRange}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                                currentStep === 1 
                                    ? 'opacity-0 pointer-events-none' 
                                    : 'text-text-secondary hover:text-kurchi-espresso-900 hover:bg-gray-100'
                            }`}
                        >
                            <ChevronLeftIcon className="w-5 h-5 mr-2" />
                            Back
                        </button>

                        {currentStep < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className={`flex items-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                                    isStepValid() 
                                        ? 'bg-kurchi-espresso-900 text-white hover:bg-kurchi-gold-500 shadow-lg' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Next Step
                                <ChevronRightIcon className="w-5 h-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isStepValid()}
                                className={`flex items-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                                    isStepValid() 
                                        ? 'bg-kurchi-gold-500 text-white hover:bg-kurchi-espresso-900 shadow-lg' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Create Project
                                <CheckCircleIcon className="w-5 h-5 ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartProjectPage;
