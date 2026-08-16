// app/(public)/page.tsx
import { supabase } from '@/lib/supabase';
import Hero from "@/components/public/sections/Hero";
import OurServices from "@/components/public/sections/OurServices";
import OurSolutions from "@/components/public/sections/OurSolutions";
import Training from "@/components/public/sections/Training";
import Stats from "@/components/public/sections/Stats";
import OurValues from "@/components/public/sections/OurValues";
import TechStack from "@/components/public/sections/TechStack";
import Partners from "@/components/public/sections/Partners";
import ProjectsGrid from "@/components/public/sections/ProjectsGrid";
import Newsletter from "@/components/public/sections/Newsletter";

// ✅ Récupérer les projets pour la page d'accueil
async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(6); // Récupérer un peu plus pour le "Voir plus"

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement projets:', error);
    return [];
  }
}

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <>
      <Hero />
      <OurServices limit={4} />
      <OurSolutions limit={4} />
      <Training limit={4} />
      <Stats />
      <OurValues />
      <TechStack />
      <Partners />
      <ProjectsGrid initialProjects={projects} limit={3} />
      <Newsletter />
    </>
  );
}