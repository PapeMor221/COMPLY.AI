import { useState, useRef, DragEvent } from "react";
import { Upload, FileText, Database, Code, X, Shield, Loader2 } from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
}

interface UploadPageProps {
  onAnalyze: (files: File[]) => void;
  isAnalyzing: boolean;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="w-5 h-5 text-destructive" />;
  if (ext === "sql" || ext === "json") return <Database className="w-5 h-5 text-accent" />;
  return <Code className="w-5 h-5 text-primary" />;
};

const formatFileSize = (bytes: number): string => {
  return (bytes / 1024).toFixed(1) + " KB";
};

const ACCEPTED_EXTENSIONS = [".js", ".py", ".sql", ".json", ".pdf", ".txt", ".md"];

export function UploadPage({ onAnalyze, isAnalyzing }: UploadPageProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles = Array.from(newFiles).filter((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      return ACCEPTED_EXTENSIONS.includes(ext);
    });

    const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
    }));

    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = () => {
    onAnalyze(files.map((f) => f.file));
  };

  const infoCards = [
    {
      icon: <Code className="w-8 h-8 text-primary" />,
      title: "Code Source",
      description: "Analysez vos fichiers JavaScript, Python et SQL pour détecter les traitements de données personnelles.",
    },
    {
      icon: <Database className="w-8 h-8 text-accent" />,
      title: "Bases de données",
      description: "Examinez vos schémas JSON et SQL pour identifier les champs contenant des PII.",
    },
    {
      icon: <FileText className="w-8 h-8 text-secondary" />,
      title: "Documents légaux",
      description: "Vérifiez la conformité de vos politiques de confidentialité et CGU.",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl gradient-primary">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              COMPLY.AI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your AI & Data Compliance Copilot
          </p>
        </header>

        {/* Upload Zone */}
        <div className="card-elevated mb-8 animate-slide-up">
          <div
            className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Formats acceptés : {ACCEPTED_EXTENSIONS.join(", ")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Parcourir les fichiers
            </button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Fichiers sélectionnés ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-scale-in"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadedFile.file.name)}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      aria-label="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={files.length === 0 || isAnalyzing}
              className="btn-primary w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin-slow" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Analyser la conformité RGPD
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {infoCards.map((card, index) => (
            <div key={index} className="card-elevated text-center">
              <div className="flex justify-center mb-4">{card.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
