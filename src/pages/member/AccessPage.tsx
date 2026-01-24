import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/firebase/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const AccessPage = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const sendMemberCode = httpsCallable(functions, 'sendMemberCode');
            await sendMemberCode({ email });
            setStep('otp');
            toast.success("Access code sent! Check your email.");
        } catch (error: any) {
            console.error("Error sending code:", error);
            const message = error.message || "Failed to send code.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setLoading(true);
        try {
            const verifyMemberCode = httpsCallable(functions, 'verifyMemberCode');
            const result = await verifyMemberCode({ email, code });
            const { token, uid } = result.data as { token: string, uid: string };

            if (token) {
                await signInWithCustomToken(auth, token);
                toast.success("Welcome back!");
                // Store auth state for gatekeeper if needed locally, though firebase auth persists
                localStorage.setItem('vs_member_authenticated', 'true');
                navigate(`/pass/${uid}`);
            }
        } catch (error: any) {
            console.error("Error verifying code:", error);
            const message = error.message || "Invalid code.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <Helmet>
                <title>Member Access | Venture Social</title>
            </Helmet>

            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4">
                        <ShieldCheck className="w-6 h-6 text-purple-500" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Member Access
                    </h1>
                    <p className="text-sm text-gray-400">
                        {step === 'email'
                            ? "Enter your email to access your Founder Pass"
                            : `Enter the code sent to ${email}`
                        }
                    </p>
                </div>

                <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl">
                    {step === 'email' ? (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="founder@startup.com"
                                    className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-600 focus:ring-purple-500/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-gray-200 transition-all font-medium"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Send Access Code <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="space-y-2 flex flex-col items-center">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider w-full text-left">Access Code</label>
                                <div className="flex justify-center w-full">
                                    <InputOTP
                                        maxLength={6}
                                        value={code}
                                        onChange={(val) => setCode(val)}
                                        disabled={loading}
                                    >
                                        <InputOTPGroup className="gap-2">
                                            <InputOTPSlot index={0} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                            <InputOTPSlot index={1} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                            <InputOTPSlot index={2} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                            <InputOTPSlot index={3} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                            <InputOTPSlot index={4} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                            <InputOTPSlot index={5} className="w-10 h-12 border-gray-700 bg-gray-900/50 text-white" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-purple-600 text-white hover:bg-purple-700 transition-all font-medium shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] border border-purple-500/20"
                                disabled={loading || code.length < 6}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Unlock Pass <Lock className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="w-full text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                ← Try a different email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessPage;
