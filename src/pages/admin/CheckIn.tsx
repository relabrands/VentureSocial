import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, QrCode, CheckCircle, XCircle, UserCheck, Camera } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

interface Member {
    id: string;
    memberId?: string;
    fullName: string;
    email: string;
    projectCompany: string;
    checkedIn?: boolean;
    checkInTime?: any;
}

const CheckIn = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [search, members]);

    const fetchMembers = async () => {
        try {
            const q = query(
                collection(db, "applications"),
                where("status", "==", "accepted"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Member[];

            setMembers(data);
            updateStats(data);
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (data: Member[]) => {
        setStats({
            total: data.length,
            checkedIn: data.filter(m => m.checkedIn).length
        });
    };

    const filterMembers = () => {
        if (!search) {
            setFilteredMembers(members);
            return;
        }
        const lowerSearch = search.toLowerCase();
        const filtered = members.filter(m =>
            m.fullName.toLowerCase().includes(lowerSearch) ||
            m.memberId?.toLowerCase().includes(lowerSearch) ||
            m.email.toLowerCase().includes(lowerSearch)
        );
        setFilteredMembers(filtered);
    };

    const handleCheckIn = async (member: Member) => {
        try {
            const newStatus = !member.checkedIn;
            const memberRef = doc(db, "applications", member.id);

            await updateDoc(memberRef, {
                checkedIn: newStatus,
                checkInTime: newStatus ? new Date() : null
            });

            const updatedMembers = members.map(m =>
                m.id === member.id
                    ? { ...m, checkedIn: newStatus, checkInTime: newStatus ? new Date() : null }
                    : m
            );

            setMembers(updatedMembers);
            updateStats(updatedMembers);

            if (newStatus) {
                toast.success(`${member.fullName} Checked In!`);
            } else {
                toast.info("Check-in cancelled");
            }
        } catch (error) {
            console.error("Error updating check-in:", error);
            toast.error("Failed to update status");
        }
    };

    const handleScan = (result: any) => {
        if (result) {
            const rawValue = result[0]?.rawValue;
            if (!rawValue) return;

            console.log("Scanned:", rawValue);

            // Extract ID from URL or raw text
            // Formats: .../pass/VS-123, .../p/VS-123, VS-123
            let extractedId = rawValue;
            if (rawValue.includes('/pass/')) {
                extractedId = rawValue.split('/pass/')[1];
            } else if (rawValue.includes('/p/')) {
                extractedId = rawValue.split('/p/')[1];
            }

            // Clean up any trailing slashes or query params
            extractedId = extractedId.split('?')[0].split('/')[0];

            console.log("Extracted ID:", extractedId);

            const member = members.find(m => m.memberId === extractedId || m.id === extractedId);

            if (member) {
                toast.success(`Found: ${member.fullName}`);
                setIsScannerOpen(false);

                // Auto check-in if not already checked in
                if (!member.checkedIn) {
                    handleCheckIn(member);
                } else {
                    toast.info(`${member.fullName} is already checked in.`);
                }

                // Filter view to show this member
                setSearch(member.fullName);
            } else {
                toast.error(`Member not found: ${extractedId}`);
                // Don't close scanner immediately so they can try again
            }
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Event Check-in</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage guest attendance</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button onClick={() => setIsScannerOpen(true)} className="w-full sm:w-auto flex-1 md:flex-none">
                        <Camera className="mr-2 h-4 w-4" />
                        Scan QR
                    </Button>
                    <Card className="w-full sm:w-auto bg-slate-900 text-white border-none flex-1 md:flex-none">
                        <CardContent className="p-3 md:p-4 flex items-center gap-4 md:gap-6 justify-center">
                            <div className="text-center">
                                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Total</div>
                                <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-700"></div>
                            <div className="text-center">
                                <div className="text-[10px] md:text-xs text-emerald-400 uppercase tracking-wider">Present</div>
                                <div className="text-xl md:text-2xl font-bold text-emerald-400">{stats.checkedIn}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-700"></div>
                            <div className="text-center">
                                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Rate</div>
                                <div className="text-xl md:text-2xl font-bold">
                                    {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or Member ID..."
                    className="pl-10 h-12 text-base md:text-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading guest list...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No members found matching your search.</div>
                ) : (
                    filteredMembers.map((member) => (
                        <Card key={member.id} className={`transition-colors ${member.checkedIn ? 'bg-emerald-50/50 border-emerald-200' : ''}`}>
                            <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto overflow-hidden">
                                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold shrink-0 ${member.checkedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {member.fullName.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-base md:text-lg flex items-center gap-2 flex-wrap">
                                            <span className="truncate">{member.fullName}</span>
                                            {member.memberId && (
                                                <Badge variant="outline" className="text-[10px] md:text-xs font-mono shrink-0">
                                                    {member.memberId}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs md:text-sm text-muted-foreground truncate">{member.projectCompany}</div>
                                    </div>
                                </div>
                                <Button
                                    size="default"
                                    variant={member.checkedIn ? "outline" : "default"}
                                    className={`w-full sm:w-auto ${member.checkedIn ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" : "bg-slate-900 hover:bg-slate-800"}`}
                                    onClick={() => handleCheckIn(member)}
                                >
                                    {member.checkedIn ? (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                            Checked In
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                            Check In
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Scan Founder Pass</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-square overflow-hidden rounded-lg bg-black">
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.log(error)}
                            components={{
                                audio: false,
                                torch: true,
                                count: false,
                                onOff: false,
                                tracker: false
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CheckIn;
