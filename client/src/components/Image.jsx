import { useState } from 'react';

export default function Image({ src, alt = '', className = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`flex flex-col ${className}`}>
            <img
                src={src}
                alt={alt}
                className="h-auto mb-1 max-w-[200px] rounded shadow-md object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => setIsOpen(true)}
            />
            {alt && <p className="text-xs text-muted italic">{alt}</p>}

            {/* Lightbox: opaque backdrop + full-size image, animated */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-pointer transition-opacity duration-300 ease-out ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden={!isOpen}
            >
                <img
                    src={src}
                    alt={alt}
                    className={`max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded shadow-2xl transition-all duration-300 ease-out ${
                        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                />
            </div>
        </div>
    );
}