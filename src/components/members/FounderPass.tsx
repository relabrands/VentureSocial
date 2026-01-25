import React, { useState } from 'react';
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenueMode } from "@/hooks/useVenueMode";

interface FounderPassProps {
    name: string;
    memberId: string;
    cohort?: string;
    company?: string;
    variant?: 'private' | 'public' | 'directory';
    shareUrl?: string;
    shareText?: string;
    role?: string;
    positionRole?: string;
    matchScore?: number;
    matchReason?: string;
}

const FounderPass: React.FC<FounderPassProps> = ({
    name,
    memberId,
    cohort = "JAN 2026",
    company = "@VentureSocial",
    variant = 'private',
    shareUrl,
    shareText,
    role = "FOUNDER",
    positionRole,
    matchScore,
    matchReason
}) => {
    // If public, start flipped (showing back side)
    const [isFlipped, setIsFlipped] = useState(variant === 'public');
    const [showAgenda, setShowAgenda] = useState(false);
    const { isVenueMode } = useVenueMode();
    const { upcomingEvents, pastEvents } = useEvents(memberId);

    const handleFlip = () => {
        // Only allow flipping if private
        if (variant === 'private') {
            setIsFlipped(!isFlipped);
        }
    };

    const toggleAgenda = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowAgenda(!showAgenda);
    };

    const linkedinShareUrl = shareUrl
        ? `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText || '')} ${encodeURIComponent(shareUrl)}`
        : '#';

    return (
        <div
            className={`relative w-[320px] h-[500px] perspective-1000 group ${variant === 'private' ? 'cursor-pointer' : ''}`}
            onClick={!showAgenda ? handleFlip : undefined}
        >
            <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped && !showAgenda ? 'rotate-y-180' : ''}`}
            >
                {/* FRONT SIDE (Private Pass) */}
                {!showAgenda && (
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
                                            {positionRole ? `${positionRole} ` : ''}{company}
                                        </div>

                                        {/* Match Info for Directory Variant */}
                                        {variant === 'directory' && matchScore && matchReason && (
                                            <div className="mt-4 w-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">🎯</span>
                                                    <span className="text-yellow-400 font-bold text-sm">{matchScore}% Synergy</span>
                                                </div>
                                                <p className="text-[10px] text-gray-300 italic leading-relaxed line-clamp-3">
                                                    "{matchReason}"
                                                </p>

                                                {shareUrl && (
                                                    <a
                                                        href={shareUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 flex items-center justify-center gap-2 w-full bg-[#0077b5] hover:bg-[#006396] text-white text-[10px] font-bold py-2 rounded transition-colors"
                                                    >
                                                        <Linkedin className="h-3 w-3" />
                                                        Visit LinkedIn
                                                    </a>
                                                )}
                                            </div>
                                        )}
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
                                    <div className="text-[8px] uppercase tracking-[2px] text-gray-400 mb-1">Official Venue</div>
                                    <img
                                        src="https://relabrands.com/wp-content/uploads/2026/01/logo-cef-horizontal.png"
                                        alt="CEF. - Santo Domingo"
                                        className="h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] brightness-0 invert"
                                    />
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-between items-end relative">
                                {variant === 'private' && (
                                    <>
                                        <button
                                            onClick={toggleAgenda}
                                            className="absolute bottom-20 right-0 z-20 bg-zinc-800/80 hover:bg-zinc-700 text-white text-[10px] px-3 py-1.5 rounded-full border border-zinc-600 transition-colors backdrop-blur-sm"
                                        >
                                            📅 Agenda
                                        </button>
                                        <div className="absolute top-20 right-5 text-[10px] text-gray-500 animate-pulse flex items-center gap-1">
                                            Tap to flip 🔄
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Agenda View Overlay */}
                {showAgenda && (
                    <div className="absolute inset-0 w-full h-full bg-[#0b1120] text-white p-[20px] rounded-[20px] z-30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                            <h3 className="text-lg font-bold text-white">📅 Agenda</h3>
                            <button
                                onClick={toggleAgenda}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                            {/* Upcoming Events */}
                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-emerald-500 mb-3 font-bold sticky top-0 bg-[#0b1120] py-1">Upcoming Events</h4>
                                {upcomingEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingEvents.map(event => (
                                            <div key={event.id} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                                <div className="text-white font-bold text-sm mb-1">{event.title}</div>
                                                <div className="text-zinc-400 text-xs mb-1">
                                                    {event.date?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-zinc-500 text-[10px] truncate">{event.location}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-zinc-500 text-xs py-4 italic">
                                        No upcoming events scheduled.
                                    </div>
                                )}
                            </div>

                            {/* Past Events / History */}
                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-bold sticky top-0 bg-[#0b1120] py-1">Attendance History</h4>
                                {pastEvents.length > 0 ? (
                                    <div className="space-y-2">
                                        {pastEvents.map(event => (
                                            <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                                                <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-full">
                                                    ✅
                                                </div>
                                                <div>
                                                    <div className="text-zinc-300 text-xs font-medium">{event.title}</div>
                                                    <div className="text-zinc-600 text-[10px]">
                                                        {event.date?.toDate().toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-zinc-600 text-[10px] py-2">
                                        No check-ins recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* BACK SIDE (Public Share Card) */}
                {!showAgenda && (
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
                                        {positionRole ? `${positionRole} ` : ''}{company}
                                    </div>

                                    {/* AI Match Display - Only show on back if NOT directory (though directory won't flip anyway) */}
                                    {variant !== 'directory' && matchScore && matchReason && (
                                        <div className="mt-6 w-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <span className="text-xl">🎯</span>
                                                <span className="text-yellow-400 font-bold text-lg">{matchScore}% Synergy</span>
                                            </div>
                                            <p className="text-xs text-gray-300 italic leading-relaxed">
                                                "{matchReason}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full mb-2">
                                    {shareUrl && variant === 'private' && (
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
                                    <div className="mt-auto mb-6 flex flex-col items-center justify-center animate-fade-in">
                                        <div className="text-[8px] uppercase tracking-[2px] text-gray-400 mb-1">Official Venue</div>
                                        <img
                                            src="https://relabrands.com/wp-content/uploads/2026/01/logo-cef-horizontal.png"
                                            alt="CEF. - Santo Domingo"
                                            className="h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] brightness-0 invert"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FounderPass;
