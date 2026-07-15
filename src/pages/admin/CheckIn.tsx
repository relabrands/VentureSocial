import { useEffect, useState, useCallback } from "react";
import {
    collection, getDocs, query, where, orderBy,
    doc, setDoc, deleteDoc, getDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Search, CheckCircle, UserCheck, Camera, RefreshCw,
    CalendarDays, Clock, Users, BarChart2, Trash2, ChevronDown, ShieldCheck
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface EventOption {
    id: string;
    title?: string;
    date?: string;
    isActive?: boolean;
    startTimestamp?: string;
}

interface Member {
    id: string;
    memberId?: string;
    fullName: string;
    email: string;
    projectCompany?: string;
    role?: string;
}

interface AttendeeRecord {
    checkedIn: boolean;
    checkInTime?: Timestamp | Date | null;
    checkInBy?: string;
    checkInByName?: string;
    rsvpAt?: any; // To track if they RSVP'd
}

interface HistoryEntry {
    memberId: string;
    memberName: string;
    memberVsId?: string;
    company?: string;
    checkInTime: Date;
    checkInByName?: string;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const CheckIn = () => {
    const { adminRole, user } = useAuth();

    // Events
    const [events, setEvents] = useState<EventOption[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);

    // Members
    const [members, setMembers] = useState<Member[]>([]);
    const [attendees, setAttendees] = useState<Record<string, AttendeeRecord>>({});
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // UI state
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("list");
    const [showOnlyRSVP, setShowOnlyRSVP] = useState(true);

    /* ── Load events on mount ── */
    useEffect(() => {
        loadEvents();
        loadMembers();
    }, []);

    /* ── Load attendees when event changes ── */
    useEffect(() => {
        if (selectedEventId) {
            const ev = events.find(e => e.id === selectedEventId) || null;
            setSelectedEvent(ev);
            loadAttendees(selectedEventId);
            loadHistory(selectedEventId);
        }
    }, [selectedEventId]);

    /* ── Filter members by search ── */
    useEffect(() => {
        if (!search.trim()) {
            setFilteredMembers(members);
            return;
        }
        const q = search.toLowerCase();
        setFilteredMembers(members.filter(m =>
            m.fullName.toLowerCase().includes(q) ||
            m.memberId?.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.projectCompany?.toLowerCase().includes(q)
        ));
    }, [search, members]);

    /* ─────────── Data Loading ─────────── */

    const loadEvents = async () => {
        try {
            const snap = await getDocs(collection(db, "events"));
            const evList: EventOption[] = snap.docs.map(d => ({
                id: d.id,
                ...(d.data() as Omit<EventOption, "id">)
            }));

            // Sort: active/upcoming first, then by date
            evList.sort((a, b) => {
                const aFuture = (a.startTimestamp || "") >= new Date().toISOString();
                const bFuture = (b.startTimestamp || "") >= new Date().toISOString();
                if (aFuture && !bFuture) return -1;
                if (!aFuture && bFuture) return 1;
                return (b.startTimestamp || "").localeCompare(a.startTimestamp || "");
            });

            setEvents(evList);

            // Auto-select first upcoming active event
            const first = evList.find(e => e.isActive !== false && (e.startTimestamp || "") >= new Date().toISOString())
                || evList[0];
            if (first) setSelectedEventId(first.id);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load events");
        }
    };

    const loadMembers = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "applications"),
                where("status", "==", "accepted"),
                orderBy("fullName", "asc")
            );
            const snap = await getDocs(q);
            const data: Member[] = snap.docs.map(d => ({
                id: d.id,
                fullName: d.data().fullName || "—",
                email: d.data().email || "",
                memberId: d.data().memberId,
                projectCompany: d.data().projectCompany || d.data().project || "",
                role: d.data().role || "",
            }));
            setMembers(data);
            setFilteredMembers(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const loadAttendees = async (eventId: string) => {
        setLoadingAttendees(true);
        try {
            const snap = await getDocs(collection(db, "events", eventId, "attendees"));
            const map: Record<string, AttendeeRecord> = {};
            snap.docs.forEach(d => {
                map[d.id] = d.data() as AttendeeRecord;
            });
            setAttendees(map);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAttendees(false);
        }
    };

    const loadHistory = async (eventId: string) => {
        try {
            const snap = await getDocs(
                query(collection(db, "events", eventId, "checkins"), orderBy("checkInTime", "desc"))
            );
            const entries: HistoryEntry[] = snap.docs.map(d => {
                const data = d.data();
                const ts = data.checkInTime;
                const time = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
                return {
                    memberId: d.id,
                    memberName: data.memberName || "—",
                    memberVsId: data.memberVsId,
                    company: data.company,
                    checkInTime: time,
                    checkInByName: data.checkInByName,
                };
            });
            setHistory(entries);
        } catch (err) {
            console.error(err);
        }
    };

    /* ─────────── Actions ─────────── */

    const handleCheckIn = async (member: Member, forceCheck?: boolean) => {
        if (!selectedEventId) {
            toast.warning("Please select an event first");
            return;
        }

        const currentlyIn = attendees[member.id]?.checkedIn === true;
        const newStatus = forceCheck !== undefined ? forceCheck : !currentlyIn;

        try {
            const attendeeRef = doc(db, "events", selectedEventId, "attendees", member.id);
            const checkinLogRef = doc(db, "events", selectedEventId, "checkins", member.id);

            if (newStatus) {
                await setDoc(attendeeRef, {
                    checkedIn: true,
                    checkInTime: serverTimestamp(),
                    checkInBy: user?.uid || "admin",
                    checkInByName: user?.displayName || user?.email || "Admin",
                    memberName: member.fullName,
                    memberId: member.memberId || "",
                    company: member.projectCompany || "",
                    email: member.email,
                }, { merge: true });

                // Write history log (separate doc so history persists even if attendee is reset)
                await setDoc(checkinLogRef, {
                    checkInTime: serverTimestamp(),
                    checkInBy: user?.uid || "admin",
                    checkInByName: user?.displayName || user?.email || "Admin",
                    memberName: member.fullName,
                    memberVsId: member.memberId || "",
                    company: member.projectCompany || "",
                    email: member.email,
                });

                setAttendees(prev => ({
                    ...prev,
                    [member.id]: {
                        checkedIn: true,
                        checkInTime: new Date(),
                        checkInByName: user?.displayName || user?.email || "Admin",
                    }
                }));
                toast.success(`✅ ${member.fullName} checked in!`);
            } else {
                // Undo check-in — update checkedIn to false instead of deleting to keep RSVP data
                await setDoc(attendeeRef, {
                    checkedIn: false,
                    checkInTime: null,
                    checkInBy: null,
                    checkInByName: null
                }, { merge: true });
                setAttendees(prev => ({
                    ...prev,
                    [member.id]: {
                        ...prev[member.id],
                        checkedIn: false,
                        checkInTime: null,
                        checkInByName: undefined
                    }
                }));
                toast.info(`Check-in cancelled for ${member.fullName}`);
            }

            // Refresh history
            await loadHistory(selectedEventId);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update check-in");
        }
    };

    const handleScan = (result: any) => {
        if (!result) return;
        const rawValue = result[0]?.rawValue;
        if (!rawValue) return;

        let extractedId = rawValue;
        if (rawValue.includes('/pass/')) extractedId = rawValue.split('/pass/')[1];
        else if (rawValue.includes('/p/')) extractedId = rawValue.split('/p/')[1];
        extractedId = extractedId.split('?')[0].split('/')[0].trim();

        const member = members.find(m => m.memberId === extractedId || m.id === extractedId);

        if (member) {
            setIsScannerOpen(false);
            if (!attendees[member.id]?.checkedIn) {
                handleCheckIn(member, true);
            } else {
                toast.info(`${member.fullName} is already checked in.`);
            }
            setSearch(member.fullName);
        } else {
            toast.error(`Member not found: ${extractedId}`);
        }
    };

    const handleResetEvent = async () => {
        if (!selectedEventId || !selectedEvent) return;
        const eventLabel = selectedEvent.title || selectedEvent.date || "this event";
        if (!window.confirm(`Reset all check-ins for "${eventLabel}"?\n\nHistory logs will be preserved but attendee statuses will be cleared.`)) return;

        try {
            const snap = await getDocs(collection(db, "events", selectedEventId, "attendees"));
            const batch: Promise<void>[] = snap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(batch);
            setAttendees({});
            toast.success("Check-ins reset. History preserved.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to reset check-ins");
        }
    };

    /* ─────────── Stats ─────────── */
    const checkedInCount = Object.values(attendees).filter(a => a.checkedIn).length;
    const total = members.length;
    const rate = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

    /* ─────────── Render helpers ─────────── */
    const getEventLabel = (ev: EventOption) => {
        const parts: string[] = [];
        if (ev.title) parts.push(ev.title);
        if (ev.date) parts.push(ev.date);
        return parts.join(" — ") || ev.id;
    };

    const isFuture = (ev: EventOption) =>
        (ev.startTimestamp || "") >= new Date().toISOString();

    /* ─────────── JSX ─────────── */
    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Event Check-in</h1>
                    <p className="text-sm text-muted-foreground">Manage attendance by event</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {adminRole === "super_admin" && selectedEventId && (
                        <Button variant="destructive" size="sm" onClick={handleResetEvent}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Reset Event
                        </Button>
                    )}
                    <Button onClick={() => setIsScannerOpen(true)} size="sm" disabled={!selectedEventId}>
                        <Camera className="h-4 w-4 mr-1" />
                        Scan QR
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        loadMembers();
                        if (selectedEventId) {
                            loadAttendees(selectedEventId);
                            loadHistory(selectedEventId);
                        }
                    }}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ── Event Selector ── */}
            <Card className="border border-border/60">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                            <CalendarDays className="h-5 w-5" />
                            <span className="text-sm font-medium">Event:</span>
                        </div>
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger className="flex-1 max-w-md">
                                <SelectValue placeholder="Select an event…" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map(ev => (
                                    <SelectItem key={ev.id} value={ev.id}>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                ev.isActive === false ? "bg-gray-400" :
                                                    isFuture(ev) ? "bg-emerald-500" : "bg-gray-400"
                                            )} />
                                            <span>{getEventLabel(ev)}</span>
                                            {isFuture(ev) && ev.isActive !== false && (
                                                <span className="text-[10px] text-emerald-600 font-medium ml-1">UPCOMING</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Stats pills */}
                        {selectedEventId && (
                            <div className="flex items-center gap-3 ml-auto">
                                <div className="text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                                    <div className="text-lg font-bold leading-tight">{total}</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <div className="text-[10px] text-emerald-500 uppercase tracking-wider">Present</div>
                                    <div className="text-lg font-bold text-emerald-500 leading-tight">{checkedInCount}</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Rate</div>
                                    <div className="text-lg font-bold leading-tight">{rate}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!selectedEventId ? (
                <div className="text-center py-16 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Select an event to start managing check-ins</p>
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="list" className="gap-2">
                            <Users className="h-4 w-4" />
                            Guest List
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{total}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Check-in Log
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{history.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Guest List ── */}
                    <TabsContent value="list" className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, or Member ID…"
                                    className="pl-10 h-11"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Switch id="rsvp-filter" checked={showOnlyRSVP} onCheckedChange={setShowOnlyRSVP} />
                                <Label htmlFor="rsvp-filter" className="text-sm cursor-pointer whitespace-nowrap">Confirmed Only</Label>
                            </div>
                        </div>

                        {/* Checked-in count bar */}
                        {checkedInCount > 0 && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${rate}%` }}
                                    />
                                </div>
                                <span className="text-muted-foreground shrink-0">
                                    {checkedInCount} / {total} checked in
                                </span>
                            </div>
                        )}

                        <div className="grid gap-2">
                            {loading || loadingAttendees ? (
                                <div className="text-center py-10 text-muted-foreground">Loading…</div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No members found</div>
                            ) : (
                                /* Checked-in members first */
                                [...filteredMembers]
                                    .filter(m => showOnlyRSVP ? attendees[m.id] !== undefined : true)
                                    .sort((a, b) => {
                                        const aIn = attendees[a.id]?.checkedIn ? 1 : 0;
                                        const bIn = attendees[b.id]?.checkedIn ? 1 : 0;
                                        return bIn - aIn;
                                    })
                                    .map(member => {
                                        const att = attendees[member.id];
                                        const isIn = att?.checkedIn === true;
                                        const checkTime = att?.checkInTime;
                                        const timeDisplay = checkTime
                                            ? (checkTime instanceof Date
                                                ? format(checkTime, "h:mm a")
                                                : checkTime && typeof (checkTime as any).toDate === 'function'
                                                    ? format((checkTime as any).toDate(), "h:mm a")
                                                    : "")
                                            : "";

                                        return (
                                            <Card
                                                key={member.id}
                                                className={cn(
                                                    "transition-all border",
                                                    isIn
                                                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                                        : "border-border/50"
                                                )}
                                            >
                                                <CardContent className="p-3 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-full flex items-center justify-center text-base font-bold shrink-0",
                                                            isIn
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {isIn
                                                                ? <CheckCircle className="h-5 w-5" />
                                                                : member.fullName.charAt(0).toUpperCase()
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-sm truncate">{member.fullName}</span>
                                                                {member.memberId && (
                                                                    <Badge variant="outline" className="text-[10px] font-mono shrink-0 py-0">
                                                                        {member.memberId}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                {member.projectCompany || member.email}
                                                            </div>
                                                            {isIn && timeDisplay && (
                                                                <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                                                    <Clock className="h-3 w-3" />
                                                                    Checked in at {timeDisplay}
                                                                    {att?.checkInByName && ` · by ${att.checkInByName}`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant={isIn ? "outline" : "default"}
                                                        className={cn(
                                                            "shrink-0",
                                                            isIn
                                                                ? "border-emerald-400 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                                : "bg-foreground text-background hover:bg-foreground/90"
                                                        )}
                                                        onClick={() => handleCheckIn(member)}
                                                    >
                                                        {isIn ? (
                                                            <><CheckCircle className="h-4 w-4 mr-1" /> Present</>
                                                        ) : (
                                                            <><UserCheck className="h-4 w-4 mr-1" /> Check In</>
                                                        )}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Tab: Check-in Log / Histórico ── */}
                    <TabsContent value="history" className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No check-ins recorded yet for this event.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {history.length} attendee{history.length !== 1 ? "s" : ""} checked in
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    {history.map((entry, i) => (
                                        <Card key={entry.memberId} className="border-border/50">
                                            <CardContent className="p-3 flex items-center gap-4">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">{entry.memberName}</span>
                                                        {entry.memberVsId && (
                                                            <Badge variant="outline" className="text-[10px] font-mono py-0">
                                                                {entry.memberVsId}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {entry.company && (
                                                        <div className="text-xs text-muted-foreground">{entry.company}</div>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-sm font-medium">
                                                        {format(entry.checkInTime, "h:mm a")}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {format(entry.checkInTime, "MMM d, yyyy")}
                                                    </div>
                                                    {entry.checkInByName && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            by {entry.checkInByName}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* ── QR Scanner Dialog ── */}
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Scan Founder Pass</DialogTitle>
                        {selectedEvent && (
                            <p className="text-sm text-muted-foreground">
                                Checking in to: <strong>{selectedEvent.title || selectedEvent.date}</strong>
                            </p>
                        )}
                    </DialogHeader>
                    <div className="aspect-square overflow-hidden rounded-lg bg-black">
                        <Scanner
                            onScan={handleScan}
                            onError={err => console.log(err)}
                            components={{
                                audio: false,
                                torch: true,
                                count: false,
                                onOff: false,
                                tracker: false,
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CheckIn;
