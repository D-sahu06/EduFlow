
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  FolderOpen,
  ArrowLeft
} from "lucide-react";

type DocumentStatus = "Verified" | "Pending" | "Rejected";

type StudentDocument = {
  id: string;
  studentId: string;
  studentName: string;
  documentName: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: DocumentStatus;
  fileUrl?: string;
};

const initialDocuments: StudentDocument[] = [
  {
    id: "DOC001",
    studentId: "STU001",
    studentName: "Aarav Sharma",
    documentName: "Aadhaar Card",
    documentType: "Identity Proof",
    fileName: "aarav-aadhaar.pdf",
    fileSize: "1.2 MB",
    uploadDate: "24 Oct 2026",
    status: "Verified",
  },
  {
    id: "DOC002",
    studentId: "STU002",
    studentName: "Ananya Verma",
    documentName: "Birth Certificate",
    documentType: "Birth Certificate",
    fileName: "ananya-birth.pdf",
    fileSize: "850 KB",
    uploadDate: "23 Oct 2026",
    status: "Pending",
  },
  {
    id: "DOC003",
    studentId: "STU003",
    studentName: "Rohan Patel",
    documentName: "Previous Marksheet",
    documentType: "Academic Record",
    fileName: "rohan-marksheet.pdf",
    fileSize: "1.5 MB",
    uploadDate: "22 Oct 2026",
    status: "Verified",
  },
  {
    id: "DOC004",
    studentId: "STU004",
    studentName: "Priya Singh",
    documentName: "Transfer Certificate",
    documentType: "School Certificate",
    fileName: "priya-tc.pdf",
    fileSize: "900 KB",
    uploadDate: "21 Oct 2026",
    status: "Rejected",
  },
];

const studentOptions = [
  { id: "STU001", name: "Aarav Sharma" },
  { id: "STU002", name: "Ananya Verma" },
  { id: "STU003", name: "Rohan Patel" },
  { id: "STU004", name: "Priya Singh" },
  { id: "STU005", name: "Kabir Khan" },
];

const documentTypes = [
  "Identity Proof",
  "Birth Certificate",
  "Academic Record",
  "School Certificate",
  "Address Proof",
  "Other",
];

export default function StudentDocumentsPage() {
  const [documents, setDocuments] =
    useState<StudentDocument[]>(initialDocuments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const router = useRouter()

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [documentType, setDocumentType] = useState("Identity Proof");
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] =
    useState<StudentDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const query = search.toLowerCase();

      const matchesSearch =
        doc.studentName.toLowerCase().includes(query) ||
        doc.studentId.toLowerCase().includes(query) ||
        doc.documentName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || doc.status === statusFilter;

      const matchesType =
        typeFilter === "All" || doc.documentType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, search, statusFilter, typeFilter]);

  const verifiedCount = documents.filter(
    (doc) => doc.status === "Verified"
  ).length;

  const pendingCount = documents.filter(
    (doc) => doc.status === "Pending"
  ).length;

  const rejectedCount = documents.filter(
    (doc) => doc.status === "Rejected"
  ).length;

  const resetForm = () => {
    setSelectedStudent("");
    setDocumentType("Identity Proof");
    setDocumentName("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile || !selectedStudent || !documentName.trim()) {
      return;
    }

    const student = studentOptions.find(
      (item) => item.id === selectedStudent
    );

    if (!student) return;

    const newDocument: StudentDocument = {
      id: `DOC${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      documentName: documentName.trim(),
      documentType,
      fileName: selectedFile.name,
      fileSize:
        selectedFile.size >= 1024 * 1024
          ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(selectedFile.size / 1024).toFixed(0)} KB`,
      uploadDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Pending",
      fileUrl: URL.createObjectURL(selectedFile),
    };

    setDocuments((prev) => [newDocument, ...prev]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (document: StudentDocument) => {
    const confirmed = window.confirm(
      `Delete ${document.documentName} for ${document.studentName}?`
    );

    if (!confirmed) return;

    if (document.fileUrl) {
      URL.revokeObjectURL(document.fileUrl);
    }

    setDocuments((prev) =>
      prev.filter((item) => item.id !== document.id)
    );

    if (previewDocument?.id === document.id) {
      setPreviewDocument(null);
    }
  };

  const handleDownload = (document: StudentDocument) => {
    if (!document.fileUrl) {
      window.alert(
        "This is a demo record. The original file is not available."
      );
      return;
    }

    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.click();
  };

  const handleStatusChange = (
    id: string,
    status: DocumentStatus
  ) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status } : doc
      )
    );

    setPreviewDocument((prev) =>
      prev?.id === id ? { ...prev, status } : prev
    );
  };

  const statusStyle = (status: DocumentStatus) => {
    if (status === "Verified") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 cursor rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload, review and manage student documents.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Documents",
            value: documents.length,
            icon: FolderOpen,
          },
          {
            title: "Verified",
            value: verifiedCount,
            icon: CheckCircle2,
          },
          {
            title: "Pending Review",
            value: pendingCount,
            icon: Clock,
          },
          {
            title: "Rejected",
            value: rejectedCount,
            icon: FileText,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.title}</p>
                <div className="rounded-lg bg-yellow-100 p-2.5">
                  <Icon size={21} className="text-slate-800" />
                </div>
              </div>

              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or document..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Document Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold text-slate-900">
            Document Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Document</th>
                <th className="px-5 py-4 font-semibold">File</th>
                <th className="px-5 py-4 font-semibold">Upload Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {doc.studentName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {doc.studentId}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {doc.documentName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {doc.documentType}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">
                      {doc.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {doc.fileSize}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {doc.uploadDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewDocument(doc)}
                        title="View Details"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => handleDownload(doc)}
                        title="Download"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Download size={17} />
                      </button>

                      <button
                        onClick={() => handleDelete(doc)}
                        title="Delete"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Upload Student Document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a document to a student record.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="">Choose student</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Name *
                </label>
                <input
                  required
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. Aadhaar Card"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Choose File *
                </label>

                <input
                  ref={fileInputRef}
                  required
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-yellow-100 file:px-3 file:py-2 file:font-semibold"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 5 MB.
                </p>

                {selectedFile && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !selectedFile ||
                    selectedFile.size > 5 * 1024 * 1024
                  }
                  className="flex items-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={17} />
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-slate-900">
                Document Details
              </h2>
              <button
                onClick={() => setPreviewDocument(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {[
                ["Student", previewDocument.studentName],
                ["Student ID", previewDocument.studentId],
                ["Document", previewDocument.documentName],
                ["Document Type", previewDocument.documentType],
                ["File Name", previewDocument.fileName],
                ["File Size", previewDocument.fileSize],
                ["Upload Date", previewDocument.uploadDate],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}

              <div className="border-t pt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Review Status
                </label>
                <select
                  value={previewDocument.status}
                  onChange={(e) =>
                    handleStatusChange(
                      previewDocument.id,
                      e.target.value as DocumentStatus
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => handleDownload(previewDocument)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
              >
                <Download size={17} />
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Demo mode: uploaded files use temporary browser object URLs. Existing
        sample records do not contain actual files. Documents and statuses
        are not persisted to a backend.
      </p>
    </div>
  );
}
