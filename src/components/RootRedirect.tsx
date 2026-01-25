import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Index from "../pages/Index";

const RootRedirect = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [showLanding, setShowLanding] = useState(false);

    useEffect(() => {
        // 1. Fast Check: LocalStorage (Instant Redirect)
        // If we have a cached ID, go there immediately.
        const cachedPassId = localStorage.getItem('vs_member_pass_id');
        if (cachedPassId) {
            navigate(`/pass/${cachedPassId}`, { replace: true });
            return;
        }

        // 2. Wait for Global Auth to load
        if (loading) return;

        const checkUser = async () => {
            const currentUser = user || auth.currentUser;

            if (currentUser) {
                // User is logged in. Find their Member ID.
                try {
                    // Strategy 1: Check if Doc ID matches Auth UID (Most reliable permissions)
                    const docRef = doc(db, "applications", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const docId = docSnap.id;
                        localStorage.setItem('vs_member_pass_id', docId);
                        localStorage.setItem('vs_member_authenticated', 'true');
                        navigate(`/pass/${docId}`, { replace: true });
                        return;
                    }

                    // Strategy 2: Query by Email (Fallback)
                    if (currentUser.email) {
                        const q = query(collection(db, "applications"), where("email", "==", currentUser.email));
                        const snapshot = await getDocs(q);

                        if (!snapshot.empty) {
                            const docId = snapshot.docs[0].id;
                            localStorage.setItem('vs_member_pass_id', docId);
                            localStorage.setItem('vs_member_authenticated', 'true');
                            navigate(`/pass/${docId}`, { replace: true });
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error finding member pass:", error);
                }
                // Fallback (Logic failed or no doc) -> Show Landing or Access?
                // If they are logged in but have no pass, Access/Login is probably safer to force re-check or show error.
                // But user requested "Landing only if user === null".
                // If user !== null but no pass, it's an edge case. Let's go to Access.
                navigate("/access", { replace: true });
            } else {
                // Not logged in *according to Firebase*.
                // Check if we *expect* to be logged in (Local Flag) OR PWA (Paranoid Mode)
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
                const shouldBeLoggedIn = localStorage.getItem('vs_member_authenticated') === 'true' || isPWA;

                if (shouldBeLoggedIn) {
                    if (!isChecking) {
                        setIsChecking(true);

                        let attempts = 0;
                        const maxAttempts = 30; // 3 seconds max

                        const interval = setInterval(async () => {
                            attempts++;
                            const recoveredUser = auth.currentUser;

                            if (recoveredUser) {
                                clearInterval(interval);
                                // Recovered! Fetch ID & Save
                                try {
                                    // Strategy 1: Check ID == UID
                                    const docRef = doc(db, "applications", recoveredUser.uid);
                                    const docSnap = await getDoc(docRef);

                                    if (docSnap.exists()) {
                                        const docId = docSnap.id;
                                        localStorage.setItem('vs_member_pass_id', docId);
                                        localStorage.setItem('vs_member_authenticated', 'true');
                                        navigate(`/pass/${docId}`, { replace: true });
                                        return;
                                    }

                                    // Strategy 2: Query by Email
                                    if (recoveredUser.email) {
                                        const q = query(collection(db, "applications"), where("email", "==", recoveredUser.email));
                                        const snapshot = await getDocs(q);
                                        if (!snapshot.empty) {
                                            const docId = snapshot.docs[0].id;
                                            localStorage.setItem('vs_member_pass_id', docId);
                                            localStorage.setItem('vs_member_authenticated', 'true');
                                            navigate(`/pass/${docId}`, { replace: true });
                                        } else {
                                            navigate("/access", { replace: true });
                                        }
                                    } else {
                                        navigate("/access", { replace: true });
                                    }
                                } catch (e) {
                                    navigate("/access", { replace: true });
                                }
                            } else if (attempts >= maxAttempts) {
                                clearInterval(interval);
                                // Timeout -> Truly logged out
                                localStorage.removeItem('vs_member_authenticated');
                                localStorage.removeItem('vs_member_pass_id');
                                setShowLanding(true);
                            }
                        }, 100);

                        return () => clearInterval(interval);
                    }
                } else {
                    // Not logged in, No PWA/Flag expectation -> Show Landing
                    setShowLanding(true);
                }
            }
        };

        if (!isChecking) {
            checkUser();
        }
    }, [user, loading, navigate, isChecking]);

    if (showLanding) {
        return <Index />;
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
        </div>
    );
};

export default RootRedirect;
