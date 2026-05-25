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
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">
            
            
            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-lg mx-auto px-4 py-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-[#1C1A18]/ backdrop-blur-xl border-white/10 shadow-2xl">
                            <CardHeader className="text-center pb-4">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Truck size={32} className="text-[#FFC703]" />
                                </div>
                                <CardTitle className="text-2xl font-light text-white">
                                    Area Supplier
                                </CardTitle>
                                <p className="text-sm text-white/40 mt-2">
                                    {token
                                        ? "Enter the temporary password provided by the administrator to activate tuo account."
                                        : "Enter the unique code provided by the Kranely administratory per attivare il tuo account fornitore."}
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
                                        <h3 className="text-xl text-white mb-2">Account Activated!</h3>
                                        <p className="text-sm text-white/40">
                                            Your role has been updated to <strong className="text-[#FFC703]">Supplier</strong>.
                                            Update la pagina per accedere alla tua area dedicata.
                                        </p>
                                        <Button
                                            onClick={() => window.location.href = "/Suppliers"}
                                            className="mt-4 bg-orange-600 hover:bg-orange-700"
                                        >
                                            Vai alla Dashboard
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <>
                                        {token ? (
                                            <div>
                                                <label className="text-xs text-white/40 block mb-2 font-medium">
                                                    <KeyRound size={12} className="inline mr-1" />
                                                    Password Temporanea
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="Enter password..."
                                                    className="bg-[#535252] border-white/10 text-white text-center text-lg tracking-wider"
                                                    onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-xs text-white/40 block mb-2 font-medium">
                                                    <Hash size={12} className="inline mr-1" />
                                                    Codice Supplier
                                                </label>
                                                <Input
                                                    value={code}
                                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                                    placeholder="Es. IWH-12345"
                                                    className="bg-[#535252] border-white/10 text-white text-center text-lg tracking-wider font-mono"
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
                                                <><Loader2 size={16} className="mr-2 animate-spin" /> Verifying...</>
                                            ) : (
                                                <><Shield size={16} className="mr-2" /> Activate Supplier Account</>
                                            )}
                                        </Button>

                                        <div className="border-t border-white/10 pt-4">
                                            <p className="text-[10px] text-white/25 text-center">
                                                Non hai un codice? Contatta l'amministratore Kranely per riceverne uno.
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


