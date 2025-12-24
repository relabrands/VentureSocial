import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

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
    ]
};

const AgendaEditor = () => {
    const [config, setConfig] = useState<AgendaConfig>(DEFAULT_AGENDA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, "config", "agenda");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setConfig(docSnap.data() as AgendaConfig);
            } else {
                // If no config exists, we'll use defaults but not save them yet
                // or we could save defaults immediately. Let's just use defaults in state.
            }
        } catch (error) {
            console.error("Error fetching agenda config:", error);
            toast.error("Failed to load agenda settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "config", "agenda"), {
                ...config,
                updatedAt: serverTimestamp()
            });
            toast.success("Agenda updated successfully");
        } catch (error) {
            console.error("Error saving agenda:", error);
            toast.error("Failed to save agenda");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof AgendaConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

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

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Agenda Editor</h1>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Date & Time</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Event Date</Label>
                            <Input
                                value={config.date}
                                onChange={(e) => updateField("date", e.target.value)}
                                placeholder="e.g. Thursday, February 27th"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Time Range</Label>
                            <Input
                                value={config.timeRange}
                                onChange={(e) => updateField("timeRange", e.target.value)}
                                placeholder="e.g. 7:00 PM - 11:00 PM"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Venue Name</Label>
                            <Input
                                value={config.locationName}
                                onChange={(e) => updateField("locationName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                value={config.locationAddress}
                                onChange={(e) => updateField("locationAddress", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Google Maps URL</Label>
                            <Input
                                value={config.locationMapUrl}
                                onChange={(e) => updateField("locationMapUrl", e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Dress Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={config.dressCodeTitle}
                                onChange={(e) => updateField("dressCodeTitle", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={config.dressCodeDescription}
                                onChange={(e) => updateField("dressCodeDescription", e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Timeline</CardTitle>
                        <Button variant="outline" size="sm" onClick={addTimelineItem}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {config.timeline.map((item, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/30">
                                <div className="grid gap-4 flex-1 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input
                                            value={item.time}
                                            onChange={(e) => updateTimelineItem(index, "time", e.target.value)}
                                            placeholder="e.g. 7:00 PM"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={item.title}
                                            onChange={(e) => updateTimelineItem(index, "title", e.target.value)}
                                            placeholder="Event Title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateTimelineItem(index, "description", e.target.value)}
                                            placeholder="Short description"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive mt-8"
                                    onClick={() => removeTimelineItem(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgendaEditor;
