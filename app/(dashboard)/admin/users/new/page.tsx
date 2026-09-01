'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaUserPlus, 
  FaEye, 
  FaEyeSlash,
  FaSpinner,
  FaShieldAlt,
  FaEnvelope,
  FaUserTag,
  FaIdCard
} from 'react-icons/fa';
import Link from 'next/link';

const roles = [
  { value: 'admin', label: 'Administrateur', icon: '🛡️' },
  { value: 'super_admin', label: 'Super Admin', icon: '👑' },
  { value: 'project_manager', label: 'Chef de projet', icon: '📋' },
  { value: 'team_lead', label: 'Lead technique', icon: '👨‍💻' },
  { value: 'developer', label: 'Développeur', icon: '💻' },
  { value: 'designer', label: 'Designer', icon: '🎨' },
  { value: 'client', label: 'Client', icon: '🤝' },
  { value: 'viewer', label: 'Visiteur', icon: '👀' },
  { value: 'collaborator', label: 'Collaborateur', icon: '🧩' },
  { value: 'associate', label: 'Associé', icon: '🔗' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  });

  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // ✅ Vérifier la force du mot de passe
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/\d/)) score++;
    if (password.match(/[^a-zA-Z\d]/)) score++;
    
    if (score <= 1) setPasswordStrength('weak');
    else if (score <= 2) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength) {
      case 'weak': return 'Faible';
      case 'medium': return 'Moyen';
      case 'strong': return 'Fort';
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setSaving(false);
      return;
    }

    if (formData.password.length < 12) {
      toast.error("Le mot de passe doit contenir au moins 12 caractères");
      setSaving(false);
      return;
    }

    console.log("📤 Envoi à /api/users:", {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    });

    // ✅ Appel à l'API (sans /new)
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      }),
    });

    console.log("📥 Status reçu:", response.status);

    // ✅ Vérification du content-type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Réponse non-JSON:", text.substring(0, 500));
      
      if (response.status === 404) {
        toast.error("API non trouvée. Vérifiez le chemin /api/users");
      } else {
        toast.error("Erreur serveur inattendue");
      }
      setSaving(false);
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || "Erreur lors de la création");
      setSaving(false);
      return;
    }

    toast.success("✅ Utilisateur créé avec succès !");
    setTimeout(() => {
      router.push("/admin/users");
    }, 1000);

  } catch (err: any) {
    console.error("❌ Erreur création utilisateur:", err);
    
    if (err.message.includes("Unexpected token")) {
      toast.error("Erreur serveur: réponse invalide");
    } else {
      toast.error(err.message || "Erreur lors de la création");
    }
  } finally {
    setSaving(false);
  }
};
  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-3xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaUserPlus className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Nouvel utilisateur</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Ajouter un compte administrateur ou un membre de l'équipe.
            </p>
          </div>
          <Link href="/admin/users" className="flex-shrink-0">
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
              <FaArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Retour à la liste</span>
              <span className="xs:hidden">Retour</span>
            </Button>
          </Link>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <FaUserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-[#F97316]" />
              <span>Créer un utilisateur</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Remplissez les informations ci-dessous pour créer un nouveau compte utilisateur.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email avec icône */}
              <div>
                <Label htmlFor="email" className="text-xs sm:text-sm flex items-center gap-2">
                  <FaEnvelope className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                  className="mt-1 text-sm"
                />
              </div>

              {/* Mot de passe avec force */}
              <div>
                <Label htmlFor="password" className="text-xs sm:text-sm">
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 12 caractères"
                    required
                    minLength={12}
                    className="pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Indicateur de force du mot de passe */}
                {formData.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ 
                            width: passwordStrength === 'weak' ? '33%' : 
                                   passwordStrength === 'medium' ? '66%' : 
                                   passwordStrength === 'strong' ? '100%' : '0%' 
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'weak' ? 'text-red-500' :
                        passwordStrength === 'medium' ? 'text-yellow-500' :
                        passwordStrength === 'strong' ? 'text-green-500' :
                        'text-slate-400'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmer le mot de passe */}
              <div>
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmer le mot de passe"
                  required
                  className="mt-1 text-sm"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-xs text-green-500">✓ Les mots de passe correspondent</p>
                )}
              </div>

              {/* Prénom et Nom - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-xs sm:text-sm flex items-center gap-2">
                    <FaIdCard className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="mt-1 text-sm"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-xs sm:text-sm">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="mt-1 text-sm"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Rôle avec icônes */}
              <div>
                <Label htmlFor="role" className="text-xs sm:text-sm flex items-center gap-2">
                  <FaUserTag className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  Rôle
                </Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.icon} {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                  Définit les permissions et les accès de l'utilisateur
                </p>
              </div>

              {/* Boutons - responsive */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => router.push('/admin/users')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Créer l'utilisateur</span>
                      <span className="xs:hidden">Créer</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Information de sécurité */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-800">Sécurité</p>
                    <p className="text-[10px] sm:text-xs text-blue-700">
                      L'utilisateur recevra un email de confirmation. Assurez-vous que l'email est valide.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
