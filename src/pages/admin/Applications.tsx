import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Eye, Filter } from "lucide-react";
import { format } from "date-fns";

interface Application {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    city: string;
    project: string;
    message: string;
    status: "new" | "review" | "accepted" | "rejected";
    source: string;
    notes: string;
    createdAt: any;
    linkedin?: string;
    revenueRange?: string;
    position?: string;
}

const Applications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApps, setFilteredApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Modal state
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStatus, setEditStatus] = useState<string>("");
    const [editNotes, setEditNotes] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        filterApplications();
    }, [search, statusFilter, applications]);

    const fetchApplications = async () => {
        try {
            const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const apps = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Application[];
            setApplications(apps);
        } catch (error) {
            console.error("Error fetching applications:", error);
            toast.error("Failed to fetch applications");
        } finally {
            setLoading(false);
        }
    };

    const filterApplications = () => {
        let result = applications;

        if (statusFilter !== "all") {
            result = result.filter(app => app.status === statusFilter);
        }

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(app =>
                app.fullName.toLowerCase().includes(lowerSearch) ||
                app.email.toLowerCase().includes(lowerSearch) ||
                app.project.toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredApps(result);
    };

    const handleView = (app: Application) => {
        setSelectedApp(app);
        setEditStatus(app.status);
        setEditNotes(app.notes || "");
        setIsModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedApp) return;

        try {
            await updateDoc(doc(db, "applications", selectedApp.id), {
                status: editStatus,
                notes: editNotes
            });

            // Update local state
            const updatedApps = applications.map(app =>
                app.id === selectedApp.id
                    ? { ...app, status: editStatus as any, notes: editNotes }
                    : app
            );
            setApplications(updatedApps);

            toast.success("Application updated successfully");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error updating application:", error);
            toast.error("Failed to update application");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "new": return "bg-blue-100 text-blue-800";
            case "review": return "bg-yellow-100 text-yellow-800";
            case "accepted": return "bg-green-100 text-green-800";
            case "rejected": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search applications..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : filteredApps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No applications found</TableCell>
                            </TableRow>
                        ) : (
                            filteredApps.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>{app.createdAt?.seconds ? format(new Date(app.createdAt.seconds * 1000), "MMM d, yyyy") : "N/A"}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{app.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{app.email}</div>
                                    </TableCell>
                                    <TableCell>{app.project}</TableCell>
                                    <TableCell className="capitalize">{app.role}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusColor(app.status)}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleView(app)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                    </DialogHeader>
                    {selectedApp && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                                    <p>{selectedApp.fullName}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                    <p>{selectedApp.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                                    <p>{selectedApp.phone}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">City</h4>
                                    <p>{selectedApp.city}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                                    <p className="capitalize">{selectedApp.role}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                                    <p className="capitalize">{selectedApp.source}</p>
                                </div>
                                {selectedApp.linkedin && (
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">LinkedIn</h4>
                                        <a href={selectedApp.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                                            {selectedApp.linkedin}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Project / Company</h4>
                                <p className="font-medium">{selectedApp.project}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Message</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedApp.message}</p>
                            </div>

                            <div className="border-t pt-4 mt-2 space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="review">In Review</SelectItem>
                                            <SelectItem value="accepted">Accepted</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Internal Notes</label>
                                    <Textarea
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        placeholder="Add notes about this applicant..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Applications;
