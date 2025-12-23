import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Users, FileText, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useVenueMode } from "@/hooks/useVenueMode";

interface Application {
    id: string;
    status: string;
    createdAt: any;
    revenueRange?: string;
    role?: string;
    city?: string;
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
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [roleData, setRoleData] = useState<any[]>([]);
    const [cityData, setCityData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isVenueMode, toggleVenueMode } = useVenueMode();

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

            // Status Chart Data
            setChartData([
                { name: "New", value: newApps, color: "#3b82f6" },
                { name: "Pending", value: pending, color: "#9ca3af" },
                { name: "Review", value: review, color: "#eab308" },
                { name: "Accepted", value: accepted, color: "#22c55e" },
                { name: "Rejected", value: rejected, color: "#ef4444" },
            ]);

            // --- Real Data Aggregation ---

            // 1. Revenue Range (Stage)
            const revenueCounts: Record<string, number> = {};
            apps.forEach(app => {
                const range = app.revenueRange || "Unknown";
                revenueCounts[range] = (revenueCounts[range] || 0) + 1;
            });
            const revenueChart = Object.keys(revenueCounts).map((key, index) => ({
                name: key === "pre-revenue" ? "Pre-Revenue" : key,
                value: revenueCounts[key],
                color: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"][index % 4]
            }));
            setRevenueData(revenueChart);

            // 2. Roles
            const roleCounts: Record<string, number> = {};
            apps.forEach(app => {
                const role = app.role ? app.role.charAt(0).toUpperCase() + app.role.slice(1) : "Unknown";
                roleCounts[role] = (roleCounts[role] || 0) + 1;
            });
            const roleChart = Object.keys(roleCounts).map((key, index) => ({
                name: key,
                value: roleCounts[key],
                color: ["#ec4899", "#8b5cf6", "#14b8a6", "#f97316"][index % 4]
            }));
            setRoleData(roleChart);

            // 3. Cities
            const cityCounts: Record<string, number> = {};
            apps.forEach(app => {
                const city = app.city || "Unknown";
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });
            const cityChart = Object.keys(cityCounts).map((key, index) => ({
                name: key,
                value: cityCounts[key],
                color: ["#06b6d4", "#f43f5e", "#84cc16", "#e11d48"][index % 4]
            })).slice(0, 5); // Top 5 cities
            setCityData(cityChart);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm">
                    <Zap className={`h-4 w-4 ${isVenueMode ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                    <Label htmlFor="venue-mode" className="text-sm font-medium cursor-pointer">
                        Activate Venue Partner: Barna
                    </Label>
                    <Switch
                        id="venue-mode"
                        checked={isVenueMode}
                        onCheckedChange={toggleVenueMode}
                    />
                </div>
            </div>

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

            {/* Talent Heatmap Section (Real Data) */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Talent Heatmap (Real Data) 📊</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Revenue/Stage Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Revenue Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {revenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Applicant Roles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={roleData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {roleData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* City Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Top Cities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cityData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                            {cityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
