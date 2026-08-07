// components/dashboard/QuickActions.tsx
import { Button } from "@/components/ui/button";
import { FaPlus, FaUserPlus, FaEnvelope } from "react-icons/fa";

interface QuickActionsProps {
  role: string;
}

export default function QuickActions({ role }: QuickActionsProps) {
  const isAdmin = ["super_admin", "admin"].includes(role);
  const isManager = ["project_manager", "team_lead"].includes(role);

  const actions = [
    {
      label: "Nouveau projet",
      icon: FaPlus,
      color: "bg-[#1E3A8A] hover:bg-[#1A2F6A]",
      href: "/admin/projects/new",
      show: isAdmin || isManager
    },
    {
      label: "Nouvelle formation",
      icon: FaPlus,
      color: "bg-[#F97316] hover:bg-[#ea580c]",
      href: "/admin/trainings/new",
      show: isAdmin
    },
    {
      label: "Ajouter utilisateur",
      icon: FaUserPlus,
      color: "bg-purple-600 hover:bg-purple-700",
      href: "/admin/users/new",
      show: isAdmin
    },
    {
      label: "Newsletter",
      icon: FaEnvelope,
      color: "bg-[#10B981] hover:bg-[#059669]",
      href: "/admin/subscribers",
      show: isAdmin
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  if (visibleActions.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {visibleActions.map((action) => (
        <Button
          key={action.label}
          className={`${action.color} text-white font-medium`}
          asChild
        >
          <a href={action.href}>
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </a>
        </Button>
      ))}
    </div>
  );
}