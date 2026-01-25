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

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Only fetch User Status if memberId provided
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

    // Use the first upcoming event as default config if no specific config provided
    const displayEvent = propConfig || (upcomingEvents.length > 0 ? {
        ...upcomingEvents[0],
        date: upcomingEvents[0].startTimestamp instanceof Timestamp
            ? upcomingEvents[0].startTimestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : new Date(upcomingEvents[0].startTimestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        timeRange: upcomingEvents[0].startTimestamp instanceof Timestamp
            ? format(upcomingEvents[0].startTimestamp.toDate(), "h:mm a") // Simplified, ideally calculated from start/end
            : format(new Date(upcomingEvents[0].startTimestamp), "h:mm a") + " - " + format(new Date(upcomingEvents[0].endTimestamp || upcomingEvents[0].startTimestamp), "h:mm a"),
        locationName: upcomingEvents[0].location || "TBD",
        locationAddress: "See details",
        locationMapUrl: "",
        dressCodeTitle: "Smart Casual",
        dressCodeDescription: upcomingEvents[0].description || "No description",
        timeline: [] // TODO: Add timeline to Event schema if needed
    } : DEFAULT_AGENDA); // Fallback to DEFAULT only if absolutely nothing. Ideally show empty state.

    // Better: If no events, show empty.
    const effectiveConfig = propConfig || (upcomingEvents.length > 0 ? {
        ...upcomingEvents[0],
        // Map fields from Event to AgendaConfig
        locationName: upcomingEvents[0].location,
        locationAddress: "",
        locationMapUrl: "",
        dressCodeTitle: "Detail",
        dressCodeDescription: upcomingEvents[0].description || "",
        timeline: [],
        date: typeof upcomingEvents[0].startTimestamp === 'object' && 'toDate' in upcomingEvents[0].startTimestamp
            ? upcomingEvents[0].startTimestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : new Date(upcomingEvents[0].startTimestamp as string).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        timeRange: "See details" // Simplified for now
    } : null);

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

    // Adapt effectiveConfig (Partial) to AgendaConfig if needed or just use separate rendering.
    // To keep it simple, I'll stick to the existing layout but populate with real data or the DEFAULT if loading.

    // Final Decision: Render layout. If `effectiveConfig` is null, show "No events".
    // I will cast upcomingEvents[0] to match the layout needs or just read directly.

    const activeEvent = effectiveConfig || DEFAULT_AGENDA; // Show default if loading or empty for now to avoid breaking UI, or handle empty.

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Event Details</h2>
                    {attendanceStatus === 'CONFIRMED' || attendanceStatus === 'PRESENT' ? (
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
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                onClick={() => window.open(activeEvent.locationMapUrl, "_blank")}
                            >
                                Open in Maps
                            </Button>
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
                {!(attendanceStatus === 'CONFIRMED' || attendanceStatus === 'PRESENT') && (
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
                                className="w-full text-left bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                                onClick={() => {
                                    // Make this event active? For now just toast
                                    toast.info("Viewing details for " + event.title);
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-white font-bold">{event.title}</h3>
                                        <p className="text-emerald-500 text-xs font-semibold mt-1">
                                            {/* Handle both Timestamp (if updated) and string (if raw) */}
                                            {typeof event.startTimestamp === 'string'
                                                ? new Date(event.startTimestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
                                                : (event.startTimestamp as any)?.toDate?.().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) || event.date}
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
