import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizeInput, validatePhone, validateLength, validateFile } from '@/lib/security';

import { Card } from '@/components/ui/card';
import { User, Mail, Phone, Building, Save, Check, Camera, Briefcase, ShieldCheck, HardHat, Users, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { user } = useUser();
  const { t } = useTranslation();
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

// Get resolved URL for existing profile image
  const existingImageUrl = useQuery(
    api.files.getFileUrl,
    convexUser?.profile_image && !convexUser.profile_image.startsWith('http')
      ? { storageId: convexUser.profile_image }
      : "skip"
  );

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
      // Use resolved URL or full URL directly
      if (convexUser?.profile_image) {
        const url = existingImageUrl || (convexUser.profile_image.startsWith('http') ? convexUser.profile_image : null);
        if (url) setImagePreview(url);
      }
    }
  }, [user, convexUser, existingImageUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateFile(file, 'image');
    if (!validation.ok) {
      toast({ title: 'Invalid file', description: validation.error, variant: 'destructive' });
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // â”€â”€ Input sanitization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const sanitized = {
      full_name: sanitizeInput(formData.full_name, 100),
      phone: sanitizeInput(formData.phone, 20),
      company_name: sanitizeInput(formData.company_name, 100),
      company_code: sanitizeInput(formData.company_code, 50),
      work_sector: sanitizeInput(formData.work_sector, 100),
    };

    if (!validateLength(sanitized.full_name, 2, 100)) {
      toast({ title: 'Invalid name', description: 'Name must be 2"“100 characters.', variant: 'destructive' });
      return;
    }
    if (sanitized.phone && !validatePhone(sanitized.phone)) {
      toast({ title: 'Invalid phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      // Use sanitized values for the rest of the save logic
      const formDataSanitized = { ...formData, ...sanitized };
      const codeChanged = formDataSanitized.company_code !== initialValuesRef.current.company_code;
      let roleUpgraded = false;

      // Only verify access code if it actually changed AND is not empty
      if (codeChanged && formDataSanitized.company_code) {
        try {
          await verifyAccount({ accessCode: formDataSanitized.company_code });
          roleUpgraded = true;
        } catch (err) {
          console.error("Upgrade failed:", err);
        }
      }

// Upload Profile Image only if selected
      let profileImageStorageId = undefined;
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const data = await result.json();
        // Store the storage ID (not full URL) - getFileUrl will resolve it
        profileImageStorageId = data.storageId;
      }

      // Update Convex Profile (this stores the profile image storage ID)
      await updateProfile({
        fullName: formDataSanitized.full_name,
        work_sector: formDataSanitized.work_sector,
        ...(profileImageStorageId && { profile_image: profileImageStorageId })
      });

      // Update Clerk Profile (name + metadata only - skip profile image upload as it fails)
      await user.update({
        firstName: formDataSanitized.full_name.split(' ')[0],
        lastName: formDataSanitized.full_name.split(' ').slice(1).join(' '),
        unsafeMetadata: {
          phone: formDataSanitized.phone,
          company_name: formDataSanitized.company_name,
          company_code: formDataSanitized.company_code
        }
      });

      // Note: Profile image is stored in Convex only. Clerk image upload is skipped
      // because Clerk's setProfileImage API has issues. The Convex image will
      // appear in the sidebar/header after refresh.

      // Update initial values to current state
      initialValuesRef.current = { ...formData };
      setSelectedImage(null);

      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);

      // Show appropriate feedback
      if (roleUpgraded) {
        toast({
          title: '🎉 Role updated!',
          description: 'Your account has been updated with the new role.',
        });
      } else {
        toast({
          title: 'âœ… Saveto',
          description: 'Your changes have been saved successfully.',
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      setIsSaving(false);
      toast({
        title: 'âŒ Errore',
        description: 'Save error: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = () => {
    const roleMap = {
      admin: { label: 'Amministratore', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      superadmin: { label: 'SuperAdmin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      client: { label: 'Client', color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/20' },
      operaio: { label: 'Operaio', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      collaborator_internal: { label: 'Collaborator Interno', color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/20' },
      collaborator_external: { label: 'Collaborator Esterno', color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/20' },
      worker: { label: 'Worker', color: 'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/20' },
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
    <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">
      

      <div className="pt-0 relative z-10 min-h-screen pb-safe">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white">Settings</h1>
              {getRoleBadge()}
            </div>
            <p className="text-xs sm:text-sm text-white/70">Manage your profile</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/ rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden hover:bg-[#1C1A18]/ transition-all duration-300"
          >
            <form onSubmit={handleSave} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Account Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <User size={20} />
                  Informazioni Account
                </h2>

                {/* Profile Image */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/ bg-[#141210]">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
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
                    <h3 className="text-white font-medium">Profile Photo</h3>
                    <p className="text-sm text-white/40">Clicca sull'immagine per cambiarla</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <Input
                      value={user.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className="pl-10 bg-[#535252]/ backdrop-blur-sm border-white/ text-white/40"
                    />
                  </div>
                  <p className="text-xs text-white/40">L'email non può essere modificata</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="pl-10 bg-[#535252]/ backdrop-blur-sm border-white/ text-white focus:bg-[#535252]/ transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+39 123 456 7890"
                      className="pl-10 bg-[#535252]/ backdrop-blur-sm border-white/ text-white focus:bg-[#535252]/ transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Settore Lavorativo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <Input
                    value={formData.work_sector || ''}
                    onChange={(e) => setFormData({ ...formData, work_sector: e.target.value })}
                    placeholder="Es: Architettura, Edilizia, Privato"
                    className="pl-10 bg-[#535252]/ backdrop-blur-sm border-white/ text-white focus:bg-[#535252]/ transition-all"
                  />
                </div>
              </div>

              {/* Admin-only: Role Management Info */}
              {isAdmin && (
                <div className="pt-6 border-t border-white/ space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <ShieldCheck size={20} />
                    Pannello Amministratore
                  </h2>
                  <Card className="bg-purple-500/10 border-purple-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-[#F0EBE8]/60 font-medium">Full system access</p>
                      <ul className="text-xs text-purple-300/80 space-y-1 list-disc list-inside">
                        <li>Gestione utenti, clienti e ruoli</li>
                        <li>Creazione e gestione cantieri</li>
                        <li>Approvazione preventivi</li>
                        <li>Gestione squadre e operai</li>
                        <li>Access to all chats and documents</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Operaio-only: Team Info */}
              {isOperaio && (
                <div className="pt-6 border-t border-white/ space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <HardHat size={20} />
                    Info Operaio
                  </h2>
                  <Card className="bg-orange-500/10 border-orange-500/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-[#F0EBE8]/60 font-medium">Access to assigned projects</p>
                      <ul className="text-xs text-orange-300/80 space-y-1 list-disc list-inside">
                        <li>View your team's projects</li>
                        <li>Update the status of assigned tasks</li>
                        <li>Comunica con la squadra nella chat dedicata</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Staff-only Info */}
              {(convexUser?.role === 'collaborator_internal' || convexUser?.role === 'collaborator_external') && (
                <div className="pt-6 border-t border-white/ space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Briefcase size={20} />
                    Info Collaborator
                  </h2>
                  <Card className="bg-[#FFC703]/10 border-[#FFC703]/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-indigo-200 font-medium">Accesso privilegiato staff</p>
                      <ul className="text-xs text-[#FFC703]/80 space-y-1 list-disc list-inside">
                        <li>Registrazione ore settimanali e log storico</li>
                        <li>View payments and deadlines</li>
                        <li>Chat diretta con l'amministrazione sbloccata</li>
                        <li>Certificati personali e professionali</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}

              {/* Client-only: Client Info */}
              {isClient && (
                <div className="pt-6 border-t border-white/ space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Users size={20} />
                    Area Client
                  </h2>
                  <Card className="bg-[#FFC703]/10 border-[#FFC703]/20 p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-blue-200 font-medium">Accesso personalizzato</p>
                      <ul className="text-xs text-[#FFC703]/80 space-y-1 list-disc list-inside">
                        <li>View your quotes and documents</li>
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
                  className="w-full bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-xl disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check size={18} className="mr-2" />
                      Saveto!
                    </>
                  ) : isSaving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Modifiche
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

