// app/(public)/page.tsx
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

export default async function HomePage() {
  console.log('🔍 Tentative de connexion à Supabase...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...');

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erreur Supabase:', error);
  } else {
    console.log('✅ Projets chargés:', projects?.length || 0);
    console.log('📦 Données:', projects);
  }

  return (
    <>
      <Hero />
      <OurSolutions />
      <Training />
      <Stats />
      <OurValues />
      <TechStack />
      <Partners />
      <ProjectsGrid projects={projects || []} limit={3} />
      <Newsletter />
    </>
  );
}