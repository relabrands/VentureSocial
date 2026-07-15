import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export const useVenueMode = () => {
    const [isVenueMode, setIsVenueMode] = useState(false);
    const [venueLogoUrl, setVenueLogoUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "config", "general"), (doc) => {
            if (doc.exists()) {
                setIsVenueMode(doc.data().venueMode === true);
                setVenueLogoUrl(doc.data().venueLogoUrl || "");
            } else {
                setIsVenueMode(false);
                setVenueLogoUrl("");
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

    const updateVenueLogo = async (url: string) => {
        try {
            await setDoc(doc(db, "config", "general"), { venueLogoUrl: url }, { merge: true });
        } catch (error) {
            console.error("Error updating venue logo:", error);
        }
    };

    return { isVenueMode, toggleVenueMode, venueLogoUrl, updateVenueLogo, loading };
};
