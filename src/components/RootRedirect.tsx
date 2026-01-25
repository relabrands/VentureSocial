import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const RootRedirect = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // If global auth is still loading, do nothing
        if (loading) return;

        const checkUser = async () => {
            const currentUser = user || auth.currentUser;

            if (currentUser) {
                // User is logged in. Find their Member ID / Pass.
                try {
                    const q = query(collection(db, "applications"), where("email", "==", currentUser.email));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const docId = snapshot.docs[0].id;
                        navigate(`/pass/${docId}`, { replace: true });
                        return;
                    }
                } catch (error) {
                    console.error("Error finding member pass:", error);
                }
                // Fallback if query failed or empty (shouldn't happen for valid members)
                navigate("/access", { replace: true });
            } else {
                // Not logged in *according to Firebase*.
                // Check if we *expect* to be logged in (Local Flag)
                const shouldBeLoggedIn = localStorage.getItem('vs_member_authenticated') === 'true';

                if (shouldBeLoggedIn) {
                    // Give it a moment - PWA storage might be lagging or waking up
                    // We only do this wait ONCE per mount to avoid hanging
                    if (!isChecking) {
                        setIsChecking(true);
                        setTimeout(() => {
                            // Check one last time
                            if (auth.currentUser) {
                                // Recovered! Trigger effect again or just reload logic? 
                                // Best to just reload page to force fresh auth state if stuck 
                                // OR navigate(0). But let's verify logic.
                                // If auth.currentUser exists now, the next render cycle of AuthProvider should pick it up?
                                // Not necessarily if listeners detached.
                                // Let's just reload to be safe if we found a user late.
                                window.location.reload();
                            } else {
                                // Truly gone
                                localStorage.removeItem('vs_member_authenticated');
                                navigate("/access", { replace: true });
                            }
                        }, 1500);
                        return; // return to wait for timeout
                    }
                    // If isChecking is true, we are waiting, do nothing.
                } else {
                    // Normal not-logged-in state
                    navigate("/access", { replace: true });
                }
            }
        };

        if (!isChecking) {
            checkUser();
        }
    }, [user, loading, navigate, isChecking]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
            {/* Show meaningful status if taking a while */}
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
            {isChecking && <p className="text-gray-500 text-xs animate-pulse">Resuming session...</p>}
        </div>
    );
};

export default RootRedirect;
