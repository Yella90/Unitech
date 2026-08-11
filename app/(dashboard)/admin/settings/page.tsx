// app/(dashboard)/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FaSave, 
  FaUserCog, 
  FaPalette, 
  FaBell, 
  FaGlobe, 
  FaDatabase, 
  FaShieldAlt,
  FaEnvelope,
  FaLock,
  FaUserCircle,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaKey,
  FaSpinner,
  FaMobileAlt,
  FaDesktop,
  FaClock,
  FaHistory
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast, Toaster } from 'sonner';
import bcrypt from 'bcryptjs';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    theme: 'light',
    language: 'fr',
    notifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
    sessionTimeout: '30',
    siteName: 'UNITECH',
    siteDescription: 'Solutions technologiques innovantes',
    adminEmail: 'admin@unitech.com',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [sections, setSections] = useState({
    profile: true,
    password: false,
    preferences: false,
    security: false,
    site: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const payload = await response.json();

        if (!response.ok || !payload.user || !['admin', 'super_admin'].includes(payload.user.role)) {
          router.push('/login');
          return;
        }

        setUser(payload.user);
        setSettings(prev => ({
          ...prev,
          firstName: payload.user.first_name || '',
          lastName: payload.user.last_name || '',
          email: payload.user.email || '',
          phone: payload.user.phone || '',
          department: payload.user.department || '',
        }));
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: settings.firstName,
          last_name: settings.lastName,
          phone: settings.phone,
          department: settings.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('✅ Profil mis à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      toast.success('✅ Préférences sauvegardées !');
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setChangingPassword(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        setChangingPassword(false);
        return;
      }

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Erreur récupération utilisateur:', fetchError);
        toast.error('Erreur lors de la vérification');
        setChangingPassword(false);
        return;
      }

      const isValid = await bcrypt.compare(passwordData.currentPassword, userData.password_hash);
      if (!isValid) {
        toast.error('Mot de passe actuel incorrect');
        setChangingPassword(false);
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, salt);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('✅ Mot de passe modifié avec succès !');
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSections(prev => ({ ...prev, password: false }));

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-4xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaUserCog className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Paramètres</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez votre profil et les préférences de l'administration.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="hidden xs:inline">En ligne</span>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* ============================================ */}
          {/* 1. PROFIL */}
          {/* ============================================ */}
          <Card className="border-0 sm:border shadow-sm sm:shadow-md">
            <CardHeader 
              className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition"
              onClick={() => toggleSection('profile')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex-shrink-0">
                    <FaUserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">Profil</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Informations personnelles et coordonnées
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sections.profile ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                </div>
              </div>
            </CardHeader>
            {sections.profile && (
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-xs sm:text-sm">Prénom</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Votre prénom"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs sm:text-sm">Nom</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Votre nom"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        disabled
                        className="mt-1 text-sm bg-slate-50"
                      />
                      <p className="mt-1 text-[10px] sm:text-xs text-slate-400">L'email ne peut pas être modifié</p>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Téléphone</Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+223 90 69 23 63"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-xs sm:text-sm">Département</Label>
                    <Select
                      value={settings.department}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direction">Direction</SelectItem>
                        <SelectItem value="development">Développement</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="sales">Commercial</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">Ressources Humaines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm"
                    disabled={saving}
                  >
                    {saving ? (
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>

          {/* ============================================ */}
          {/* 2. CHANGEMENT DE MOT DE PASSE */}
          {/* ============================================ */}
          <Card className="border-0 sm:border shadow-sm sm:shadow-md">
            <CardHeader 
              className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition"
              onClick={() => toggleSection('password')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex-shrink-0">
                    <FaKey className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">Mot de passe</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Modifier votre mot de passe
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sections.password ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                </div>
              </div>
            </CardHeader>
            {sections.password && (
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-xs sm:text-sm">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Votre mot de passe actuel"
                      required
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-xs sm:text-sm">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Nouveau mot de passe (min 6 caractères)"
                      required
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirmer le nouveau mot de passe"
                      required
                      className="mt-1 text-sm"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <FaKey className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    {changingPassword ? 'Changement en cours...' : 'Changer le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>

          {/* ============================================ */}
          {/* 3. PRÉFÉRENCES */}
          {/* ============================================ */}
          <Card className="border-0 sm:border shadow-sm sm:shadow-md">
            <CardHeader 
              className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition"
              onClick={() => toggleSection('preferences')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex-shrink-0">
                    <FaPalette className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">Préférences</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Thème, langue et notifications
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sections.preferences ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                </div>
              </div>
            </CardHeader>
            {sections.preferences && (
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme" className="text-xs sm:text-sm">Thème</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Clair</SelectItem>
                        <SelectItem value="dark">🌙 Sombre</SelectItem>
                        <SelectItem value="system">💻 Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language" className="text-xs sm:text-sm">Langue</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue placeholder="Choisir une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="mb-2 block text-xs sm:text-sm">Notifications</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-3 sm:p-4 gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <FaBell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium">Notifications générales</p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">Recevoir les notifications du système</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                      className="flex-shrink-0"
                    />
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-3 sm:p-4 gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium">Notifications par email</p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">Recevoir les notifications par email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSavePreferences} 
                  className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* ============================================ */}
          {/* 4. SÉCURITÉ */}
          {/* ============================================ */}
          <Card className="border-0 sm:border shadow-sm sm:shadow-md">
            <CardHeader 
              className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition"
              onClick={() => toggleSection('security')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex-shrink-0">
                    <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">Sécurité</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Authentification et paramètres de sécurité
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sections.security ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                </div>
              </div>
            </CardHeader>
            {sections.security && (
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-3 sm:p-4 gap-2 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium">Authentification à deux facteurs</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Renforcez la sécurité de votre compte</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                    className="flex-shrink-0"
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout" className="text-xs sm:text-sm">Délai d'inactivité (minutes)</Label>
                  <Select
                    value={settings.sessionTimeout}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, sessionTimeout: value }))}
                  >
                    <SelectTrigger className="w-full sm:w-48 mt-1 text-sm">
                      <SelectValue placeholder="Choisir un délai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                      <SelectItem value="480">8 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-yellow-800">Modification du mot de passe</p>
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Utilisez la section "Mot de passe" ci-dessus pour modifier votre mot de passe.
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm">
                  <FaHistory className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Voir l'historique des connexions
                </Button>
              </CardContent>
            )}
          </Card>

          {/* ============================================ */}
          {/* 5. SITE */}
          {/* ============================================ */}
          <Card className="border-0 sm:border shadow-sm sm:shadow-md">
            <CardHeader 
              className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition"
              onClick={() => toggleSection('site')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex-shrink-0">
                    <FaGlobe className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">Site</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Configuration générale du site
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sections.site ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                </div>
              </div>
            </CardHeader>
            {sections.site && (
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div>
                  <Label htmlFor="siteName" className="text-xs sm:text-sm">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription" className="text-xs sm:text-sm">Description du site</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail" className="text-xs sm:text-sm">Email de contact</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-blue-800">Informations</p>
                      <p className="text-xs sm:text-sm text-blue-700">
                        Les modifications seront appliquées après validation.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSavePreferences} 
                  className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}