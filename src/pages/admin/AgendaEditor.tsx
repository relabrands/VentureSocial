import { useEffect, useState } from "react";
import { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, writeBatch, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Calendar as CalendarIcon, MoreVertical, RefreshCw, Archive } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
    time: string;
    title: string;
    description: string;
}

interface EventConfig {
    id?: string;
    title?: string; // Added title
    date: string;
    timeRange: string;
    locationName: string;
    locationAddress: string;
    locationMapUrl: string;
    dressCodeTitle: string;
    dressCodeDescription: string;
    timeline: TimelineItem[];
    startTimestamp?: string;
    endTimestamp?: string;
    status?: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED';
    archived?: boolean;
}

const DEFAULT_EVENT: Omit<EventConfig, 'id'> = {
    title: "",
    date: "",
    timeRange: "7:00 PM - 11:00 PM",
    locationName: "Barna Management School",
    locationAddress: "Av. John F. Kennedy 34, Santo Domingo",
    locationMapUrl: "",
    dressCodeTitle: "Smart Casual / Business Tech",
    dressCodeDescription: "Come as you are, but ready to impress.",
    timeline: [
        { time: "7:00 PM", title: "Doors Open", description: "Check-in" }
    ]
};

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const ampm = hour < 12 ? "AM" : "PM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute} ${ampm}`;
});

