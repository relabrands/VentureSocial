import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export const useGatekeeperMode = () => {
    const [isGatekeeperEnabled, setIsGatekeeperEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "config", "gatekeeper"), (doc) => {
            if (doc.exists()) {
                setIsGatekeeperEnabled(doc.data().enabled);
            } else {
                // Default to false if config doesn't exist
                setIsGatekeeperEnabled(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleGatekeeperMode = async (enabled: boolean) => {
        try {
            await setDoc(doc(db, "config", "gatekeeper"), { enabled });
        } catch (error) {
            console.error("Error toggling gatekeeper mode:", error);
        }
    };

    return { isGatekeeperEnabled, toggleGatekeeperMode, loading };
};
