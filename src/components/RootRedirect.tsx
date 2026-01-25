import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const RootRedirect = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // AuthProvider ensures this component only renders when loading is false

    useEffect(() => {
        const checkUser = async () => {
            if (user) {
                // User is logged in. Find their Member ID / Pass.
                try {
                    const q = query(collection(db, "applications"), where("email", "==", user.email));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const docId = snapshot.docs[0].id;
                        navigate(`/pass/${docId}`, { replace: true });
                    } else {
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
        };

        checkUser();
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
        </div>
    );
};

export default RootRedirect;
