// app/(public)/projects/[slug]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Newsletter from '@/components/public/sections/Newsletter';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectGallery from '@/components/public/projects/ProjectGallery';
import { 
  FaCheckCircle, 
  FaClock, 
  FaCode, 
  FaDatabase, 
  FaServer, 
  FaCog, 
  FaGlobe, 
  FaArrowRight 
} from 'react-icons/fa';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'planning': { label: 'Planification', variant: 'secondary' },
  'in-progress': { label: 'En cours', variant: 'default' },
  'testing': { label: 'En test', variant: 'outline' },
  'pending': { label: 'En attente', variant: 'secondary' },
  'completed': { label: 'Terminé', variant: 'default' },
  'on-hold': { label: 'En pause', variant: 'destructive' }
};

const statusIconMap: Record<string, React.ReactNode> = {
  'completed': <FaCheckCircle className="h-4 w-4 text-green-500" />,
  'in-progress': <FaClock className="h-4 w-4 text-blue-500" />,
  'pending': <FaClock className="h-4 w-4 text-slate-400" />
};

const techIconMap: Record<string, React.ReactNode> = {
  'frontend': <FaGlobe className="h-4 w-4" />,
  'backend': <FaServer className="h-4 w-4" />,
  'database': <FaDatabase className="h-4 w-4" />,
  'others': <FaCog className="h-4 w-4" />
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: stages } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  if (stages) {
    project.stages = stages;
  }

  const { data: relatedProjects } = await supabase
    .from('projects')
    .select('*')
    .neq('id', project.id)
    .limit(2);

  const status = statusMap[project.status] || statusMap['planning'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      {/* Hero du projet */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-8 text-white md:p-12">
        <div className="flex items-start gap-4 md:items-center">
          <span className="text-5xl md:text-6xl">{project.icon}</span>
          <div>
            <h1 className="text-3xl font-black md:text-4xl">{project.name}</h1>
            <p className="text-white/80">{project.description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[150px]">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Progression</span>
              <span className="font-bold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2.5 bg-white/20 [&>div]:bg-white" />
          </div>
          <Badge variant={status.variant} className="bg-white/20 text-white border-white/30">
            {status.label}
          </Badge>
          {project.next_milestone && (
            <span className="text-sm text-white/80">
              🚀 {project.next_milestone}
            </span>
          )}
        </div>
      </div>

      {/* Problème / Solution / Bénéfices */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {project.problem && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-red-700">⚠️ Problème</h3>
              <p className="mt-2 text-sm text-slate-600">{project.problem}</p>
            </CardContent>
          </Card>
        )}
        {project.solution && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-green-700">💡 Solution</h3>
              <p className="mt-2 text-sm text-slate-600">{project.solution}</p>
            </CardContent>
          </Card>
        )}
        {project.benefits && project.benefits.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-blue-700">🎯 Bénéfices</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {project.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <FaCheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Technologies */}
      {project.tech_stack && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#1E3A8A]">🔧 Technologies</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(project.tech_stack).map(([key, techs]) => {
              if (!techs || (techs as []).length === 0) return null;
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <h4 className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                      {techIconMap[key] || <FaCode className="h-4 w-4" />}
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {(techs as string[]).map((tech: string) => (
                        <li key={tech}>• {tech}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Étapes */}
      {project.stages && project.stages.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#1E3A8A]">📈 Avancement détaillé</h2>
          <div className="mt-4 space-y-3">
            {project.stages.map((stage: any) => (
              <div key={stage.id} className="flex items-center gap-4">
                <span className="w-40 text-sm font-medium text-slate-700">
                  {stage.name}
                </span>
                <div className="flex-1">
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2.5 rounded-full ${
                        stage.status === 'completed'
                          ? 'bg-green-500'
                          : stage.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-medium text-slate-600">
                  {stage.progress}%
                </span>
                <span className="text-sm">
                  {statusIconMap[stage.status] || (
                    <FaClock className="h-4 w-4 text-slate-400" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Galerie d'images */}
      {project.gallery && project.gallery.length > 0 && (
        <ProjectGallery images={project.gallery} projectName={project.name} />
      )}

      <Separator className="my-12" />

      {/* Projets similaires */}
      {relatedProjects && relatedProjects.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#1E3A8A]">
            Projets similaires
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {relatedProjects.map((related) => (
              <ProjectCard key={related.id} project={related} />
            ))}
          </div>
        </div>
      )}

      {/* Bouton retour */}
      <div className="mt-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-[#1E3A8A] hover:underline font-medium"
        >
          <FaArrowRight className="h-4 w-4 rotate-180" />
          Retour à la liste des projets
        </Link>
      </div>

      <Newsletter />
    </div>
  );
}