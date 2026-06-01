'use client'

import React from 'react'
import Image from 'next/image'

export interface SectionItem {
  label: string
  icon?: React.ReactNode
}

interface ReusableSectionProps {
  title: string
  subtitle: string
  imageUrl: string
  items: SectionItem[]
}

const ReusableSection: React.FC<ReusableSectionProps> = ({
  title,
  subtitle,
  imageUrl,
  items,
}) => {
  return (
    <div className="mb-8 w-full">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mb-1">{subtitle}</p>

      <div className="border border-gray-300 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-6">
        {/* Left Image */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-20 h-20 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 160px"
            className="object-contain"
          />
        </div>

        {/* Right: Icon + Label Items */}
        <div className="flex flex-col justify-center gap-2 w-full">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              {/* Dashed Circle Icon */}
              <div className="text-gery-400">
                {/* Icon is rendered here */}
                {item.icon}
              </div>

              {/* Label */}
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
        </div>
        
      </div>
    </div>
  )
}

export default ReusableSection
