import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";

interface Application {
    id: string;
    status: string;
    createdAt: any;
}

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        accepted: 0,
        pending: 0,
        new: 0,
        rejected: 0,
        review: 0,
        thisWeek: 0,
        lastWeek: 0,
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const apps = snapshot.docs.map(doc => doc.data()) as Application[];

            const total = apps.length;
            const accepted = apps.filter(a => a.status === "accepted").length;
            const pending = apps.filter(a => a.status === "pending").length;
            const newApps = apps.filter(a => a.status === "new").length;
            const rejected = apps.filter(a => a.status === "rejected").length;
            const review = apps.filter(a => a.status === "review").length;

            // Weekly Growth Logic
            const now = new Date();
            const oneWeekAgo = subDays(now, 7);
            const twoWeeksAgo = subDays(now, 14);

            const thisWeekCount = apps.filter(a => {
                const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
                return isAfter(date, oneWeekAgo);
            }).length;

            const lastWeekCount = apps.filter(a => {
                const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
                return isAfter(date, twoWeeksAgo) && !isAfter(date, oneWeekAgo);
            }).length;

            setStats({
                total,
                accepted,
                pending,
                new: newApps,
                rejected,
                review,
                thisWeek: thisWeekCount,
                lastWeek: lastWeekCount
            });

            // Chart Data
            setChartData([
                { name: "New", value: newApps, color: "#3b82f6" },
                { name: "Pending", value: pending, color: "#9ca3af" },
                { name: "Review", value: review, color: "#eab308" },
                { name: "Accepted", value: accepted, color: "#22c55e" },
                { name: "Rejected", value: rejected, color: "#ef4444" },
            ]);

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const growthPercentage = stats.lastWeek === 0
        ? (stats.thisWeek > 0 ? 100 : 0)
        : Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100);

    if (loading) return <div className="p-8">Loading stats...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            All time applications
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accepted Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.accepted}</div>
                        <p className="text-xs text-muted-foreground">
                            {((stats.accepted / stats.total) * 100 || 0).toFixed(1)}% acceptance rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending + stats.new + stats.review}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires action
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.thisWeek}</div>
                        <p className={`text-xs ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {growthPercentage > 0 ? '+' : ''}{growthPercentage}% from last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Application Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats / Breakdown */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {chartData.map((item) => (
                                <div key={item.name} className="flex items-center">
                                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                    <div className="flex-1 font-medium text-sm">{item.name}</div>
                                    <div className="font-bold">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
