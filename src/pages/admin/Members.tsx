import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Mail, Filter, Eye, Download, Send } from "lucide-react";
import { format } from "date-fns";
import { getFunctions, httpsCallable } from "firebase/functions";

interface Application {
    id: string;
    memberId?: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    city: string;
    projectCompany: string;
    message: string;
    status: "pending" | "new" | "review" | "accepted" | "rejected";
    source: string;
    notes: string;
    createdAt: any;
    linkedin: string;
    positionRole: string;
    superpower?: string;
    biggestChallenge?: string;
}

const Members = () => {
    const [members, setMembers] = useState<Application[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Email Modal state
    const [selectedMember, setSelectedMember] = useState<Application | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);

    // View Modal state
    const [viewMember, setViewMember] = useState<Application | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Email All Modal state
    const [isEmailAllModalOpen, setIsEmailAllModalOpen] = useState(false);
    const [emailAllSubject, setEmailAllSubject] = useState("");
    const [emailAllBody, setEmailAllBody] = useState("");
    const [sendingEmailAll, setSendingEmailAll] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [search, members]);

    const fetchMembers = async () => {
        try {
            // Query only accepted applications
            const q = query(
                collection(db, "applications"),
                where("status", "==", "accepted"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const apps = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    memberId: data.memberId,
                    fullName: data.fullName || data.name || "—",
                    email: data.email || "—",
                    phone: data.phone || "—",
                    role: data.role || "Unknown",
                    city: data.city || "—",
                    projectCompany: data.projectCompany || data.project || "—",
                    message: data.message || "—",
                    status: data.status || "pending",
                    source: data.source || "Web",
                    notes: data.notes || "",
                    createdAt: data.createdAt,
                    linkedin: data.linkedin || data.linkedinProfile || "—",
                    positionRole: data.positionRole || data.position || "—",
                    superpower: data.superpower || "",
                    biggestChallenge: data.biggestChallenge || "",
                };
            }) as Application[];
            setMembers(apps);
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to fetch members");
        } finally {
            setLoading(false);
        }
    };

    const filterMembers = () => {
        let result = members;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(app =>
                app.fullName.toLowerCase().includes(lowerSearch) ||
                app.email.toLowerCase().includes(lowerSearch) ||
                app.projectCompany.toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredMembers(result);
    };

    const handleOpenEmailModal = (member: Application) => {
        setSelectedMember(member);
        setEmailSubject("");
        setEmailBody("");
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedMember || !emailSubject || !emailBody) {
            toast.error("Subject and Body are required");
            return;
        }

        setSendingEmail(true);
        try {
            const functions = getFunctions();
            const sendAdminEmail = httpsCallable(functions, 'sendAdminEmail');

            await sendAdminEmail({
                to: selectedMember.email,
                subject: emailSubject,
                html: emailBody // The function should handle HTML content
            });

            toast.success(`Email sent to ${selectedMember.fullName}`);
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email");
        } finally {
            setSendingEmail(false);
        }
    };

    // New Features Implementation

    const handleViewMember = (member: Application) => {
        setViewMember(member);
        setIsViewModalOpen(true);
    };

    const handleViewPass = (memberId: string) => {
        if (!memberId) return;
        window.open(`/pass/${memberId}`, '_blank');
    };

    const handleExport = () => {
        const headers = ["Date", "Member ID", "Name", "Email", "Phone", "Role", "City", "Project/Company", "LinkedIn", "Position", "Superpower", "Biggest Challenge"];
        const csvContent = [
            headers.join(","),
            ...filteredMembers.map(app => [
                app.createdAt?.seconds ? format(new Date(app.createdAt.seconds * 1000), "yyyy-MM-dd") : "",
                app.memberId || "",
                `"${app.fullName}"`,
                app.email,
                app.phone,
                app.role,
                `"${app.city}"`,
                `"${app.projectCompany}"`,
                app.linkedin,
                `"${app.positionRole}"`,
                `"${app.superpower || ''}"`,
                `"${app.biggestChallenge || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "fundadores.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOpenEmailAllModal = () => {
        if (filteredMembers.length === 0) {
            toast.error("No members to email");
            return;
        }
        setEmailAllSubject("");
        setEmailAllBody("");
        setIsEmailAllModalOpen(true);
    };

    const handleSendEmailAll = async () => {
        if (!emailAllSubject || !emailAllBody) {
            toast.error("Subject and Body are required");
            return;
        }

        if (!confirm(`Are you sure you want to send this email to ${filteredMembers.length} members?`)) return;

        setSendingEmailAll(true);
        try {
            const functions = getFunctions();
            const sendAdminEmail = httpsCallable(functions, 'sendAdminEmail');

            // Send emails in parallel
            const promises = filteredMembers.map(member =>
                sendAdminEmail({
                    to: member.email,
                    subject: emailAllSubject,
                    html: emailAllBody
                }).catch(err => {
                    console.error(`Failed to send to ${member.email}:`, err);
                    return { error: err };
                })
            );

            await Promise.all(promises);

            toast.success(`Emails sent to ${filteredMembers.length} members`);
            setIsEmailAllModalOpen(false);
        } catch (error) {
            console.error("Error sending bulk emails:", error);
            toast.error("Failed to send some emails");
        } finally {
            setSendingEmailAll(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search members..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={handleOpenEmailAllModal}>
                        <Send className="mr-2 h-4 w-4" />
                        Email All
                    </Button>
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-4 md:hidden">
                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No members found</div>
                ) : (
                    filteredMembers.map((member) => (
                        <Card key={member.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg">{member.fullName}</div>
                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                        {member.memberId && (
                                            <Badge variant="outline" className="mt-1 text-[10px] h-5">
                                                {member.memberId}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        {member.memberId && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => handleViewPass(member.memberId!)}
                                                className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 h-8 w-8"
                                            >
                                                🎫
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleViewMember(member)} className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground text-xs block">Project/Company</span>
                                        <span className="font-medium">{member.projectCompany}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs block">Role</span>
                                        <span className="capitalize">{member.role}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs block">City</span>
                                        <span>{member.city}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs block">Date Accepted</span>
                                        <span>{member.createdAt?.seconds ? format(new Date(member.createdAt.seconds * 1000), "MMM d, yyyy") : "N/A"}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEmailModal(member)} className="w-full">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Email
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Accepted</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Project / Company</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No members found</TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.createdAt?.seconds ? format(new Date(member.createdAt.seconds * 1000), "MMM d, yyyy") : "N/A"}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{member.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                        {member.memberId && (
                                            <Badge variant="outline" className="mt-1 text-[10px] h-5">
                                                {member.memberId}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{member.projectCompany}</TableCell>
                                    <TableCell className="capitalize">{member.role}</TableCell>
                                    <TableCell>{member.city}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {member.memberId && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleViewPass(member.memberId!)}
                                                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                >
                                                    Pass 🎫
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleViewMember(member)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleOpenEmailModal(member)}>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Email
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Individual Email Modal */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Send Email to {selectedMember?.fullName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email Subject"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Message (HTML Supported)</label>
                            <Textarea
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                placeholder="<p>Write your message here...</p>"
                                className="h-[200px] font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={sendingEmail}>
                            {sendingEmail ? "Sending..." : "Send Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email All Modal */}
            <Dialog open={isEmailAllModalOpen} onOpenChange={setIsEmailAllModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Email All Members ({filteredMembers.length} recipients)</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Input
                                value={emailAllSubject}
                                onChange={(e) => setEmailAllSubject(e.target.value)}
                                placeholder="Email Subject"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Message (HTML Supported)</label>
                            <Textarea
                                value={emailAllBody}
                                onChange={(e) => setEmailAllBody(e.target.value)}
                                placeholder="<p>Write your message here...</p>"
                                className="h-[200px] font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailAllModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmailAll} disabled={sendingEmailAll}>
                            {sendingEmailAll ? "Sending..." : "Send Email to All"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Member Details</DialogTitle>
                    </DialogHeader>
                    {viewMember && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                    <div className="text-sm font-medium">{viewMember.fullName}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                                    <div className="text-sm">{viewMember.email}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
                                    <div className="text-sm">{viewMember.phone}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                                    <div className="text-sm capitalize">{viewMember.role}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">City</label>
                                    <div className="text-sm">{viewMember.city}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Project / Company</label>
                                    <div className="text-sm">{viewMember.projectCompany}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">LinkedIn</label>
                                    <div className="text-sm truncate">
                                        {viewMember.linkedin !== "—" ? (
                                            <a href={viewMember.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {viewMember.linkedin}
                                            </a>
                                        ) : "—"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Position</label>
                                    <div className="text-sm">{viewMember.positionRole}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Source</label>
                                    <div className="text-sm">{viewMember.source}</div>
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Superpower / Value Add</label>
                                    <div className="text-sm p-3 bg-blue-50/50 border border-blue-100 rounded-md mt-1">
                                        {viewMember.superpower || "—"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Biggest Challenge / Needs</label>
                                    <div className="text-sm p-3 bg-orange-50/50 border border-orange-100 rounded-md mt-1">
                                        {viewMember.biggestChallenge || "—"}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Message</label>
                                <div className="text-sm p-3 bg-muted rounded-md mt-1 whitespace-pre-wrap">{viewMember.message}</div>
                            </div>
                            {viewMember.notes && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Internal Notes</label>
                                    <div className="text-sm p-3 bg-yellow-50 border border-yellow-100 rounded-md mt-1 whitespace-pre-wrap">{viewMember.notes}</div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Members;
