import React from 'react';
import { BarChart3, Folder, GitBranch, Mail, MessageSquare, Smartphone, Bell, Send } from 'lucide-react';
import { NodeType } from '../../../types/explorer';

interface TreeNodeIconProps {
  type: NodeType;
  label: string;
  color: string;
  size?: number;
}

export const TreeNodeIcon: React.FC<TreeNodeIconProps> = ({ type, label, color, size = 14 }) => {
  if (type === 'canal') {
    const lower = label.toLowerCase();
    if (lower === 'email') return <Mail size={size} style={{ color }} />;
    if (lower === 'sms') return <Smartphone size={size} style={{ color }} />;
    if (lower === 'whatsapp') return <MessageSquare size={size} style={{ color }} />;
    if (lower === 'push') return <Bell size={size} style={{ color }} />;
    return <Mail size={size} style={{ color }} />;
  }

  switch (type) {
    case 'bu': return <BarChart3 size={size} style={{ color }} />;
    case 'segmento': return <Folder size={size} style={{ color }} />;
    case 'jornada': return <GitBranch size={size} style={{ color }} />;
    case 'disparo': return <Send size={size - 1} style={{ color }} />;
    default: return <Folder size={size} style={{ color }} />;
  }
};
