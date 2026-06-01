"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Zap, Check, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CancelIcon } from '@/public/icons/cancel';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/layout/DataTable';

interface PaymentsSubscriptionsPageProps {
  onClose?: () => void;
}

// Define the Purchase History type
type PurchaseHistory = {
  orderId: string;
  date: string;
  plan: string;
  card: string;
  status: string;
};

const PaymentsSubscriptionsPage: React.FC<PaymentsSubscriptionsPageProps> = ({ onClose }) => {
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const router = useRouter();

  // Generate mock data
  const purchaseData: PurchaseHistory[] = Array.from({ length: 12 }, (_, index) => ({
    orderId: `#${15267 + index}`,
    date: new Date(2024, index, 1).toLocaleDateString(),
    plan: 'Basic',
    card: 'VISA **67',
    status: 'Success',
  }));

  // Define columns for DataTable
  const columns: ColumnDef<PurchaseHistory>[] = [
    {
      accessorKey: 'orderId',
      header: 'Order ID',
      cell: ({ row }) => (
        <div className="font-inter text-[12px] font-normal leading-4 text-foreground">
          {row.getValue('orderId')}
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="font-inter text-[12px] font-normal leading-4 text-foreground">
          {row.getValue('date')}
        </div>
      ),
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => (
        <div className="font-inter text-[12px] font-normal leading-4 text-foreground">
          {row.getValue('plan')}
        </div>
      ),
    },
    {
      accessorKey: 'card',
      header: 'Card',
      cell: ({ row }) => (
        <div className="font-inter text-[12px] font-normal leading-4 text-foreground">
          {row.getValue('card')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="font-inter text-[12px] font-normal leading-4 text-foreground">
          {row.getValue('status')}
        </div>
      ),
    },
    {
      id: 'download',
      header: 'Download',
      cell: () => (
        <div className="flex justify-center">
          <button
            className="p-1 hover:bg-muted rounded transition-colors"
            onClick={() => toast.success('Downloading invoice...')}
          >
            <Download className="h-4 w-4 text-primary" />
          </button>
        </div>
      ),
    },
  ];

  const handleCancelClick = () => {
    setOpenCancelDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenCancelDialog(false);
  };

  const handleCancelSubscription = () => {
    setOpenCancelDialog(false);
    toast.success('Subscription cancelled');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-inter text-[20px] font-semibold leading-[100%] text-primary tracking-[0px]">
          Payments & Subscriptions
        </h2>
        <p className="font-inter text-[10px] font-medium text-muted-foreground mt-1">
          Your Next Billing Cycle is on JULY, 31 2024
        </p>
      </div>

      {/* Current Plan Section */}
      <div className="flex gap-6">
        {/* Plan Card */}
        <Card className="w-[450px] border shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-inter text-[16px] font-medium leading-[100%] text-foreground mb-2 tracking-[0px]">
              Basic plan
            </h3>
            <div className="font-inter text-[32px] font-semibold leading-[100%] text-foreground my-4 tracking-[0px]">
              $10/mth
            </div>
            <p className="font-inter text-[14px] font-normal leading-5 text-muted-foreground mb-4 tracking-[0px]">
              Billed annually.
            </p>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter text-[14px] font-medium leading-5 tracking-[0px]"
              onClick={() => {
                router.push('/dashboard');
                onClose?.();
              }}
            >
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="flex-1 pt-6 pl-4">
          {[
            'Access to all basic features',
            'Basic reporting and analytics',
            'Up to 10 individual users',
            '20GB individual data each user',
            'Basic chat and email support',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="font-inter text-[14px] font-normal leading-5 text-foreground tracking-[0px]">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase History Section */}
      <div className="space-y-2">
        <h3 className="font-inter text-[16px] font-semibold leading-[100%] text-foreground tracking-[0px]">
          Purchase History
        </h3>
        <p className="font-inter text-[12px] font-normal leading-4 text-muted-foreground tracking-[0px]">
          Below you can see your purchase history, you won&apos;t lose all your data, progress, files, and team projects.
        </p>

        {/* DataTable Container with fixed height and overscroll-behavior */}
        <div className="mt-4 relative max-h-[400px] overflow-auto overscroll-contain">
          <DataTable
            columns={columns}
            data={purchaseData}
            searchPlaceholder="Search orders..."
            enableGlobalFilter={true}
            emptyMessage="No purchase history found."
          />
        </div>
      </div>

      {/* Cancel Subscription Section */}
      <div className="space-y-2">
        <h3 className="font-inter text-[16px] font-semibold leading-[100%] text-foreground tracking-[0px]">
          Cancel Subscription
        </h3>
        <p className="font-inter text-[12px] font-normal leading-4 text-muted-foreground tracking-[0px]">
          By canceling your subscription you won&apos;t be able to utilize all the features.
        </p>
        <Button
          variant="link"
          onClick={handleCancelClick}
          className="text-destructive hover:text-destructive/90 p-0 h-auto mt-2 font-inter text-[14px] font-medium leading-5 tracking-[0px]"
        >
          Cancel Subscription
        </Button>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <CancelIcon />
              </div>
              <AlertDialogTitle className="font-inter text-[18px] font-semibold leading-[100%] text-foreground tracking-[0px]">
                Cancel Subscription
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-inter text-[14px] font-normal leading-5 text-muted-foreground tracking-[0px]">
              Are you sure want to cancel subscription? You will be losing all the advanced features and integrations in future, you can always change subscription plan if you want.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialog} className="font-inter text-[14px] font-medium leading-5 text-foreground tracking-[0px]">
              Change Plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-inter text-[14px] font-medium leading-5 tracking-[0px]"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-inter text-[14px] font-medium leading-5 tracking-[0px]"
          onClick={() => toast.success('Settings saved')}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default PaymentsSubscriptionsPage;
