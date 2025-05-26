import { 
  File,
  InsertFile,
  ExamWeek,
  InsertExamWeek,
  Exam,
  InsertExam,
  Quiz,
  InsertQuiz,
  QuizAttempt,
  InsertQuizAttempt,
  Questions,
  subjects,
  semesters,
  adminUsername,
  adminPassword
} from "@shared/schema";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface IStorage {
  // Auth
  validateAdmin(username: string, password: string): Promise<boolean>;
  
  // Files
  getFiles(): Promise<File[]>;
  getFilesBySubject(subject: string): Promise<File[]>;
  getFilesBySemester(semester: string): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile, fileBuffer: Buffer): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Exam Weeks
  getExamWeeks(): Promise<ExamWeek[]>;
  getExamWeek(id: number): Promise<ExamWeek | undefined>;
  createExamWeek(examWeek: InsertExamWeek): Promise<ExamWeek>;
  deleteExamWeek(id: number): Promise<boolean>;
  
  // Exams
  getExams(): Promise<Exam[]>;
  getExamsByWeek(weekId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  deleteExam(id: number): Promise<boolean>;
  
  // Quizzes
  getQuizzes(): Promise<Quiz[]>;
  getQuizByCode(code: string): Promise<Quiz | undefined>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Quiz Attempts
  getQuizAttempts(quizId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
}

export class MemStorage implements IStorage {
  private files: Map<number, File>;
  private examWeeks: Map<number, ExamWeek>;
  private exams: Map<number, Exam>;
  private quizzes: Map<number, Quiz>;
  private quizAttempts: Map<number, QuizAttempt>;
  
  private currentFileId: number;
  private currentExamWeekId: number;
  private currentExamId: number;
  private currentQuizId: number;
  private currentQuizAttemptId: number;
  
  constructor() {
    this.files = new Map();
    this.examWeeks = new Map();
    this.exams = new Map();
    this.quizzes = new Map();
    this.quizAttempts = new Map();
    
    this.currentFileId = 1;
    this.currentExamWeekId = 1;
    this.currentExamId = 1;
    this.currentQuizId = 1;
    this.currentQuizAttemptId = 1;
    
    // Add sample data for development (will be removed in production)
    this.initSampleData();
  }
  
  // Auth
  async validateAdmin(username: string, password: string): Promise<boolean> {
    return username === adminUsername && password === adminPassword;
  }
  
  // Files
  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }
  
  async getFilesBySubject(subject: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.subject === subject);
  }
  
  async getFilesBySemester(semester: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.semester === semester);
  }
  
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async createFile(fileData: InsertFile, fileBuffer: Buffer): Promise<File> {
    const id = this.currentFileId++;
    const fileName = `${Date.now()}-${fileData.fileName}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Save file to disk
    fs.writeFileSync(filePath, fileBuffer);
    
    const file: File = {
      id,
      ...fileData,
      filePath: `/uploads/${fileName}`,
      uploadedAt: new Date(),
    };
    
    this.files.set(id, file);
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) return false;
    
    // Delete file from disk
    try {
      const fullPath = path.join(__dirname, "..", file.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
    
    return this.files.delete(id);
  }
  
  // Exam Weeks
  async getExamWeeks(): Promise<ExamWeek[]> {
    return Array.from(this.examWeeks.values());
  }
  
  async getExamWeek(id: number): Promise<ExamWeek | undefined> {
    return this.examWeeks.get(id);
  }
  
  async createExamWeek(examWeekData: InsertExamWeek): Promise<ExamWeek> {
    const id = this.currentExamWeekId++;
    const examWeek: ExamWeek = {
      id,
      ...examWeekData,
      createdAt: new Date(),
    };
    
    this.examWeeks.set(id, examWeek);
    return examWeek;
  }
  
  async deleteExamWeek(id: number): Promise<boolean> {
    // Delete associated exams
    const examIds = Array.from(this.exams.values())
      .filter(exam => exam.weekId === id)
      .map(exam => exam.id);
    
    for (const examId of examIds) {
      this.exams.delete(examId);
    }
    
    return this.examWeeks.delete(id);
  }
  
  // Exams
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }
  
  async getExamsByWeek(weekId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.weekId === weekId);
  }
  
  async createExam(examData: InsertExam): Promise<Exam> {
    const id = this.currentExamId++;
    const exam: Exam = {
      id,
      ...examData,
    };
    
    this.exams.set(id, exam);
    return exam;
  }
  
  async deleteExam(id: number): Promise<boolean> {
    return this.exams.delete(id);
  }
  
  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }
  
  async getQuizByCode(code: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(quiz => quiz.code === code);
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const code = nanoid(8).toUpperCase();
    
    // Create a clean object with all required properties
    const quiz: Quiz = {
      id,
      title: quizData.title,
      subject: quizData.subject,
      creator: quizData.creator,
      description: quizData.description || null,
      questions: quizData.questions,
      code,
      createdAt: new Date(),
    };
    
    this.quizzes.set(id, quiz);
    return quiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    // Delete associated attempts
    const attemptIds = Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.quizId === id)
      .map(attempt => attempt.id);
    
    for (const attemptId of attemptIds) {
      this.quizAttempts.delete(attemptId);
    }
    
    return this.quizzes.delete(id);
  }
  
  // Quiz Attempts
  async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(attempt => attempt.quizId === quizId);
  }
  
  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = this.currentQuizAttemptId++;
    const attempt: QuizAttempt = {
      id,
      ...attemptData,
      createdAt: new Date(),
    };
    
    this.quizAttempts.set(id, attempt);
    return attempt;
  }
  
  // Initialize sample data (for development only)
  private initSampleData() {
    // No sample data needed
  }
}

export const storage = new MemStorage();
