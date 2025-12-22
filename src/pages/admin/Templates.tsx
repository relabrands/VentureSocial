import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmailTemplate {
    id: string; // This will be the key
    subject: string;
    body: string;
    active: boolean;
    updatedAt: any;
}

const Templates = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    // Form state
    const [key, setKey] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const q = query(collection(db, "emailTemplates"), orderBy("updatedAt", "desc"));
            const querySnapshot = await getDocs(q);
            const temps = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as EmailTemplate[];
            setTemplates(temps);
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Failed to fetch templates");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template?: EmailTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setKey(template.id);
            setSubject(template.subject);
            setBody(template.body);
            setActive(template.active);
        } else {
            setEditingTemplate(null);
            setKey("");
            setSubject("");
            setBody("");
            setActive(true);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!key || !subject || !body) {
            toast.error("Key, Subject and Body are required");
            return;
        }

        try {
            const templateData = {
                subject,
                body,
                active,
                updatedAt: serverTimestamp(),
            };

            // Use setDoc with merge: true to create or update with specific ID (key)
            await setDoc(doc(db, "emailTemplates", key), templateData, { merge: true });

            toast.success(editingTemplate ? "Template updated" : "Template created");

            setIsModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("Failed to save template");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            await deleteDoc(doc(db, "emailTemplates", id));
            setTemplates(templates.filter(t => t.id !== id));
            toast.success("Template deleted");
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Failed to delete template");
        }
    };

    const handleCopy = (template: EmailTemplate) => {
        const textToCopy = `Subject: ${template.subject}\n\n${template.body}`;
        navigator.clipboard.writeText(textToCopy);
        toast.success("Copied to clipboard");
    };

    const toggleActive = async (template: EmailTemplate) => {
        try {
            await updateDoc(doc(db, "emailTemplates", template.id), {
                active: !template.active,
                updatedAt: serverTimestamp()
            });
            setTemplates(templates.map(t => t.id === template.id ? { ...t, active: !t.active } : t));
            toast.success(`Template ${!template.active ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleLoadDefaults = async () => {
        if (!confirm("This will create default templates if they don't exist. Continue?")) return;

        const defaults = [
            {
                id: "application_received",
                subject: "Application Received - Venture Social",
                body: "<h1>Application Received</h1><p>Hi {{fullName}},</p><p>Thanks for applying to Venture Social. We have received your application for <strong>{{project}}</strong> and will be in touch shortly.</p><br><p>Best regards,</p><p>The Venture Social Team</p>",
                active: true
            },
            {
                id: "application_accepted",
                subject: "Congratulations! Application Accepted",
                body: "<h1>Application Accepted</h1><p>Hi {{fullName}},</p><p>We are pleased to inform you that your application for <strong>{{project}}</strong> has been accepted!</p><p>We will be sending next steps in a separate email.</p><br><p>Welcome aboard,</p><p>Venture Social</p>",
                active: true
            },
            {
                id: "application_rejected",
                subject: "Update on your Application",
                body: "<h1>Update on your Application</h1><p>Hi {{fullName}},</p><p>Thank you for your interest in Venture Social. After careful review, we are unable to proceed with your application for <strong>{{project}}</strong> at this time.</p><p>We wish you the best in your future endeavors.</p><br><p>Venture Social</p>",
                active: true
            },
            {
                id: "application_review",
                subject: "Application Under Review",
                body: "<h1>Under Review</h1><p>Hi {{fullName}},</p><p>Your application for <strong>{{project}}</strong> is now being reviewed by our team.</p><p>We will get back to you soon.</p><br><p>Best,</p><p>Venture Social Team</p>",
                active: true
            },
            {
                id: "application_pending",
                subject: "Application Pending",
                body: "<h1>Application Pending</h1><p>Hi {{fullName}},</p><p>Your application for <strong>{{project}}</strong> is currently pending further action.</p><br><p>Best,</p><p>Venture Social Team</p>",
                active: true
            }
        ];

        try {
            for (const temp of defaults) {
                // Only create if not exists to avoid overwriting custom changes, or use set with merge
                // Here using set with merge to ensure fields exist
                await setDoc(doc(db, "emailTemplates", temp.id), {
                    ...temp,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            toast.success("Default templates loaded");
            fetchTemplates();
        } catch (error) {
            console.error("Error loading defaults:", error);
            toast.error("Failed to load default templates");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleLoadDefaults}>
                        Load Defaults
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Loading...</p>
                ) : templates.length === 0 ? (
                    <p>No templates found.</p>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg font-mono">{template.id}</CardTitle>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(template)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                <div className="font-medium mb-1 text-foreground">{template.subject}</div>
                                {template.body}
                            </CardContent>
                            <CardFooter className="pt-3 border-t flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={template.active}
                                        onCheckedChange={() => toggleActive(template)}
                                    />
                                    <span className="text-xs text-muted-foreground">{template.active ? 'Active' : 'Inactive'}</span>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => handleCopy(template)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="key">Template Key (ID)</Label>
                            <Input
                                id="key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="e.g. application_accepted"
                                disabled={!!editingTemplate} // Disable key editing for existing docs
                            />
                            <p className="text-xs text-muted-foreground">Unique identifier for the template (e.g. application_accepted)</p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={active}
                                onCheckedChange={setActive}
                            />
                            <Label htmlFor="active">Active</Label>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="body">Body (HTML Supported)</Label>
                            <Textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="<html>... Use {{fullName}} for dynamic values."
                                className="h-[300px] font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">You can use HTML tags for formatting. Supported variables: {"{{fullName}}"}, {"{{project}}"}, {"{{status}}"}, {"{{role}}"}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Templates;
