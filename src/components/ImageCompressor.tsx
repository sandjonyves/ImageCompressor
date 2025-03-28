'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface CompressedImage {
  original: File;
  compressed: File;
  preview: string;
}

const ImageCompressor: React.FC = () => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsCompressing(true);
    try {
      const compressedImages = await Promise.all(
        acceptedFiles.map(async (file) => {
          const image = new window.Image();
          const preview = URL.createObjectURL(file);
          image.src = preview;

          await new Promise((resolve) => {
            image.onload = resolve;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions while maintaining aspect ratio
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(image, 0, 0, width, height);

          // Convert to blob with reduced quality
          const compressedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
              },
              'image/jpeg',
              0.7
            );
          });

          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          });

          return {
            original: file,
            compressed: compressedFile,
            preview,
          };
        })
      );

      setImages((prev) => [...prev, ...compressedImages]);
    } catch (error) {
      console.error('Error compressing images:', error);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
  });

  const downloadImage = (image: CompressedImage) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(image.compressed);
    link.download = `compressed_${image.original.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCompressionRatio = (original: number, compressed: number) => {
    return ((original - compressed) / original * 100).toFixed(1);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Compressez vos images en quelques clics
        </h2>
        <p className="text-gray-600">
          Glissez-déposez vos images ou cliquez pour les sélectionner
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-500">
              Déposez vos images ici...
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Glissez-déposez vos images ici
              </p>
              <p className="text-sm text-gray-500">
                ou cliquez pour sélectionner
              </p>
            </div>
          )}
        </div>
      </div>

      {isCompressing && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
            <p className="font-medium">Compression en cours...</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Images compressées ({images.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.preview}
                    alt={`Compressed ${image.original.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {image.original.name}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Original:</span>
                      <span className="font-medium text-gray-800">
                        {(image.original.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Compressed:</span>
                      <span className="font-medium text-green-600">
                        {(image.compressed.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Réduction:</span>
                      <span className="font-medium text-blue-600">
                        {getCompressionRatio(image.original.size, image.compressed.size)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadImage(image)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor; 