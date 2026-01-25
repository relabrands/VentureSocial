import { useEffect, useState } from "react";
import { MapPin, Clock, Shirt, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { useEvents, Event } from "@/hooks/useEvents";

interface TimelineItem {
    time: string;
    title: string;
    description: string;
}

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
    timeline: TimelineItem[];
    status?: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED';
}

const DEFAULT_AGENDA: AgendaConfig = {
    date: "Thursday, February 27th",
    timeRange: "7:00 PM - 11:00 PM",
    locationName: "Barna Management School",
    locationAddress: "Av. John F. Kennedy 34, Santo Domingo",
    locationMapUrl: "https://maps.app.goo.gl/example",
    dressCodeTitle: "Smart Casual / Business Tech",
    dressCodeDescription: "Come as you are, but ready to impress. No suits required.",
    timeline: [
        { time: "7:00 PM", title: "Doors Open & Networking", description: "Check-in with your Founder Pass" },
        { time: "8:00 PM", title: "Welcome Remarks", description: "Short intro from the hosts" },
        { time: "8:30 PM", title: "Open Networking", description: "Connect with other founders" },
        { time: "11:00 PM", title: "Event Ends", description: "See you at the next one!" }
    ],
    status: 'UPCOMING'
};

interface AgendaProps {
    memberId?: string;
    onEnterRoomLive?: () => void;
    eventStatus?: 'UPCOMING' | 'LIVE' | 'ENDED_RECENTLY' | 'ENDED';
    onEditSpotMe?: () => void;
    config?: AgendaConfig; // New prop
}

