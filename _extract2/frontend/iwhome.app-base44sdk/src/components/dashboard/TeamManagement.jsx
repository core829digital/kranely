/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    Users, UserPlus, Shield, CheckCircle, Clock, Trash2, ChevronDown, Activity, Crown, User, HardHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_ICONS = {
    superadmin: Crown,
    admin: Shield,
    supervisor: HardHat,
    worker: User,
};

const ROLE_COLORS = {
    superadmin: 'from-purple-500 to-violet-600',
    admin: 'from-purple-500 to-indigo-600',
    supervisor: 'from-blue-500 to-cyan-600',
    worker: 'from-gray-500 to-slate-600',
};

const ROLE_BADGE_COLORS = {
    superadmin: 'bg-purple-500/20 text-purple-400',
    admin: 'bg-purple-500/20 text-purple-400',
    supervisor: 'bg-blue-500/20 text-blue-400',
    worker: 'bg-gray-500/20 text-gray-400',
};

export default function TeamManagement({ cantiereId }) {
    const { user } = useUser();
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('worker');
    const [expandedMember, setExpandedMember] = useState(null);

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const userName = user?.fullName || userEmail;

    // Queries
    const teamWithActivity = useQuery(api.team_members.getTeamWithActivity, { cantiere_id: cantiereId }) || [];
    const userRole = useQuery(api.team_members.getUserRole, { cantiere_id: cantiereId });
    const roleOptions = useQuery(api.team_members.getRoleOptions, {}) || [];

    // Mutations
    const inviteTeamMember = useMutation(api.cantieri.inviteTeamMember);
    const updateTeamMember = useMutation(api.cantieri.updateTeamMember);
    const removeTeamMember = useMutation(api.cantieri.removeTeamMember);
    const logActivity = useMutation(api.team_members.logActivity);

    const canManageTeam = userRole?.permissions?.canManageTeam ;
    const canChangeRoles = userRole?.permissions?.canChangeRoles ;
    const canRemoveMembers = userRole?.permissions?.canRemoveMembers ;

    const handleInvite = async () => {
        if (!newMemberEmail) return;

        try {
            await inviteTeamMember({
                cantiere_id: cantiereId,
                email: newMemberEmail,
                role: newMemberRole,
                invited_by: userEmail,
            });

            await logActivity({
                action: 'invited',
                entity_type: 'team_member',
                entity_id: cantiereId,
                entity_name: newMemberEmail,
                details: `Invitato come ${newMemberRole}`,
            });

            setInviteModalOpen(false);
            setNewMemberEmail('');
            setNewMemberRole('worker');
        } catch (error) {
            console.error('Error inviting member:', error);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        await updateTeamMember({
            member_id: memberId,
            role: newRole,
        });
    };

    const handleRemove = async (memberId, memberEmail) => {
        await removeTeamMember({ member_id: memberId });
        await logActivity({
            action: 'removed',
            entity_type: 'team_member',
            entity_id: cantiereId,
            entity_name: memberEmail,
        });
    };

    const handleStatusChange = async (memberId, newStatus) => {
        await updateTeamMember({
            member_id: memberId,
            status: newStatus,
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Attivo</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> In Attesa</Badge>;
            case 'declined':
                return <Badge className="bg-red-500/20 text-red-400 border-none">Rifiutato</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="text-blue-400" size={24} />
                    <h3 className="text-xl font-medium text-[#f8f9fa]">Gestione Team</h3>
                    <Badge variant="outline" className="text-[#adb5bd]">
                        {teamWithActivity.filter(m => m.status === 'accepted').length} attivi
                    </Badge>
                </div>
                {canManageTeam && (
                    <Button
                        onClick={() => setInviteModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <UserPlus size={16} className="mr-2" /> Invita Membro
                    </Button>
                )}
            </div>

            {/* Role Legend */}
            <div className="flex flex-wrap gap-2">
                {roleOptions.map(role => {
                    const IconComponent = ROLE_ICONS[role.id] || User;
                    return (
                        <div key={role.id} className="flex items-center gap-2 bg-[#495057]/30 px-3 py-1.5 rounded-lg text-xs">
                            <IconComponent size={14} className="text-[#adb5bd]" />
                            <span className="text-[#adb5bd]">{role.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamWithActivity.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-[#343a40]/50 rounded-xl border border-[#495057]">
                        <Users size={40} className="text-[#6c757d] mx-auto mb-3" />
                        <p className="text-[#adb5bd]">Nessun membro nel team</p>
                        {canManageTeam && (
                            <p className="text-xs text-[#6c757d] mt-1">Clicca "Invita Membro" per iniziare</p>
                        )}
                    </div>
                ) : (
                    teamWithActivity.map((member) => {
                        const IconComponent = ROLE_ICONS[member.role] || User;
                        const isExpanded = expandedMember === member._id;

                        return (
                            <motion.div
                                key={member._id}
                                layout
                                className="bg-[#343a40] rounded-xl border border-[#495057] overflow-hidden"
                            >
                                <div
                                    className="p-4 cursor-pointer hover:bg-[#3d4348] transition-colors"
                                    onClick={() => setExpandedMember(isExpanded ? null : member._id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_COLORS[member.role] || ROLE_COLORS.worker} flex items-center justify-center`}>
                                                <IconComponent size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[#f8f9fa] font-medium">{member.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={`${ROLE_BADGE_COLORS[member.role] || ROLE_BADGE_COLORS.worker} border-none text-xs`}>
                                                        {roleOptions.find(r => r.id === member.role)?.label || member.role}
                                                    </Badge>
                                                    {getStatusBadge(member.status)}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={18}
                                            className={`text-[#6c757d] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-[#adb5bd]">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle size={12} className="text-green-400" />
                                            {member.stats?.tasksCompleted || 0} completati
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="text-yellow-400" />
                                            {member.stats?.tasksPending || 0} in corso
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Activity size={12} className="text-blue-400" />
                                            {member.stats?.completionRate || 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-[#495057]"
                                        >
                                            <div className="p-4 space-y-4">
                                                {/* Recent Activity */}
                                                <div>
                                                    <p className="text-xs text-[#6c757d] mb-2">Attività Recente</p>
                                                    {member.recentActivity?.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {member.recentActivity.slice(0, 3).map((activity, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-xs text-[#adb5bd]">
                                                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                                    <span>{activity.action}</span>
                                                                    <span className="text-[#6c757d]">{activity.entity_name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-[#6c757d]">Nessuna attività recente</p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {canManageTeam && member.email !== userEmail && (
                                                    <div className="flex items-center gap-2 pt-2 border-t border-[#495057]">
                                                        {canChangeRoles && (
                                                            <Select
                                                                value={member.role}
                                                                onValueChange={(value) => handleRoleChange(member._id, value)}
                                                            >
                                                                <SelectTrigger className="flex-1 bg-[#495057] border-[#6c757d] text-[#f8f9fa] h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                                                    {roleOptions.map(role => (
                                                                        <SelectItem key={role.id} value={role.id} className="text-[#f8f9fa] text-xs">
                                                                            {role.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}

                                                        {member.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleStatusChange(member._id, 'accepted')}
                                                                className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                                                            >
                                                                Approva
                                                            </Button>
                                                        )}

                                                        {canRemoveMembers && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRemove(member._id, member.email)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Invite Modal */}
            <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa]">Invita Membro al Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[#dee2e6]">Email</Label>
                            <Input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                placeholder="esempio@email.com"
                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#dee2e6]">Ruolo</Label>
                            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {roleOptions.map(role => (
                                        <SelectItem key={role.id} value={role.id} className="text-[#f8f9fa]">
                                            <div>
                                                <p>{role.label}</p>
                                                <p className="text-xs text-[#6c757d]">{role.description}</p>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleInvite} disabled={!newMemberEmail} className="w-full bg-blue-600 hover:bg-blue-700">
                            <UserPlus size={16} className="mr-2" /> Invia Invito
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
