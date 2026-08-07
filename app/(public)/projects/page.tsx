// app/(public)/projects/page.tsx
import { supabase } from '@/lib/supabase';
import ProjectCard from "@/components/public/projects/ProjectCard";

export const metadata = {
  title: "Projets - UNITECH",
  description: "Découvrez tous les projets UNITECH en développement.",
};

export default async function ProjectsPage() {
  // ✅ Récupérer tous les projets depuis Supabase
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur Supabase:', error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-4xl font-black text-[#1E3A8A]">Tous nos projets</h1>
      <p className="mt-2 text-slate-600">
        Découvrez l'ensemble de nos solutions en développement.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(projects || []).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}