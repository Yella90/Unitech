// components/sections/ProjectsGrid.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/projects/ProjectCard";
import { Project } from "@/types";
import { ArrowRight } from "lucide-react";

interface ProjectsGridProps {
  projects: Project[];
  limit?: number;
}

export default function ProjectsGrid({ projects, limit }: ProjectsGridProps) {
  const displayProjects = limit ? projects.slice(0, limit) : projects;

  if (!projects || projects.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <p className="text-slate-500">Aucun projet disponible pour le moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Nos Projets en Développement
        </h2>
        <p className="mt-2 text-slate-600">
          Découvrez nos 3 solutions innovantes actuellement en phase de production.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button
          asChild
          variant="outline"
          className="border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white rounded-xl px-8 py-6 text-base"
        >
          <Link href="/projects">
            Voir tous les projets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}