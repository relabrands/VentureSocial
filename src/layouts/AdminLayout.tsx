import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, LogOut, Users, QrCode } from "lucide-react";

const AdminLayout = () => {
    const { user, loading, isAdmin, logout } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-primary">Venture Social</h2>
                    <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                </div>
                <nav className="px-4 space-y-2">
                    <Link to="/admin/dashboard">
                        <Button variant={isActive("dashboard") ? "secondary" : "ghost"} className="w-full justify-start">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link to="/admin/applications">
                        <Button variant={isActive("applications") ? "secondary" : "ghost"} className="w-full justify-start">
                            <FileText className="mr-2 h-4 w-4" />
                            Applications
                        </Button>
                    </Link>
                    <Link to="/admin/members">
                        <Button variant={isActive("members") ? "secondary" : "ghost"} className="w-full justify-start">
                            <Users className="mr-2 h-4 w-4" />
                            Members
                        </Button>
                    </Link>
                    <Link to="/admin/templates">
                        <Button variant={isActive("templates") ? "secondary" : "ghost"} className="w-full justify-start">
                            <FileText className="mr-2 h-4 w-4" />
                            Email Templates
                        </Button>
                    </Link>
                    <Link to="/admin/check-in">
                        <Button variant={isActive("check-in") ? "secondary" : "ghost"} className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <QrCode className="mr-2 h-4 w-4" />
                            Event Check-in
                        </Button>
                    </Link>
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                    <Button variant="outline" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header (visible on small screens) */}
            {/* ... simplified for brevity, assuming desktop first for admin */}

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
