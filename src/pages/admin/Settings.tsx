import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVenueMode } from "@/hooks/useVenueMode";
import { useGatekeeperMode } from "@/hooks/useGatekeeperMode";
import { Settings as SettingsIcon, Zap, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
    const { isVenueMode, toggleVenueMode, venueLogoUrl, venueTitle, updateVenueConfig } = useVenueMode();
    const { isGatekeeperEnabled, toggleGatekeeperMode } = useGatekeeperMode();
    
    // Local state for the config form
    const [localVenueTitle, setLocalVenueTitle] = useState("");
    const [localVenueLogoUrl, setLocalVenueLogoUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Sync from global config on mount / update
    useEffect(() => {
        setLocalVenueTitle(venueTitle);
        setLocalVenueLogoUrl(venueLogoUrl);
    }, [venueTitle, venueLogoUrl]);

    const handleSaveVenueConfig = async () => {
        setIsSaving(true);
        try {
            await updateVenueConfig(localVenueLogoUrl, localVenueTitle);
            toast.success("Venue configuration saved successfully.");
        } catch (error) {
            toast.error("Failed to save venue configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage global configurations and features.</p>
                </div>
            </div>

            <div className="grid gap-6">
                
                {/* Gatekeeper Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            Secure Pass (Gatekeeper)
                        </CardTitle>
                        <CardDescription>
                            Enable strict security checks for the Founder Pass (requires exact matching and validation).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 bg-muted/50 p-4 rounded-lg border">
                            <Switch
                                id="gatekeeper-mode"
                                checked={isGatekeeperEnabled}
                                onCheckedChange={toggleGatekeeperMode}
                            />
                            <Label htmlFor="gatekeeper-mode" className="text-base font-medium cursor-pointer">
                                {isGatekeeperEnabled ? "Enabled" : "Disabled"}
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Venue Partner Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Venue Partner Mode
                        </CardTitle>
                        <CardDescription>
                            Customize how the pass looks during partnered events. This will replace the default footer with the partner's logo and title.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2 bg-muted/50 p-4 rounded-lg border">
                            <Switch
                                id="venue-mode"
                                checked={isVenueMode}
                                onCheckedChange={toggleVenueMode}
                            />
                            <Label htmlFor="venue-mode" className="text-base font-medium cursor-pointer">
                                {isVenueMode ? "Venue Mode is Active" : "Venue Mode is Inactive"}
                            </Label>
                        </div>

                        {/* Configuration Form */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid gap-2">
                                <Label htmlFor="venue-title">Venue Title (e.g., "Official Venue", "Partner Oficial")</Label>
                                <Input 
                                    id="venue-title" 
                                    value={localVenueTitle}
                                    onChange={(e) => setLocalVenueTitle(e.target.value)}
                                    placeholder="Official Venue"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="venue-logo">Venue Logo URL (PNG/SVG transparent recommended)</Label>
                                <Input 
                                    id="venue-logo" 
                                    value={localVenueLogoUrl}
                                    onChange={(e) => setLocalVenueLogoUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                {localVenueLogoUrl && (
                                    <div className="mt-2 p-4 bg-black/5 rounded-lg border inline-block">
                                        <img 
                                            src={localVenueLogoUrl} 
                                            alt="Preview" 
                                            className="h-12 object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button onClick={handleSaveVenueConfig} disabled={isSaving} className="w-full sm:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                Save Configuration
                            </Button>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default Settings;
