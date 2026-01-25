import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const RootRedirect = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is logged in. Find their Member ID / Pass.
                try {
                    // Query applications where userId == user.uid
                    // Assuming 'userId' field exists on application doc. 
                    // If not, we might need to query by email or we assume docId is NOT uid (it usually isn't in this app structure).

                    // Strategy: Query by 'email' since we likely have that.
                    // Or check if 'userId' is stored.
                    // Let's try email first as it's standard.

                    const q = query(collection(db, "applications"), where("email", "==", user.email));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const docId = snapshot.docs[0].id;
                        // Redirect to Pass Page
                        // User said "redirect to his pass". Assuming /pass/:id is the full member experience.
                        navigate(`/pass/${docId}`, { replace: true });
                    } else {
                        // User logged in but no application found?
                        // Maybe redirect to access anyway or a "Not Found" state
                        // For now, access page seems safe or stay here.
                        // But if we stay here, we render nothing.
                        // Let's redirect to /access (maybe they need to apply?)
                        navigate("/access", { replace: true });
                    }

                } catch (error) {
                    console.error("Error finding member pass:", error);
                    navigate("/access", { replace: true });
                }
            } else {
                // Not logged in -> Redirect to Access
                navigate("/access", { replace: true });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
        </div>
    );
};

export default RootRedirect;
