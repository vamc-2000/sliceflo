"use client";

import { FC, useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LuFileImage } from "react-icons/lu";
import { Trash2, Pencil } from "lucide-react";

interface ImageUploadModalProps {
    open: boolean;
    onClose: () => void;
    onFileSelect: (file: File) => void;
    initialImage?: string | null;
}

const ImageUploadModal: FC<ImageUploadModalProps> = ({ open, onClose, onFileSelect, initialImage }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            if (initialImage) {
                setPreviewUrl(initialImage);
            } else {
                setPreviewUrl(null);
            }
            setSelectedFile(null);
        }
    }, [open, initialImage]);

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onFileSelect(selectedFile);
            setSelectedFile(null);
            setPreviewUrl(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-md rounded-2xl"
                style={{
                    border: "2px solid #9CA3AF",
                    borderBottom: "7px solid #001F3F",
                    borderBottomLeftRadius: "16px",
                    borderBottomRightRadius: "16px",
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Upload image</DialogTitle>
                </DialogHeader>

                {/* Upload area */}
                <div className="flex flex-col items-center justify-center border-2 border-gray-400 rounded-lg p-4 w-60 h-60 mx-auto relative overflow-hidden">
                    {previewUrl ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                                width={240}
                                height={240}
                            />
                            {selectedFile && (
                                <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-1 text-[10px] truncate backdrop-blur-sm">
                                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </div>
                            )}

                            {/* Small edit icon button (bottom-right corner) */}
                            <label
                                htmlFor="file-upload"
                                className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 cursor-pointer"
                            >
                                <Pencil className="w-4 h-4 text-gray-700" />
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    ) : (
                        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-full w-20 aspect-square">
                                <LuFileImage className="w-8 h-8 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 mt-2">Upload image here</span>
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    )}
                </div>

                <p className="mt-2 text-xs text-gray-400">File formats supported - jpeg, jpg, png, webp</p>

                {/* Footer */}
                <div className="relative">
                    <DialogFooter className="flex justify-end mt-4 pr-2">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} className="text-[#8E8E93]">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!selectedFile}
                                // className="bg-[#F2F2F7] text-[#8E8E93]"
                                className={`${selectedFile
                                    ? "bg-[#001F3F] text-white hover:bg-[#01172C]"
                                    : "bg-[#F2F2F7] text-[#8E8E93] cursor-not-allowed"
                                    }`}
                            >
                                Upload & Save
                            </Button>
                        </div>

                        {/* Trash button to clear current selection */}
                        {previewUrl && (
                            <Button
                                variant="ghost"
                                className="absolute left-1 text-[#8E8E93] hover:text-red-600"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageUploadModal;
