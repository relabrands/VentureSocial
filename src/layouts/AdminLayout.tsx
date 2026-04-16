import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, LogOut, Users, QrCode, Menu, Calendar, Gift, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AdminLayout = () => {
    const { user, loading, isAdmin, adminRole, adminPermissions, logout } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    const isActive = (path: string) => location.pathname.includes(path);

    const hasViewAccess = (module: string) => {
        if (adminRole === "super_admin") return true;
        
        // If explicit granular permission exists, respect it
        if (adminPermissions && typeof adminPermissions === 'object' && module in adminPermissions) {
            return adminPermissions[module]?.view === true;
        }

        // Fallbacks for legacy/unmigrated users
        if (adminRole === "event_validator") {
            return module === "check-in";
        }
        
        if (adminRole === "partner") {
            // Partners usually saw mostly everything except users
            if (module === "users") return false;
            return true;
        }

        return false; // Default deny
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-white border-r hidden md:block fixed h-full z-10">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-primary">Venture Social</h2>
                    <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                </div>
                <nav className="px-4 space-y-2">
                    {hasViewAccess("dashboard") && (
                        <Link to="/admin/dashboard">
                            <Button variant={isActive("dashboard") ? "secondary" : "ghost"} className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("applications") && (
                        <Link to="/admin/applications">
                            <Button variant={isActive("applications") ? "secondary" : "ghost"} className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Applications
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("members") && (
                        <Link to="/admin/members">
                            <Button variant={isActive("members") ? "secondary" : "ghost"} className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Members
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("templates") && (
                        <Link to="/admin/templates">
                            <Button variant={isActive("templates") ? "secondary" : "ghost"} className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Email Templates
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("priority-invites") && (
                        <Link to="/admin/priority-invites">
                            <Button variant={isActive("priority-invites") ? "secondary" : "ghost"} className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                <Users className="mr-2 h-4 w-4" />
                                Priority Invite List
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("agenda") && (
                        <Link to="/admin/agenda">
                            <Button variant={isActive("agenda") ? "secondary" : "ghost"} className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                <Calendar className="mr-2 h-4 w-4" />
                                Agenda
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("perks") && (
                        <Link to="/admin/perks">
                            <Button variant={isActive("perks") ? "secondary" : "ghost"} className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                <Gift className="mr-2 h-4 w-4" />
                                Perks
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("check-in") && (
                        <Link to="/admin/check-in">
                            <Button variant={isActive("check-in") ? "secondary" : "ghost"} className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                <QrCode className="mr-2 h-4 w-4" />
                                Event Check-in
                            </Button>
                        </Link>
                    )}
                    {hasViewAccess("users") && adminRole === "super_admin" && (
                        <Link to="/admin/users">
                            <Button variant={isActive("users") ? "secondary" : "ghost"} className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                <Shield className="mr-2 h-4 w-4" />
                                User Management
                            </Button>
                        </Link>
                    )}
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                    <Button variant="outline" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-primary">Venture Social</h2>
                                <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                            </div>
                            <nav className="p-4 space-y-2">
                                {hasViewAccess("dashboard") && (
                                    <Link to="/admin/dashboard">
                                        <Button variant={isActive("dashboard") ? "secondary" : "ghost"} className="w-full justify-start">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("applications") && (
                                    <Link to="/admin/applications">
                                        <Button variant={isActive("applications") ? "secondary" : "ghost"} className="w-full justify-start">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Applications
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("members") && (
                                    <Link to="/admin/members">
                                        <Button variant={isActive("members") ? "secondary" : "ghost"} className="w-full justify-start">
                                            <Users className="mr-2 h-4 w-4" />
                                            Members
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("templates") && (
                                    <Link to="/admin/templates">
                                        <Button variant={isActive("templates") ? "secondary" : "ghost"} className="w-full justify-start">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Email Templates
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("priority-invites") && (
                                    <Link to="/admin/priority-invites">
                                        <Button variant={isActive("priority-invites") ? "secondary" : "ghost"} className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                            <Users className="mr-2 h-4 w-4" />
                                            Priority Invite List
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("agenda") && (
                                    <Link to="/admin/agenda">
                                        <Button variant={isActive("agenda") ? "secondary" : "ghost"} className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Agenda
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("perks") && (
                                    <Link to="/admin/perks">
                                        <Button variant={isActive("perks") ? "secondary" : "ghost"} className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                            <Gift className="mr-2 h-4 w-4" />
                                            Perks
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("check-in") && (
                                    <Link to="/admin/check-in">
                                        <Button variant={isActive("check-in") ? "secondary" : "ghost"} className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                            <QrCode className="mr-2 h-4 w-4" />
                                            Event Check-in
                                        </Button>
                                    </Link>
                                )}
                                {hasViewAccess("users") && adminRole === "super_admin" && (
                                    <Link to="/admin/users">
                                        <Button variant={isActive("users") ? "secondary" : "ghost"} className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <Shield className="mr-2 h-4 w-4" />
                                            User Management
                                        </Button>
                                    </Link>
                                )}
                                <div className="pt-4 mt-4 border-t">
                                    <Button variant="outline" className="w-full" onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-lg">Admin</span>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto md:ml-64 mt-16 md:mt-0">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
