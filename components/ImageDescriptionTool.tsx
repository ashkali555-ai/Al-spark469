
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const ImageDescriptionTool: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoadingDesc, setIsLoadingDesc] = useState<boolean>(false);
  const [isLoadingImg, setIsLoadingImg] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setDescription('');
      setGeneratedImage(null);
      setError('');
    }
  };

  const generateDescription = useCallback(async () => {
    if (!image) {
      setError('الرجاء تحميل صورة أولاً.');
      return;
    }
    setIsLoadingDesc(true);
    setError('');
    setDescription('');
    setGeneratedImage(null);

    try {
      const imagePart = await fileToGenerativePart(image);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: 'صف هذه الصورة بالتفصيل باللغة العربية.' }] },
      });
      setDescription(response.text.replace(/\*\*/g, ''));
    } catch (err) {
      console.error(err);
      let message = 'حدث خطأ أثناء وصف الصورة. الرجاء المحاولة مرة أخرى.';
      if (err instanceof Error) {
          const errorMessage = err.message.toLowerCase();
          if (errorMessage.includes('api key not valid')) {
              message = 'مفتاح API غير صالح. يرجى التأكد من أنه تم إعداده بشكل صحيح.';
          } else if (errorMessage.includes('quota')) {
              message = 'تم الوصول إلى الحد الأقصى للاستخدام (Quota). يرجى المحاولة مرة أخرى لاحقًا.';
          } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
              message = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
          }
      }
      setError(message);
    } finally {
      setIsLoadingDesc(false);
    }
  }, [image]);

  const generateImageFromDescription = useCallback(async () => {
    if (!description) {
      setError('لا يوجد وصف لتوليد صورة منه.');
      return;
    }
    setIsLoadingImg(true);
    setError('');

    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: description,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
      });
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      setGeneratedImage(`data:image/jpeg;base64,${base64ImageBytes}`);
    } catch (err) {
      console.error(err);
      let message = 'حدث خطأ أثناء توليد الصورة الجديدة. الرجاء المحاولة مرة أخرى.';
      if (err instanceof Error) {
          const errorMessage = err.message.toLowerCase();
          if (errorMessage.includes('api key not valid')) {
              message = 'مفتاح API غير صالح. يرجى التأكد من أنه تم إعداده بشكل صحيح.';
          } else if (errorMessage.includes('quota')) {
              message = 'تم الوصول إلى الحد الأقصى للاستخدام (Quota). يرجى المحاولة مرة أخرى لاحقًا.';
          } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
              message = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
          }
      }
      setError(message);
    } finally {
      setIsLoadingImg(false);
    }
  }, [description]);


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">أداة وصف وتوليد الصور</h2>
      <p className="text-center text-gray-600 dark:text-slate-400">قم بتحميل صورة ليصفها الذكاء الاصطناعي، ثم يمكنك إنشاء صورة جديدة من هذا الوصف.</p>

      <div className="flex flex-col items-center">
        <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-amber-600 dark:text-amber-400 font-bold py-2 px-4 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors transform active:scale-95">
          اختر صورة
        </label>
        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-center">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col items-center space-y-4">
          {imageUrl && <img src={imageUrl} alt="Uploaded preview" className="max-w-full h-auto max-h-80 rounded-lg shadow-md" />}
          <button
            onClick={generateDescription}
            disabled={!image || isLoadingDesc}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-2"
          >
            {isLoadingDesc ? <Spinner /> : 'صف الصورة'}
          </button>
          {description && (
             <div className="w-full p-4 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2">الوصف:</h3>
                <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          {description && (
             <button
              onClick={generateImageFromDescription}
              disabled={isLoadingImg}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-2"
            >
              {isLoadingImg ? <Spinner /> : 'أنشئ صورة من هذا الوصف'}
            </button>
          )}

          {isLoadingImg && <div className="w-80 h-80 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"><Spinner size={12} /></div>}
          
          {generatedImage && <img src={generatedImage} alt="Generated from description" className="max-w-full h-auto max-h-80 rounded-lg shadow-md" />}
        </div>
      </div>
    </div>
  );
};
