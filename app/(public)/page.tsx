// app/(public)/page.tsx (version avec diagnostic)
import { supabase } from '@/lib/supabase';
import Hero from "@/components/public/sections/Hero";
import OurSolutions from "@/components/public/sections/OurSolutions";
import Training from "@/components/public/sections/Training";
import Stats from "@/components/public/sections/Stats";
import OurValues from "@/components/public/sections/OurValues";
import TechStack from "@/components/public/sections/TechStack";
import Partners from "@/components/public/sections/Partners";
import ProjectsGrid from "@/components/public/sections/ProjectsGrid";
import Newsletter from "@/components/public/sections/Newsletter";

async function getCollaborations() {
  try {
    console.log('🔍 1. Tentative de récupération des collaborations...');
    console.log('📡 URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // ✅ Test simple : compter les collaborations
    const { count, error: countError } = await supabase
      .from('collaborations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage:', countError);
      return [];
    }

    console.log(`📊 2. Nombre total de collaborations: ${count}`);

    // ✅ Récupérer toutes les collaborations (sans filtre pour tester)
    const { data: allData, error: allError } = await supabase
      .from('collaborations')
      .select('*');

    if (allError) {
      console.error('❌ Erreur récupération toutes:', allError);
      return [];
    }

    console.log(`📊 3. Toutes les collaborations: ${allData?.length || 0}`);
    console.log('📦 Données brutes:', allData);

    // ✅ Récupérer les collaborations actives
    const { data: activeData, error: activeError } = await supabase
      .from('collaborations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error('❌ Erreur récupération actives:', activeError);
      return [];
    }

    console.log(`✅ 4. Collaborations actives: ${activeData?.length || 0}`);
    console.log('📦 Données actives:', activeData);

    return activeData || [];
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return [];
  }
}

async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur projets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erreur projets:', error);
    return [];
  }
}

export default async function HomePage() {
  console.log('🚀 Démarrage de la page...');
  
  const [projects, collaborations] = await Promise.all([
    getProjects(),
    getCollaborations()
  ]);

  console.log('📊 Résultat final:');
  console.log(`  - Projets: ${projects.length}`);
  console.log(`  - Collaborations: ${collaborations.length}`);

  return (
    <>
      <Hero />
      <OurSolutions />
      <Training />
      <Stats />
      <OurValues />
      <TechStack />
      <Partners initialCollaborations={collaborations} />
      <ProjectsGrid projects={projects || []} limit={3} />
      <Newsletter />
    </>
  );
}