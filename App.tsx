import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, CheckCircle2, FileText, BrainCircuit, PenTool, AlertCircle, Image as ImageIcon, Printer, Copy, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import FileUploader from './components/FileUploader';
import { FileData } from './types';

// Initialize Gemini API
// NOTE: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const App: React.FC = () => {
  const [transcriptFile, setTranscriptFile] = useState<FileData | null>(null);
  const [studentFile, setStudentFile] = useState<FileData | null>(null);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    // Validation
    if (!studentFile) {
      setError('Vui lòng upload bài làm của học sinh!');
      return;
    }
    if (!transcriptFile && !transcriptText.trim()) {
      setError('Vui lòng upload ảnh transcript hoặc nhập nội dung transcript!');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const parts: any[] = [];

      // Add Student Work Image
      parts.push({
        inlineData: {
          mimeType: studentFile.mimeType,
          data: studentFile.base64
        }
      });
      
      parts.push({ text: "Đây là hình ảnh bài làm của học sinh." });

      // Add Transcript (Image or Text)
      if (transcriptFile) {
         parts.push({
          inlineData: {
            mimeType: transcriptFile.mimeType,
            data: transcriptFile.base64
          }
        });
        parts.push({ text: "Đây là hình ảnh đáp án (transcript) chuẩn." });
      }

      if (transcriptText.trim()) {
        parts.push({ text: `NỘI DUNG TRANSCRIPT (ĐÁP ÁN CHUẨN):\n${transcriptText}` });
      }

      // Instruction Prompt
      const instruction = `
Bạn là một trợ lý AI chấm bài Listening Gap-Fill tiếng Anh chuyên nghiệp.
Hãy phân tích và so sánh bài làm của học sinh với đáp án chuẩn.

NHIỆM VỤ: Tạo ra 2 phần báo cáo riêng biệt để giáo viên sử dụng cho 2 mục đích khác nhau.

---
### PHẦN 1: NỘI DUNG GỬI PHỤ HUYNH
Viết theo phong cách tin nhắn (Zalo/Messenger): ngắn gọn, cụ thể, giọng điệu ân cần, khích lệ.
**Yêu cầu format:**
Kết quả bài nghe- chép chính tả: [Số câu đúng]/[Tổng] ([Tỷ lệ]%)

Ưu điểm: [Nhận xét 1 câu về điểm tốt. Ví dụ: Con nghe rất tốt, nắm bắt được hầu hết từ khóa...]

Cần cải thiện: [Chỉ rõ lỗi sai cụ thể (nếu ít lỗi) hoặc lỗi phổ biến. Ví dụ: Con mắc 1 lỗi ở câu số 10 do chưa nghe chính xác động từ "copy" mà ghi thành "write".]

[Một câu lời khuyên/khích lệ cuối cùng. Ví dụ: Con nên luyện tập nghe các từ đồng nghĩa để tránh nhầm lẫn nhé.]

---
### PHẦN 2: BÁO CÁO CHUYÊN MÔN (Dành cho Giáo Viên)
1. **Đánh giá trình độ CEFR:** Ước lượng trình độ (A1/A2/B1...) dựa trên bài làm và độ khó từ vựng trong transcript.
2. **Bảng chi tiết lỗi sai:** So sánh từng câu.

---
⚠️ QUY TẮC CHẤM:
1. **Đáp án cuối cùng**: Nếu gạch xóa, chỉ lấy từ viết rõ nhất cuối cùng.
2. **Bỏ qua**: Dấu tick của giáo viên, các vết tẩy xóa.
3. **Chữ viết tay**: Cố gắng luận giải tối đa.

---
ĐỊNH DẠNG ĐẦU RA (Markdown bắt buộc):

# 📨 TIN NHẮN GỬI PHỤ HUYNH (Mẫu)

> Kết quả bài nghe- chép chính tả: [Điểm]/[Tổng] ([%])
>
> **Ưu điểm:** ...
>
> **Cần cải thiện:** ...
>
> ... (Lời khuyên) ...

---

# 👩‍🏫 BÁO CÁO GIÁO VIÊN

### 1. Đánh Giá Trình Độ
*   **Ước lượng CEFR:** [Level]
*   **Kết luận:** [Đạt / Cần cố gắng]

### 2. Chi Tiết Bài Làm
| Câu | Bài làm HS | Đáp án Chuẩn | KQ | Lỗi/Ghi chú |
|:---:|:---|:---|:---:|:---|
| 1 | ... | ... | ✅ | - |
| 2 | ... | ... | ❌ | Sai chính tả... |

---
*Báo cáo được tạo tự động bởi hệ thống AI.*
`;

      parts.push({ text: instruction });

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: parts
        },
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const text = response.text;
      if (text) {
        setResult(text);
      } else {
        throw new Error("Không nhận được phản hồi từ AI.");
      }

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      setError(`Lỗi khi phân tích: ${err.message || "Đã có lỗi không xác định"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyReport = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert("Đã copy nội dung báo cáo!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] py-8 px-4 font-sans print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Header - Hidden when printing */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-8 text-center text-white print:hidden">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <BrainCircuit size={40} />
            Đánh Giá Listening Gap-Fill
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
            Hệ thống chấm bài tự động sử dụng AI để phân tích chữ viết tay và so sánh với transcript.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-indigo-100/80">
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><PenTool size={14}/> Bỏ qua từ gạch xóa</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><CheckCircle2 size={14}/> Bỏ qua dấu chấm của giáo viên</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><ImageIcon size={14}/> Hỗ trợ JPG/PNG/PDF</span>
          </div>
        </div>

        <div className="p-6 md:p-10 print:p-4">
          
          {/* Inputs Section - Hidden when printing */}
          <div className="print:hidden">
            {/* Guide Box */}
            <div className="bg-indigo-50 border-l-4 border-[#667eea] p-5 rounded-r-lg mb-8">
              <h3 className="text-[#667eea] font-bold text-lg mb-2 flex items-center gap-2">
                <span className="text-xl">🤖</span> Nhận Diện Thông Minh
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#667eea] font-bold">✓</span>
                  <span><strong>Từ bị gạch xóa:</strong> AI tự động bỏ qua các từ học sinh đã gạch ngang, chỉ chấm đáp án cuối cùng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#667eea] font-bold">✓</span>
                  <span><strong>Dấu tích giáo viên:</strong> Tự động loại bỏ các dấu ✓ ✔ cũ trên bài làm.</span>
                </li>
              </ul>
            </div>

            {/* Upload Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* Transcript Upload */}
              <div className="space-y-4">
                <FileUploader
                  label="Upload Transcript (Đáp án)"
                  subLabel="Chọn ảnh (JPG, PNG) hoặc PDF đáp án"
                  fileData={transcriptFile}
                  onFileSelect={setTranscriptFile}
                  icon={<FileText size={48} />}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc nhập text trực tiếp</span>
                  </div>
                </div>

                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Nhập transcript đáp án tại đây...&#10;1. environment&#10;2. pollution&#10;3. sustainable"
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none resize-none transition-all text-sm font-mono"
                />
              </div>

              {/* Student Work Upload */}
              <div>
                <FileUploader
                  label="Upload Bài Làm Học Sinh"
                  subLabel="Chọn ảnh chụp bài viết tay rõ nét"
                  fileData={studentFile}
                  onFileSelect={setStudentFile}
                  icon={<PenTool size={48} />}
                />
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
                  <strong>Lưu ý:</strong> Chụp ảnh thẳng góc, đủ ánh sáng và thấy rõ chữ viết tay để AI nhận diện tốt nhất.
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform
                flex items-center justify-center gap-3
                ${isAnalyzing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-xl hover:-translate-y-1 active:scale-95'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang Phân Tích...
                </>
              ) : (
                <>
                  <BrainCircuit />
                  Phân Tích & Đánh Giá Ngay
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 animate-fade-in print:hidden">
              <AlertCircle className="shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Đã xảy ra lỗi</strong>
                {error}
              </div>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className="mt-10 animate-fade-in-up print:mt-0 print:animate-none">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" /> Kết Quả Phân Tích
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyReport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Printer size={16} /> In / Lưu PDF
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl print:rounded-none p-8 print:p-0 border border-slate-200 print:border-none shadow-sm print:shadow-none">
                
                {/* Print-only Header */}
                <div className="hidden print:block mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Phiếu Kết Quả Listening Gap-Fill</h1>
                  <p className="text-gray-500 text-sm">Ngày đánh giá: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>

                <div className="prose prose-indigo max-w-none">
                  <ReactMarkdown
                    components={{
                      // Custom H1 for the Score
                      h1: ({node, ...props}) => (
                        <h1 className="text-3xl font-bold text-center text-[#667eea] my-6 pb-4 border-b border-dashed border-gray-200" {...props} />
                      ),
                      // Custom H2 for Section Headers
                      h2: ({node, ...props}) => (
                        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-l-4 border-[#667eea] pl-3 uppercase tracking-wide flex items-center gap-2" {...props} />
                      ),
                      // Styled Table
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm">
                          <table className="w-full border-collapse bg-white text-sm" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-bold tracking-wider" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="px-6 py-4 border-b border-gray-200 text-left whitespace-nowrap" {...props} />
                      ),
                      tr: ({node, ...props}) => (
                        <tr className="border-b border-gray-100 hover:bg-slate-50 transition-colors" {...props} />
                      ),
                      td: ({node, children, ...props}) => {
                         const content = String(children);
                         let className = "px-6 py-4 text-gray-700 align-top";
                         
                         // Enhanced status column styling
                         if (content.includes('✅') || content.includes('❌')) {
                            className += " text-center font-bold text-base"; 
                            if (content.includes('✅')) className += " text-emerald-600 bg-emerald-50/50";
                            else className += " text-red-600 bg-red-50/50";
                         } 
                         
                         return <td className={className} {...props}>{children}</td>
                      },
                      // Styled Blockquotes for Remarks
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-emerald-400 bg-emerald-50 p-4 rounded-r-lg text-gray-700 my-4 shadow-sm" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4" {...props} />
                      ),
                      p: ({node, ...props}) => (
                         <p className="mb-2 leading-relaxed text-gray-700" {...props} />
                      )
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center text-gray-400 text-xs flex justify-between items-center print:text-gray-500">
                   <span>Giáo viên/AI chấm: Gemini AI Assistant</span>
                   <span>Hệ thống chấm điểm tự động</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;