const Agenda = ({ memberId, onEnterRoomLive, eventStatus = 'UPCOMING', onEditSpotMe, config: propConfig }: AgendaProps) => {
    // const [config, setConfig] = useState<AgendaConfig | null>(null); // Removed internal state
    // const [loading, setLoading] = useState(true); // Removed internal loading
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const { upcomingEvents, pastEvents, loading } = useEvents(memberId);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                if (memberId) {
                    const memberDoc = await getDoc(doc(db, "applications", memberId));
                    if (memberDoc.exists()) {
                        setAttendanceStatus(memberDoc.data().attendance_status);
                    }
                }
            } catch (error) {
                console.error("Error fetching status:", error);
            }
        };

        fetchStatus();
    }, [memberId]);

    // Use the selected event, otherwise default to the first upcoming event
    const nextEvent = upcomingEvents[0];
    const targetEvent = selectedEventId
        ? upcomingEvents.find(e => e.id === selectedEventId) || nextEvent
        : nextEvent;

    // Helper to format timestamps safely
    const formatStartTimestamp = (event?: Event) => {
        if (!event?.startTimestamp) return null;
        if (event.startTimestamp instanceof Timestamp) {
            return event.startTimestamp.toDate();
        }
        return new Date(event.startTimestamp as string);
    };

    const formatEndTimestamp = (event?: Event) => {
        if (!event?.endTimestamp) return null;
        if (event.endTimestamp instanceof Timestamp) {
            return event.endTimestamp.toDate();
        }
        return new Date(event.endTimestamp as string);
    };

    const effectiveConfig = propConfig || (targetEvent ? {
        // Map fields
        id: targetEvent.id, // Add ID for comparison
        title: targetEvent.title,
        locationName: targetEvent.location || "TBD",
        locationAddress: "See details",
        locationMapUrl: "",
        dressCodeTitle: "Smart Casual",
        dressCodeDescription: targetEvent.description || "No description",
        timeline: [],
        date: formatStartTimestamp(targetEvent)?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) || targetEvent.date,
        timeRange: formatStartTimestamp(targetEvent)
            ? format(formatStartTimestamp(targetEvent) as Date, "h:mm a") + (targetEvent.endTimestamp ? " - " + format(formatEndTimestamp(targetEvent) as Date, "h:mm a") : "")
            : "See details"
    } : null);

    const activeEvent = effectiveConfig || DEFAULT_AGENDA;

    // Only show confirmed badge if:
    // 1. User is confirmed
    // 2. AND we are looking at the *next* event (assuming global status applies to next).
    // 3. OR if we are looking at a past event they attended (logic pending).
    // Fix: If user says "it shows confirmed and I haven't", it implies attendanceStatus is improperly default. 
    // We already init to null. 
    // We will strict check: isConfirmed is true ONLY if `attendanceStatus === 'CONFIRMED'` AND `targetEvent.id === nextEvent?.id`.
    const isConfirmed = (attendanceStatus === 'CONFIRMED' || attendanceStatus === 'PRESENT') && targetEvent?.id === nextEvent?.id;

    const handleConfirmAttendance = async () => {
        if (!memberId) return;
        setRsvpLoading(true);
        try {
            const memberRef = doc(db, "applications", memberId);
            await updateDoc(memberRef, {
                attendance_status: "CONFIRMED"
            });
            setAttendanceStatus("CONFIRMED");
            toast.success("Attendance Confirmed! See you there.");
        } catch (error) {
            console.error("Error confirming attendance:", error);
            toast.error("Failed to confirm attendance");
        } finally {
            setRsvpLoading(false);
        }
    };

    if (!effectiveConfig && !loading) {
        return (
            <div className="w-full max-w-md mx-auto space-y-6 pb-24 text-center text-gray-500 pt-10">
                <p>No upcoming events scheduled.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Event Details</h2>
                    {isConfirmed ? (
                        <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-medium rounded-full border border-[#10b981]/20">
                            Confirmed
                        </span>
                    ) : null}
                </div>

                {/* The Room Live Access */}
                {(eventStatus === 'LIVE' || eventStatus === 'ENDED_RECENTLY') && attendanceStatus === 'PRESENT' && onEnterRoomLive && (
                    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-sm">The Room Live</h3>
                            <p className="text-xs text-gray-400">See who is here.</p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={onEnterRoomLive}
                        >
                            Enter Room
                        </Button>
                        {onEditSpotMe && (
                            <button
                                onClick={onEditSpotMe}
                                className="text-[10px] text-gray-400 hover:text-white underline text-center mt-2 w-full block"
                            >
                                Edit Info
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Event Title if available */}
                    {activeEvent.title && (
                        <div>
                            <h3 className="text-2xl font-bold text-white">{activeEvent.title}</h3>
                        </div>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Date</h3>
                            <p className="text-white font-semibold">{activeEvent.date}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{activeEvent.timeRange}</span>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <MapPin className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-400">Location</h3>
                            <p className="text-white font-semibold">{activeEvent.locationName}</p>
                            <p className="text-sm text-gray-500 mt-1">{activeEvent.locationAddress}</p>
                            {activeEvent.locationMapUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                    onClick={() => window.open(activeEvent.locationMapUrl, "_blank")}
                                >
                                    Open in Maps
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Dress Code */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <Shirt className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Dress Code</h3>
                            <p className="text-white font-semibold">{activeEvent.dressCodeTitle}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeEvent.dressCodeDescription}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Big Confirm Button */}
                {!isConfirmed && (
                    <Button
                        size="lg"
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-lg h-12 shadow-lg shadow-emerald-500/20"
                        onClick={handleConfirmAttendance}
                        disabled={rsvpLoading}
                    >
                        {rsvpLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Confirm Attendance
                    </Button>
                )}
            </div>

            {/* Upcoming Events List */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Upcoming Events</h2>
                {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingEvents.map(event => (
                            <button
                                key={event.id}
                                className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedEventId === event.id || (!selectedEventId && event.id === nextEvent?.id) ? 'bg-zinc-800 border-emerald-500/50' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'}`}
                                onClick={() => setSelectedEventId(event.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-white font-bold">{event.title || event.date || "Event"}</h3>
                                        <p className="text-emerald-500 text-xs font-semibold mt-1">
                                            {formatStartTimestamp(event)?.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) || event.date}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">{event.location}</p>
                                    </div>
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-4 text-sm italic">
                        No upcoming events found.
                    </div>
                )}
            </div>

            {/* Past Events History */}
            {pastEvents.length > 0 && (
                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">History</h2>
                    <div className="space-y-3">
                        {pastEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-3 p-3 bg-zinc-800/20 rounded-xl border border-zinc-800">
                                <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-gray-200 text-sm font-medium">{event.title}</h3>
                                    <p className="text-gray-500 text-xs">
                                        {typeof event.startTimestamp === 'string'
                                            ? new Date(event.startTimestamp).toLocaleDateString('en-US')
                                            : (event.startTimestamp as any)?.toDate?.().toLocaleDateString('en-US') || event.date}
                                    </p>
                                </div>
                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">
                                    ATTENDED
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
