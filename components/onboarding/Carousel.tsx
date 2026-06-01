"use client";

import * as React from "react";
import Image from "next/image";

const slides = [
  {
    image: "/carousel1.png",
    title: "Elevate Your Projects to New Heights",
    description:
      "Discover a new level of project management excellence. Our tool helps you streamline processes, ensuring your projects soar above the rest.",
  },
  {
    image: "/carousel2.png",
    title: "Collaborate Seamlessly",
    description:
      "Work together in real-time with your team members. Share ideas, track progress, and achieve goals together.",
  },
  {
    image: "/carousel1.png",
    title: "Powerful Analytics",
    description:
      "Get insights into your project performance with detailed analytics and reporting tools.",
  },
  {
    image: "/carousel2.png",
    title: "Smart Automation",
    description:
      "Automate repetitive tasks and focus on what matters most - delivering great results.",
  },
];

export function Carousel() {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-24">
      {/* Image Container */}
      <div className="relative mb-4 h-[300px] w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-contain -ml-4"
              priority
            />
          </div>
        ))}
      </div>

      {/* Dots Navigation */}
      <div className="mb-4 flex gap-2 ml-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`relative h-3 w-3 rounded-full border border-green-500 ${
              currentSlide === index ? "bg-white" : "bg-white border-2 border-green-500"
            }`}
          >
            {currentSlide === index && (
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4CAF4F]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2 ml-10">
        <h2 className="text-2xl font-semibold text-gray-900">
          {slides[currentSlide].title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {slides[currentSlide].description}
        </p>
      </div>
    </div>
  );
}
