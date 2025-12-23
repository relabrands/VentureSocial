import React, { useState } from 'react';
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenueMode } from "@/hooks/useVenueMode";

interface FounderPassProps {
    name: string;
    memberId: string;
    cohort?: string;
    company?: string;
    variant?: 'private' | 'public';
    shareUrl?: string;
    role?: string;
}

const FounderPass: React.FC<FounderPassProps> = ({
    name,
    memberId,
    cohort = "JAN 2026",
    company = "@VentureSocial",
    variant = 'private',
    shareUrl,
    role = "FOUNDER"
}) => {
    // If public, start flipped (showing back side)
    const [isFlipped, setIsFlipped] = useState(variant === 'public');
    const { isVenueMode } = useVenueMode();

    const handleFlip = () => {
        // Only allow flipping if private
        if (variant === 'private') {
            setIsFlipped(!isFlipped);
        }
    };

    const linkedinShareUrl = shareUrl
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        : '#';

    return (
        <div
            className={`relative w-[320px] h-[500px] perspective-1000 group ${variant === 'private' ? 'cursor-pointer' : ''}`}
            onClick={handleFlip}
        >
            <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
                {/* FRONT SIDE (Private Pass) */}
                <div
                    className={`absolute w-full h-full backface-hidden ${isFlipped ? 'pointer-events-none' : ''}`}
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="w-full h-full bg-[#0b1120] text-white font-sans p-[30px] rounded-[20px] flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#1f2937] overflow-hidden">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1e293b_0%,_#0b1120_40%)] pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-[#374151] pb-5">
                                <div className="text-[14px] font-extrabold tracking-[2px] uppercase text-[#9ca3af]">
                                    Venture Social
                                </div>
                                <div className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-mono text-[#10b981] border border-[#10b981]">
                                    {cohort}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-grow flex flex-col justify-center">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[1.5px] text-[#6b7280] mb-2">
                                        {role}
                                    </div>
                                    <div className="text-[32px] font-extrabold leading-[1.1] mb-2.5 bg-gradient-to-r from-white to-[#9ca3af] bg-clip-text text-transparent">
                                        {name}
                                    </div>
                                    <div className="text-[18px] font-medium text-[#10b981]">
                                        {company}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-end">
                                <div className="font-mono">
                                    <div className="text-[10px] uppercase tracking-[1.5px] text-[#6b7280] mb-2">
                                        ID Number
                                    </div>
                                    <div className="text-[16px] text-white tracking-[1px]">
                                        #{memberId}
                                    </div>
                                </div>
                                <div className="w-[60px] h-[60px] bg-white rounded p-1">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${memberId}`}
                                        alt="QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Venue Partner Footer (Front) */}
                        {isVenueMode && (
                            <div className="mt-auto mb-2 flex flex-col items-center justify-center animate-fade-in">
                                <div className="text-[8px] uppercase tracking-[2px] text-gray-500 mb-1">Official Venue</div>
                                <img
                                    src="https://barna.edu.do/wp-content/uploads/2025/01/LOGO_BARNA_HORIZONTAL_BLANCO.webp"
                                    alt="Barna"
                                    className="h-4 object-contain opacity-80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-end">
                            {variant === 'private' && (
                                <div className="absolute top-20 right-5 text-[10px] text-gray-500 animate-pulse flex items-center gap-1">
                                    Tap to flip 🔄
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BACK SIDE (Public Share Card) */}
                <div
                    className={`absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="w-full h-full bg-[#0b1120] text-white font-sans p-[30px] rounded-[20px] flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#1f2937] overflow-hidden">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#10b981_0%,_#0b1120_50%)] pointer-events-none opacity-20" />

                        <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
                            <div className="mt-8">
                                <div className="text-[14px] font-extrabold tracking-[2px] uppercase text-[#9ca3af] mb-4">
                                    Venture Social
                                </div>
                                <h2 className="text-[40px] font-black leading-tight text-white mb-2 animate-fade-up">
                                    I AM A<br />
                                    <span className="text-[#10b981]">MEMBER</span>
                                </h2>
                            </div>

                            <div className="flex-grow flex flex-col justify-center items-center w-full">
                                <div className="text-[24px] font-bold text-white mb-1">
                                    {name}
                                </div>
                                <div className="text-[14px] font-medium text-[#10b981] mb-1 uppercase tracking-wider">
                                    {role}
                                </div>
                                <div className="text-[16px] text-[#9ca3af]">
                                    {company}
                                </div>
                            </div>

                            <div className="w-full mb-8">
                                {shareUrl && (
                                    <a
                                        href={linkedinShareUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-[#0077b5] hover:bg-[#006396] text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center rounded-md"
                                    >
                                        <Linkedin className="mr-2 h-6 w-6" />
                                        Share on LinkedIn
                                    </a>
                                )}
                                {variant === 'private' && (
                                    <p className="text-[10px] text-gray-500 mt-4 animate-pulse">
                                        Tap to flip back 🔄
                                    </p>
                                )}
                            </div>

                            {/* Venue Partner Footer (Back) */}
                            {isVenueMode && (
                                <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
                                    <div className="text-[8px] uppercase tracking-[2px] text-gray-500 mb-1">Official Venue</div>
                                    <img
                                        src="https://barna.edu.do/wp-content/uploads/2025/01/LOGO_BARNA_HORIZONTAL_BLANCO.webp"
                                        alt="Barna"
                                        className="h-4 object-contain opacity-80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            );
};

            export default FounderPass;
