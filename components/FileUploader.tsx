import React, { useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { FileData } from '../types';

interface FileUploaderProps {
  label: string;
  subLabel: string;
  accept?: string;
  fileData: FileData | null;
  onFileSelect: (fileData: FileData | null) => void;
  icon?: React.ReactNode;
}

import { processFile } from '../utils/fileUtils';

const FileUploader: React.FC<FileUploaderProps> = ({ 
  label, 
  subLabel, 
  accept = "image/jpeg,image/png,image/webp,application/pdf", 
  fileData, 
  onFileSelect,
  icon
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const processedData = await processFile(file);
        onFileSelect(processedData);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Lỗi khi xử lý file. Vui lòng thử lại.");
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
        ${fileData 
          ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100' 
          : 'border-indigo-200 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100'
        }
      `}
      style={{ borderWidth: '3px' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {fileData ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 relative">
             {fileData.mimeType.startsWith('image/') ? (
               <img 
                 src={fileData.previewUrl} 
                 alt="Preview" 
                 className="h-32 object-contain rounded-lg shadow-sm border border-emerald-200 bg-white" 
               />
             ) : (
               <div className="h-32 w-32 flex items-center justify-center bg-white rounded-lg shadow-sm border border-emerald-200 text-emerald-600">
                 <FileText size={48} />
               </div>
             )}
            <button 
              onClick={handleClear}
              className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
            >
              <X size={16} />
            </button>
          </div>
          <p className="font-semibold text-emerald-700 break-all px-4">{fileData.file.name}</p>
          <p className="text-emerald-600 text-sm mt-1">Đã tải lên thành công</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-indigo-400 mb-4">
            {icon || <Upload size={48} />}
          </div>
          <h3 className="text-gray-800 font-bold text-lg mb-2">{label}</h3>
          <p className="text-gray-500 text-sm">{subLabel}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
