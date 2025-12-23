import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export const useVenueMode = () => {
    const [isVenueMode, setIsVenueMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "config", "general"), (doc) => {
            if (doc.exists()) {
                setIsVenueMode(doc.data().venueMode === true);
            } else {
                setIsVenueMode(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleVenueMode = async (value: boolean) => {
        try {
            await setDoc(doc(db, "config", "general"), { venueMode: value }, { merge: true });
        } catch (error) {
            console.error("Error toggling venue mode:", error);
        }
    };

    return { isVenueMode, toggleVenueMode, loading };
};
