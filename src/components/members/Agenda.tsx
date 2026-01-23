import { useEffect, useState } from "react";
import { MapPin, Clock, Shirt, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";

interface TimelineItem {
    time: string;
    title: string;
    description: string;
}

interface AgendaConfig {
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
}

const Agenda = ({ memberId, onEnterRoomLive }: AgendaProps) => {
    const [config, setConfig] = useState<AgendaConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
    const [rsvpLoading, setRsvpLoading] = useState(false);

    useEffect(() => {
        const fetchConfigAndStatus = async () => {
            try {
                // Fetch Config
                const docRef = doc(db, "config", "agenda");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setConfig(docSnap.data() as AgendaConfig);
                } else {
                    setConfig(DEFAULT_AGENDA);
                }

                // Fetch User Status if memberId provided
                if (memberId) {
                    const memberDoc = await getDoc(doc(db, "applications", memberId));
                    if (memberDoc.exists()) {
                        setAttendanceStatus(memberDoc.data().attendance_status);
                    }
                }

            } catch (error) {
                console.error("Error fetching agenda/status:", error);
                setConfig(DEFAULT_AGENDA);
            } finally {
                setLoading(false);
            }
        };

        fetchConfigAndStatus();
    }, [memberId]);

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#10b981]" /></div>;
    }

    const data = config || DEFAULT_AGENDA;

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

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Event Details</h2>
                    {attendanceStatus === 'CONFIRMED' || attendanceStatus === 'PRESENT' ? (
                        <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-medium rounded-full border border-[#10b981]/20">
                            Confirmed
                        </span>
                    ) : (
                        <Button
                            size="sm"
                            variant="default"
                            className="bg-white text-black hover:bg-gray-200 text-xs h-7"
                            onClick={handleConfirmAttendance}
                            disabled={rsvpLoading}
                        >
                            {rsvpLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Confirm RSVP
                        </Button>
                    )}
                </div>

                {/* The Room Live Access - Only if Event is LIVE (or manually enabled for testing) */}
                {(data.status === 'LIVE' || data.status === 'ENDED_RECENTLY') && attendanceStatus === 'PRESENT' && onEnterRoomLive && (
                    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-sm">The Room Live</h3>
                            <p className="text-xs text-gray-400">See who is here right now.</p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={onEnterRoomLive}
                        >
                            Enter Room
                        </Button>
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
                            <p className="text-white font-semibold">{data.date}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{data.timeRange}</span>
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
                            <p className="text-white font-semibold">{data.locationName}</p>
                            <p className="text-sm text-gray-500 mt-1">{data.locationAddress}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                onClick={() => window.open(data.locationMapUrl, "_blank")}
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
                            <p className="text-white font-semibold">{data.dressCodeTitle}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {data.dressCodeDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Timeline</h2>
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-800">
                    {data.timeline.map((item, i) => (
                        <div key={i} className="relative flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center z-10 shrink-0">
                                <div className="w-3 h-3 bg-[#10b981] rounded-full" />
                            </div>
                            <div className="pt-1">
                                <span className="text-[#10b981] text-sm font-bold">{item.time}</span>
                                <h3 className="text-white font-semibold">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
