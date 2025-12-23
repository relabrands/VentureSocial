import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Linkedin } from "lucide-react";

interface Member {
    id: string;
    memberId?: string;
    fullName: string;
    projectCompany: string;
    linkedin?: string;
    role?: string;
}

interface MemberDirectoryProps {
    currentMemberId?: string;
}

const MemberDirectory = ({ currentMemberId }: MemberDirectoryProps) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const q = query(
                    collection(db, "applications"),
                    where("status", "==", "accepted"),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Member))
                    .filter(m => m.memberId !== currentMemberId); // Exclude self

                setMembers(data);
            } catch (error) {
                console.error("Error fetching directory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [currentMemberId]);

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading The Room...</div>;
    }

    return (
        <div className="w-full max-w-[320px] mx-auto mt-12 pb-20">
            <div className="mb-6">
                <h3 className="text-xs font-extrabold tracking-[2px] uppercase text-[#9ca3af] mb-1">The Cohort - Jan 2026</h3>
                <h2 className="text-2xl font-bold text-white">{members.length} Founders Selected</h2>
            </div>

            <div className="space-y-1">
                {members.map((member) => (
                    <div key={member.id} className="flex items-center p-3 bg-[#111827] rounded-xl border border-[#1f2937] hover:bg-[#1f2937] transition-colors">
                        {/* Avatar / Initial */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-lg shrink-0">
                            {member.fullName.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{member.fullName}</h4>
                            <p className="text-[#9ca3af] text-xs truncate">
                                {member.role ? `${member.role} @ ` : ''}{member.projectCompany}
                            </p>
                        </div>

                        {/* Action */}
                        {member.linkedin && (
                            <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-8 flex items-center justify-center text-[#0077b5] hover:bg-[#0077b5]/10 rounded-full transition-colors"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemberDirectory;
