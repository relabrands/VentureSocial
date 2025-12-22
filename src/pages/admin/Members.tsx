import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Mail, Filter } from "lucide-react";
import { format } from "date-fns";
import { getFunctions, httpsCallable } from "firebase/functions";

interface Application {
    id: string;
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
    revenueRange: string;
    positionRole: string;
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
                    revenueRange: data.revenueRange || "—",
                    positionRole: data.positionRole || data.position || "—",
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search members..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="border rounded-md bg-white">
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
                                    </TableCell>
                                    <TableCell>{member.projectCompany}</TableCell>
                                    <TableCell className="capitalize">{member.role}</TableCell>
                                    <TableCell>{member.city}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenEmailModal(member)}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send Email
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

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
        </div>
    );
};

export default Members;
