import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Shield, UserCog, UserCheck, Trash2, Edit2, CheckSquare, Square } from "lucide-react";

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    permissions?: any;
    createdAt?: any;
}

const MODULES = ["dashboard", "applications", "members", "templates", "priority-invites", "agenda", "perks", "check-in"];

const getPresetPermissions = (role: string) => {
    const p: any = {};
    MODULES.forEach(m => p[m] = { view: false, edit: false });
    if (role === "super_admin") {
        MODULES.forEach(m => p[m] = { view: true, edit: true });
    } else if (role === "event_validator") {
        p["check-in"] = { view: true, edit: true };
    } else if (role === "partner") {
        ["dashboard", "applications", "members", "priority-invites", "agenda", "perks"].forEach(m => {
            p[m] = { view: true, edit: false };
        });
    }
    return p;
};

export default function AdminUsers() {
    const { user, adminRole } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    // Form state
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("event_validator");
    const [newPermissions, setNewPermissions] = useState<any>(getPresetPermissions("event_validator"));

    const handleRoleChange = (role: string) => {
        setNewRole(role);
        setNewPermissions(getPresetPermissions(role));
    };

    const togglePermission = (module: string, type: "view" | "edit") => {
        setNewPermissions((prev: any) => ({
            ...prev,
            [module]: {
                ...prev[module],
                [type]: !prev[module]?.[type]
            }
        }));
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "admins"));
            const fetchedAdmins: AdminUser[] = [];
            querySnapshot.forEach((doc) => {
                fetchedAdmins.push({ id: doc.id, ...doc.data() } as AdminUser);
            });
            setAdmins(fetchedAdmins);
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast.error("Error fetching admin users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminRole === "super_admin") {
            fetchAdmins();
        } else {
            setLoading(false);
        }
    }, [adminRole]);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newName || !newEmail || !newPassword || !newRole) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setIsSubmitting(true);
            const functions = getFunctions();
            const createAdminUser = httpsCallable(functions, 'createAdminUser');
            
            await createAdminUser({
                email: newEmail,
                password: newPassword,
                name: newName,
                role: newRole,
                permissions: newPermissions
            });

            toast.success("Admin user created successfully!");
            setIsAddOpen(false);
            
            // Reset form
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("event_validator");
            setNewPermissions(getPresetPermissions("event_validator"));
            
            // Refresh list
            fetchAdmins();
        } catch (error: any) {
            console.error("Error adding admin:", error);
            toast.error(error.message || "Failed to create admin user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (admin: AdminUser) => {
        setEditingUser(admin);
        setNewRole(admin.role);
        
        // Merge missing permissions in case new modules were added securely
        const mergedPermissions = { ...getPresetPermissions(admin.role), ...admin.permissions };
        setNewPermissions(mergedPermissions);
        setIsEditOpen(true);
    };

    const handleEditAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            setIsSubmitting(true);
            const functions = getFunctions();
            const updateAdminUser = httpsCallable(functions, 'updateAdminUser');

            await updateAdminUser({
                uid: editingUser.id,
                role: newRole,
                permissions: newPermissions
            });

            toast.success("Permissions updated successfully!");
            setIsEditOpen(false);
            fetchAdmins();
        } catch (error: any) {
            console.error("Error updating admin:", error);
            toast.error(error.message || "Failed to update admin permissions");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (adminId: string) => {
        if (window.confirm("Are you sure you want to delete this admin user? Note: This will only remove their admin privileges, not delete their Firebase Auth account.")) {
            try {
                await deleteDoc(doc(db, "admins", adminId));
                setAdmins(admins.filter((a) => a.id !== adminId));
                toast.success("Admin privileges removed");
            } catch (error) {
                console.error("Error deleting admin:", error);
                toast.error("Failed to remove admin privileges");
            }
        }
    };

    // Helper to format role visually
    const RoleBadge = ({ role }: { role: string }) => {
        switch (role) {
            case "super_admin":
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-purple-100 text-purple-700"><Shield className="w-3 h-3"/> Super Admin</span>;
            case "event_validator":
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700"><UserCheck className="w-3 h-3"/> Event Validator</span>;
            case "partner":
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700"><UserCog className="w-3 h-3"/> Partner</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700">{role}</span>;
        }
    };

    if (adminRole !== "super_admin") {
        return (
            <div className="p-8 text-center bg-white rounded-xl border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500">You need Super Admin privileges to view and manage users.</p>
            </div>
        );
    }

    const renderPermissionsGrid = () => (
        <div className="space-y-3 mt-4 border rounded-md p-4 bg-slate-50">
            <h4 className="text-sm font-semibold">Granular Permissions</h4>
            <div className="grid grid-cols-3 gap-2 pb-2 mb-2 border-b text-xs font-medium text-slate-500">
                <div>Module</div>
                <div className="text-center">View</div>
                <div className="text-center">Edit</div>
            </div>
            {MODULES.map(module => (
                <div key={module} className="grid grid-cols-3 gap-2 items-center text-sm py-1">
                    <div className="capitalize">{module.replace('-', ' ')}</div>
                    <div className="flex justify-center">
                        <button type="button" onClick={() => togglePermission(module, "view")}>
                            {newPermissions[module]?.view ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </button>
                    </div>
                    <div className="flex justify-center">
                        <button type="button" onClick={() => togglePermission(module, "edit")}>
                            {newPermissions[module]?.edit ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage admins, partners, and event validators.</p>
                </div>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-white">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Admin User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Admin User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAdmin} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="Min 6 characters" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role (Select a preset)</Label>
                                <Select value={newRole} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="event_validator">Event Validator</SelectItem>
                                        <SelectItem value="partner">Partner</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {renderPermissionsGrid()}

                            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create User"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Admin Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Permissions</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditAdmin} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>User</Label>
                                <div className="p-2 bg-slate-100 rounded-md text-sm">{editingUser?.name} ({editingUser?.email})</div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role (Base Template)</Label>
                                <Select value={newRole} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="event_validator">Event Validator</SelectItem>
                                        <SelectItem value="partner">Partner</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {renderPermissionsGrid()}

                            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : admins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No administrative users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.name}</TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <RoleBadge role={admin.role} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 mr-2"
                                            onClick={() => openEditModal(admin)}
                                            title="Edit permissions"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteAdmin(admin.id)}
                                            disabled={admin.id === user?.uid} // Prevent deleting yourself
                                            title={admin.id === user?.uid ? "You cannot remove yourself" : "Remove privileges"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
