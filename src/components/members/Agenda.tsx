import { useEffect, useState } from "react";
import { MapPin, Clock, Shirt, Calendar, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { useEvents, Event } from "@/hooks/useEvents";

interface AgendaConfig {
    id?: string;
    title?: string;
    date: string;
    timeRange: string;
    locationName: string;
    locationAddress: string;
    locationMapUrl: string;
    dressCodeTitle: string;
    dressCodeDescription: string;
    timeline: { time: string; title: string; description: string }[];
    status?: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED';
}

interface AgendaProps {
    memberId?: string;
    member?: any;
    onEnterRoomLive?: () => void;
    eventStatus?: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED';
    onEditSpotMe?: () => void;
    config?: AgendaConfig;
}

const Agenda = ({ memberId, member, onEnterRoomLive, eventStatus = 'UPCOMING', onEditSpotMe, config: propConfig }: AgendaProps) => {
    const { upcomingEvents, pastEvents, loading } = useEvents(memberId);

    // Which event card is expanded (null = none)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    // Per-event RSVP status map: { [eventId]: boolean }
    const [rsvpMap, setRsvpMap] = useState<Record<string, boolean>>({});
    // Per-event RSVP loading
    const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    // Format Firestore/string timestamps to Date
    const toDate = (ts: any): Date | null => {
        if (!ts) return null;
        if (ts instanceof Timestamp) return ts.toDate();
        if (ts?.toDate) return ts.toDate();
        const d = new Date(ts);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatEventDate = (event: any): string => {
        const start = toDate(event.startTimestamp);
        if (start) return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        return event.date || "Date TBD";
    };

    const formatEventTime = (event: any): string => {
        const start = toDate(event.startTimestamp);
        const end = toDate(event.endTimestamp);
        if (start) {
            const s = format(start, "h:mm a");
            const e = end ? format(end, "h:mm a") : "";
            return e ? `${s} – ${e}` : s;
        }
        return event.timeRange || "Time TBD";
    };

    const formatShortDate = (event: any): string => {
        const start = toDate(event.startTimestamp);
        if (start) return start.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
        return event.date || "Date TBD";
    };

    // Fetch check-in status + RSVP for all upcoming events
    useEffect(() => {
        if (!memberId) return;

        const fetchStatuses = async () => {
            try {
                // Global check-in
                const memberDoc = await getDoc(doc(db, "applications", memberId));
                if (memberDoc.exists()) {
                    setIsCheckedIn(memberDoc.data().attendance_status === 'PRESENT');
                }

                // RSVP per event
                const rsvpResults: Record<string, boolean> = {};
                await Promise.all(
                    upcomingEvents.map(async (event) => {
                        if (!event.id) return;
                        const ref = doc(db, "events", event.id, "attendees", memberId);
                        const snap = await getDoc(ref);
                        rsvpResults[event.id] = snap.exists();
                    })
                );
                setRsvpMap(rsvpResults);
            } catch (err) {
                console.error("Error fetching statuses:", err);
            }
        };

        if (upcomingEvents.length > 0) fetchStatuses();
    }, [memberId, upcomingEvents.length]);

    const handleConfirmAttendance = async (event: any) => {
        if (!memberId || !event.id) return;
        setRsvpLoadingId(event.id);
        try {
            const attendeeData = {
                uid: memberId,
                name: member?.fullName || member?.name || "Unknown",
                email: member?.email || "",
                role: member?.role || "",
                company: member?.projectCompany || member?.company || "",
                linkedin: member?.linkedin || "",
                status: "CONFIRMED",
                rsvpAt: serverTimestamp(),
            };
            await setDoc(doc(db, "events", event.id, "attendees", memberId), attendeeData, { merge: true });
            setRsvpMap(prev => ({ ...prev, [event.id]: true }));
            toast.success("Attendance Confirmed! See you there. 🎉");
        } catch (err) {
            console.error(err);
            toast.error("Failed to confirm attendance");
        } finally {
            setRsvpLoadingId(null);
        }
    };

    const toggleExpand = (eventId: string) => {
        setExpandedEventId(prev => prev === eventId ? null : eventId);
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center pt-20 pb-24 space-y-4 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-sm">Loading events...</p>
            </div>
        );
    }

    if (upcomingEvents.length === 0 && pastEvents.length === 0) {
        return (
            <div className="w-full max-w-md mx-auto pb-24 pt-10 text-center space-y-3 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto text-gray-700" />
                <p className="text-base font-medium">No events scheduled yet.</p>
                <p className="text-sm text-gray-600">Check back soon — something's brewing.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Live Event Banner (when eventStatus = LIVE and checked in) */}
            {(eventStatus === 'LIVE' || eventStatus === 'ENDED_RECENTLY') && isCheckedIn && onEnterRoomLive && (
                <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-500/40 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                            <h3 className="text-white font-bold text-sm">The Room — Live</h3>
                        </div>
                        <p className="text-xs text-gray-400">See who's here right now.</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onEnterRoomLive}>
                            Enter
                        </Button>
                        {onEditSpotMe && (
                            <button onClick={onEditSpotMe} className="text-[10px] text-gray-500 hover:text-white underline">
                                Edit Info
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium px-1">Upcoming Events</p>
                    {upcomingEvents.map((event) => {
                        const isExpanded = expandedEventId === event.id;
                        const isConfirmed = rsvpMap[event.id] ?? false;
                        const isLoadingRsvp = rsvpLoadingId === event.id;
                        const shortDate = formatShortDate(event);
                        const fullDate = formatEventDate(event);
                        const timeRange = formatEventTime(event);
                        const location = event.locationName || event.location || null;
                        const mapUrl = event.locationMapUrl || null;
                        const locationAddress = event.locationAddress || null;
                        const dressCodeTitle = event.dressCodeTitle || null;
                        const dressCodeDescription = event.dressCodeDescription || null;

                        return (
                            <div
                                key={event.id}
                                className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all duration-300 ${
                                    isExpanded ? 'border-emerald-500/40' : 'border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                {/* Card Header — always visible, click to expand */}
                                <button
                                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                                    onClick={() => toggleExpand(event.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Date badge */}
                                        <div className={`flex-shrink-0 p-2.5 rounded-xl ${isExpanded ? 'bg-emerald-500/15' : 'bg-gray-800'}`}>
                                            <Calendar className={`w-5 h-5 ${isExpanded ? 'text-emerald-400' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold text-sm truncate">{event.title || "Venture Social Event"}</h3>
                                            <p className={`text-xs mt-0.5 font-medium ${isExpanded ? 'text-emerald-400' : 'text-gray-500'}`}>{shortDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isConfirmed && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                                            </span>
                                        )}
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                                        }
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-5 border-t border-gray-800/80 pt-4">

                                        {/* Date & Time */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                                                <Calendar className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
                                                <p className="text-white text-sm font-semibold">{fullDate}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{timeRange}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        {location && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                                                    <MapPin className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                                                    <p className="text-white text-sm font-semibold">{location}</p>
                                                    {locationAddress && <p className="text-xs text-gray-500 mt-0.5">{locationAddress}</p>}
                                                    {mapUrl && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-2 w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs h-8"
                                                            onClick={() => window.open(mapUrl, "_blank")}
                                                        >
                                                            Open in Maps
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dress Code */}
                                        {dressCodeTitle && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
                                                    <Shirt className="w-4 h-4 text-orange-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">Dress Code</p>
                                                    <p className="text-white text-sm font-semibold">{dressCodeTitle}</p>
                                                    {dressCodeDescription && <p className="text-xs text-gray-500 mt-0.5">{dressCodeDescription}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Confirm Attendance CTA */}
                                        {!isConfirmed ? (
                                            <Button
                                                size="lg"
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 shadow-lg shadow-emerald-900/30 mt-1"
                                                onClick={() => handleConfirmAttendance(event)}
                                                disabled={isLoadingRsvp}
                                            >
                                                {isLoadingRsvp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Confirm Attendance
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm font-medium">
                                                <CheckCircle2 className="w-4 h-4" />
                                                You're confirmed for this event!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Past Events History */}
            {pastEvents.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-1">History</p>
                    {pastEvents.map(event => {
                        const start = toDate((event as any).startTimestamp);
                        const dateStr = start ? start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : (event.date || "");
                        return (
                            <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-900/40 rounded-xl border border-gray-800/60">
                                <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-full flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-300 text-sm font-medium truncate">{event.title || "Past Event"}</h3>
                                    <p className="text-gray-600 text-xs mt-0.5">{dateStr}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-800/40 flex-shrink-0">
                                    ATTENDED
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Agenda;
