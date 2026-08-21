// components/admin/ApiKeyModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FaSpinner, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import { toast } from 'sonner';

// ✅ Importer les types depuis le fichier central
import type { 
  APIKey, 
  ApiKeyStatus, 
  AIProvider 
} from '@/lib/types/ai-management';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingKey: APIKey | null;
  providers: AIProvider[];
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  editingKey,
  providers,
}: ApiKeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: '',
    key_value: '',
    key_name: '',
    status: 'active' as ApiKeyStatus,
    is_primary: false,
    notes: '',
  });

  // ✅ Réinitialiser le formulaire quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      if (editingKey) {
        setFormData({
          provider_id: editingKey.provider_id,
          key_value: editingKey.key_value,
          key_name: editingKey.key_name || '',
          status: editingKey.status,
          is_primary: editingKey.is_primary || false,
          notes: editingKey.notes || '',
        });
      } else {
        setFormData({
          provider_id: '',
          key_value: '',
          key_name: '',
          status: 'active',
          is_primary: false,
          notes: '',
        });
      }
      setShowKey(false);
    }
  }, [editingKey, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Validations
      if (!formData.provider_id) {
        toast.error('Veuillez sélectionner un fournisseur');
        setLoading(false);
        return;
      }

      if (!formData.key_value.trim()) {
        toast.error('Veuillez entrer la clé API');
        setLoading(false);
        return;
      }

      // ✅ Vérifier si la clé existe déjà pour ce provider
      if (!editingKey) {
        const { data: existing, error: checkError } = await supabase
          .from('api_keys')
          .select('id')
          .eq('provider_id', formData.provider_id)
          .eq('key_value', formData.key_value.trim())
          .maybeSingle();

        if (checkError) {
          console.error('❌ Erreur vérification:', checkError);
        }

        if (existing) {
          toast.error('Cette clé API existe déjà pour ce fournisseur');
          setLoading(false);
          return;
        }
      }

      // ✅ Préparer les données
      const data = {
        provider_id: formData.provider_id,
        key_value: formData.key_value.trim(),
        key_name: formData.key_name.trim() || null,
        status: formData.status,
        is_primary: formData.is_primary,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // ✅ Si c'est une clé primaire, désactiver les autres du même provider
      if (formData.is_primary) {
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ 
            is_primary: false,
            updated_at: new Date().toISOString()
          })
          .eq('provider_id', formData.provider_id);

        if (updateError) {
          console.error('❌ Erreur désactivation primaires:', updateError);
        }
      }

      let result;
      if (editingKey) {
        // ✅ Mise à jour
        result = await supabase
          .from('api_keys')
          .update(data)
          .eq('id', editingKey.id)
          .select()
          .single();
      } else {
        // ✅ Insertion
        result = await supabase
          .from('api_keys')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
            usage_count: 0,
            monthly_usage: 0,
            daily_usage: 0,
            error_count: 0,
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Erreur Supabase:', result.error);
        throw new Error(result.error.message);
      }

      toast.success(editingKey ? '✅ Clé mise à jour avec succès' : '✅ Clé ajoutée avec succès');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      
      // ✅ Messages d'erreur personnalisés
      let errorMessage = error.message || 'Erreur lors de l\'enregistrement';
      
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'Cette clé API existe déjà pour ce fournisseur';
      } else if (errorMessage.includes('foreign key')) {
        errorMessage = 'Le fournisseur sélectionné n\'existe pas';
      } else if (errorMessage.includes('row-level security')) {
        errorMessage = 'Erreur de sécurité. Veuillez contacter l\'administrateur.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset du formulaire
  const handleClose = () => {
    setFormData({
      provider_id: '',
      key_value: '',
      key_name: '',
      status: 'active',
      is_primary: false,
      notes: '',
    });
    setShowKey(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#1E3A8A]">
            <FaKey className="h-5 w-5 text-[#F97316]" />
            {editingKey ? 'Modifier la clé API' : 'Ajouter une clé API'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ Fournisseur */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Fournisseur <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              required
              disabled={loading}
            >
              <option value="">-- Sélectionnez un fournisseur --</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.display_name}
                </option>
              ))}
            </select>
            {providers.length === 0 && (
              <p className="mt-1 text-xs text-amber-500">
                ⚠️ Aucun fournisseur disponible. Veuillez d'abord créer un fournisseur.
              </p>
            )}
          </div>

          {/* ✅ Nom */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom de la clé
            </label>
            <input
              type="text"
              value={formData.key_name}
              onChange={(e) => setFormData(prev => ({ ...prev, key_name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              placeholder="Clé principale OpenAI"
              disabled={loading}
            />
          </div>

          {/* ✅ Clé */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Clé API <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formData.key_value}
                onChange={(e) => setFormData(prev => ({ ...prev, key_value: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                placeholder="sk-..."
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={loading}
              >
                {showKey ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {editingKey ? 'La clé existante sera remplacée par la nouvelle valeur' : 'Entrez la clé API du fournisseur sélectionné'}
            </p>
          </div>

          {/* ✅ Statut et Primaire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ApiKeyStatus }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                disabled={loading}
              >
                <option value="active">✅ Actif</option>
                <option value="inactive">⛔ Inactif</option>
                <option value="expired">⏰ Expiré</option>
                <option value="depleted">📉 Épuisé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Primaire
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  disabled={loading}
                />
                <span className="text-sm text-slate-600">Utiliser comme clé primaire</span>
              </div>
              {formData.is_primary && (
                <p className="mt-1 text-xs text-amber-500">
                  ⚠️ Les autres clés du même fournisseur seront désactivées
                </p>
              )}
            </div>
          </div>

          {/* ✅ Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] resize-none"
              placeholder="Informations supplémentaires..."
              disabled={loading}
            />
          </div>

          {/* ✅ Boutons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || providers.length === 0}
              className="w-full sm:w-auto bg-[#1E3A8A] hover:bg-[#1A2F6A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  {editingKey ? 'Mise à jour...' : 'Ajout...'}
                </>
              ) : (
                editingKey ? 'Mettre à jour' : 'Ajouter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}