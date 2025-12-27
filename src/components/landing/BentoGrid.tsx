import React from 'react';
import { ShieldCheck, QrCode, Wallet, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BentoGrid = () => {
    return (
        <section className="container mx-auto px-4 py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">How it Works</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">A system designed for meaningful connections.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

                {/* CARD 1: Strictly Curated (Left, Large - 2 cols on mobile? No, user said Left Large, usually implies 1 col full height or 2 cols width. Let's assume 1 col span, 2 rows span for "Left Large" in a 3-col grid, OR 2 cols span, 2 rows span. 
                   User said: "Caja 1 (Izquierda - Grande)", "Caja 2 (Derecha Superior)", "Caja 3 (Derecha Inferior)".
                   This implies a 2-column layout where Left is 1 col (row span 2) and Right is 1 col (split into 2 rows). 
                   OR a 3-column layout where Left is 2 cols (row span 2) and Right is 1 col.
                   Let's go with: Left Col (Span 2 cols, Span 2 rows)? No, that's too big.
                   Let's try: Grid with 2 columns. Left column has 1 tall card. Right column has 2 stacked cards.
                   Mobile: Stacked.
                */}

                <div className="md:col-span-1 md:row-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
                    <div>
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="text-zinc-100 font-bold text-2xl mb-3">Strictly Curated</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Admission is selective. We accept only active founders and verified investors to ensure high-quality conversations.
                        </p>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Recent Members</div>
                        {/* Member List Visual */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-zinc-200 text-sm font-medium">Javier Mendez</div>
                                    <div className="text-emerald-500 text-[10px] font-bold">CEO @ TechCorp</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-900 text-blue-200">JS</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-zinc-200 text-sm font-medium">Jane Smith</div>
                                    <div className="text-purple-400 text-[10px] font-bold">VC @ FutureFund</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 opacity-60">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-orange-900 text-orange-200">MR</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-zinc-200 text-sm font-medium">Mike Ross</div>
                                    <div className="text-zinc-400 text-[10px] font-bold">FOUNDER @ LegalAI</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 2: AI-Driven Connections (Right Top) */}
                <div className="md:col-span-2 md:row-span-1 relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 flex flex-col md:flex-row items-center gap-6 group hover:border-yellow-500/30 transition-colors">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <h3 className="text-zinc-100 font-bold text-xl">AI-Driven Connections</h3>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">
                            Skip the small talk. Our engine analyzes your challenges and pairs you with the exact person who can solve them.
                        </p>
                    </div>

                    {/* Visual: Match Notification */}
                    <div className="flex-1 w-full">
                        <div className="bg-zinc-950 border border-yellow-500/20 rounded-xl p-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-yellow-500" />
                                </div>
                                <div>
                                    <div className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">New Match Found</div>
                                    <div className="text-zinc-200 text-sm font-medium">
                                        Javier <span className="text-zinc-500">(Fintech)</span> + Robinson <span className="text-zinc-500">(Proptech)</span>
                                    </div>
                                    <div className="text-zinc-500 text-xs mt-1">
                                        "High synergy in B2B integrations."
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 3: The Founder Pass (Right Bottom) */}
                <div className="md:col-span-2 md:row-span-1 relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 flex flex-col md:flex-row items-center gap-6 group hover:border-emerald-500/30 transition-colors">
                    <div className="flex-1 order-2 md:order-1">
                        <div className="flex items-center gap-2 mb-2">
                            <QrCode className="h-5 w-5 text-emerald-500" />
                            <h3 className="text-zinc-100 font-bold text-xl">The Founder Pass</h3>
                        </div>
                        <p className="text-zinc-400 text-sm">
                            Your key to the ecosystem. Seamless check-in. Digital identity. Zero friction.
                        </p>
                    </div>

                    <div className="flex-1 flex justify-center order-1 md:order-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                            <div className="relative bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                                <div className="bg-white p-2 rounded-lg">
                                    <QrCode className="h-12 w-12 text-black" />
                                </div>
                                <div>
                                    <div className="text-zinc-200 font-bold">Robinson Sanchez</div>
                                    <div className="text-emerald-500 text-xs font-mono">VERIFIED MEMBER</div>
                                </div>
                                <Wallet className="h-6 w-6 text-zinc-600 ml-2" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default BentoGrid;
