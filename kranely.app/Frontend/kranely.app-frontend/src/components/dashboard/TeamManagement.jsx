/// <reference types="vite/client" />
import React, { useState } from 'react';
import { sanitizeInput, validateEmail } from '@/lib/security';
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
    superadmin: 'from-[#FFC703] to-[#FFC703]/40',
    admin: 'from-[#FFC703]/80 to-[#535252]',
    supervisor: 'from-[#535252] to-[#1C1A18]',
    worker: 'from-[#F0EBE8]/30 to-[#535252]/50',
};

const ROLE_BADGE_COLORS = {
    superadmin: 'bg-[#FFC703]/20 text-[#FFC703]',
    admin: 'bg-[#FFC703]/15 text-[#FFC703]/80',
    supervisor: 'bg-white/10 text-white/70',
    worker: 'bg-white/5 text-white/50',
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
        const cleanEmail = sanitizeInput(newMemberEmail.trim(), 254);
        if (!cleanEmail || !validateEmail(cleanEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        try {
            await inviteTeamMember({
                cantiere_id: cantiereId,
                email: cleanEmail,
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
                return <Badge className="bg-[#FFC703]/15 text-[#FFC703]/80 border-none"><CheckCircle size={12} className="mr-1" /> Active</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> Pending</Badge>;
            case 'declined':
                return <Badge className="bg-red-500/20 text-red-400 border-none">Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="text-[#FFC703]" size={24} />
                    <h3 className="text-xl font-medium text-white">Team Management</h3>
                    <Badge variant="outline" className="text-white/40">
                        {teamWithActivity.filter(m => m.status === 'accepted').length} attivi
                    </Badge>
                </div>
                {canManageTeam && (
                    <Button
                        onClick={() => setInviteModalOpen(true)}
                        className="bg-gradient-to-r from-[#FFC703] to-[#FFC703] hover:from-[#FFC703] hover:to-[#FFC703]"
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
                        <div key={role.id} className="flex items-center gap-2 bg-[#535252]/ px-3 py-1.5 rounded-lg text-xs">
                            <IconComponent size={14} className="text-white/40" />
                            <span className="text-white/40">{role.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamWithActivity.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-[#1C1A18]/ rounded-xl border border-white/10">
                        <Users size={40} className="text-white/25 mx-auto mb-3" />
                        <p className="text-white/40">No team members yet</p>
                        {canManageTeam && (
                            <p className="text-xs text-white/25 mt-1">Clicca "Invita Membro" per iniziare</p>
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
                                className="bg-[#1C1A18] rounded-xl border border-white/10 overflow-hidden"
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
                                                <p className="text-white font-medium">{member.email}</p>
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
                                            className={`text-white/25 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle size={12} className="text-[#FFC703]/70" />
                                            {member.stats?.tasksCompleted || 0} completati
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="text-yellow-400" />
                                            {member.stats?.tasksPending || 0} in corso
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Activity size={12} className="text-[#FFC703]" />
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
                                            className="border-t border-white/10"
                                        >
                                            <div className="p-4 space-y-4">
                                                {/* Recent Activity */}
                                                <div>
                                                    <p className="text-xs text-white/25 mb-2">Attività Recente</p>
                                                    {member.recentActivity?.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {member.recentActivity.slice(0, 3).map((activity, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-xs text-white/40">
                                                                    <span className="w-2 h-2 rounded-full bg-[#FFC703]/60" />
                                                                    <span>{activity.action}</span>
                                                                    <span className="text-white/25">{activity.entity_name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-white/25">No attività recente</p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {canManageTeam && member.email !== userEmail && (
                                                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                                        {canChangeRoles && (
                                                            <Select
                                                                value={member.role}
                                                                onValueChange={(value) => handleRoleChange(member._id, value)}
                                                            >
                                                                <SelectTrigger className="flex-1 bg-[#535252] border-white/10 text-white h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-[#1C1A18] border-white/10">
                                                                    {roleOptions.map(role => (
                                                                        <SelectItem key={role.id} value={role.id} className="text-white text-xs">
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
                                                                className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] h-8 text-xs font-medium"
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
                <DialogContent className="bg-[#1C1A18] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white/70">Email</Label>
                            <Input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                placeholder="esempio@email.com"
                                className="bg-[#535252] border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/70">Ruolo</Label>
                            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                <SelectTrigger className="bg-[#535252] border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1C1A18] border-white/10">
                                    {roleOptions.map(role => (
                                        <SelectItem key={role.id} value={role.id} className="text-white">
                                            <div>
                                                <p>{role.label}</p>
                                                <p className="text-xs text-white/25">{role.description}</p>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleInvite} disabled={!newMemberEmail} className="w-full bg-[#FFC703] hover:bg-[#FFC703]">
                            <UserPlus size={16} className="mr-2" /> Send Invite
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

