import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Copy, Rocket, ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

const PriorityInviteList = () => {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        category: "founder",
        role: "",
        company: "",
        linkedin: ""
    });

    const fetchInvites = async () => {
        try {
            // Fetch applications that are either pending_venue or ready_to_invite
            // We might also want to show accepted ones that came from this flow?
            // For now, let's fetch all that have an inviteToken or are in these statuses
            const q = query(
                collection(db, "applications"),
                where("status", "in", ["pending_venue", "ready_to_invite", "accepted"])
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                // Filter client-side to only show those relevant to this CRM if needed
                // For now, assuming these statuses are exclusive to this flow or we want to see them all
                .filter((app: any) => app.inviteToken || app.status === 'pending_venue' || app.status === 'ready_to_invite');

            setInvites(data);
        } catch (error) {
            console.error("Error fetching invites:", error);
            toast.error("Failed to load invite list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleAddVIP = async () => {
        if (!formData.fullName || !formData.role || !formData.company) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const newInvite = {
                ...formData,
                status: "pending_venue",
                inviteToken: uuidv4(),
                createdAt: new Date().toISOString(),
                source: "admin_crm"
            };

            await addDoc(collection(db, "applications"), newInvite);
            toast.success("VIP added successfully");
            setIsAddOpen(false);
            setFormData({
                fullName: "",
                category: "founder",
                role: "",
                company: "",
                linkedin: ""
            });
            fetchInvites();
        } catch (error) {
            console.error("Error adding VIP:", error);
            toast.error("Failed to add VIP");
        }
    };

    const handleLaunchBatch = async () => {
        if (!confirm("Are you sure you want to activate ALL pending invites? This will enable the copy invite buttons.")) return;

        setIsLaunching(true);
        try {
            const batch = writeBatch(db);
            const pendingInvites = invites.filter(i => i.status === "pending_venue");

            if (pendingInvites.length === 0) {
                toast.info("No pending invites to launch");
                setIsLaunching(false);
                return;
            }

            pendingInvites.forEach(invite => {
                const ref = doc(db, "applications", invite.id);
                batch.update(ref, { status: "ready_to_invite" });
            });

            await batch.commit();
            toast.success(`Launched ${pendingInvites.length} invites! 🚀`);
            fetchInvites();
        } catch (error) {
            console.error("Error launching batch:", error);
            toast.error("Failed to launch batch");
        } finally {
            setIsLaunching(false);
        }
    };

    const copyInviteLink = (invite: any) => {
        const link = `https://venturesocialdr.com/claim/${invite.inviteToken}`;
        const message = `${invite.fullName.split(' ')[0]}, te reservé un lugar para el lanzamiento de enero. Activa tu pase aquí: ${link}`;

        navigator.clipboard.writeText(message);
        toast.success("Invite copied to clipboard! 📋");
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'founder': return 'bg-blue-500';
            case 'investor': return 'bg-purple-500';
            case 'corporate': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_venue': return 'bg-red-500';
            case 'ready_to_invite': return 'bg-yellow-500';
            case 'accepted': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Priority Invite List</h1>
                    <p className="text-gray-400">Manage VIP invitations for the January launch</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={handleLaunchBatch}
                        disabled={isLaunching}
                        className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    >
                        {isLaunching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                        Launch Batch Jan-2026 (Activate All)
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#10b981] hover:bg-[#059669] text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Person
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111827] border-[#1f2937] text-white">
                            <DialogHeader>
                                <DialogTitle>Add VIP to List</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="bg-[#1f2937] border-gray-700 text-white mt-1"
                                        placeholder="Ex: Javier Piña"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">I am a...</label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger className="bg-[#1f2937] border-gray-700 text-white mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1f2937] border-gray-700 text-white">
                                            <SelectItem value="founder">Founder</SelectItem>
                                            <SelectItem value="investor">Investor</SelectItem>
                                            <SelectItem value="corporate">Corporate</SelectItem>
                                            <SelectItem value="creative">Creative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-400">Position / Role Title</label>
                                        <Input
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="bg-[#1f2937] border-gray-700 text-white mt-1"
                                            placeholder="Ex: CEO"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-400">Project / Company</label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="bg-[#1f2937] border-gray-700 text-white mt-1"
                                            placeholder="Ex: Corotos"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">LinkedIn Profile (URL)</label>
                                    <Input
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        className="bg-[#1f2937] border-gray-700 text-white mt-1"
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <Button onClick={handleAddVIP} className="w-full bg-[#10b981] hover:bg-[#059669] mt-2">
                                    Add to CRM
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-[#111827] rounded-lg border border-[#1f2937] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#1f2937]">
                        <TableRow>
                            <TableHead className="text-gray-400">Name</TableHead>
                            <TableHead className="text-gray-400">Role / Company</TableHead>
                            <TableHead className="text-gray-400">Category</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-right text-gray-400">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    Loading invites...
                                </TableCell>
                            </TableRow>
                        ) : invites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No invites found. Add your first VIP!
                                </TableCell>
                            </TableRow>
                        ) : (
                            invites.map((invite) => (
                                <TableRow key={invite.id} className="border-b border-[#1f2937] hover:bg-[#1f2937]/50">
                                    <TableCell>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {invite.fullName}
                                            {invite.linkedin && (
                                                <a
                                                    href={invite.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-500 hover:text-[#0077b5]"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <span className="font-bold text-white">{invite.role}</span>
                                            <span className="text-gray-400"> @ {invite.company}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getCategoryColor(invite.category)} text-white border-0`}>
                                            {invite.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(invite.status)}`} />
                                            <span className="text-gray-300 text-sm">{formatStatus(invite.status)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-700 text-gray-300 hover:bg-[#1f2937] hover:text-white"
                                            onClick={() => copyInviteLink(invite)}
                                            disabled={invite.status === 'pending_venue'}
                                        >
                                            <Copy className="mr-2 h-3 w-3" />
                                            Copy Invite
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
};

export default PriorityInviteList;
