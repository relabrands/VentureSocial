import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Linkedin, X, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FounderPass from "./FounderPass";

interface Member {
    id: string;
    memberId?: string;
    fullName: string;
    projectCompany: string;
    linkedin?: string;
    role?: string;
    positionRole?: string;
}

interface Recommendation {
    matchUid: string;
    score: number;
    reason: string;
    icebreaker: string;
}

interface MemberDirectoryProps {
    currentMemberId?: string;
    recommendations?: Recommendation[];
    liveMode?: boolean;
}

const MemberDirectory = ({ currentMemberId, recommendations = [], liveMode = false }: MemberDirectoryProps) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                // If Live Mode, we only want people marked as PRESENT
                // Note: Firestore query requires composite index if we do multiple where clauses + orderBy
                // For simplicity/speed without index issues, we might filter client side if list is small (<100)
                // Or try to query simply.
                // Let's query accepted first, then filter client side for maximum compatibility without deploying indexes mid-session

                const q = query(
                    collection(db, "applications"),
                    where("status", "==", "accepted"),
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(q);
                let data = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Member & { attendance_status?: string }))
                    .filter(m => m.memberId !== currentMemberId); // Exclude self

                // LIVE MODE FILTER
                if (liveMode) {
                    data = data.filter(m => m.attendance_status === 'PRESENT');
                }

                // Sort by Match Score if recommendations exist
                if (recommendations.length > 0) {
                    data = data.sort((a, b) => {
                        const scoreA = recommendations.find(r => r.matchUid === a.id)?.score || 0;
                        const scoreB = recommendations.find(r => r.matchUid === b.id)?.score || 0;
                        return scoreB - scoreA; // Descending order
                    });
                }

                setMembers(data);
            } catch (error) {
                console.error("Error fetching directory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [currentMemberId, recommendations, liveMode]);

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading The Room...</div>;
    }

    const getMatchInfo = (memberId: string) => {
        return recommendations.find(r => r.matchUid === memberId);
    };

    return (
        <div className="w-full max-w-[320px] mx-auto mt-12 pb-20">
            <div className="mb-6">
                <h3 className="text-xs font-extrabold tracking-[2px] uppercase text-[#9ca3af] mb-1">
                    {liveMode ? (
                        <span className="text-red-500 animate-pulse flex items-center gap-1">
                            ● LIVE ROOM
                        </span>
                    ) : (
                        "The Cohort - Jan 2026"
                    )}
                </h3>
                <h2 className="text-2xl font-bold text-white">
                    {liveMode ? `${members.length} Checked In` : `${members.length} Founders Selected`}
                </h2>
                {liveMode && members.length === 0 && (
                    <p className="text-gray-500 text-sm mt-2">
                        No one has checked in yet. Be the first!
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {members.map((member) => {
                    const match = getMatchInfo(member.id);
                    const isMatch = !!match;

                    return (
                        <div
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
                                ${isMatch
                                    ? 'bg-[#111827] border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-yellow-500'
                                    : 'bg-[#111827] border-[#1f2937] hover:bg-[#1f2937]'
                                }
                            `}
                        >
                            {/* Smart Match Badge */}
                            {isMatch && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                    🔥 Smart Match
                                </div>
                            )}

                            {/* Avatar / Initial */}
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shadow-lg shrink-0
                                ${isMatch
                                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600 ring-2 ring-yellow-500/30'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                                }
                            `}>
                                {member.fullName.charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">{member.fullName}</h4>
                                <p className="text-[#9ca3af] text-xs truncate">
                                    {member.positionRole || member.role ? `${member.positionRole || member.role} @ ` : ''}{member.projectCompany}
                                </p>
                                {isMatch && (
                                    <p className="text-yellow-500/90 text-[10px] mt-1 italic truncate">
                                        💡 {match.reason}
                                    </p>
                                )}
                                {liveMode && (member as any).how_to_spot_me && (
                                    <p className="text-purple-400/90 text-[10px] mt-1 italic truncate flex items-center gap-1">
                                        <Eye className="h-3 w-3" /> {(member as any).how_to_spot_me}
                                    </p>
                                )}
                            </div>

                            {/* Action Icon */}
                            {!isMatch && member.linkedin && (
                                <div className="h-8 w-8 flex items-center justify-center text-gray-600 group-hover:text-white transition-colors">
                                    <Linkedin className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="bg-transparent border-none shadow-none p-0 flex items-center justify-center max-w-fit" aria-describedby="member-dialog-description">
                    <div className="sr-only" id="member-dialog-title">Member Details</div>
                    <div className="sr-only" id="member-dialog-description">Details for {selectedMember?.fullName}</div>
                    {selectedMember && (
                        <div className="relative">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="absolute -top-4 -right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <FounderPass
                                name={selectedMember.fullName}
                                memberId={selectedMember.memberId || "PENDING"}
                                company={`@${selectedMember.projectCompany}`}
                                role={selectedMember.role || "FOUNDER"}
                                positionRole={selectedMember.positionRole}
                                variant="directory"
                                shareUrl={selectedMember.linkedin}
                                shareText={`Check out ${selectedMember.fullName} from Venture Social!`}
                                matchScore={getMatchInfo(selectedMember.id)?.score}
                                matchReason={getMatchInfo(selectedMember.id)?.reason}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MemberDirectory;
