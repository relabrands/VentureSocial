import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import FounderPass from "@/components/members/FounderPass";
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
        const url = window.location.href;
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
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 gap-8">
                <Helmet>
                    <title>{member.fullName} | Venture Social Founder Pass</title>
                    <meta property="og:title" content={`${member.fullName} | Venture Social Founder Pass`} />
                    <meta property="og:description" content={`Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴`} />
                    <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/venture-social-dr.firebasestorage.app/o/founder-pass-preview.png?alt=media" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:type" content="website" />
                </Helmet>
                <FounderPass
                    name={member.fullName || member.name}
                    memberId={member.memberId || "PENDING"}
                    company={member.projectCompany ? `@${member.projectCompany}` : undefined}
                />

                <div className="flex flex-col gap-4 w-full max-w-[320px]">
                    <Button
                        onClick={handleShareLinkedIn}
                        className="w-full bg-[#0077b5] hover:bg-[#006396] text-white"
                    >
                        <Linkedin className="mr-2 h-4 w-4" />
                        Share on LinkedIn
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                        Share your achievement with your network
                    </p>
                </div>
            </div>
        </HelmetProvider>
    );
};

export default PassPage;
