import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2 } from "lucide-react";

interface Perk {
    id: string;
    title: string;
    description: string;
    status: "active" | "coming_soon";
    link: string;
    color: string;
}

const Perks = () => {
    const [perks, setPerks] = useState<Perk[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerks = async () => {
            try {
                const docRef = doc(db, "config", "perks");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPerks(data.items || []);
                } else {
                    // Fallback if no config exists yet
                    setPerks([]);
                }
            } catch (error) {
                console.error("Error fetching perks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPerks();
    }, []);

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#10b981]" /></div>;
    }

    return (
        <div className="w-full max-w-md space-y-6 pb-24">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Member Perks 🎁</h2>
                <p className="text-gray-400 text-sm">Exclusive benefits for Venture Social members.</p>
            </div>

            <div className="grid gap-4">
                {perks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-gray-800 rounded-lg border-dashed">
                        No perks available at the moment.
                    </div>
                ) : (
                    perks.map((perk) => (
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
                                {perk.status === "active" && perk.link && perk.link !== "#" && (
                                    <div className="mt-4 flex justify-end">
                                        <a
                                            href={perk.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-[#10b981] hover:text-[#34d399] flex items-center gap-1 font-medium"
                                        >
                                            Claim Benefit <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Perks;
