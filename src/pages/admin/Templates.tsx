import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

// ... (imports)

// ... (inside component)

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    const handleLoadDefaults = async () => {
        if (!confirm("This will create default templates ONLY if they don't exist. Existing templates will be preserved. Continue?")) return;

        const defaults = [
            {
                id: "application_received",
                subject: "Application Received - Venture Social",
                body: `<h1>Application Received</h1>
<p>Hi {{fullName}},</p>
<p>Thanks for applying to Venture Social. We have received your application for <strong>{{project}}</strong> and will be in touch shortly.</p>
<p>Best regards,</p>
<p>The Venture Social Team</p>`,
                active: true
            },
            {
                id: "application_accepted",
                subject: "Welcome to Venture Social! 🚀",
                body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Accepted</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8;">
        <tr>
            <td align="center" style="padding-top: 30px; padding-bottom: 30px;">
                
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                    <tr>
                        <td align="center" style="background-color: #0b1120; padding: 20px 0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">VENTURE SOCIAL</h1>
                        </td>
                    </tr>
                </table>

                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="padding: 30px;">
                            
                            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                                <span style="color:#10b981;">✅</span> You're in!
                            </h2>
                            
                            <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                Hi <strong>{{fullName}}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                We are pleased to inform you that your application for <strong>{{project}}</strong> has been selected. Your profile is a perfect fit for the ecosystem we are building.
                            </p>

                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-bottom: 8px; color: #6b7280; font-size: 13px;">Next Event:</td>
                                        <td align="right" style="padding-bottom: 8px; color: #111827; font-weight: bold; font-size: 13px;">January 2026 (Launch)</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 8px; color: #6b7280; font-size: 13px;">Location:</td>
                                        <td align="right" style="padding-bottom: 8px; color: #111827; font-weight: bold; font-size: 13px;">CEF. - Santo Domingo</td>
                                    </tr>
                                    <tr>
                                        <td style="border-top: 1px solid #e5e7eb; padding-top: 8px; color: #10b981; font-weight: bold; font-size: 15px;">Status:</td>
                                        <td align="right" style="border-top: 1px solid #e5e7eb; padding-top: 8px; color: #10b981; font-weight: bold; font-size: 15px;">Confirmed</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Founder Pass Section -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #0b1120; border-radius: 12px; text-align: center; color: white;">
                                <p style="margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">Your Founder Pass is Ready</p>
                                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: white;">{{fullName}}</h2>
                                <a href="{{passUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                View & Share Your Pass 💳
                                </a>
                                <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">Member ID: {{memberId}}</p>
                            </div>

                            <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                You will receive the official calendar invite and access details shortly.
                            </p>
                            
                            <p style="margin: 0; color: #4b5563; font-size: 16px;">
                                Welcome to the club! 🚀
                            </p>

                        </td>
                    </tr>
                </table>

                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                 © 2025 Venture Social DR.<br>
                                Connecting Founders & Capital.<br>
                                Santo Domingo, Dominican Republic.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>`,
                active: true
            },
            {
                id: "application_rejected",
                subject: "Update on your Application",
                body: `<h1>Update on your Application</h1>
<p>Hi {{fullName}},</p>
<p>Thank you for your interest in Venture Social. After careful review, we are unable to proceed with your application for <strong>{{project}}</strong> at this time.</p>
<p>We wish you the best in your future endeavors.</p>
<p>Venture Social</p>`,
                active: true
            },
            {
                id: "application_review",
                subject: "Application Under Review",
                body: `<h1>Under Review</h1>
<p>Hi {{fullName}},</p>
<p>Your application for <strong>{{project}}</strong> is now being reviewed by our team.</p>
<p>We will get back to you soon.</p>
<p>Best,</p>
<p>Venture Social Team</p>`,
                active: true
            },
            {
                id: "application_pending",
                subject: "Application Pending",
                body: `<h1>Application Pending</h1>
<p>Hi {{fullName}},</p>
<p>Your application for <strong>{{project}}</strong> is currently pending further action.</p>
<p>Best,</p>
<p>Venture Social Team</p>`,
                active: true
            },
            {
                id: "magic_link_login",
                subject: "Your Venture Social Member Access Link",
                body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #10b981;">Access your Founder Pass</h1>
    <p>Hello {{name}},</p>
    <p>Click the button below to access your Venture Social Founder Pass and the Member Panel.</p>
    <a href="{{magicLink}}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
        Access Member Panel
    </a>
    <p style="color: #666; font-size: 14px;">Or copy this link: <a href="{{magicLink}}">{{magicLink}}</a></p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
</div>`,
                active: true
            }
        ];

        try {
            let loadedCount = 0;
            for (const temp of defaults) {
                const docRef = doc(db, "emailTemplates", temp.id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    await setDoc(docRef, {
                        ...temp,
                        updatedAt: serverTimestamp()
                    });
                    loadedCount++;
                }
            }

            if (loadedCount > 0) {
                toast.success(`Loaded ${loadedCount} new default templates`);
                fetchTemplates();
            } else {
                toast.info("All default templates already exist");
            }
        } catch (error) {
            console.error("Error loading defaults:", error);
            toast.error("Failed to load default templates");
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
            toast.success(`Template ${!template.active ? 'activated' : 'deactivated'} `);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };





    return (
        <div className="space-y-6">
            {/* ... (header remains same) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleLoadDefaults} className="flex-1 md:flex-none">
                        Load Defaults
                    </Button>
                    <Button onClick={() => handleOpenModal()} className="flex-1 md:flex-none">
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </div>
            </div>

            {/* ... (grid remains same) */}
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
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="key">Template Key (ID)</Label>
                                <Input
                                    id="key"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="e.g. application_accepted"
                                    disabled={!!editingTemplate}
                                />
                            </div>
                            <div className="flex items-end pb-2 space-x-2">
                                <Switch
                                    id="active"
                                    checked={active}
                                    onCheckedChange={setActive}
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
                        </div>

                        <Tabs defaultValue="edit" className="flex-1 flex flex-col">
                            <TabsList>
                                <TabsTrigger value="edit">Edit HTML</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className="flex-1 mt-2">
                                <div className="grid gap-2 h-full">
                                    <Textarea
                                        id="body"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="<html>... Use {{fullName}} for dynamic values."
                                        className="h-full min-h-[300px] font-mono text-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">Supported variables: {"{{fullName}}"}, {"{{project}}"}, {"{{status}}"}, {"{{role}}"}</p>
                                </div>
                            </TabsContent>
                            <TabsContent value="preview" className="flex-1 mt-2 border rounded-md p-4 bg-white overflow-y-auto min-h-[300px]">
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                                    __html: body
                                        .replace(/{{fullName}}/g, "John Doe")
                                        .replace(/{{project}}/g, "My Awesome Project")
                                        .replace(/{{status}}/g, "accepted")
                                        .replace(/{{role}}/g, "Developer")
                                }} />
                            </TabsContent>
                        </Tabs>
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
