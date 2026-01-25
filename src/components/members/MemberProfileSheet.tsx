import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, User, Briefcase, Building, Linkedin, Target, Zap } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";

interface MemberProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    member: any; // Using any for flexibility with Firestore data
    onUpdate: (updatedData: any) => void;
}

const MemberProfileSheet = ({ isOpen, onClose, member, onUpdate }: MemberProfileSheetProps) => {
    const [formData, setFormData] = useState({
        fullName: "",
        role: "",
        company: "",
        positionRole: "",
        linkedin: "",
        bio: "",
        superpower: "",
        biggestChallenge: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (member) {
            setFormData({
                fullName: member.fullName || "",
                role: member.role || "",
                company: member.projectCompany || member.company || "",
                positionRole: member.positionRole || "",
                linkedin: member.linkedin || "",
                bio: member.bio || "",
                superpower: member.superpower || "",
                biggestChallenge: member.biggestChallenge || ""
            });
        }
    }, [member, isOpen]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!member?.id) return;

        setSaving(true);
        try {
            const updates = {
                fullName: formData.fullName,
                role: formData.role,
                projectCompany: formData.company, // Mapping back to projectCompany as main field
                positionRole: formData.positionRole,
                linkedin: formData.linkedin,
                bio: formData.bio,
                superpower: formData.superpower,
                biggestChallenge: formData.biggestChallenge
            };

            await updateDoc(doc(db, "applications", member.id), updates);

            // Notify parent to update local state optimistically
            onUpdate({ ...member, ...updates });

            toast.success("Profile updated successfully");
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md bg-[#0a0a0a] border-l border-gray-800 text-white p-0 flex flex-col h-full">
                <SheetHeader className="p-6 pb-2 border-b border-gray-800/50">
                    <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-500" />
                        Edit Profile
                    </SheetTitle>
                    <SheetDescription className="text-gray-400">
                        Update your information visible to other members.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
                    {/* Public Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Public Info</h3>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => handleChange("fullName", e.target.value)}
                                    className="bg-gray-900/50 border-gray-700 pl-9 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-gray-300">Role (e.g. Founder)</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => handleChange("role", e.target.value)}
                                        className="bg-gray-900/50 border-gray-700 pl-9 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-gray-300">Company</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="company"
                                        value={formData.company}
                                        onChange={(e) => handleChange("company", e.target.value)}
                                        className="bg-gray-900/50 border-gray-700 pl-9 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin" className="text-gray-300">LinkedIn URL</Label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    id="linkedin"
                                    value={formData.linkedin}
                                    onChange={(e) => handleChange("linkedin", e.target.value)}
                                    className="bg-gray-900/50 border-gray-700 pl-9 focus:border-purple-500"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Community Info Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Community Intro</h3>

                        <div className="space-y-2">
                            <Label htmlFor="superpower" className="text-purple-400 font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4" /> My Superpower
                            </Label>
                            <Textarea
                                id="superpower"
                                value={formData.superpower}
                                onChange={(e) => handleChange("superpower", e.target.value)}
                                className="bg-gray-900/50 border-gray-700 focus:border-purple-500 min-h-[80px]"
                                placeholder="What can you help others with?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="challenge" className="text-orange-400 font-medium flex items-center gap-2">
                                <Target className="w-4 h-4" /> Biggest Challenge
                            </Label>
                            <Textarea
                                id="challenge"
                                value={formData.biggestChallenge}
                                onChange={(e) => handleChange("biggestChallenge", e.target.value)}
                                className="bg-gray-900/50 border-gray-700 focus:border-orange-500 min-h-[80px]"
                                placeholder="What help do you need right now?"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 bg-[#0a0a0a]/95 backdrop-blur border-t border-gray-800">
                    <Button variant="ghost" onClick={onClose} className="mr-auto text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default MemberProfileSheet;
