import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import FounderPass from "@/components/members/FounderPass";
import MemberDirectory from "@/components/members/MemberDirectory";
import Agenda from "@/components/members/Agenda";
import Perks from "@/components/members/Perks";
import { Button } from "@/components/ui/button";
import { Linkedin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet, HelmetProvider } from 'react-helmet-async';

import OnboardingModal from "@/components/members/OnboardingModal";

const PassPage = () => {
    const { id } = useParams<{ id: string }>();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState<'pass' | 'room' | 'agenda' | 'perks'>('pass');
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const fetchMember = async () => {
            if (!id) return;

            try {
                let memberData = null;
                let docId = id;

                // Check if ID is a Member ID (VS-XXX) or Document ID
                if (id.startsWith("VS-")) {
                    // Firestore Rules require the query to explicitly filter by status="accepted"
                    // to match the "allow read: if resource.data.status == 'accepted'" rule.
                    const q = query(
                        collection(db, "applications"),
                        where("memberId", "==", id),
                        where("status", "==", "accepted")
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        memberData = querySnapshot.docs[0].data();
                        docId = querySnapshot.docs[0].id; // Get the actual document ID for updates
                    }
                } else {
                    // Assume Document ID
                    const docRef = doc(db, "applications", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        memberData = docSnap.data();
                    }
                }

                if (memberData) {
                    // Inject the actual document ID into the member object for the modal to use
                    setMember({ ...memberData, id: docId });

                    // Check for Soft Gate (Missing Superpower, Challenge, or LinkedIn)
                    // Only if viewing their own pass (private view) - inferred by using Document ID or if we had auth
                    // For now, we'll check if superpower/biggestChallenge/linkedin are missing
                    if (!memberData.superpower || !memberData.biggestChallenge || !memberData.linkedin) {
                        setShowOnboarding(true);
                    }
                } else {
                    toast.error("Member not found");
                }
            } catch (error) {
                console.error("Error fetching member:", error);
                toast.error("Failed to load member data");
            } finally {
                setLoading(false);
            }
        };

        fetchMember();
    }, [id]);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
            </div>
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
