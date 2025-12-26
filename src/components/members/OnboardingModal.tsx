import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { roleConfig } from "@/components/landing/ApplicationForm";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OnboardingModalProps {
    isOpen: boolean;
    memberId: string; // Document ID
    role: string;
    existingLinkedin?: string; // Add existingLinkedin prop
    onComplete: () => void;
}

const OnboardingModal = ({ isOpen, memberId, role, existingLinkedin, onComplete }: OnboardingModalProps) => {
    const [formData, setFormData] = useState({
        superpower: "",
        biggestChallenge: "",
        email: "",
        linkedin: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Normalize role to lowercase to match config keys
    const normalizedRole = role?.toLowerCase() || "founder";
    const config = roleConfig[normalizedRole] || roleConfig["founder"];

    const showLinkedinInput = !existingLinkedin;

    const handleSubmit = async () => {
        if (!formData.superpower || !formData.biggestChallenge || !formData.email || (showLinkedinInput && !formData.linkedin)) {
            toast.error("Please fill in all fields to continue.");
            return;
        }

        setIsSubmitting(true);
        try {
            const docRef = doc(db, "applications", memberId);
            const updateData: any = {
                superpower: formData.superpower,
                biggestChallenge: formData.biggestChallenge,
                email: formData.email
            };

            if (showLinkedinInput) {
                updateData.linkedin = formData.linkedin;
            }

            await updateDoc(docRef, updateData);
            toast.success("Profile updated! Welcome to the network.");
            onComplete();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-[#111827] border-[#1f2937] text-white [&>button]:hidden pointer-events-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">
                        Activate your Networking AI 🧠
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        To connect you with the right people, we need a few details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-[#10b981] font-medium text-base">
                            Email Address
                        </Label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-gray-700 bg-[#1f2937] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {showLinkedinInput && (
                        <div className="space-y-3">
                            <Label htmlFor="linkedin" className="text-[#10b981] font-medium text-base">
                                LinkedIn Profile
                            </Label>
                            <input
                                id="linkedin"
                                type="text"
                                placeholder="linkedin.com/in/username"
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-gray-700 bg-[#1f2937] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="superpower" className="text-[#10b981] font-medium text-base">
                            {config.offerLabel}
                        </Label>
                        <Textarea
                            id="superpower"
                            placeholder={config.offerPlaceholder}
                            value={formData.superpower}
                            onChange={(e) => setFormData({ ...formData, superpower: e.target.value })}
                            className="bg-[#1f2937] border-gray-700 text-white min-h-[100px] focus-visible:ring-[#10b981]"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="biggestChallenge" className="text-[#10b981] font-medium text-base">
                            {config.seekLabel}
                        </Label>
                        <Textarea
                            id="biggestChallenge"
                            placeholder={config.seekPlaceholder}
                            value={formData.biggestChallenge}
                            onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                            className="bg-[#1f2937] border-gray-700 text-white min-h-[100px] focus-visible:ring-[#10b981]"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-6 text-lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Activating...
                            </>
                        ) : (
                            "Activate My Pass 🚀"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OnboardingModal;
