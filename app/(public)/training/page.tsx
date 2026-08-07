// app/(public)/training/page.tsx
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaArrowRight, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaGraduationCap, FaUsers, FaCertificate, FaChalkboardTeacher } from "react-icons/fa";
import Link from "next/link";

export const metadata = {
  title: "Formation - UNITECH",
  description: "UNITECH propose des formations théoriques et pratiques en technologie, développement, robotique et IA.",
};

const colorMap: Record<string, string> = {
  blue: "from-blue-50 to-blue-100 border-blue-200",
  orange: "from-orange-50 to-orange-100 border-orange-200",
  green: "from-green-50 to-green-100 border-green-200",
  purple: "from-purple-50 to-purple-100 border-purple-200",
  yellow: "from-yellow-50 to-yellow-100 border-yellow-200",
  red: "from-red-50 to-red-100 border-red-200",
};

export default async function TrainingPage() {
  // ✅ Récupérer les formations
  const { data: trainings, error } = await supabase
    .from("trainings")
    .select("*")
    .order("created_at", { ascending: true });

  // ✅ Afficher les formations même s'il y a une erreur de console
  // La page s'affiche si trainings existe, même avec une erreur de log
  if (!trainings || trainings.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-8 text-white md:p-12">
          <div className="flex items-start gap-4 md:items-center">
            <FaGraduationCap className="h-16 w-16 text-[#F97316]" />
            <div>
              <h1 className="text-3xl font-black md:text-4xl">Nos Formations</h1>
              <p className="text-white/80 max-w-2xl">
                UNITECH propose des formations théoriques et pratiques pour initier les jeunes
                aux métiers de la technologie.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-yellow-800">⚠️ Aucune formation disponible</h2>
            <p className="mt-2 text-yellow-700">
              Les programmes de formation sont en cours de préparation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-8 text-white md:p-12">
        <div className="flex items-start gap-4 md:items-center">
          <FaGraduationCap className="h-16 w-16 text-[#F97316]" />
          <div>
            <h1 className="text-3xl font-black md:text-4xl">Nos Formations</h1>
            <p className="text-white/80 max-w-2xl">
              UNITECH propose des formations théoriques et pratiques pour initier les jeunes
              aux métiers de la technologie, du développement à la robotique en passant par l'IA.
            </p>
          </div>
        </div>
      </div>

      {/* Programmes */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Programmes de formation</h2>
        <p className="mt-1 text-slate-600">
          Des programmes adaptés à tous les niveaux, de débutant à avancé.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training) => (
            <Card
              key={training.id}
              className={`border-2 bg-gradient-to-br ${
                colorMap[training.color] || colorMap.blue
              } hover:shadow-xl transition-all h-full`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{training.icon}</div>
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {training.duration}
                    </Badge>
                    <p className="text-xs text-slate-500">{training.level}</p>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mt-2">
                  {training.title}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {training.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FaClock className="h-4 w-4 text-[#1E3A8A]" />
                    <span>{training.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <FaCalendarAlt className="h-4 w-4 text-[#1E3A8A]" />
                    <span>{training.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <FaMapMarkerAlt className="h-4 w-4 text-[#1E3A8A]" />
                    <span>Bamako, Mali</span>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-[#1E3A8A]">{training.price}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500">Modules inclus :</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      {training.modules?.slice(0, 3).map((module: string) => (
                        <li key={module} className="flex items-start gap-2">
                          <span className="text-[#1E3A8A]">•</span>
                          {module}
                        </li>
                      ))}
                      {training.modules?.length > 3 && (
                        <li className="text-[#1E3A8A] font-medium">
                          +{training.modules.length - 3} autres modules
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full bg-[#F97316] hover:bg-[#ea580c] text-white"
                  asChild
                >
                  <Link href="/contact">
                    S'inscrire
                    <FaArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Avantages */}
      <div className="mt-16 bg-[#F5F7FB] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[#1E3A8A] text-center">
          Pourquoi choisir UNITECH Formation ?
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                <FaChalkboardTeacher className="h-8 w-8" />
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-slate-800">Approche Théorique & Pratique</h3>
            <p className="mt-1 text-sm text-slate-600">
              Des cours en salle et des ateliers pratiques pour une maîtrise complète.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F97316]/10 text-[#F97316]">
                <FaCertificate className="h-8 w-8" />
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-slate-800">Certification</h3>
            <p className="mt-1 text-sm text-slate-600">
              Une attestation de formation reconnue à la fin de chaque programme.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                <FaUsers className="h-8 w-8" />
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-slate-800">Encadrement Personnalisé</h3>
            <p className="mt-1 text-sm text-slate-600">
              Un suivi individuel et un mentorat pour chaque apprenant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}