// components/projects/ProjectCard.tsx
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

const colorMap = {
  blue: {
    border: 'border-blue-200',
    text: 'text-[#1E3A8A]',
    progress: 'bg-[#1E3A8A]',
    hover: 'hover:border-[#1E3A8A]',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  orange: {
    border: 'border-orange-200',
    text: 'text-[#F97316]',
    progress: 'bg-[#F97316]',
    hover: 'hover:border-[#F97316]',
    badge: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  green: {
    border: 'border-green-200',
    text: 'text-[#10B981]',
    progress: 'bg-[#10B981]',
    hover: 'hover:border-[#10B981]',
    badge: 'bg-green-100 text-green-700 border-green-200'
  }
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'planning': { label: 'Planification', variant: 'secondary' },
  'in-progress': { label: 'En cours', variant: 'default' },
  'testing': { label: 'En test', variant: 'outline' },
  'pending': { label: 'En attente', variant: 'secondary' },
  'completed': { label: 'Terminé', variant: 'default' },
  'on-hold': { label: 'En pause', variant: 'destructive' }
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const colors = colorMap[project.color] || colorMap.blue;
  const status = statusMap[project.status] || statusMap['planning'];

  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className={`group h-full transition-all hover:-translate-y-1 hover:shadow-xl border-2 ${colors.border} ${colors.hover}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <span className="text-4xl">{project.icon}</span>
          <Badge variant={status.variant}>
            {status.label}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className={`text-xl font-bold ${colors.text}`}>
              {project.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {project.description}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-500">Progression</span>
              <span className={`font-bold ${colors.text}`}>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2.5" />
          </div>

          {project.nextMilestone && (
            <p className="text-xs text-slate-500">
              🚀 {project.nextMilestone}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center text-sm font-semibold text-[#F97316] group-hover:underline">
            En savoir plus
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}