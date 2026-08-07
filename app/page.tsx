// app/page.tsx
import { getAllProjects } from "@/lib/data";
import Hero from "@/components/sections/Hero";
import OurSolutions from "@/components/sections/OurSolutions";
import Training from "@/components/sections/Training";
import Stats from "@/components/sections/Stats";
import OurValues from "@/components/sections/OurValues";
import TechStack from "@/components/sections/TechStack";
import Partners from "@/components/sections/Partners";
import ProjectsGrid from "@/components/sections/ProjectsGrid";
import Newsletter from "@/components/sections/Newsletter";
import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  // Récupérer les projets depuis Supabase
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur Supabase:', error);
  }
  return (
    <>
      <Hero />
      <OurSolutions />
      <Training />          {/* ← Nouvelle section */}
      <Stats />
      <OurValues />
      <TechStack />
      <Partners />
       <ProjectsGrid projects={projects || []} />
      <Newsletter />
    </>
  );
}