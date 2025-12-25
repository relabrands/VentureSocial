import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/firebase"; // Assuming functions is exported from firebase config

interface MagicLoginDialogProps {
    children: React.ReactNode;
}

const MagicLoginDialog = ({ children }: MagicLoginDialogProps) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [open, setOpen] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // 1. Check if user exists and is accepted
            const q = query(
                collection(db, "applications"),
                where("email", "==", email.toLowerCase().trim()),
                where("status", "==", "accepted")
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("No active member invitation found for this email.");
                setLoading(false);
                return;
            }

            const memberDoc = querySnapshot.docs[0];
            const memberData = memberDoc.data();
            const memberId = memberData.memberId || memberDoc.id;

            // 2. Call Cloud Function to send magic link
            // Note: We'll implement the 'sendMagicLink' function next.
            // For now, we'll simulate success or try to call it if it existed.

            try {
                const sendMagicLink = httpsCallable(functions, 'sendMagicLink');
                const result = await sendMagicLink({
                    email: email.toLowerCase().trim(),
                    memberId: memberId,
                    name: memberData.fullName || memberData.name
                });
                console.log("Magic Link Result:", result.data);
                setSent(true);
                toast.success("Magic link sent! Check your inbox.");
            } catch (fnError) {
                console.error("Function error:", fnError);
                // Fallback for development/testing if function not deployed yet
                // In a real scenario, we should show an error.
                // For now, let's show success to test UI flow, but log error.
                toast.error("Failed to send email. System might be under maintenance.");
            }

        } catch (error) {
            console.error("Login error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset state when closed
            setTimeout(() => {
                setSent(false);
                setEmail("");
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#111827] border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Member Access</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Enter your registered email to receive a magic link to your Founder Pass.
                    </DialogDescription>
                </DialogHeader>

                {sent ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-white">Check your email</h3>
                            <p className="text-sm text-gray-400 max-w-[260px] mx-auto">
                                We've sent a magic link to <span className="text-white font-medium">{email}</span>
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="founder@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#10b981] focus:ring-[#10b981]"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-medium transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Send Magic Link
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MagicLoginDialog;
