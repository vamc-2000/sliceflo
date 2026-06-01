"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LogoutConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-xl p-6 text-center border-0 border-b-[5px] border-[#001F3F]">

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center"
                >
                    <DialogTitle asChild>
                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg font-semibold text-[#001F3F] dark:text-white"
                        >
                            Are you sure you want to logout?
                        </motion.h2>
                    </DialogTitle>

                    {/* Image animation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                        className="my-4"
                    >
                        <Image
                            src="/images/logout.svg"
                            alt="Logout"
                            width={100}
                            height={100}
                        />
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-gray-500 dark:text-gray-400"
                    >
                        You will need to login again to access your account.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="flex w-full gap-3 mt-6"
                    >
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {isLoading ? "Logging out..." : "Logout"}
                        </Button>
                    </motion.div>
                </motion.div>

            </DialogContent>
        </Dialog>
    );
};

export default LogoutConfirmModal;