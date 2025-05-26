import React, { useState } from "react";
import { useExams } from "@/hooks/useExams";
import { useAuth } from "@/hooks/useAuth";
import ExamList from "@/components/ExamWeek";
import AddExamModal from "@/components/AddExamModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

const Exams: React.FC = () => {
  const { isAdmin } = useAuth();
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const { exams, isLoading, error, deleteExam } = useExams();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">جدول الاختبارات</h2>

        {isAdmin && (
          <Button 
            onClick={() => setShowAddExamModal(true)} 
            className="flex items-center space-x-1 space-x-reverse"
          >
            <PlusIcon className="h-4 w-4 ml-2" />
            <span>إضافة اختبار</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4">جاري تحميل جدول الاختبارات...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">
          <p>حدث خطأ أثناء تحميل جدول الاختبارات. يرجى المحاولة مرة أخرى.</p>
        </div>
      ) : exams && exams.length > 0 ? (
        <ExamList 
          exams={exams} 
          onDelete={deleteExam}
        />
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">لا توجد اختبارات متاحة حالياً</p>
          {isAdmin && (
            <Button onClick={() => setShowAddExamModal(true)} variant="outline" className="mt-4">
              إضافة اختبار
            </Button>
          )}
        </div>
      )}

      <AddExamModal 
        isOpen={showAddExamModal} 
        onClose={() => setShowAddExamModal(false)} 
      />
    </div>
  );
};

export default Exams;