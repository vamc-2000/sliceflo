// components/ColorIconPicker.tsx

'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Search } from 'lucide-react'
import {
    IoAdd, IoPersonSharp, IoTimeSharp, IoMenu, IoReorderThreeSharp, IoReorderFourSharp, IoListSharp, IoApps,
    IoGridSharp, IoRemove, IoArrowUpSharp, IoAppsSharp, IoArchiveSharp, IoArrowDownSharp, IoStopCircleSharp,
    IoLibrarySharp, IoFlashSharp, IoTrophySharp, IoSparklesSharp, IoHomeSharp, IoCafeSharp, IoRestaurantSharp, IoBrushSharp,
    IoServerSharp, IoHardwareChipSharp, IoBugSharp, IoBookSharp, IoChevronDownSharp, IoChevronBackSharp, IoChevronForwardSharp, IoChevronUpSharp,
    IoColorPaletteSharp, IoHelpBuoySharp, IoBarChartSharp, IoStopSharp, IoPlaySharp, IoAttachSharp, IoHelpCircleSharp, IoDownloadSharp,
    IoExpandSharp, IoContractSharp, IoSunnySharp, IoMoonSharp, IoCloudSharp,
    IoCameraSharp, IoDesktopSharp, IoCreateSharp, IoHandLeftSharp, IoPencilSharp, IoAtSharp, IoListOutline,
    IoPricetagSharp, IoHappySharp, IoCalculatorSharp, IoLayersSharp, IoCopySharp, IoCutSharp, IoDocumentSharp, IoDocumentTextSharp,
    IoAlarmSharp, IoStarSharp, IoImageSharp, IoVideocamSharp, IoFolderOpenSharp, IoPeopleSharp
} from 'react-icons/io5'

export interface IconLibraryItem {
    name: string;
    icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
    category: string;
}

export const iconLibrary: IconLibraryItem[] = [
    { name: 'add', icon: IoAdd, category: 'general' },
    { name: 'person', icon: IoPersonSharp, category: 'people' },
    { name: 'time', icon: IoTimeSharp, category: 'time' },
    { name: 'menu', icon: IoMenu, category: 'layout' },
    { name: 'reorder-three', icon: IoReorderThreeSharp, category: 'layout' },
    { name: 'reorder-four', icon: IoReorderFourSharp, category: 'layout' },
    { name: 'list', icon: IoListSharp, category: 'layout' },
    { name: 'apps', icon: IoApps, category: 'general' },
    { name: 'grid', icon: IoGridSharp, category: 'layout' },
    { name: 'remove', icon: IoRemove, category: 'general' },
    { name: 'arrow-up', icon: IoArrowUpSharp, category: 'arrows' },
    { name: 'apps-sharp', icon: IoAppsSharp, category: 'layout' },
    { name: 'archive', icon: IoArchiveSharp, category: 'files' },
    { name: 'arrow-down', icon: IoArrowDownSharp, category: 'arrows' },
    { name: 'stop-circle', icon: IoStopCircleSharp, category: 'general' },
    { name: 'library', icon: IoLibrarySharp, category: 'business' },
    { name: 'flash', icon: IoFlashSharp, category: 'general' },
    { name: 'trophy', icon: IoTrophySharp, category: 'awards' },
    { name: 'sparkles', icon: IoSparklesSharp, category: 'general' },
    { name: 'home', icon: IoHomeSharp, category: 'general' },
    { name: 'cafe', icon: IoCafeSharp, category: 'food' },
    { name: 'restaurant', icon: IoRestaurantSharp, category: 'food' },
    { name: 'brush', icon: IoBrushSharp, category: 'design' },
    { name: 'server', icon: IoServerSharp, category: 'tech' },
    { name: 'hardware-chip', icon: IoHardwareChipSharp, category: 'tech' },
    { name: 'bug', icon: IoBugSharp, category: 'tech' },
    { name: 'book', icon: IoBookSharp, category: 'files' },
    { name: 'chevron-down', icon: IoChevronDownSharp, category: 'arrows' },
    { name: 'chevron-back', icon: IoChevronBackSharp, category: 'arrows' },
    { name: 'chevron-forward', icon: IoChevronForwardSharp, category: 'arrows' },
    { name: 'chevron-up', icon: IoChevronUpSharp, category: 'arrows' },
    { name: 'color-palette', icon: IoColorPaletteSharp, category: 'design' },
    { name: 'help-buoy', icon: IoHelpBuoySharp, category: 'general' },
    { name: 'bar-chart', icon: IoBarChartSharp, category: 'business' },
    { name: 'stop', icon: IoStopSharp, category: 'shapes' },
    { name: 'play', icon: IoPlaySharp, category: 'shapes' },
    { name: 'attach', icon: IoAttachSharp, category: 'general' },
    { name: 'help-circle', icon: IoHelpCircleSharp, category: 'general' },
    { name: 'download', icon: IoDownloadSharp, category: 'general' },
    { name: 'expand', icon: IoExpandSharp, category: 'general' },
    { name: 'contract', icon: IoContractSharp, category: 'general' },
    { name: 'sunny', icon: IoSunnySharp, category: 'weather' },
    { name: 'moon', icon: IoMoonSharp, category: 'weather' },
    { name: 'cloud', icon: IoCloudSharp, category: 'weather' },
    { name: 'camera', icon: IoCameraSharp, category: 'tech' },
    { name: 'desktop', icon: IoDesktopSharp, category: 'tech' },
    { name: 'create', icon: IoCreateSharp, category: 'text' },
    { name: 'hand-left', icon: IoHandLeftSharp, category: 'general' },
    { name: 'pencil', icon: IoPencilSharp, category: 'tools' },
    { name: 'at', icon: IoAtSharp, category: 'communication' },
    { name: 'list-outline', icon: IoListOutline, category: 'layout' },
    { name: 'pricetag', icon: IoPricetagSharp, category: 'general' },
    { name: 'happy', icon: IoHappySharp, category: 'emoji' },
    { name: 'calculator', icon: IoCalculatorSharp, category: 'general' },
    { name: 'layers', icon: IoLayersSharp, category: 'design' },
    { name: 'copy', icon: IoCopySharp, category: 'general' },
    { name: 'cut', icon: IoCutSharp, category: 'tools' },
    { name: 'document', icon: IoDocumentSharp, category: 'files' },
    { name: 'document-text', icon: IoDocumentTextSharp, category: 'files' },
    { name: 'alarm', icon: IoAlarmSharp, category: 'time' },
    { name: 'star', icon: IoStarSharp, category: 'general' },
    { name: 'image', icon: IoImageSharp, category: 'files' },
    { name: 'videocam', icon: IoVideocamSharp, category: 'files' },
    { name: 'folder-open', icon: IoFolderOpenSharp, category: 'files' },
    { name: 'people', icon: IoPeopleSharp, category: 'people' }
];

