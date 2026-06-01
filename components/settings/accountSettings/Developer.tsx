'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Trash2 } from 'lucide-react';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';

interface PersonalAccessToken {
  id: string;
  token: string;
  secretKey: string;
  createdOn: string;
  status: 'Active' | 'Inactive';
  expiryDate: string;
  description: string;
}

const tokensData: PersonalAccessToken[] = [
  {
    id: '1',
    token: 'A',
    secretKey: 'sk...gl5a',
    createdOn: 'Aug 1, 2025',
    status: 'Active',
    expiryDate: 'Nov 7, 2025 at 10:24 AM',
    description: 'Description....'
  },
  {
    id: '2',
    token: 'B',
    secretKey: 'sk...glBhj',
    createdOn: 'Aug 1, 2025',
    status: 'Active',
    expiryDate: 'Never expires',
    description: 'Description....'
  }
];

export default function Developer() {
  const [activeSection, setActiveSection] = useState<'tokens' | null>(null);
  const [tokens, setTokens] = useState<PersonalAccessToken[]>(tokensData);

  const handleDeleteToken = (id: string) => {
    setTokens(tokens.filter(token => token.id !== id));
    toast("success", { title: "Success", description: "Token deleted successfully" });
  };

  const handleGenerateToken = () => {
    console.log('Generate new token');
    toast("success", { title: "Success", description: "New token generated" });
  };

  return (
    <div className="w-full space-y-6">
      <SettingsCard
        id="tokens"
        title="Personal Access Tokens"
        subtitle="Generate secure API tokens to integrate your data with external applications."
        icon={
          <Image
            src="/icons/personalAccesIcon.svg"
            alt="Personal Access Tokens"
            width={50}
            height={50}
          />
        }
        isActive={activeSection === 'tokens'}
        onToggle={() => setActiveSection((prev) => (prev === 'tokens' ? null : 'tokens'))}
        actionButton={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                Generate Personal Access Token
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGenerateToken}>
                Generate New Token
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="w-full overflow-x-auto">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Token
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Secret Key
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Created On
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Expiry Date & Time
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs uppercase text-primary">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id} className="hover:bg-muted">
                    <TableCell className="text-left">
                      <div>
                        <div className="font-semibold text-sm text-primary">
                          {token.token}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {token.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <code className="text-sm text-primary bg-muted px-2 py-1 rounded">
                        {token.secretKey}
                      </code>
                    </TableCell>
                    <TableCell className="text-center text-sm text-primary">
                      {token.createdOn}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                      >
                        {token.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-primary">
                      {token.expiryDate}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SettingsCard>
    </div>

  );
}
