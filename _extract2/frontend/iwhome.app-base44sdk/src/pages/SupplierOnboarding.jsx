import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Hash, Loader2, Shield, Truck, KeyRound } from 'lucide-react';
import { useLocation } from 'react-router-dom';



export default function SupplierOnboarding() {
    const { user } = useUser();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    const redeemSupplierCode = useMutation(api.suppliers.redeemSupplierCode);

    const handleRedeem = async () => {
        if (!token && (!code.trim() || code.length < 5)) return;
        if (token && !password.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            if (token) {
                await redeemSupplierCode({
                    whatsapp_token: token,
                    password: password.trim(),
                    user_email: user?.primaryEmailAddress?.emailAddress || '',
                });
            } else {
                await redeemSupplierCode({
                    code: code.trim().toUpperCase(),
                    user_email: user?.primaryEmailAddress?.emailAddress || '',
                });
            }
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Errore durante la verifica. Contatta l\'amministratore.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            
            
            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-lg mx-auto px-4 py-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-[#343a40]/80 backdrop-blur-xl border-[#495057] shadow-2xl">
                            <CardHeader className="text-center pb-4">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Truck size={32} className="text-orange-400" />
                                </div>
                                <CardTitle className="text-2xl font-light text-[#f8f9fa]">
                                    Area Fornitore
                                </CardTitle>
                                <p className="text-sm text-[#adb5bd] mt-2">
                                    {token
                                        ? "Inserisci la password temporanea fornita dall'amministratore per attivare il tuo account."
                                        : "Inserisci il codice univoco che ti è stato fornito dall'amministratore IWHome per attivare il tuo account fornitore."}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {status === 'success' ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle size={40} className="text-green-400" />
                                        </div>
                                        <h3 className="text-xl text-[#f8f9fa] mb-2">Account Attivato!</h3>
                                        <p className="text-sm text-[#adb5bd]">
                                            Il tuo ruolo è stato aggiornato a <strong className="text-orange-400">Fornitore</strong>.
                                            Aggiorna la pagina per accedere alla tua area dedicata.
                                        </p>
                                        <Button
                                            onClick={() => window.location.href = "/Fornitori"}
                                            className="mt-4 bg-orange-600 hover:bg-orange-700"
                                        >
                                            Vai alla Dashboard
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <>
                                        {token ? (
                                            <div>
                                                <label className="text-xs text-[#adb5bd] block mb-2 font-medium">
                                                    <KeyRound size={12} className="inline mr-1" />
                                                    Password Temporanea
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="Inserisci la password..."
                                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-center text-lg tracking-wider"
                                                    onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-xs text-[#adb5bd] block mb-2 font-medium">
                                                    <Hash size={12} className="inline mr-1" />
                                                    Codice Fornitore
                                                </label>
                                                <Input
                                                    value={code}
                                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                                    placeholder="Es. IWH-12345"
                                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-center text-lg tracking-wider font-mono"
                                                    maxLength={10}
                                                    onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                                                />
                                            </div>
                                        )}

                                        {status === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                                            >
                                                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-300">{errorMsg}</p>
                                            </motion.div>
                                        )}

                                        <Button
                                            onClick={handleRedeem}
                                            disabled={(token ? !password.trim() : (!code.trim() || code.length < 5)) || status === 'loading'}
                                            className="w-full bg-orange-600 hover:bg-orange-700 h-11 text-base"
                                        >
                                            {status === 'loading' ? (
                                                <><Loader2 size={16} className="mr-2 animate-spin" /> Verifica in corso...</>
                                            ) : (
                                                <><Shield size={16} className="mr-2" /> Attiva Account Fornitore</>
                                            )}
                                        </Button>

                                        <div className="border-t border-[#495057] pt-4">
                                            <p className="text-[10px] text-[#6c757d] text-center">
                                                Non hai un codice? Contatta l'amministratore IWHome per riceverne uno.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
