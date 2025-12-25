import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const Perks = () => {
    const perks = [
        {
            id: "barna",
            title: "Barna Management School",
            description: "15% Off en Programas Ejecutivos 2026",
            status: "active",
            link: "#", // Placeholder or specific link if available
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

    return (
        <div className="w-full max-w-md space-y-6 pb-24">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Member Perks 🎁</h2>
                <p className="text-gray-400 text-sm">Exclusive benefits for Venture Social members.</p>
            </div>

            <div className="grid gap-4">
                {perks.map((perk) => (
                    <Card key={perk.id} className="bg-[#111827] border-gray-800 overflow-hidden relative group hover:border-gray-700 transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${perk.color}`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-white">{perk.title}</CardTitle>
                                {perk.status === "active" ? (
                                    <Badge className="bg-[#10b981] hover:bg-[#059669] text-white border-0">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-700">
                                        Coming Soon
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-300 font-medium">{perk.description}</p>
                            {perk.status === "active" && (
                                <div className="mt-4 flex justify-end">
                                    <a
                                        href={perk.link}
                                        className="text-sm text-[#10b981] hover:text-[#34d399] flex items-center gap-1 font-medium"
                                    >
                                        Claim Benefit <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Perks;
