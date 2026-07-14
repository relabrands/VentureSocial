import { useEffect, useState } from "react";
import { MapPin, Clock, Shirt, Calendar, Loader2, ChevronDown, ChevronUp, CheckCircle2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc, setDoc, Timestamp, serverTimestamp, collection, getDocs, query, orderBy } from "firebase/firestore";
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
    description?: string;
    coverImageUrl?: string;
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

interface Attendee {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    company?: string;
}

// Luma-style attendee section
const AttendeesSection = ({ eventId, confirmed }: { eventId: string; confirmed: boolean }) => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!confirmed) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const ref = collection(db, "events", eventId, "attendees");
                let snap;
                try {
                    snap = await getDocs(query(ref, orderBy("rsvpAt", "desc")));
                } catch {
                    snap = await getDocs(ref);
                }
                setAttendees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendee)));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [eventId, confirmed]);

    if (loading) return <div className="flex items-center gap-2 text-xs text-gray-500 py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading attendees...</div>;
    if (attendees.length === 0) return null;

    const visible = attendees.slice(0, 5);
    const extra = attendees.length - 5;

    // Build names string like Luma
    const firstName = (name?: string) => name?.split(" ")[0] || "Member";
    let namesStr = "";
    if (attendees.length === 1) {
        namesStr = firstName(attendees[0].name);
    } else if (attendees.length === 2) {
        namesStr = `${firstName(attendees[0].name)} and ${firstName(attendees[1].name)}`;
    } else if (attendees.length <= 4) {
        const names = attendees.slice(0, attendees.length - 1).map(a => firstName(a.name)).join(", ");
        namesStr = `${names} and ${firstName(attendees[attendees.length - 1].name)}`;
    } else {
        namesStr = `${firstName(attendees[0].name)}, ${firstName(attendees[1].name)} and ${attendees.length - 2} more`;
    }

    return (
        <>
            <div className="border-t border-gray-800/60 pt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>{attendees.length} {attendees.length === 1 ? "person" : "people"} confirmed</span>
                </div>
                {/* Avatar stack */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {visible.map((a, i) => (
                            <div
                                key={a.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-emerald-500 border-2 border-[#111827] flex items-center justify-center text-white text-xs font-bold"
                                style={{ zIndex: visible.length - i }}
                                title={a.name}
                            >
                                {(a.name?.[0] || "?").toUpperCase()}
                            </div>
                        ))}
                        {extra > 0 && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#111827] flex items-center justify-center text-gray-300 text-[10px] font-bold">
                                +{extra}
                            </div>
                        )}
                    </div>
                </div>
                {/* Names — clickable to show all */}
                <button
                    className="text-xs text-gray-400 hover:text-white text-left transition-colors"
                    onClick={() => setShowAll(true)}
                >
                    {namesStr}
                </button>
            </div>

            {/* Full attendee list modal */}
            {showAll && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowAll(false)}>
                    <div
                        className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-white font-bold text-sm">{attendees.length} Confirmed</h3>
                            <button onClick={() => setShowAll(false)} className="text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-3 space-y-2">
                            {attendees.map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/50 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {(a.name?.[0] || "?").toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{a.name || "Member"}</p>
                                        {(a.role || a.company) && (
                                            <p className="text-gray-500 text-xs truncate">{[a.role, a.company].filter(Boolean).join(" · ")}</p>
                                        )}
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Agenda = ({ memberId, member, onEnterRoomLive, eventStatus = 'UPCOMING', onEditSpotMe, config: propConfig }: AgendaProps) => {
    const { upcomingEvents, pastEvents, loading } = useEvents(memberId);

    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [rsvpMap, setRsvpMap] = useState<Record<string, boolean>>({});
    const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

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

    useEffect(() => {
        if (!memberId) return;

        const fetchStatuses = async () => {
            try {
                const memberDoc = await getDoc(doc(db, "applications", memberId));
                if (memberDoc.exists()) {
                    setIsCheckedIn(memberDoc.data().attendance_status === 'PRESENT');
                }

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

            {/* Live Event Banner */}
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
                        const description = event.description || null;
                        const coverImageUrl = event.coverImageUrl || null;

                        return (
                            <div
                                key={event.id}
                                className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all duration-300 ${
                                    isExpanded ? 'border-emerald-500/40' : 'border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                {/* Cover Image */}
                                {coverImageUrl && (
                                    <div className="w-full h-36 overflow-hidden">
                                        <img
                                            src={coverImageUrl}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                                        />
                                    </div>
                                )}

                                {/* Card Header */}
                                <button
                                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                                    onClick={() => toggleExpand(event.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
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
                                    <div className="px-4 pb-4 space-y-4 border-t border-gray-800/80 pt-4">

                                        {/* Description */}
                                        {description && (
                                            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                                        )}

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

                                        {/* Luma-style Attendees */}
                                        <AttendeesSection eventId={event.id} confirmed={isConfirmed} />

                                        {/* Confirm CTA */}
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
