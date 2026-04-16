import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { signOut, checkAdminStatus } from "@/firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    adminRole?: string;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    adminRole: undefined,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminRole, setAdminRole] = useState<string | undefined>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser?.uid);
            setUser(currentUser);

            if (currentUser) {
                const adminStatus = await checkAdminStatus(currentUser.uid);
                console.log("Admin Status:", adminStatus);
                setIsAdmin(adminStatus.isAdmin);
                setAdminRole(adminStatus.role);
            } else {
                setIsAdmin(false);
                setAdminRole(undefined);
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
        <AuthContext.Provider value={{ user, loading, isAdmin, adminRole, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
