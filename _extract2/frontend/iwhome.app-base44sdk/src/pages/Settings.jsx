import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';
import { User, Mail, Phone, Building, Save, Check, Camera, Briefcase, ShieldCheck, HardHat, Users, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company_name: '',
    company_code: '',
    work_sector: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Track initial values to detect real changes
  const initialValuesRef = useRef({ company_code: '' });

  const verifyAccount = useMutation(api.users.verifyAccount);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });

  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
  const isOperaio = convexUser?.role === 'operaio';
  const isClient = convexUser?.role === 'client';

  useEffect(() => {
    if (user) {
      const initial = {
        full_name: user.fullName || '',
        phone: `${user.unsafeMetadata?.phone || ''}`,
        company_name: `${user.unsafeMetadata?.company_name || ''}`,
        company_code: `${user.unsafeMetadata?.company_code || ''}`,
        work_sector: convexUser?.work_sector || ''
      };
      setFormData(initial);
      initialValuesRef.current = { ...initial };
      if (convexUser?.profile_image) {
        setImagePreview(convexUser.profile_image);
      }
    }
  }, [user, convexUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const codeChanged = formData.company_code !== initialValuesRef.current.company_code;
      let roleUpgraded = false;

      // Only verify access code if it actually changed AND is not empty
      if (codeChanged && formData.company_code) {
        try {
          await verifyAccount({ accessCode: formData.company_code });
          roleUpgraded = true;
        } catch (err) {
          console.error("Upgrade failed:", err);
        }
      }

      // Upload Profile Image only if selected
      let profileImageId = undefined;
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await result.json();
        profileImageId = storageId;
      }

      // Update Convex Profile
      await updateProfile({
        fullName: formData.full_name,
        work_sector: formData.work_sector,
        ...(profileImageId && { profile_image: profileImageId })
      });

      // Update Clerk Profile
      await user.update({
        firstName: formData.full_name.split(' ')[0],
        lastName: formData.full_name.split(' ').slice(1).join(' '),
        unsafeMetadata: {
          phone: formData.phone,
          company_name: formData.company_name,
          company_code: formData.company_code
        }
      });

      // Update initial values to current state
      initialValuesRef.current = { ...formData };
      setSelectedImage(null);

      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);

      // Show appropriate feedback
      if (roleUpgraded) {
        toast({
          title: '🎉 Ruolo aggiornato!',
          description: 'Il tuo account è stato aggiornato con il nuovo ruolo.',
        });
      } else {
        toast({
          title: '✅ Salvato',
          description: 'Le tue modifiche sono state salvate con successo.',
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      setIsSaving(false);
      toast({
        title: '❌ Errore',
        description: 'Errore nel salvataggio: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = () => {
    const roleMap = {
      admin: { label: 'Amministratore', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      superadmin: { label: 'SuperAdmin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      client: { label: 'Cliente', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      operaio: { label: 'Operaio', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      collaborator_internal: { label: 'Collaboratore Interno', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
      collaborator_external: { label: 'Collaboratore Esterno', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
      worker: { label: 'Collaboratore', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
      user: { label: 'Utente', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    };
    const role = convexUser?.role || 'user';
    const config = roleMap[role] || roleMap.user;
    return (
      <span className={`text-xs px-3 py-1 rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };




  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa]">Impostazioni</h1>
              {getRoleBadge()}
            </div>
            <p className="text-xs sm:text-sm text-[#dee2e6]">Gestisci il tuo profilo</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden hover:bg-[#343a40]/40 transition-all duration-300"
          >
            <form onSubmit={handleSave} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Account Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                  <User size={20} />
                  Informazioni Account
                </h2>

                {/* Profile Image */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#f8f9fa]/10">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#f8f9fa]/20 bg-[#212529]">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#adb5bd]">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <label htmlFor="profile-image" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Camera className="text-white" size={24} />
                    </label>
                    <input
                      type="file"
                      id="profile-image"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-[#f8f9fa] font-medium">Foto Profilo</h3>
                    <p className="text-sm text-[#adb5bd]">Clicca sull'immagine per cambiarla</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      value={user.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className="pl-10 bg-[#495057]/20 backdrop-blur-sm border-[#f8f9fa]/10 text-[#adb5bd]"
                    />
                  </div>
                  <p className="text-xs text-[#adb5bd]">L'email non può essere modificata</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="pl-10 bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+39 123 456 7890"
                      className="pl-10 bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#f8f9fa]">Settore Lavorativo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                  <Input
                    value={formData.work_sector || ''}
                    onChange={(e) => setFormData({ ...formData, work_sector: e.target.value })}
                    placeholder="Es: Architettura, Edilizia, Privato"
                    className="pl-10 bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                  />
                </div>
              </div>

              {/* Admin-only: Role Management Info */}
              {isAdmin && (
                <div className="pt-6 border-t border-[#f8f9fa]/10 space-y-4">
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                    <ShieldCheck size={20} />
                    Pannello Amministratore
                  </h2>
                  <Card className="bg-purple-500/10 border-purple-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-purple-200 font-medium">Accesso completo al sistema</p>
                      <ul className="text-xs text-purple-300/80 space-y-1 list-disc list-inside">
                        <li>Gestione utenti, clienti e ruoli</li>
                        <li>Creazione e gestione cantieri</li>
                        <li>Approvazione preventivi</li>
                        <li>Gestione squadre e operai</li>
                        <li>Accesso a tutte le chat e documenti</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Operaio-only: Team Info */}
              {isOperaio && (
                <div className="pt-6 border-t border-[#f8f9fa]/10 space-y-4">
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                    <HardHat size={20} />
                    Info Operaio
                  </h2>
                  <Card className="bg-orange-500/10 border-orange-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-orange-200 font-medium">Accesso ai cantieri assegnati</p>
                      <ul className="text-xs text-orange-300/80 space-y-1 list-disc list-inside">
                        <li>Visualizza i cantieri della tua squadra</li>
                        <li>Aggiorna lo stato dei task assegnati</li>
                        <li>Comunica con la squadra nella chat dedicata</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Staff-only Info */}
              {(convexUser?.role === 'collaborator_internal' || convexUser?.role === 'collaborator_external') && (
                <div className="pt-6 border-t border-[#f8f9fa]/10 space-y-4">
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                    <Briefcase size={20} />
                    Info Collaboratore
                  </h2>
                  <Card className="bg-indigo-500/10 border-indigo-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-indigo-200 font-medium">Accesso privilegiato staff</p>
                      <ul className="text-xs text-indigo-300/80 space-y-1 list-disc list-inside">
                        <li>Registrazione ore settimanali e log storico</li>
                        <li>Visualizzazione pagamenti e scadenze</li>
                        <li>Chat diretta con l'amministrazione sbloccata</li>
                        <li>Certificati personali e professionali</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Client-only: Client Info */}
              {isClient && (
                <div className="pt-6 border-t border-[#f8f9fa]/10 space-y-4">
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                    <Users size={20} />
                    Area Cliente
                  </h2>
                  <Card className="bg-blue-500/10 border-blue-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-blue-200 font-medium">Accesso personalizzato</p>
                      <ul className="text-xs text-blue-300/80 space-y-1 list-disc list-inside">
                        <li>Visualizza i tuoi preventivi e documenti</li>
                        <li>Prenota e gestisci appuntamenti</li>
                        <li>Comunica direttamente con l'amministrazione</li>
                        <li>Monitora l'avanzamento dei tuoi cantieri</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}


              {/* Save Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-xl disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check size={18} className="mr-2" />
                      Salvato!
                    </>
                  ) : isSaving ? (
                    'Salvataggio...'
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}