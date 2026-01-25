import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import FounderPass from "@/components/members/FounderPass";
import MemberDirectory from "@/components/members/MemberDirectory";
import Agenda from "@/components/members/Agenda";
import Perks from "@/components/members/Perks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"
import { Linkedin, Loader2, Lock, ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import OnboardingModal from "@/components/members/OnboardingModal";
import MemberProfileSheet from "@/components/members/MemberProfileSheet";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const PassPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [currentTab, setCurrentTab] = useState<'pass' | 'room' | 'agenda' | 'perks' | 'room_live'>('pass');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Spot Me State
    const [showSpotMeModal, setShowSpotMeModal] = useState(false);
    const [spotMeText, setSpotMeText] = useState("");
    const [savingSpotMe, setSavingSpotMe] = useState(false);

    // Monitor Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                // If logged in, try to fetch/subscribe
                subscribeToMember(id || "", user.uid);
            } else {
                // Not logged in -> Redirect to Access/Login or show locked
                // We'll wait a bit or prompt
                setLoading(false);
            }
        });
    }, [id]);

    const [eventStatus, setEventStatus] = useState<'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED'>('UPCOMING');
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
    const [agendaConfig, setAgendaConfig] = useState<any>(null);

    // Fetch Active Event
    useEffect(() => {
        const fetchActiveEvent = async () => {
            try {
                // Fetch all events sorted by start time
                // We do client-side filtering to pick the "best" one to show
                const q = query(collection(db, "events"), orderBy("startTimestamp", "asc"));
                const snapshot = await getDocs(q);

                let activeEvent: any = null;
                let status: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED' = 'UPCOMING';

                const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                // Logic:
                // 1. Check for LIVE event (Now inside window)
                // 2. Check for ENDED_RECENTLY (Now < End + 24h) -- Only if no LIVE event? Or maybe priority?
                // 3. Check for NEXT UPCOMING (Start > Now)

                const now = new Date();

                // Find LIVE
                const liveEvent = events.find((e: any) => {
                    if (!e.startTimestamp || !e.endTimestamp) return false;
                    const start = new Date(e.startTimestamp);
                    const end = new Date(e.endTimestamp);
                    return now >= start && now <= end && !e.archived;
                });

                if (liveEvent) {
                    activeEvent = liveEvent;
                    status = 'LIVE';
                } else {
                    // Find ENDED RECENTLY (within 24h)
                    const recentEvent = events.find((e: any) => {
                        if (!e.endTimestamp) return false;
                        const end = new Date(e.endTimestamp);
                        const twentyFourHoursAfter = new Date(end.getTime() + (24 * 60 * 60 * 1000));
                        return now > end && now < twentyFourHoursAfter && !e.archived;
                    });

                    if (recentEvent) {
                        activeEvent = recentEvent;
                        status = 'ENDED_RECENTLY';
                    } else {
                        // Find NEAREST UPCOMING
                        const upcomingEvent = events.find((e: any) => {
                            if (!e.startTimestamp) return false;
                            return new Date(e.startTimestamp) > now && !e.archived;
                        });

                        if (upcomingEvent) {
                            activeEvent = upcomingEvent;
                            status = 'UPCOMING';
                        }
                    }
                }

                if (activeEvent) {
                    setAgendaConfig(activeEvent);
                    setEventStatus(status);
                } else {
                    // Fallback to legacy or defaults if no events found
                    // Can leave defaults in child components
                }

            } catch (e) {
                console.error("Error fetching events", e);
            }
        };
        fetchActiveEvent();
    }, []);

    const subscribeToMember = (memberId: string) => {
        if (!memberId) return;
        setLoading(true);

        try {
            if (memberId.startsWith("VS-")) {
                const q = query(
                    collection(db, "applications"),
                    where("memberId", "==", memberId),
                    where("status", "==", "accepted")
                );

                getDocs(q).then(snapshot => {
                    if (!snapshot.empty) {
                        const foundDoc = snapshot.docs[0];
                        setupDocListener(foundDoc.id);
                    } else {
                        setLoading(false);
                    }
                });
            } else {
                setupDocListener(memberId);
            }
        } catch (error) {
            console.error("Error setting up subscription:", error);
            setLoading(false);
        }
    };

    const setupDocListener = (docId: string) => {
        const docRef = doc(db, "applications", docId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMember({ ...data, id: docSnap.id });
                setAttendanceStatus(data.attendance_status);

                // Spot Me Modal Trigger
                if (data.attendance_status === 'PRESENT' && !data.how_to_spot_me) {
                    if (!sessionStorage.getItem(`spot_me_dismissed_${docId}`)) {
                        setShowSpotMeModal(true);
                    }
                }

                if (!data.superpower || !data.biggestChallenge || !data.linkedin) {
                    setShowOnboarding(true);
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
        });
        return unsubscribe;
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

    // AUTHENTICATED UI
    // Auth redirect logic
    if (!loading && !currentUser) {
        // Show message before redirecting
        toast.error("Please login to access your Founder Pass");
        // Small delay to allow toast to show? No, just redirect, toast usually persists or we can use a query param
        // Actually, window.location.href is hard refresh. Navigate is better.
        // But since we used window.location before, let's stick to it but maybe adding a query param for the login page to show the error
        navigate('/access?error=auth_required');
        return null;
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <Lock className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-white">Access Denied</h1>
                    <p className="text-gray-400">
                        This Founder Pass belongs to another member.
                        Please log in with the correct email address.
                    </p>
                    <Button
                        onClick={() => {
                            auth.signOut();
                            navigate('/access');
                        }}
                        variant="outline"
                    >
                        Switch Account
                    </Button>
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

                {/* Profile Header */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-full pl-1 pr-3 py-1 hover:border-purple-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:shadow-purple-500/20">
                            {member.fullName?.charAt(0) || "U"}
                        </div>
                        <span className="text-xs font-medium text-gray-300 group-hover:text-white hidden sm:block">Edit Profile</span>
                    </button>
                </div>

                <MemberProfileSheet
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    member={member}
                    onUpdate={(updatedData) => setMember(updatedData)}
                />

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

                    {currentTab === 'room_live' && (
                        <MemberDirectory
                            currentMemberId={member.memberId}
                            recommendations={member.aiRecommendations}
                            liveMode={true}
                        />
                    )}

                    {currentTab === 'agenda' && (
                        <Agenda
                            memberId={member.id} // Pass Firestore Document ID for RSVP updates
                            onEnterRoomLive={() => setCurrentTab('room_live')}
                            eventStatus={eventStatus}
                            config={agendaConfig}
                            onEditSpotMe={() => {
                                setSpotMeText(member.how_to_spot_me || "");
                                setShowSpotMeModal(true);
                            }}
                        />
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

                    {/* ROOM LIVE NAV ITEM */}
                    {(eventStatus === 'LIVE' || eventStatus === 'ENDED_RECENTLY') && attendanceStatus === 'PRESENT' && (
                        <button
                            onClick={() => setCurrentTab('room_live')}
                            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all relative ${currentTab === 'room_live' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <span className="text-lg animate-pulse">📡</span>
                            <span className="text-[10px] font-bold mt-0.5">LIVE</span>
                            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        </button>
                    )}

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

            {/* Spot Me Modal */}
            <Dialog open={showSpotMeModal} onOpenChange={setShowSpotMeModal}>
                <DialogContent className="sm:max-w-md bg-[#111827] border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Eye className="h-5 w-5 text-purple-400" />
                            Help others recognize you
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This helps other founders identify you in the room. Be specific about how you look or where you are.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Textarea
                                placeholder="e.g. Blue blazer, near the entrance..."
                                value={spotMeText}
                                onChange={(e) => setSpotMeText(e.target.value)}
                                className="bg-gray-900 border-gray-700 min-h-[100px] text-white placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowSpotMeModal(false);
                                sessionStorage.setItem(`spot_me_dismissed_${member?.id}`, 'true');
                            }}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!member?.id) return;
                                setSavingSpotMe(true);
                                try {
                                    await updateDoc(doc(db, "applications", member.id), {
                                        how_to_spot_me: spotMeText
                                    });
                                    toast.success("Saved! You are now easier to find.");
                                    setShowSpotMeModal(false);
                                } catch (e) {
                                    toast.error("Failed to save");
                                } finally {
                                    setSavingSpotMe(false);
                                }
                            }}
                            disabled={!spotMeText.trim() || savingSpotMe}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {savingSpotMe ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HelmetProvider>
    );
};

export default PassPage;
