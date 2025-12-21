import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const revenueOptions = [
  { value: "pre-revenue", label: "Pre-Revenue" },
  { value: "10k-100k", label: "$10k - $100k / año" },
  { value: "100k-1m", label: "$100k - $1M / año" },
  { value: "1m-plus", label: "$1M+ / año" },
];

const ApplicationForm = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    revenueRange: "",
    phone: "",
    email: "",
    linkedin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.position || !formData.revenueRange || !formData.phone || !formData.email || !formData.linkedin) {
      toast({
        title: "Please fill all fields",
        description: "All fields are required to submit your application.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send application");
      }

      toast({
        title: "Application Received",
        description: "We'll review your application and be in touch within 48 hours.",
      });

      setFormData({
        name: "",
        position: "",
        revenueRange: "",
        phone: "",
        email: "",
        linkedin: "",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="xl" className="w-full sm:w-auto">
          Apply for Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Apply for Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position / Role</Label>
            <Input
              id="position"
              placeholder="CEO, Founder, Investor..."
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile / Name</Label>
            <Input
              id="linkedin"
              placeholder="linkedin.com/in/johndoe or John Doe"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-3">
            <Label>Current Revenue Range</Label>
            <RadioGroup
              value={formData.revenueRange}
              onValueChange={(value) => setFormData({ ...formData, revenueRange: value })}
              className="space-y-2"
            >
              {revenueOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
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
            <Label htmlFor="email">Email</Label>
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
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationForm;
