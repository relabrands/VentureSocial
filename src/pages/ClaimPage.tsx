import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet, HelmetProvider } from 'react-helmet-async';

const ClaimPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [invite, setInvite] = useState<any>(null);

    useEffect(() => {
        const fetchInvite = async () => {
            if (!token) return;

            try {
                const q = query(
                    collection(db, "applications"),
                    where("inviteToken", "==", token)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const inviteData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                    setInvite(inviteData);
                } else {
                    toast.error("Invalid or expired invite link");
                }
            } catch (error) {
                console.error("Error fetching invite:", error);
                toast.error("Failed to load invite");
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [token]);

    const handleClaim = async () => {
        if (!invite) return;

        setClaiming(true);
        try {
            // Generate Member ID if not present (VS-XXX)
            // For simplicity, we'll use a random 3 digit number if not present, 
            // but ideally this should be sequential or managed by a cloud function.
            // Since this is a "Priority" list, we might want to assign them specific IDs?
            // For now, let's generate a random one if missing to ensure they have one.
            let memberId = invite.memberId;
            if (!memberId) {
                const randomNum = Math.floor(100 + Math.random() * 900);
                memberId = `VS-${randomNum}`;
            }

            const ref = doc(db, "applications", invite.id);
            await updateDoc(ref, {
                status: "accepted",
                memberId: memberId,
                claimedAt: new Date().toISOString()
            });

            toast.success("Pass activated successfully! Welcome to the club. 🎉");

            // Redirect to their pass page
            navigate(`/pass/${memberId}`);
        } catch (error) {
            console.error("Error claiming pass:", error);
            toast.error("Failed to activate pass");
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
            </div>
        );
    }

    if (!invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-2 text-red-500">Invalid Invite</h1>
                    <p className="text-gray-400">This invite link is invalid or has expired. Please contact the person who invited you.</p>
                    <Button
                        onClick={() => navigate('/')}
                        className="mt-6 bg-white text-black hover:bg-gray-200"
                    >
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    // If already accepted, redirect to pass
    if (invite.status === 'accepted' && invite.memberId) {
        navigate(`/pass/${invite.memberId}`);
        return null;
    }

    return (
        <HelmetProvider>
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <Helmet>
                    <title>You're Invited | Venture Social</title>
                </Helmet>

                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b981_0%,_#000000_70%)] opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-md w-full bg-[#111827] border border-[#1f2937] rounded-2xl p-8 shadow-2xl text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="h-16 w-16 bg-[#10b981]/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">
                        Hola, {invite.fullName.split(' ')[0]} 👋
                    </h1>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Hemos reservado una credencial de <span className="text-white font-semibold capitalize">{invite.role || invite.category}</span> para ti en representación de <span className="text-white font-semibold">{invite.projectCompany || invite.company}</span>.
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={handleClaim}
                            disabled={claiming}
                            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-6 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] whitespace-normal h-auto min-h-[60px]"
                        >
                            {claiming ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Activating...
                                </>
                            ) : (
                                "Confirmar Asistencia y Activar Pase"
                            )}
                        </Button>

                        <p className="text-xs text-gray-500">
                            Al confirmar, obtendrás acceso inmediato a tu Founder Pass y al directorio de miembros.
                        </p>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
};

export default ClaimPage;
