// components/reports/Widgets/ProductivityWidgets.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

type WidgetType =
  | "bar"
  | "line"
  | "pie"
  | "doughnut"
  | "radar"
  | "area"
  | "areaG";

interface ProductivityWidgetsProps {
  onSelect: (type: WidgetType) => void;
}

export default function ProductivityWidgets({
  onSelect,
}: ProductivityWidgetsProps) {
  const [selected, setSelected] = useState<WidgetType | null>(null);

  const widgets: { id: WidgetType; title: string; image: string }[] = [
    { id: "bar", title: "Bar Chart", image: "/images/reports/bar.webp" },
    { id: "line", title: "Line Chart", image: "/images/reports/bar.webp" },
    { id: "pie", title: "Pie Chart", image: "/images/reports/bar.webp" },
    { id: "doughnut", title: "Donut Chart", image: "/images/reports/bar.webp" },
    { id: "radar", title: "Radar Chart", image: "/images/reports/bar.webp" },
    { id: "area", title: "Area Chart", image: "/images/reports/bar.webp" },
    { id: "areaG", title: "Area Gradient Chart", image: "/images/reports/bar.webp" },
  ];

  const handleSelect = (id: WidgetType) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Productivity</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <button
            key={widget.id}
            onClick={() => handleSelect(widget.id)}
            className={`group border rounded-2xl bg-white transition-all duration-200 overflow-hidden text-left
            ${selected === widget.id
                ? "border-[#001F3F] shadow-lg"
                : "hover:shadow-lg hover:border-[#001F3F]"
              }`}
          >
            {/* Image */}
            <div className="relative h-40 w-full bg-muted">
              <Image
                src={widget.image}
                alt={widget.title}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Text */}
            <div className="p-4">
              <div className="font-medium text-[#001F3F]">{widget.title}</div>
              <p className="text-sm text-gray-500 mt-1">
                Click to add this widget
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}