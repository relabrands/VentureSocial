import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import FounderPass from "@/components/members/FounderPass";
import MemberDirectory from "@/components/members/MemberDirectory";
import Agenda from "@/components/members/Agenda";
import Perks from "@/components/members/Perks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Linkedin, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Helmet, HelmetProvider } from 'react-helmet-async';

import OnboardingModal from "@/components/members/OnboardingModal";

const PassPage = () => {
    const { id } = useParams<{ id: string }>();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState<'pass' | 'room' | 'agenda' | 'perks'>('pass');
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Gatekeeper State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const storedAuth = localStorage.getItem('vs_member_authenticated');

            if (storedAuth === 'true') {
                setIsAuthenticated(true);
                await fetchMemberById(id || "");
            } else {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, [id]);

    const fetchMemberById = async (memberId: string) => {
        if (!memberId) return;
        setLoading(true);
        try {
            let memberData = null;
            let docId = memberId;

            if (memberId.startsWith("VS-")) {
                const q = query(
                    collection(db, "applications"),
                    where("memberId", "==", memberId),
                    where("status", "==", "accepted")
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    memberData = querySnapshot.docs[0].data();
                    docId = querySnapshot.docs[0].id;
                }
            } else {
                const docRef = doc(db, "applications", memberId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    memberData = docSnap.data();
                }
            }

            if (memberData) {
                setMember({ ...memberData, id: docId });
                if (!memberData.superpower || !memberData.biggestChallenge || !memberData.linkedin) {
                    setShowOnboarding(true);
                }
            } else {
                // If auth was true but member not found, maybe invalid ID or deleted.
                // We don't necessarily want to logout, just show not found.
            }
        } catch (error) {
            console.error("Error fetching member:", error);
            toast.error("Failed to load member data");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!emailInput) {
            setAuthError("Please enter your email.");
            return;
        }

        setIsVerifying(true);
        setAuthError("");

        try {
            // Secure Verification: Query Firestore directly
            // We try to match memberId AND email.
            // Note: We try both the input as-is and lowercase to handle potential casing differences in DB.

            let q;
            if (id?.startsWith("VS-")) {
                q = query(
                    collection(db, "applications"),
                    where("memberId", "==", id),
                    where("email", "==", emailInput), // Try exact match first
                    where("status", "==", "accepted")
                );
            } else {
                // If it's a doc ID, we can't easily query by ID field + email without a composite index or fetching.
                // For security, we'll assume public links use VS-ID.
                // If it is a Doc ID, we fallback to fetching (but this should be rare for public).
                // Let's just treat it as "Access Denied" for now if not VS-ID, or fetch-and-verify for DocID.
                // Actually, let's allow DocID fetch-and-verify for admin convenience, but strictly check email.
                const docRef = doc(db, "applications", id || "");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.email?.toLowerCase() === emailInput.toLowerCase()) {
                        // Match!
                        setMember({ ...data, id: docSnap.id });
                        localStorage.setItem('vs_member_authenticated', 'true');
                        setIsAuthenticated(true);
                        toast.success("Identity Verified");
                        setIsVerifying(false);
                        return;
                    }
                }
                throw new Error("Invalid credentials");
            }

            let querySnapshot = await getDocs(q);

            // If not found, try lowercase email
            if (querySnapshot.empty) {
                q = query(
                    collection(db, "applications"),
                    where("memberId", "==", id),
                    where("email", "==", emailInput.toLowerCase()),
                    where("status", "==", "accepted")
                );
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                const memberData = querySnapshot.docs[0].data();
                const docId = querySnapshot.docs[0].id;

                setMember({ ...memberData, id: docId });
                localStorage.setItem('vs_member_authenticated', 'true');
                setIsAuthenticated(true);
                toast.success("Identity Verified");

                // Check onboarding
                if (!memberData.superpower || !memberData.biggestChallenge || !memberData.linkedin) {
                    setShowOnboarding(true);
                }
            } else {
                setAuthError("Access Denied. Email does not match our records.");
                toast.error("Access Denied");
            }

        } catch (error) {
            console.error("Verification error:", error);
            setAuthError("Access Denied. Please check your email.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        // Optimistically update local state so we don't need to refetch
        // In a real app we might want to refetch to be sure
        setMember((prev: any) => ({
            ...prev,
            superpower: "Updated", // Just to satisfy the check if we re-ran it, but we won't
            biggestChallenge: "Updated",
            linkedin: prev.linkedin || "Updated"
        }));
    };

    if (loading || gatekeeperLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
            </div>
        );
    }

    // GATEKEEPER UI
    if (isGatekeeperEnabled && !isAuthenticated) {
        return (
            <HelmetProvider>
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    <Helmet>
                        <title>Identity Verification | Venture Social</title>
                    </Helmet>

                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b981_0%,_#000000_70%)] opacity-10 pointer-events-none" />

                    <div className="relative z-10 max-w-md w-full bg-[#111827] border border-[#1f2937] rounded-2xl p-8 shadow-2xl text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="h-16 w-16 bg-[#10b981]/10 rounded-full flex items-center justify-center border border-[#10b981]/20">
                                <ShieldCheck className="h-8 w-8 text-[#10b981]" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Identity Verification
                        </h1>

                        <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                            For security, please enter the email address associated with this Founder Pass.
                        </p>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2 text-left">
                                <Input
                                    type="email"
                                    placeholder="Enter your email..."
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500 h-12"
                                    autoFocus
                                />
                                {authError && (
                                    <p className="text-red-500 text-xs flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <Lock className="h-3 w-3" /> {authError}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isVerifying}
                                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-6 text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02]"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Access"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </HelmetProvider>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Member Not Found</h1>
                    <p className="text-gray-400">The requested founder pass does not exist.</p>
                </div>
            </div>
        );
    }

    // AUTHENTICATED UI
    return (
        <HelmetProvider>
            <div className="min-h-[100dvh] w-full bg-black flex flex-col items-center pt-8 p-4 pb-24 gap-6 relative">
                <Helmet>
                    <title>{member.fullName} | Venture Social Founder Pass</title>
                    <meta property="og:title" content={`${member.fullName} | Venture Social Founder Pass`} />
                    <meta property="og:description" content={`Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴`} />
                    <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/venture-social-dr.firebasestorage.app/o/founder-pass-preview.png?alt=media" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:type" content="website" />
                </Helmet>

                <OnboardingModal
                    isOpen={showOnboarding}
                    memberId={member.id}
                    role={member.role}
                    existingLinkedin={member.linkedin}
                    onComplete={handleOnboardingComplete}
                />

                {/* Content Area */}
                <div className={`w-full max-w-md animate-in fade-in duration-500 ${showOnboarding ? 'blur-sm pointer-events-none' : ''}`}>
                    {currentTab === 'pass' && (
                        <div className="flex flex-col items-center">
                            <FounderPass
                                name={member.fullName || member.name}
                                memberId={member.memberId || "PENDING"}
                                company={member.projectCompany ? `@${member.projectCompany}` : (member.company ? `@${member.company}` : undefined)}
                                role={member.role || "FOUNDER"}
                                positionRole={member.positionRole}
                                variant="private"
                                shareUrl={`https://www.venturesocialdr.com/p/${member.memberId || id}`}
                                shareText={`Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴 #VentureSocialdr`}
                            />
                            <p className="text-xs text-gray-500 animate-pulse mt-4">
                                Tap card to flip & share 🔄
                            </p>
                        </div>
                    )}

                    {currentTab === 'room' && (
                        <MemberDirectory
                            currentMemberId={member.memberId}
                            recommendations={member.aiRecommendations}
                        />
                    )}

                    {currentTab === 'agenda' && (
                        <Agenda />
                    )}

                    {currentTab === 'perks' && (
                        <Perks />
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-[#111827]/90 backdrop-blur-lg border border-gray-800 rounded-full p-1.5 shadow-2xl z-50 flex justify-between items-center ${showOnboarding ? 'hidden' : ''}`}>
                    <button
                        onClick={() => setCurrentTab('pass')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${currentTab === 'pass' ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">💳</span>
                        <span className="text-[10px] font-medium mt-0.5">My Pass</span>
                    </button>

                    <button
                        onClick={() => setCurrentTab('room')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${currentTab === 'room' ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">👥</span>
                        <span className="text-[10px] font-medium mt-0.5">The Room</span>
                    </button>

                    <button
                        onClick={() => setCurrentTab('agenda')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${currentTab === 'agenda' ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">📅</span>
                        <span className="text-[10px] font-medium mt-0.5">Agenda</span>
                    </button>

                    <button
                        onClick={() => setCurrentTab('perks')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${currentTab === 'perks' ? 'bg-[#10b981] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">🎁</span>
                        <span className="text-[10px] font-medium mt-0.5">Perks</span>
                    </button>
                </div>
            </div>
        </HelmetProvider>
    );
};

export default PassPage;
