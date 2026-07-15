import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export const useVenueMode = () => {
    const [isVenueMode, setIsVenueMode] = useState(false);
    const [venueLogoUrl, setVenueLogoUrl] = useState<string>("");
    const [venueTitle, setVenueTitle] = useState<string>("Official Venue");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "config", "general"), (doc) => {
            if (doc.exists()) {
                setIsVenueMode(doc.data().venueMode === true);
                setVenueLogoUrl(doc.data().venueLogoUrl || "");
                setVenueTitle(doc.data().venueTitle || "Official Venue");
            } else {
                setIsVenueMode(false);
                setVenueLogoUrl("");
                setVenueTitle("Official Venue");
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

    const updateVenueConfig = async (url: string, title: string) => {
        try {
            await setDoc(doc(db, "config", "general"), { venueLogoUrl: url, venueTitle: title }, { merge: true });
        } catch (error) {
            console.error("Error updating venue config:", error);
        }
    };

    return { isVenueMode, toggleVenueMode, venueLogoUrl, venueTitle, updateVenueConfig, loading };
};
