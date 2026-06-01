
'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Search } from 'lucide-react'

// Import icons from react-icons/io5 (flat bold style)
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

// Exporting iconLibrary for use elsewhere (like team icon box)
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
]

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#e11d48', // pink
  '#6b7280', // gray
  '#84cc16', // lime
  '#f59e0b', // amber
  '#10b981', // emerald
];

interface IconData {
  type: 'icon' | 'file';
  icon?: string;
  image?: string;
  color: string;
  name?: string;
}

interface ColorIconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconData: IconData) => void;
  currentIcon?: string | null;
  currentColor?: string;
  mode?: 'icon' | 'color';
}

const ColorIconPicker: React.FC<ColorIconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon = null,
  currentColor = '#6366f1',
  mode = 'icon'
}) => {
  const [activeTab, setActiveTab] = useState<'Icon' | 'Upload'>(
    currentIcon && currentIcon.startsWith('data:') ? 'Upload' : 'Icon'
  )
  const [selectedColor, setSelectedColor] = useState<string>(currentColor)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentIcon?.startsWith('data:') ? currentIcon : null
  )
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredIcons = iconLibrary.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleColorChange = (color: string): void => {
    setSelectedColor(color)
  }

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = () => {
        setUploadedImage(reader.result as string)
        setActiveTab('Upload')
      }
      reader.readAsDataURL(file)
    } else if (file) {
      alert('File size must be under 5MB')
    }
  }

  const handleUploadSelect = (): void => {
    if (uploadedImage) {
      onSelect({
        type: 'file',
        image: uploadedImage,
        color: selectedColor
      })
      onClose()
    }
  }

  const handleDeleteImage = (): void => {
    setUploadedImage(null)
    setActiveTab('Icon')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadNew = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-90 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-900">Color & icon</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Color Picker Section */}
        <div className="p-2 border-b  border-gray-100">
          <div className="text-xs text-gray-500 mb-3 font-medium">
            HEX <span className="text-gray-800 ml-1">{selectedColor}</span>
          </div>

          {/* Gradient Background */}
          <div
            className="w-full h-24 rounded-xl mb-3 relative border border-gray-200"
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
              className="w-full h-3 rounded-full relative cursor-pointer border border-gray-200"
              style={{
                background:
                  'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
              }}
              onClick={handleSliderChange}
            >
              <div
                className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full absolute top-[-2px] shadow-sm"
                style={{ left: `calc(${sliderPosition}% - 8px)` }}
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex flex-wrap gap-1">
            {/* No Color Button */}
            <button
              onClick={() => setSelectedColor('transparent')}
              className={`w-6 h-6 rounded-full border-2 flex  items-center justify-center relative ${selectedColor === 'transparent' ? 'border-gray-400' : 'border-gray-300'
                }`}
              style={{ background: 'white' }}
            >
              <div className="w-0.5 h-5 bg-red-500 rotate-45 absolute" />
            </button>

            {/* Color Swatches */}
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-gray-400 ring-1 ring-gray-800' : 'border-gray-300'
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        {mode === 'icon' && (
          <div className="flex justify-baseline border-b rounded-xl border-gray-100">
            <button
              onClick={() => setActiveTab('Icon')}
              className={`px-6 py-1 text-sm font-medium transition-colors ${activeTab === 'Icon'
                ? 'text-gray-800 border-b-2 border-gray-800 bg-gray-100'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Icon
            </button>
            <button
              onClick={() => setActiveTab('Upload')}
              className={`px-6 py-1 text-sm font-medium transition-colors ${activeTab === 'Upload'
                ? 'text-gray-800 border-b-2 border-gray-800 bg-gray-100'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Upload
            </button>
          </div>
        )}


        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'Icon' && (
            <div className="p-3">
              {/* Left aligned Icon label */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Icon
                </h4>
              </div>

              {/* Search */}
              <div className="relative mb-1">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800"
                />
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-9 gap-1 max-h-64 overflow-y-auto">
                {filteredIcons.map(iconData => {
                  const IconComponent = iconData.icon
                  const isHovered = hoveredIcon === iconData.name

                  return (
                    <button
                      key={iconData.name}
                      onClick={() => handleIconSelect(iconData)}
                      onMouseEnter={() => setHoveredIcon(iconData.name)}
                      onMouseLeave={() => setHoveredIcon(null)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                      title={iconData.name}
                    >
                      <IconComponent
                        size={18}
                        color={isHovered ? selectedColor : '#1f2937'}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'Upload' && (
            <div className="p-4 flex flex-col h-full">
              {/* Left aligned Upload label */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Upload
                </h4>
              </div>

              {!uploadedImage ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <Upload size={20} className="text-orange-500" />
                  </div>
                  <h4 className="font-medium text-base mb-1 text-gray-900">Upload sources</h4>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    Choose a square PNG or JPEG
                    <br />
                    image under 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="mb-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded icon"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleUploadNew}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Upload new
                    </button>
                    <button
                      onClick={handleDeleteImage}
                      className="px-3 py-1.5 text-red-600 border border-red-300 text-sm rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={handleUploadSelect}
                    className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-700 transition-colors"
                  >
                    Use This Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Bottom styled div */}
        <div className="border-b-5 border-b-[#001F3F] rounded-b-lg" />
      </div>
    </div>
  )
}

export default ColorIconPicker
