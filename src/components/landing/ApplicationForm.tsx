import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { v4 as uuidv4 } from 'uuid';

export const roleConfig: Record<string, { offerLabel: string; offerPlaceholder: string; seekLabel: string; seekPlaceholder: string }> = {
  founder: {
    offerLabel: "What is your current Superpower?",
    offerPlaceholder: "Ex: Growth Hacking, Technical Product Building...",
    seekLabel: "What is your biggest obstacle today?",
    seekPlaceholder: "Ex: Seed Capital, Finding a CTO, Intros..."
  },
  investor: {
    offerLabel: "What is your 'Value Add' (besides the check)?",
    offerPlaceholder: "Ex: Retail Network, Operational Experience...",
    seekLabel: "What is your current Investment Thesis?",
    seekPlaceholder: "Ex: B2B SaaS Seed Stage, Fintech..."
  },
  partner: {
    offerLabel: "What unique resource or access do you bring?",
    offerPlaceholder: "Ex: AWS Credits, Office Space, Legal Advice...",
    seekLabel: "Who are you looking to partner with?",
    seekPlaceholder: "Ex: Series A Startups, New Funds..."
  },
  corporate: {
    offerLabel: "What Pilot/Contract opportunities do you offer?",
    offerPlaceholder: "Ex: Distribution Channels, Technical Validation...",
    seekLabel: "What innovation or solution are you hunting for?",
    seekPlaceholder: "Ex: Process Automation, AI for Customer Service..."
  },
  creative: {
    offerLabel: "What is your creative / technical magic?",
    offerPlaceholder: "Ex: High-level Branding, UX/UI, Storytelling...",
    seekLabel: "What kind of vision do you want to impact?",
    seekPlaceholder: "Ex: Visionary Founders, Social Impact Projects..."
  }
};

interface ApplicationFormProps {
  isInternal?: boolean;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  defaultOpen?: boolean;
}

const ApplicationForm = ({ isInternal = false, trigger, onSuccess, defaultOpen = false }: ApplicationFormProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = internalOpen;
  const setOpen = setInternalOpen;

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    position: "",
    linkedin: "",
    projectCompany: "",
    phone: "",
    email: "",
    superpower: "",
    biggestChallenge: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Skip validation if internal
    if (!isInternal) {
      if (
        !formData.name ||
        !formData.role ||
        !formData.position ||
        !formData.linkedin ||
        !formData.projectCompany ||
        !formData.phone ||
        !formData.email
      ) {
        toast({
          title: "Please fill all fields",
          description: "All fields are required to submit your application.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role || "Unknown",
      positionRole: formData.position,
      linkedin: formData.linkedin,
      projectCompany: formData.projectCompany,
      superpower: formData.superpower,
      biggestChallenge: formData.biggestChallenge,
      status: isInternal ? "pending_venue" : "new",
      source: isInternal ? "admin_crm" : "Web",
      inviteToken: isInternal ? uuidv4() : null,
      notes: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("Submitting Payload:", payload);

    try {
      await addDoc(collection(db, "applications"), payload);

      toast({
        title: isInternal ? "VIP Added" : "Application Received",
        description: isInternal ? "The user has been added to the priority list." : "We'll review your application and be in touch within 48 hours.",
      });

      setFormData({
        name: "",
        role: "",
        position: "",
        linkedin: "",
        projectCompany: "",
        phone: "",
        email: "",
        superpower: "",
        biggestChallenge: ""
      });
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoleConfig = formData.role ? roleConfig[formData.role] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="hero" size="xl" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 rounded-full font-medium px-8 py-6 text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
            Apply for January Cohort
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isInternal ? "Add VIP to List" : "Apply for Access"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">I am a... {isInternal ? "(Optional)" : ""}</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentRoleConfig && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/30 p-4 rounded-lg border border-dashed border-muted-foreground/20">
              <p className="text-xs text-muted-foreground italic mb-2">
                * These questions help us match you with the right opportunities and members in the community.
              </p>

              <div className="space-y-2">
                <Label htmlFor="superpower" className="text-primary font-medium">{currentRoleConfig.offerLabel}</Label>
                <Textarea
                  id="superpower"
                  placeholder={currentRoleConfig.offerPlaceholder}
                  value={formData.superpower}
                  onChange={(e) => setFormData({ ...formData, superpower: e.target.value })}
                  className="bg-background border-border min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biggestChallenge" className="text-primary font-medium">{currentRoleConfig.seekLabel}</Label>
                <Textarea
                  id="biggestChallenge"
                  placeholder={currentRoleConfig.seekPlaceholder}
                  value={formData.biggestChallenge}
                  onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                  className="bg-background border-border min-h-[80px]"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="position">Position / Role Title {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="position"
              placeholder="CEO, Founder, Investor..."
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectCompany">Project / Company Name {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="projectCompany"
              placeholder="My Startup Inc."
              value={formData.projectCompany}
              onChange={(e) => setFormData({ ...formData, projectCompany: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile / Name {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="linkedin"
              placeholder="linkedin.com/in/johndoe or John Doe"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email {isInternal ? "(Optional)" : ""}</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background border-border"
            />
          </div>



          <Button type="submit" variant="hero" size="lg" className="w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : (isInternal ? "Add to CRM" : "Submit Application")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationForm;
