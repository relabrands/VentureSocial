import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Gift, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Perk {
    id: string;
    title: string;
    description: string;
    status: "active" | "coming_soon" | "disabled";
    link: string;
    color: string;
}

interface PerksConfig {
    items: Perk[];
}

const COLORS = [
    { label: "Blue", value: "bg-blue-900" },
    { label: "Orange", value: "bg-orange-500" },
    { label: "Black", value: "bg-black" },
    { label: "Green", value: "bg-green-600" },
    { label: "Purple", value: "bg-purple-600" },
    { label: "Red", value: "bg-red-600" },
];

const PerksEditor = () => {
    const [items, setItems] = useState<Perk[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Perk | null>(null);
    const [formData, setFormData] = useState<Perk>({
        id: "",
        title: "",
        description: "",
        status: "active",
        link: "",
        color: "bg-blue-900"
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, "config", "perks");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as PerksConfig;
                setItems(data.items || []);
            } else {
                // Initialize with defaults if empty
                const defaults: Perk[] = [
                    {
                        id: "barna",
                        title: "Barna Management School",
                        description: "15% Off en Programas Ejecutivos 2026",
                        status: "active",
                        link: "#",
                        color: "bg-blue-900"
                    },
                    {
                        id: "aws",
                        title: "AWS Activate",
                        description: "$1,000 en créditos",
                        status: "coming_soon",
                        link: "#",
                        color: "bg-orange-500"
                    },
                    {
                        id: "notion",
                        title: "Notion for Startups",
                        description: "6 meses gratis del plan Plus",
                        status: "coming_soon",
                        link: "#",
                        color: "bg-black"
                    }
                ];
                setItems(defaults);
                // Optionally save defaults immediately
                // await saveConfig(defaults);
            }
        } catch (error) {
            console.error("Error fetching perks:", error);
            toast.error("Failed to load perks");
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newItems: Perk[]) => {
        setSaving(true);
        try {
            await setDoc(doc(db, "config", "perks"), {
                items: newItems,
                updatedAt: serverTimestamp()
            });
            setItems(newItems);
            toast.success("Perks updated successfully");
        } catch (error) {
            console.error("Error saving perks:", error);
            toast.error("Failed to save perks");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenModal = (item?: Perk) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                id: crypto.randomUUID(),
                title: "",
                description: "",
                status: "active",
                link: "",
                color: "bg-blue-900"
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveItem = async () => {
        if (!formData.title || !formData.description) {
            toast.error("Title and Description are required");
            return;
        }

        let newItems = [...items];
        if (editingItem) {
            newItems = newItems.map(item => item.id === editingItem.id ? formData : item);
        } else {
            newItems.push(formData);
        }

        await saveConfig(newItems);
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this perk?")) return;
        const newItems = items.filter(item => item.id !== id);
        await saveConfig(newItems);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Perks Editor</h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Perk
                </Button>
            </div>

            <div className="grid gap-4">
                {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden relative group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${item.color}`} />
                        <CardContent className="p-6 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{item.title}</h3>
                                    {item.status === "active" ? (
                                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                                    ) : item.status === "coming_soon" ? (
                                        <Badge variant="outline">Coming Soon</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">Disabled</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">{item.description}</p>
                                {item.link && item.link !== "#" && (
                                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline block mt-1">
                                        {item.link}
                                    </a>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No perks configured yet.
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Perk" : "New Perk"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. AWS Activate"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="e.g. $1,000 in credits"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val: "active" | "coming_soon" | "disabled") => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Color Theme</Label>
                                <Select
                                    value={formData.color}
                                    onValueChange={(val) => setFormData({ ...formData, color: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLORS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${c.value}`} />
                                                    {c.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Link (Optional)</Label>
                            <Input
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PerksEditor;
