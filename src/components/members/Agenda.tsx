import { MapPin, Clock, Shirt, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const Agenda = () => {
    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Event Details</h2>
                    <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-medium rounded-full border border-[#10b981]/20">
                        Confirmed
                    </span>
                </div>

                <div className="space-y-6">
                    {/* Date & Time */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Date</h3>
                            <p className="text-white font-semibold">Thursday, February 27th</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>7:00 PM - 11:00 PM</span>
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
                            <p className="text-white font-semibold">Barna Management School</p>
                            <p className="text-sm text-gray-500 mt-1">Av. John F. Kennedy 34, Santo Domingo</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                onClick={() => window.open("https://maps.app.goo.gl/example", "_blank")}
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
                            <p className="text-white font-semibold">Smart Casual / Business Tech</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Come as you are, but ready to impress. No suits required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Timeline</h2>
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-800">
                    {[
                        { time: "7:00 PM", title: "Doors Open & Networking", desc: "Check-in with your Founder Pass" },
                        { time: "8:00 PM", title: "Welcome Remarks", desc: "Short intro from the hosts" },
                        { time: "8:30 PM", title: "Open Networking", desc: "Connect with other founders" },
                        { time: "11:00 PM", title: "Event Ends", desc: "See you at the next one!" }
                    ].map((item, i) => (
                        <div key={i} className="relative flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center z-10 shrink-0">
                                <div className="w-3 h-3 bg-[#10b981] rounded-full" />
                            </div>
                            <div className="pt-1">
                                <span className="text-[#10b981] text-sm font-bold">{item.time}</span>
                                <h3 className="text-white font-semibold">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
