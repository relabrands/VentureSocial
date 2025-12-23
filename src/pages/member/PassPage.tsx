import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import FounderPass from "@/components/members/FounderPass";
import MemberDirectory from "@/components/members/MemberDirectory";
import { Button } from "@/components/ui/button";
import { Linkedin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet, HelmetProvider } from 'react-helmet-async';

const PassPage = () => {
    const { id } = useParams<{ id: string }>();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMember = async () => {
            if (!id) return;

            try {
                let memberData = null;

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
                    setMember(memberData);
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

    const handleShareLinkedIn = () => {
        const text = `Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴 #VentureSocialdr`;
        // Share the PUBLIC link (/p/ID) instead of the private pass link
        // Use memberId directly if available to ensure correct URL construction
        const shareId = member.memberId || id;
        const url = `https://www.venturesocialdr.com/p/${shareId}`;
        const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)} ${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank');
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
            <div className="min-h-screen bg-black flex flex-col items-center pt-8 p-4 gap-6">
                <Helmet>
                    <title>{member.fullName} | Venture Social Founder Pass</title>
                    <meta property="og:title" content={`${member.fullName} | Venture Social Founder Pass`} />
                    <meta property="og:description" content={`Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴`} />
                    <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/venture-social-dr.firebasestorage.app/o/founder-pass-preview.png?alt=media" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:type" content="website" />
                </Helmet>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-[#111827] rounded-full border border-[#1f2937] mb-4">
                    <button
                        onClick={() => setActiveTab('pass')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'pass'
                                ? 'bg-[#10b981] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        My Pass 💳
                    </button>
                    <button
                        onClick={() => setActiveTab('room')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'room'
                                ? 'bg-[#10b981] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        The Room 👥
                    </button>
                </div>

                {activeTab === 'pass' ? (
                    <>
                        <FounderPass
                            name={member.fullName || member.name}
                            memberId={member.memberId || "PENDING"}
                            company={member.projectCompany ? `@${member.projectCompany}` : undefined}
                            role={member.role || "FOUNDER"}
                            variant="private"
                            shareUrl={`https://www.venturesocialdr.com/p/${member.memberId || id}`}
                        />
                        <p className="text-xs text-gray-500 animate-pulse mt-4">
                            Tap card to flip & share 🔄
                        </p>
                    </>
                ) : (
                    <MemberDirectory currentMemberId={member.memberId} />
                )}
            </div>
        </HelmetProvider>
    );
};

export default PassPage;
