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

// ✅ Récupérer les collaborations actives
async function getCollaborations() {
  try {
    const { data, error } = await supabase
      .from('collaborations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur chargement collaborations:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement collaborations:', error);
    return [];
  }
}

// ✅ Récupérer les services
async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(3);

    if (error) {
      console.error('❌ Erreur chargement services:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement services:', error);
    return [];
  }
}

// ✅ Récupérer les solutions
async function getSolutions() {
  try {
    const { data, error } = await supabase
      .from('solutions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(3);

    if (error) {
      console.error('❌ Erreur chargement solutions:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('❌ Erreur chargement solutions:', error);
    return [];
  }
}

// ✅ Récupérer les formations
async function getTrainings() {
  try {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

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
      .order('created_at', { ascending: false })
      .limit(3);

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
  // ✅ Charger toutes les données en parallèle
  const [services, solutions, trainings, projects, collaborations] = await Promise.all([
    getServices(),
    getSolutions(),
    getTrainings(),
    getProjects(),
    getCollaborations()
  ]);

  return (
    <>
      <Hero />
      <OurServices initialServices={services} limit={3} />
      <OurSolutions initialSolutions={solutions} limit={3} />
      <Training initialTrainings={trainings} limit={3} />
      <Stats />
      <OurValues />
      <TechStack />
      <Partners initialCollaborations={collaborations} limit={3} />
      <ProjectsGrid initialProjects={projects} limit={3} />
      <Newsletter />
    </>
  );
}