const AgendaEditor = () => {
    const [events, setEvents] = useState<EventConfig[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [config, setConfig] = useState<EventConfig>(DEFAULT_EVENT as EventConfig);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [archiving, setArchiving] = useState(false);

    // Form State
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState("7:00 PM");
    const [endTime, setEndTime] = useState("11:00 PM");

    // Attendees State
    const [attendees, setAttendees] = useState<any[]>([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);

    useEffect(() => {
        if (!selectedEventId) {
            setAttendees([]);
            return;
        }

        const fetchAttendees = async () => {
            setAttendeesLoading(true);
            try {
                // Fetch users from the EVENT SUBCOLLECTION (New Per-Event Logic)
                const attendeesRef = collection(db, "events", selectedEventId, "attendees");
                const q = query(attendeesRef, orderBy("rsvpAt", "desc"));

                try {
                    const snapshot = await getDocs(q);
                    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAttendees(users);
                } catch (orderError) {
                    // Fallback if index missing or field missing
                    console.warn("Ordering failed, fetching unsorted", orderError);
                    const snapshot = await getDocs(attendeesRef);
                    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAttendees(users);
                }

            } catch (err) {
                console.error("Error fetching attendees:", err);
            } finally {
                setAttendeesLoading(false);
            }
        };

        fetchAttendees();
    }, [selectedEventId]);

    useEffect(() => {
        fetchEvents();
    }, []);

    // Load selected event into form
    useEffect(() => {
        if (selectedEventId) {
            const event = events.find(e => e.id === selectedEventId);
            if (event) {
                setConfig(event);

                // Parse date
                if (event.date) {
                    const parsedDate = parse(event.date, "EEEE, MMMM do", new Date());
                    if (!isNaN(parsedDate.getTime())) setSelectedDate(parsedDate);
                } else {
                    setSelectedDate(undefined);
                }

                // Parse times
                if (event.timeRange) {
                    const [start, end] = event.timeRange.split(" - ");
                    if (start) setStartTime(start);
                    if (end) setEndTime(end);
                }
            }
        } else {
            // New Event Mode
            setConfig(DEFAULT_EVENT as EventConfig);
            setSelectedDate(undefined);
            setStartTime("7:00 PM");
            setEndTime("11:00 PM");
        }
    }, [selectedEventId, events]);

    // Sync time range
    useEffect(() => {
        if (config) {
            updateField("timeRange", `${startTime} - ${endTime}`);
        }
    }, [startTime, endTime]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "events"), orderBy("startTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedEvents: EventConfig[] = [];
            querySnapshot.forEach((doc) => {
                fetchedEvents.push({ id: doc.id, ...doc.data() } as EventConfig);
            });
            setEvents(fetchedEvents);

            // Select first event if none selected
            if (fetchedEvents.length > 0 && !selectedEventId) {
                // setSelectedEventId(fetchedEvents[0].id); // Optional: Auto-select? No, let user choose "New" logic can be default
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Timestamp Logic
            let startTimestamp = null;
            let endTimestamp = null;

            if (selectedDate && startTime && endTime) {
                const combineDateTime = (date: Date, timeStr: string) => {
                    const time = parse(timeStr, "h:mm a", date);
                    const newDate = new Date(date);
                    newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
                    return newDate;
                };

                const start = combineDateTime(selectedDate, startTime);
                const end = combineDateTime(selectedDate, endTime);
                if (end < start) end.setDate(end.getDate() + 1);

                startTimestamp = start.toISOString();
                endTimestamp = end.toISOString();
            }

            const eventData = {
                ...config,
                startTimestamp,
                endTimestamp,
                updatedAt: serverTimestamp()
            };

            if (selectedEventId) {
                await setDoc(doc(db, "events", selectedEventId), eventData);
                toast.success("Event updated");
            } else {
                const docRef = await addDoc(collection(db, "events"), eventData);
                setSelectedEventId(docRef.id);
                toast.success("Event created");
            }
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            toast.error("Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleArchiveAndReset = async () => {
        if (!selectedEventId) return;
        if (!confirm("Are you sure? This will archive current attendees and reset everyone's status.")) return;

        setArchiving(true);
        try {
            // 1. Get all PRESENT attendees
            const q = query(collection(db, "applications"), where("attendance_status", "==", "PRESENT"));
            const snapshot = await getDocs(q);
            const attendees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (attendees.length === 0) {
                toast.info("No attendees to archive.");
            } else {
                // 2. Batch write to subcollection events/{id}/attendees
                // Note: Batches are limited to 500. For MVP/Beta, we assume <500.
                const batch = writeBatch(db);

                attendees.forEach((attendee: any) => {
                    // Add to archive
                    const archiveRef = doc(collection(db, "events", selectedEventId, "attendees"), attendee.id);
                    batch.set(archiveRef, {
                        ...attendee,
                        archivedAt: serverTimestamp()
                    });

                    // Reset User
                    const userRef = doc(db, "applications", attendee.id);
                    batch.update(userRef, {
                        attendance_status: null,
                        checkInTime: null,
                        checkedIn: false
                    });
                });

                await batch.commit();
                toast.success(`Archived ${attendees.length} attendees & reset status.`);
            }

            // Mark event as archived/ended
            await updateDoc(doc(db, "events", selectedEventId), {
                status: 'ENDED',
                archived: true
            });

            fetchEvents();

        } catch (error) {
            console.error("Archive error:", error);
            toast.error("Failed to archive/reset.");
        } finally {
            setArchiving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this event?")) return;
        await deleteDoc(doc(db, "events", id));
        if (selectedEventId === id) setSelectedEventId(null);
        fetchEvents();
        toast.success("Event deleted");
    };

    const updateField = (field: keyof EventConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            updateField("date", format(date, "EEEE, MMMM do"));
        } else {
            updateField("date", "");
        }
    };

    // Timeline Helpers
    const updateTimelineItem = (index: number, field: keyof TimelineItem, value: string) => {
        const newTimeline = [...config.timeline];
        newTimeline[index] = { ...newTimeline[index], [field]: value };
        setConfig(prev => ({ ...prev, timeline: newTimeline }));
    };

    const addTimelineItem = () => {
        setConfig(prev => ({
            ...prev,
            timeline: [...prev.timeline, { time: "", title: "", description: "" }]
        }));
    };

    const removeTimelineItem = (index: number) => {
        setConfig(prev => ({
            ...prev,
            timeline: prev.timeline.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Sidebar List */}
            <div className="w-80 border-r pr-6 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Events</h2>
                    <Button size="sm" variant="outline" onClick={() => setSelectedEventId(null)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="space-y-2">
                    {events.map(event => (
                        <div
                            key={event.id}
                            className={cn(
                                "p-3 rounded-lg cursor-pointer border hover:bg-muted transition-colors relative group",
                                selectedEventId === event.id ? "bg-muted border-primary" : "border-transparent bg-muted/30"
                            )}
                            onClick={() => setSelectedEventId(event.id!)}
                        >
                            <h3 className="font-semibold text-sm">{event.title || event.date || "Untitled Event"}</h3>
                            <p className="text-xs text-muted-foreground">{event.timeRange}</p>
                            {event.id && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id!); }}
                                >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No events found.</p>}
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 overflow-y-auto pb-20 px-2">
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {selectedEventId ? "Edit Event" : "Create New Event"}
                            </h1>
                            <p className="text-muted-foreground">{selectedEventId ? "Update event details and manage status." : "Schedule a new upcoming event."}</p>
                        </div>
                        <div className="flex gap-2">
                            {selectedEventId && (
                                <Button
                                    variant="destructive"
                                    onClick={handleArchiveAndReset}
                                    disabled={archiving}
                                >
                                    {archiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                                    End & Archive
                                </Button>
                            )}
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Event
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Identical Card Content from previous version, mapped to state */}
                        <Card>
                            <CardHeader><CardTitle>Date & Time</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Event Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !config.date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {config.date || <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Select value={startTime} onValueChange={setStartTime}>
                                            <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                                            <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`s-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Select value={endTime} onValueChange={setEndTime}>
                                            <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                                            <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`e-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Event Title</Label>
                                    <Input
                                        placeholder="e.g. Founder & Investor Mixer"
                                        value={config.title || ""}
                                        onChange={e => updateField("title", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2"><Label>Venue Name</Label><Input value={config.locationName} onChange={e => updateField("locationName", e.target.value)} /></div>
                                <div className="space-y-2"><Label>Address</Label><Input value={config.locationAddress} onChange={e => updateField("locationAddress", e.target.value)} /></div>
                                <div className="space-y-2"><Label>Map URL</Label><Input value={config.locationMapUrl} onChange={e => updateField("locationMapUrl", e.target.value)} /></div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader><CardTitle>Dress Code</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Title</Label><Input value={config.dressCodeTitle} onChange={e => updateField("dressCodeTitle", e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={config.dressCodeDescription} onChange={e => updateField("dressCodeDescription", e.target.value)} /></div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Timeline</CardTitle>
                                <Button variant="outline" size="sm" onClick={addTimelineItem}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {config.timeline.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/30">
                                        <div className="grid gap-4 flex-1 md:grid-cols-3">
                                            <div className="space-y-2"><Label>Time</Label><Input value={item.time} onChange={e => updateTimelineItem(index, "time", e.target.value)} /></div>
                                            <div className="space-y-2"><Label>Title</Label><Input value={item.title} onChange={e => updateTimelineItem(index, "title", e.target.value)} /></div>
                                            <div className="space-y-2"><Label>Description</Label><Input value={item.description} onChange={e => updateTimelineItem(index, "description", e.target.value)} /></div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeTimelineItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Confirmed Attendees Section */}
                        {selectedEventId && (
                            <Card className="md:col-span-2 border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/10">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-emerald-500">Confirmed Attendees</CardTitle>
                                            <CardDescription>
                                                Members who have RSVP'd "Confirmed" (Global Status).
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                            {attendees.length} Confirmed
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {attendeesLoading ? (
                                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-emerald-500" /></div>
                                    ) : attendees.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {attendees.map(attendee => (
                                                <div key={attendee.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                                                        {(attendee.name?.[0] || "U").toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{attendee.name || "Unknown Member"}</p>
                                                        <p className="text-xs text-muted-foreground">{attendee.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No confirmed attendees yet.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaEditor;
