// components/dashboard/StatsCards.tsx
import { FaProjectDiagram, FaGraduationCap, FaUsers, FaEnvelope } from "react-icons/fa";

interface StatsCardsProps {
  projects: number;
  trainings: number;
  users: number;
  subscribers: number;
}

export default function StatsCards({ projects, trainings, users, subscribers }: StatsCardsProps) {
  const stats = [
    {
      label: "Projets",
      value: projects,
      icon: FaProjectDiagram,
      color: "bg-blue-50 text-[#1E3A8A]",
      bg: "hover:bg-blue-50"
    },
    {
      label: "Formations",
      value: trainings,
      icon: FaGraduationCap,
      color: "bg-orange-50 text-[#F97316]",
      bg: "hover:bg-orange-50"
    },
    {
      label: "Utilisateurs",
      value: users,
      icon: FaUsers,
      color: "bg-purple-50 text-purple-600",
      bg: "hover:bg-purple-50"
    },
    {
      label: "Abonnés",
      value: subscribers,
      icon: FaEnvelope,
      color: "bg-green-50 text-[#10B981]",
      bg: "hover:bg-green-50"
    },
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl bg-white p-6 shadow-sm border border-slate-100 transition ${stat.bg}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`rounded-full ${stat.color} p-3`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}