import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { signOut, isAdmin as checkIsAdmin } from "@/firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser?.uid);
            setUser(currentUser);

            if (currentUser) {
                const adminStatus = await checkIsAdmin(currentUser.uid);
                console.log("Is Admin:", adminStatus);
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut();
            navigate("/login");
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Error logging out");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
