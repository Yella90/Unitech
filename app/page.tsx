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

// ✅ Récupérer les formations
async function getTrainings() {
  try {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur chargement formations:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement formations:', error);
    return [];
  }
}

// ✅ Récupérer les projets
async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur chargement projets:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement projets:', error);
    return [];
  }
}

export default async function HomePage() {
  // ✅ Charger les données en parallèle
  const [trainings, projects] = await Promise.all([
    getTrainings(),
    getProjects()
  ]);

  return (
    <>
      <Hero />
      <OurServices limit={3} />
      <OurSolutions limit={3} />
      <Training limit={3} initialTrainings={trainings} />
      <Stats />
      <OurValues />
      <TechStack />
      <Partners />
      <ProjectsGrid limit={3} initialProjects={projects} />
      <Newsletter />
    </>
  );
}