import React from 'react';

interface FounderPassProps {
    name: string;
    memberId: string;
    cohort?: string;
    company?: string;
}

const FounderPass: React.FC<FounderPassProps> = ({
    name,
    memberId,
    cohort = "JAN 2026",
    company = "@VentureSocial"
}) => {
    return (
        <div className="relative w-[320px] h-[500px] bg-[#0b1120] text-white font-sans p-[30px] rounded-[20px] flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#1f2937] overflow-hidden">
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
                            Member
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
        </div>
    );
};

export default FounderPass;
