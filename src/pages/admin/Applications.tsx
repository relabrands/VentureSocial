import { collection, getDocs, doc, updateDoc, orderBy, query, writeBatch, deleteDoc } from "firebase/firestore";
// ... imports

// ... inside Applications component

const [deletingAll, setDeletingAll] = useState(false);

// ... existing functions

const handleDeleteAllData = async () => {
    const confirm1 = confirm("⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to DELETE ALL applications and members?\n\nThis action cannot be undone.");
    if (!confirm1) return;

    const confirm2 = confirm("Please confirm again.\n\nThis will wipe the entire database of applicants and reset member IDs to VS-001.\n\nType 'DELETE' to confirm (mentally, just click OK).");
    if (!confirm2) return;

    setDeletingAll(true);
    try {
        // 1. Delete all applications
        const q = query(collection(db, "applications"));
        const snapshot = await getDocs(q);

        // Firestore batch limit is 500
        const batchSize = 500;
        const chunks = [];

        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            chunks.push(snapshot.docs.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // 2. Reset Member ID Counter
        await deleteDoc(doc(db, "counters", "members"));

        toast.success("All data deleted and counters reset.");
        setApplications([]);
        setFilteredApps([]);
    } catch (error) {
        console.error("Error deleting data:", error);
        toast.error("Failed to delete data");
    } finally {
        setDeletingAll(false);
    }
};

return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                    variant="destructive"
                    onClick={handleDeleteAllData}
                    disabled={deletingAll}
                >
                    {deletingAll ? "Deleting..." : "⚠️ Reset Database"}
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    Export CSV
                </Button>
                {/* ... existing search and filter */}
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
                        <SelectItem value="pending">Pending</SelectItem>
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
                        <TableHead>Project / Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
                        </TableRow>
                    ) : filteredApps.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">No applications found</TableCell>
                        </TableRow>
                    ) : (
                        filteredApps.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell>{app.createdAt?.seconds ? format(new Date(app.createdAt.seconds * 1000), "MMM d, yyyy") : "N/A"}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{app.email}</div>
                                </TableCell>
                                <TableCell>{app.projectCompany}</TableCell>
                                <TableCell className="capitalize">{app.role}</TableCell>
                                <TableCell>{app.revenueRange}</TableCell>
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
                                <h4 className="text-sm font-medium text-muted-foreground">Position / Title</h4>
                                <p>{selectedApp.positionRole}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Revenue Range</h4>
                                <p>{selectedApp.revenueRange}</p>
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
                            <p className="font-medium">{selectedApp.projectCompany}</p>
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
                                        <SelectItem value="pending">Pending</SelectItem>
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