export const iconComponentMap: Record<
    string,
    React.ComponentType<{ size?: number; color?: string; className?: string }>
> = iconLibrary.reduce((acc, item) => {
    acc[item.name] = item.icon;
    return acc;
}, {} as Record<string, any>);


const colors = [
    '#FF3B30', '#FF9500', '#34C759', '#FFCC00', '#00C7BE', '#007AFF',
    '#5856D6', '#AF52DE', '#FF2D55', '#001F3F', '#A2845E',
];

export interface IconData {
    type: 'icon' | 'file';
    icon?: string;
    iconId?: string | null;
    image?: string;
    imageId?: string | null;
    color: string;
    name?: string;
}

interface ColorIconPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (iconData: IconData) => void;
    currentIcon?: string | null;
    currentColor?: string;
    currentType?: 'icon' | 'file';
    mode?: 'icon' | 'color';
    isInline?: boolean;

    onUpload?: (file: File) => Promise<{ id: string; url?: string }>;
    onDelete?: (uploadId: string) => Promise<void>;
}

const ColorIconPicker: React.FC<ColorIconPickerProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentIcon = null,
    currentColor = '#6366f1',
    currentType = 'icon',
    mode = 'icon',
    isInline = false,
    onUpload,
    onDelete
}) => {
    const [activeTab, setActiveTab] = useState<'Icon' | 'Upload'>(currentType === 'file' ? 'Upload' : 'Icon')
    const [selectedColor, setSelectedColor] = useState(currentColor)
    const [searchTerm, setSearchTerm] = useState('')
    const [uploadedImage, setUploadedImage] = useState<string | null>(
        currentType === 'file' ? currentIcon : null
    )
    const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
    const [sliderPosition, setSliderPosition] = useState(50)
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const filteredIcons = iconLibrary.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleColorChange = (color: string): void => {
        setSelectedColor(color);

        if (mode === 'color') {
            onSelect({
                type: 'icon',
                color: color,
                icon: currentIcon || undefined
            });
            onClose();
        }
    };


    const handleSliderChange = (e: React.MouseEvent<HTMLDivElement>): void => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
        setSliderPosition(percent)
        const hue = (percent / 100) * 360
        const hexColor = hslToHex(hue, 70, 50)
        setSelectedColor(hexColor)
    }

    const hslToHex = (h: number, s: number, l: number): string => {
        l /= 100
        const a = s * Math.min(l, 1 - l) / 100
        const f = (n: number) => {
            const k = (n + h / 30) % 12
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
            return Math.round(255 * color).toString(16).padStart(2, '0')
        }
        return `#${f(0)}${f(8)}${f(4)}`
    }

    const handleIconSelect = (iconData: IconLibraryItem): void => {
        onSelect({
            type: 'icon',
            icon: iconData.name,
            color: selectedColor,
            name: iconData.name
        })
        onClose()
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be under 5MB')
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Only image files are allowed')
            return
        }

        setIsUploading(true)
        setUploadError(null)

        try {
            if (onUpload) {
                console.log('🚀 Starting file upload:', file.name);

                // Upload file with 3-step process
                const result = await onUpload(file)

                console.log("✅ File upload completed, ID:", result.id);

                // Construct image URL
                const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;
                const imageUrl = `${s3BaseUrl}/${result.url}`;

                console.log("📷 Image URL:", imageUrl);

                // Update state with uploaded image
                setUploadedImage(imageUrl)
                setUploadedImageId(result.id);
                setActiveTab('Upload')

                console.log('✅ Icon upload state updated');
            }
        } catch (error: any) {
            console.error('❌ Upload error:', error)
            setUploadError(error?.message || 'Failed to upload image. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleUploadSelect = (): void => {
        if (uploadedImage) {
            onSelect({
                type: 'file',
                image: uploadedImage,
                imageId: uploadedImageId,
                color: selectedColor,
            })
            onClose()
        }
    }

    const handleDeleteImage = async (): Promise<void> => {
        try {
            setIsUploading(true);
            setUploadError(null);

            // ✅ Call parent's delete handler if provided
            if (uploadedImageId && onDelete) {
                console.log('🗑️ Requesting parent to delete image, ID:', uploadedImageId);

                await onDelete(uploadedImageId);

                console.log('✅ Image deleted via parent handler');
            }

            // Clear local state
            setUploadedImage(null);
            setUploadedImageId(null);
            setActiveTab('Icon');

            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error: any) {
            console.error('❌ Error deleting image:', error);
            setUploadError(error?.message || 'Failed to delete image');
        } finally {
            setIsUploading(false);
        }
    }

    const handleUploadNew = async (): Promise<void> => {
        try {
            setIsUploading(true);
            setUploadError(null);

            // ✅ Delete old image before uploading new one
            if (uploadedImageId && onDelete) {
                console.log('🗑️ Deleting old image before new upload, ID:', uploadedImageId);

                // await onDelete(uploadedImageId);

                console.log('✅ Old image deleted');

                // Clear old image state
                setUploadedImage(null);
                setUploadedImageId(null);
            }

            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Open file picker
            setTimeout(() => {
                fileInputRef.current?.click();
            }, 100);

        } catch (error: any) {
            console.error('❌ Error deleting old image:', error);
            setUploadError(error?.message || 'Failed to delete old image');
        } finally {
            setIsUploading(false);
        }
    }

    if (!isOpen) return null

    const content = (
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-xs flex flex-col overflow-hidden border border-border border-b-4 border-b-primary"
                data-testid="modal-content"
                onClick={isInline ? undefined : (e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-2 border-b border-border"
                    data-testid="modal-header"
                >
                    <h3 className="font-semibold text-sm text-foreground"
                        data-testid="modal-title"
                    >
                        {mode === 'icon' ? 'Color & icon' : 'Color'}</h3>
                    <button
                        onClick={onClose}
                        data-testid="close-modal-button"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Color Picker Section */}
                <div className="p-2 border-b border-border"
                    data-testid="color-picker-section"
                >
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                        HEX <span className="text-foreground ml-1"
                            data-testid="selected-color-hex"
                        >
                            {selectedColor}</span>
                    </div>

                    {/* Gradient Background */}
                    <div
                        data-testid="color-gradient-preview"
                        className="w-full h-24 rounded-xl mb-1 relative border border-border"
                        style={{
                            background: `linear-gradient(135deg,
                rgba(0,0,0,0.9) 0%,
                rgba(0,0,0,0.7) 30%,
                ${selectedColor}80 60%,
                ${selectedColor} 100%)`
                        }}
                    />

                    {/* Color Slider */}
                    <div className="mb-2">
                        <div
                            data-testid="color-slider"
                            className="w-full h-3 rounded-full relative cursor-pointer border border-border"
                            style={{
                                background:
                                    'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
                            }}
                            onClick={handleSliderChange}
                        >
                            <div
                                data-testid="color-slider-thumb"
                                className="w-4 h-4 bg-background border-2 border-border rounded-full absolute top-[-2px] shadow-sm"
                                style={{ left: `calc(${sliderPosition}% - 8px)` }}
                            />
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex flex-wrap gap-1"
                        data-testid="color-palette"
                    >
                        {/* No Color Button */}
                        <button
                            onClick={() => setSelectedColor('transparent')}
                            data-testid="color-transparent-button"
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center relative ${selectedColor === 'transparent' ? 'border-ring' : 'border-border'
                                }`}
                            style={{ background: 'var(--background)' }}
                        >
                            <div className="w-0.5 h-5 bg-red-500 rotate-45 absolute" />
                        </button>

                        {/* Color Swatches */}
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                data-testid={`color-swatch-${color.replace('#', '')}`}
                                className={`w-5 h-5 rounded-full border-2 ${selectedColor === color ? 'border-ring ring-1 ring-primary' : 'border-border'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Tabs - Only show when mode is 'icon' */}
                {mode === 'icon' && (
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('Icon')}
                            data-testid="icon-tab-button"
                            className={`px-6 py-1 text-xs font-medium transition-colors ${activeTab === 'Icon'
                                ? 'text-primary border-b-2 border-primary bg-muted'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Icon
                        </button>
                        <button
                            onClick={() => setActiveTab('Upload')}
                            data-testid="upload-tab-button"
                            className={`px-6 py-1 text-xs font-medium transition-colors ${activeTab === 'Upload'
                                ? 'text-primary border-b-2 border-primary bg-muted'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Upload
                        </button>
                    </div>
                )}


                {/* Content */}
                {mode === 'icon' && (
                    <div className="flex-1 overflow-hidden"
                        data-testid="tab-content-container"
                    >
                        {activeTab === 'Icon' && (
                            <div className="p-3"
                                data-testid="icon-tab-content"
                            >

                                {/* Search */}
                                <div className="relative mb-1"
                                    data-testid="icon-search-container"
                                >
                                    <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        data-testid="icon-search-input"
                                        className="w-full pl-9 pr-4 py-2 border border-input bg-background text-foreground rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                                    />
                                </div>

                                {/* Icons Grid */}
                                <div
                                    data-testid="icons-grid"
                                    className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto overflow-x-hidden 
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-muted
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-primary
  ">
                                    {filteredIcons.map(iconData => {
                                        const IconComponent = iconData.icon
                                        const isHovered = hoveredIcon === iconData.name

                                        return (
                                            <button
                                                key={iconData.name}
                                                onClick={() => handleIconSelect(iconData)}
                                                onMouseEnter={() => setHoveredIcon(iconData.name)}
                                                onMouseLeave={() => setHoveredIcon(null)}
                                                data-testid={`icon-button-${iconData.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded transition-colors"
                                                title={iconData.name}
                                            >
                                                <IconComponent
                                                    size={18}
                                                    color={isHovered ? selectedColor : 'currentColor'}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Upload' && (
                            <div className="p-4 flex flex-col h-full"
                                data-testid="upload-tab-content"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileUpload}
                                    data-testid="file-input"
                                    className="hidden"
                                />

                                {!uploadedImage ? (
                                    <div className="flex-1 flex flex-col items-center justify-center bg-muted py-4 rounded-md"
                                        data-testid="upload-empty-state"
                                    >
                                        <div className="w-12 h-12 bg-brand-orange/20 rounded-full flex items-center justify-center mb-3">
                                            <Upload size={20} className="text-brand-orange" />
                                        </div>
                                        <h4 className="font-semibold text-sm mb-1 text-foreground"
                                            data-testid="upload-title"
                                        >
                                            Upload sources</h4>
                                        <p className="text-xs text-muted-foreground text-center mb-4"
                                            data-testid="upload-description"
                                        >
                                            Choose a square PNG or JPEG
                                            <br />
                                            image under 5MB
                                        </p>

                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            data-testid="choose-file-button"
                                            className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isUploading ? 'Uploading...' : 'Choose File'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center"
                                        data-testid="upload-preview-state"
                                    >
                                        <div className="mb-4">
                                            <img
                                                src={uploadedImage}
                                                alt="Uploaded icon"
                                                data-testid="uploaded-image-preview"
                                                className="w-24 h-24 object-cover rounded-lg border border-border"
                                            />
                                        </div>
                                        <div className="flex gap-2 mb-3"
                                            data-testid="upload-actions"
                                        >
                                            <button
                                                onClick={handleUploadNew}
                                                data-testid="upload-new-button"
                                                className="px-3 py-1.5 border border-input text-muted-foreground text-xs rounded-lg hover:bg-muted transition-colors"
                                            >
                                                Upload new
                                            </button>
                                            <button
                                                onClick={handleDeleteImage}
                                                data-testid="delete-image-button"
                                                className="px-3 py-1.5 text-destructive border border-destructive/30 text-xs rounded-lg hover:bg-destructive/10 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleUploadSelect}
                                            data-testid="use-image-button"
                                            className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            Use This Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
    );

    if (isInline) {
        return content;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 top-10 bg-background/60"
            data-testid="color-icon-modal"
            onClick={onClose}
        >
            {content}
        </div>
    )
}

export default ColorIconPicker
