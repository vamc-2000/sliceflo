

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, Users, X, Send } from 'lucide-react';

const getAvatarColor = (id: string) => {
  if (!id) return 'bg-blue-500';
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500'
  ];
  // Parse ID or hash it if it's alphanumeric to reliably get a number
  const num = parseInt(id);
  const index = (isNaN(num) ? Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) : num) % colors.length;
  return colors[index];
};

interface Member {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  location?: string;
  teams?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

const MemberDetailsModal: React.FC<Props> = ({ open, onClose, member }) => {
  if (!member) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSendEmail = () => {
    if (member.email) {
      window.location.href = `mailto:${member.email}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-95 rounded-xl p-6 border-0 border-b-[5px] border-[#001F3F]">
        {/* Close Button */}
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button> */}

        {/* Header with Avatar */}
        <DialogHeader className="text-center">
          <div className="flex flex-col items-center mb-2">
            <Avatar className="w-24 h-24 mb-3">
              <AvatarImage src={member.avatar || ''} alt={member.name} />
              <AvatarFallback className={`${getAvatarColor(member.id)} text-white text-xl font-semibold`}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-xl font-bold">
              {member.name}
              {/* {member.name.length > 10
                ? `${member.name.slice(0, 10)}...`
                : member.name} */}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {member.role || 'No Role'}
            </p>
          </div>
          <Separator className='bg-[#C7C7CC] h-px'/>
        </DialogHeader>

        {/* Contact Details */}
        <div className="mt-0">
          <h3 className="text-base font-semibold text-center mb-3">
            Contact Details
          </h3>

          {/* Phone */}
          <div className="flex items-center py-3 border-b border-[#C7C7CC]">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <Phone className="h-4 w-4 text-[#0A2540]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900">Phone</p>
              <p className="text-sm text-gray-600">
                {member.phone || '+91 99999 99999'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center py-3 border-b border-[#C7C7CC]">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <Mail className="h-4 w-4 text-[#0A2540]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-600 truncate">
                {member.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSendEmail}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 ml-2"
            >
              <Send className="h-4 w-4 text-[#0A2540]" />
            </Button>
          </div>

          {/* Location */}
          <div className="flex items-center py-3 border-b border-[#C7C7CC]">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <MapPin className="h-4 w-4 text-[#0A2540]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900">City, Country</p>
              <p className="text-sm text-gray-600">
                {member.location || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center py-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-[#0A2540]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900">Team</p>
              <p className="text-sm text-gray-600">
                {member.teams && member.teams.length > 0
                  ? member.teams.join(', ')
                  : 'No teams assigned'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsModal;
