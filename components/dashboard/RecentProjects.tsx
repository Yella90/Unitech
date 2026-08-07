// components/dashboard/RecentProjects.tsx
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FaProjectDiagram, FaClock } from "react-icons/fa";

export default async function RecentProjects() {
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1E3A8A] flex items-center gap-2">
            <FaProjectDiagram className="h-5 w-5 text-[#F97316]" />
            Projets récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Aucun projet récent</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1E3A8A] flex items-center gap-2">
          <FaProjectDiagram className="h-5 w-5 text-[#F97316]" />
          Projets récents
          <span className="ml-auto text-xs font-normal text-slate-400 flex items-center gap-1">
            <FaClock className="h-3 w-3" />
            Derniers ajouts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{project.icon}</span>
                <span className="font-medium text-sm">{project.name}</span>
              </div>
              <span className="text-sm font-medium text-[#1E3A8A]">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}