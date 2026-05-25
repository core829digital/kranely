import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser, SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, Shield, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OnboardingStaff() {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const redeemOnboarding = useMutation(api.collaborators.redeemOnboardingLink);

    const handleRedeem = async () => {
        if (!token || !password) return;
        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await redeemOnboarding({ token, password });
            if (res.success) {
                setStatus('success');
                // Auto redirect after 3 seconds
                setTimeout(() => navigate('/Dashboard'), 3000);
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Errore durante l\'attivazione. Contatta l\'amministratore.');
        }
    };

    return (
        <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <Card className="bg-white/5 border-white/10 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFC703]/20 flex items-center justify-center">
                            <Users size={32} className="text-[#FFC703]" />
                        </div>
                        <CardTitle className="text-2xl font-light text-white">
                            Attivazione Profilo Staff
                        </CardTitle>
                        <p className="text-sm text-white/40 mt-2">
                            Benvenuto nel team Kranely. Inserisci la password temporanea ricevuta su WhatsApp per attivare il tuo profilo.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <SignedIn>
                            {status === 'success' ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle size={32} className="text-green-400" />
                                    </div>
                                    <h3 className="text-xl text-white mb-2">Profilo Attivato!</h3>
                                    <p className="text-sm text-white/40 mb-6">Il tuo account Ã¨ stato collegato correttamente. Verrai reindirizzato alla dashboard in pochi secondi...</p>
                                    <Button onClick={() => navigate('/Dashboard')} className="w-full bg-[#FFC703] hover:bg-[#FFC703]">
                                        Vai alla Dashboard Ora
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {status === 'error' && (
                                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-300">{errorMsg}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs text-white/40">Temporary Password (6 digits)</label>
                                        <Input
                                            type="text"
                                            placeholder="Enter password..."
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="bg-[#535252] border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14"
                                            maxLength={6}
                                        />
                                    </div>

                                    <Button 
                                        onClick={handleRedeem}
                                        disabled={!token || !password || status === 'loading'}
                                        className="w-full bg-[#FFC703] hover:bg-[#FFC703] h-11"
                                    >
                                        {status === 'loading' ? (
                                            <><Loader2 size={16} className="mr-2 animate-spin" /> Verificando...</>
                                        ) : (
                                            <><Shield size={16} className="mr-2" /> Attiva Profilo</>
                                        )}
                                    </Button>

                                    {!token && (
                                        <p className="text-xs text-red-400 text-center">Token di attivazione mancante. Usa il link ricevuto su WhatsApp.</p>
                                    )}
                                </>
                            )}
                        </SignedIn>
                        <SignedOut>
                            <div className="text-center py-4 space-y-4">
                                <div className="flex items-start gap-2 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-lg p-3 text-left">
                                    <AlertCircle size={16} className="text-[#FFC703] flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#FFC703]">Devi creare un account o accedere per poter collegare il tuo profilo staff.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                                        <Button variant="outline" className="w-full border-[#FFC703]/50 text-[#FFC703] hover:bg-[#FFC703]/10">Accedi</Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal" forceRedirectUrl={window.location.href}>
                                        <Button className="w-full bg-[#FFC703] hover:bg-[#FFC703] text-white">Registrati</Button>
                                    </SignUpButton>
                                </div>
                            </div>
                        </SignedOut>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}




