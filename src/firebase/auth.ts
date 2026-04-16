import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = () => {
    return firebaseSignOut(auth);
};

export interface AdminStatus {
    isAdmin: boolean;
    role?: string;
}

export const checkAdminStatus = async (uid: string): Promise<AdminStatus> => {
    try {
        const adminDoc = await getDoc(doc(db, "admins", uid));
        if (adminDoc.exists()) {
            const data = adminDoc.data();
            return { 
                isAdmin: true, 
                role: data?.role || "super_admin" 
            };
        }
        return { isAdmin: false };
    } catch (error) {
        console.error("Error checking admin status:", error);
        return { isAdmin: false };
    }
};

export const isAdmin = async (uid: string): Promise<boolean> => {
    const status = await checkAdminStatus(uid);
    return status.isAdmin;
};
