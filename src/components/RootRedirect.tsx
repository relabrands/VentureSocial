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
                    if (!isChecking) {
                        setIsChecking(true);

                        let attempts = 0;
                        const maxAttempts = 50; // 50 * 100ms = 5 seconds

                        const interval = setInterval(async () => {
                            attempts++;
                            // Check direct auth instance
                            const recoveredUser = auth.currentUser;

                            if (recoveredUser) {
                                clearInterval(interval);
                                // Found user! Re-run the success logic
                                try {
                                    const q = query(collection(db, "applications"), where("email", "==", recoveredUser.email));
                                    const snapshot = await getDocs(q);
                                    if (!snapshot.empty) {
                                        const docId = snapshot.docs[0].id;
                                        navigate(`/pass/${docId}`, { replace: true });
                                    } else {
                                        navigate("/access", { replace: true });
                                    }
                                } catch (e) {
                                    navigate("/access", { replace: true });
                                }
                            } else if (attempts >= maxAttempts) {
                                clearInterval(interval);
                                // Timed out
                                localStorage.removeItem('vs_member_authenticated');
                                navigate("/access", { replace: true });
                            }
                        }, 100);

                        return () => clearInterval(interval);
                    }
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
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
            <p className="text-gray-500 text-xs animate-pulse">
                {isChecking ? "Verifying secure session..." : "Loading..."}
            </p>
        </div>
    );
};

export default RootRedirect;
