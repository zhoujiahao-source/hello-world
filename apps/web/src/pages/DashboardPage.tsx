import { StatusCards } from "../components/dashboard/StatusCards.js";
import { RecentRuns } from "../components/dashboard/RecentRuns.js";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-gray-100">Dashboard</h1>
      <StatusCards />
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Recent Runs</h2>
        <RecentRuns />
      </div>
    </div>
  );
}
