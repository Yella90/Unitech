// app/page.tsx
import { getAllProjects } from "@/lib/data";
import Hero from "@/components/sections/Hero";
import OurSolutions from "@/components/sections/OurSolutions";
import Training from "@/components/sections/Training";
import Stats from "@/components/sections/Stats";
import OurValues from "@/components/sections/OurValues";
import TechStack from "@/components/sections/TechStack";
import Partners from "@/components/public/sections/Partners";
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

  // ✅ Récupération des collaborations côté serveur
async function getCollaborations() {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération collaborations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erreur:', error);
    return [];
  }
}
const collaborations = await getCollaborations();

  return (
    <>
      <Hero />
      <OurSolutions />
      <Training />          {/* ← Nouvelle section */}
      <Stats />
      <OurValues />
      <TechStack />
       <Partners initialCollaborations={collaborations} />
       <ProjectsGrid projects={projects || []} />
      <Newsletter />
    </>
  );
}