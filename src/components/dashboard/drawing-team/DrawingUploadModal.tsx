import React, { useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, Square2StackIcon } from '@heroicons/react/24/outline';

interface DrawingUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, type: 'pdf' | 'cad') => void;
}

const DrawingUploadModal: React.FC<DrawingUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const cadInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'cad') => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file, type);
            onClose();
        }
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200 dark:border-gray-700">
                                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                        Upload Drawing
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg p-1 transition-all"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="px-6 py-8">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                                        Please select the type of drawing you want to upload.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* OPTION 1: PDF */}
                                        <button
                                            onClick={() => pdfInputRef.current?.click()}
                                            className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 dark:hover:bg-slate-800 transition-all group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform">
                                                <DocumentTextIcon className="w-8 h-8" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-bold text-gray-900 dark:text-white">PDF Document</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submit standard PDF drawing</p>
                                            </div>
                                            <input
                                                type="file"
                                                ref={pdfInputRef}
                                                className="hidden"
                                                accept=".pdf"
                                                onChange={(e) => handleFileChange(e, 'pdf')}
                                            />
                                        </button>

                                        {/* OPTION 2: CAD */}
                                        <button
                                            onClick={() => cadInputRef.current?.click()}
                                            className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 dark:hover:bg-slate-800 transition-all group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <Square2StackIcon className="w-8 h-8" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-bold text-gray-900 dark:text-white">2D / CAD Drawing</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.dwg, .dxf, .dgn, .stl</p>
                                            </div>
                                            <input
                                                type="file"
                                                ref={cadInputRef}
                                                className="hidden"
                                                accept=".dwg,.dxf,.dgn,.stl,.sldprt,.sldasm,.stp,.step"
                                                onChange={(e) => handleFileChange(e, 'cad')}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DrawingUploadModal;
