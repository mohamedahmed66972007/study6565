import React, { useState } from "react";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useAuth } from "@/hooks/useAuth";
import QuizCard from "@/components/QuizCard";
import CreateQuizModal from "@/components/CreateQuizModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjectOptions } from "@/components/SubjectIcons";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Quizzes: React.FC = () => {
  const { isAdmin } = useAuth();
  const [showCreateQuizModal, setShowCreateQuizModal] = React.useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const { quizzes, isLoading, error, searchQuizByCode } = useQuizzes();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuizzes = quizzes.filter(quiz => 
    subjectFilter === "all" || quiz.subject === subjectFilter
  );

    const handleSearch = () => {
    if (searchQuery.trim()) {
      searchQuizByCode(searchQuery);
    } else {
      // If search is empty, fetch all quizzes
      searchQuizByCode("");
    }
  };

  // Handle real-time search as user types
  React.useEffect(() => {
    // Add a small delay to avoid too many requests while typing
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    // Clear timeout on cleanup
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">الاختبارات التفاعلية</h2>

        <div className="flex items-center gap-4">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="جميع المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {subjectOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Search Quiz */}
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="ابحث عن اختبار بالرمز"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
            <Search className="h-4 w-4 absolute right-3 text-muted-foreground" />
          </div>


          {!showCreateQuizModal && (
            <Button
              variant="default"
              className="bg-secondary hover:bg-secondary/90 flex items-center space-x-1 space-x-reverse"
              onClick={() => setShowCreateQuizModal(true)}
            >
              <PlusIcon className="h-4 w-4 ml-2" />
              <span>إنشاء اختبار جديد</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4">جاري تحميل الاختبارات...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">
          <p>حدث خطأ أثناء تحميل الاختبارات. يرجى المحاولة مرة أخرى.</p>
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">لا توجد اختبارات متاحة حالياً</p>
          <Button onClick={() => setShowCreateQuizModal(true)} variant="outline" className="mt-4">
            إنشاء اختبار جديد
          </Button>
        </div>
      )}

      <CreateQuizModal
        isOpen={showCreateQuizModal}
        onClose={() => setShowCreateQuizModal(false)}
      />
    </div>
  );
};

export default Quizzes;