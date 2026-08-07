// components/public/projects/ProjectGallery.tsx
'use client';

import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaImage } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ProjectGalleryProps {
  images: string[];
  projectName: string;
}

export default function ProjectGallery({ images, projectName }: ProjectGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <FaImage className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Aucune image disponible pour ce projet</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-[#1E3A8A]">📸 Galerie du projet</h2>
      <p className="mt-1 text-sm text-slate-500">
        {images.length} image{images.length > 1 ? 's' : ''}
      </p>

      {/* Miniatures */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 border-slate-200 transition hover:border-[#F97316] hover:shadow-lg"
            onClick={() => {
              setCurrentIndex(index);
              setIsOpen(true);
            }}
          >
            <img
              src={image}
              alt={`${projectName} - Image ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Modal de visualisation */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <FaTimes className="h-6 w-6" />
            </button>

            <div className="relative flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={`${projectName} - Image ${currentIndex + 1}`}
                className="max-h-[80vh] w-full rounded-xl object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <FaChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <FaChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition ${
                    index === currentIndex ? 'bg-[#F97316] w-4' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}