"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowLeft,
  Loader2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

type DocumentStatus = "Pending" | "Approved" | "Rejected" | "Verified";

type DocumentHistoryItem = {
  action: string;
  status: DocumentStatus;
  actorName?: string;
  actorRole?: string;
  reason?: string;
  timestamp?: string;
};

type StudentDocument = {
  id: string;
  studentId: string;
  studentName: string;
  documentName: string;
  documentType: string;
  description?: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: DocumentStatus;
  fileUrl?: string;
  mongoStudentId?: string;
  uploadedByName?: string;
  approvedByName?: string;
  approvedAt?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  history?: DocumentHistoryItem[];
};

const documentTypes = [
  "Identity Proof",
  "Birth Certificate",
  "Academic Record",
  "School Certificate",
  "Address Proof",
  "Pan Card",
  "Other",
];

export default function StudentDocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [studentOptions, setStudentOptions] = useState<{ id: string; name: string; mongoId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [userRole, setUserRole] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMongoStudentId, setSelectedMongoStudentId] = useState("");
  const [studentNameInput, setStudentNameInput] = useState("");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [documentType, setDocumentType] = useState("Identity Proof");
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<StudentDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StudentDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveStoredRole = () => {
    const userKeys = ["eduflow-user", "edunexus-user", "currentUser", "user"];
    for (const key of userKeys) {
      try {
        const rawUser = localStorage.getItem(key);
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed?.role) {
            return String(parsed.role).toUpperCase();
          }
        }
      } catch {
        // Ignore malformed storage entry
      }
    }
    return (
      localStorage.getItem("eduflow-role") ||
      localStorage.getItem("eduflow-demo-role") ||
      localStorage.getItem("role") ||
      ""
    ).toUpperCase();
  };

  useEffect(() => {
    const syncRole = () => {
      const resolved = resolveStoredRole();
      if (resolved) {
        setUserRole(resolved);
      }
    };

    syncRole();
    fetchData();

    // Verify role against live session token so stale localStorage cannot hide Upload Document
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("eduflow-token");

    if (token) {
      api
        .get<{ success?: boolean; user?: { role?: string } }>("/auth/me")
        .then((res) => {
          const liveRole = res?.user?.role ? String(res.user.role).toUpperCase() : "";
          if (liveRole) {
            setUserRole(liveRole);
          }
        })
        .catch(() => {
          // Keep stored fallback if auth check fails
        });
    }

    window.addEventListener("eduflow-user-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("eduflow-user-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get<{ success: boolean; students: any[] }>("/students");
      if (res?.students) {
        const options = res.students.map((s: any) => ({
          id: s.studentId || s._id,
          name: s.name,
          mongoId: s._id,
        }));
        setStudentOptions(options);

        const allDocs: StudentDocument[] = [];
        res.students.forEach((s: any) => {
          if (Array.isArray(s.documents) && s.documents.length > 0) {
            s.documents.forEach((d: any, idx: number) => {
              const fallbackFileName =
                d.fileUrl && !String(d.fileUrl).startsWith("data:")
                  ? String(d.fileUrl).split("/").pop() || "document.pdf"
                  : "document.pdf";

              allDocs.push({
                id: d._id || `DOC_${s._id}_${idx}`,
                studentId: s.studentId || s._id,
                studentName: s.name,
                documentName: d.title || "Document",
                documentType: d.documentType || "Identity Proof",
                description: d.description || "",
                fileName: d.fileName || fallbackFileName,
                fileSize: d.fileSize || "—",
                uploadDate: d.uploadDate
                  ? new Date(d.uploadDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : new Date().toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                status: (d.status as DocumentStatus) || "Pending",
                fileUrl: d.fileUrl || undefined,
                mongoStudentId: s._id,
                uploadedByName: d.uploadedByName || undefined,
                approvedByName: d.approvedByName || undefined,
                approvedAt: formatDate(d.approvedAt),
                verifiedByName: d.verifiedByName || undefined,
                verifiedAt: formatDate(d.verifiedAt),
                rejectedByName: d.rejectedByName || undefined,
                rejectedAt: formatDate(d.rejectedAt),
                rejectionReason: d.rejectionReason || undefined,
                history: Array.isArray(d.history) ? d.history : [],
              });
            });
          }
        });

        setDocuments(allDocs);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  const canUpload = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"].includes(userRole);
  const canVerify = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(userRole);
  const canDelete = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);
  const isStudent = userRole === "STUDENT";

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

  const approvedCount = documents.filter(
    (doc) => doc.status === "Approved"
  ).length;

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
    setSelectedMongoStudentId("");
    setStudentNameInput("");
    setStudentIdInput("");
    setDocumentType("Identity Proof");
    setDocumentName("");
    setDescription("");
    setSelectedFile(null);
    setFormError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectRegisteredStudent = (mongoId: string) => {
    setSelectedMongoStudentId(mongoId);
    const match = studentOptions.find((s) => s.mongoId === mongoId);
    if (match) {
      setStudentNameInput(match.name);
      setStudentIdInput(match.id);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!canUpload) {
      setFormError("You are not authorized to upload student documents.");
      return;
    }

    const cleanStudentName = studentNameInput.trim();
    const cleanStudentId = studentIdInput.trim();
    if (!isStudent && !cleanStudentName && !cleanStudentId && !selectedMongoStudentId) {
      setFormError("Please enter or select Student Name and Student ID / Admission Number.");
      return;
    }

    if (!selectedFile || !documentName.trim()) {
      setFormError("Please enter document title and choose a valid PDF/JPG/PNG file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError("File size exceeds 5 MB limit.");
      return;
    }

    // Match existing student if user typed Student ID / Name manually
    const matchedStudent =
      studentOptions.find((s) => s.mongoId === selectedMongoStudentId) ||
      studentOptions.find(
        (s) => cleanStudentId && s.id.toLowerCase() === cleanStudentId.toLowerCase()
      ) ||
      studentOptions.find(
        (s) => cleanStudentName && s.name.toLowerCase() === cleanStudentName.toLowerCase()
      );

    setUploading(true);
    try {
      const fileDataUrl = await readFileAsDataUrl(selectedFile);

      await api.post("/students/documents", {
        ...(isStudent
          ? {}
          : {
              mongoStudentId: matchedStudent?.mongoId || selectedMongoStudentId || undefined,
              studentId: cleanStudentId || matchedStudent?.id || undefined,
              studentName: cleanStudentName || matchedStudent?.name || undefined,
            }),
        title: documentName.trim(),
        documentType,
        description: description.trim(),
        fileName: selectedFile.name,
        fileUrl: fileDataUrl,
      });

      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docItem: StudentDocument) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `Delete ${docItem.documentName} for ${docItem.studentName}?`
    );

    if (!confirmed) return;

    if (docItem.fileUrl && docItem.fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(docItem.fileUrl);
    }

    if (docItem.mongoStudentId) {
      try {
        setUpdatingId(docItem.id);
        setErrorMsg("");
        await api.delete(`/students/${docItem.mongoStudentId}/documents/${docItem.id}`);

        setDocuments((prev) =>
          prev.filter((item) => item.id !== docItem.id)
        );
        if (previewDocument?.id === docItem.id) {
          setPreviewDocument(null);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Could not delete document.");
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const handleDownload = (docItem: StudentDocument) => {
    if (!docItem.fileUrl) {
      window.alert("Document record found, but no file is attached.");
      return;
    }

    const link = window.document.createElement("a");
    link.href = docItem.fileUrl;
    link.download = docItem.fileName || "document";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleStatusChange = async (
    docItem: StudentDocument,
    status: DocumentStatus,
    reason?: string
  ) => {
    if (!canVerify || !docItem.mongoStudentId) return false;

    try {
      setUpdatingId(docItem.id);
      setErrorMsg("");
      const res = await api.put<{
        success: boolean;
        document?: {
          status?: DocumentStatus;
          approvedByName?: string;
          approvedAt?: string;
          verifiedByName?: string;
          verifiedAt?: string;
          rejectedByName?: string;
          rejectedAt?: string;
          rejectionReason?: string;
          history?: DocumentHistoryItem[];
        };
      }>(`/students/${docItem.mongoStudentId}/documents/${docItem.id}/status`, {
        status,
        rejectionReason: reason,
      });

      const updatedDoc = res?.document;
      const patchFields = (doc: StudentDocument): StudentDocument => ({
        ...doc,
        status: updatedDoc?.status || status,
        approvedByName: updatedDoc?.approvedByName || undefined,
        approvedAt: formatDate(updatedDoc?.approvedAt),
        verifiedByName: updatedDoc?.verifiedByName || undefined,
        verifiedAt: formatDate(updatedDoc?.verifiedAt),
        rejectedByName: updatedDoc?.rejectedByName || undefined,
        rejectedAt: formatDate(updatedDoc?.rejectedAt),
        rejectionReason: updatedDoc?.rejectionReason || undefined,
        history: Array.isArray(updatedDoc?.history) ? updatedDoc.history : doc.history,
      });

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docItem.id ? patchFields(doc) : doc))
      );

      setPreviewDocument((prev) =>
        prev?.id === docItem.id ? patchFields(prev) : prev
      );
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update document status.");
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const openRejectModal = (docItem: StudentDocument) => {
    setRejectTarget(docItem);
    setRejectionReason(docItem.rejectionReason || "");
    setRejectError("");
  };

  const handleConfirmReject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rejectTarget) return;
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectError("Please provide a rejection reason.");
      return;
    }

    const ok = await handleStatusChange(rejectTarget, "Rejected", cleanReason);
    if (ok) {
      setRejectTarget(null);
      setRejectionReason("");
      setRejectError("");
    } else {
      setRejectError("Could not reject document. Check your permissions and try again.");
    }
  };

  const statusStyle = (status: DocumentStatus) => {
    if (status === "Verified") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Approved") {
      return "bg-blue-100 text-blue-700";
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
            {isStudent
              ? "Upload, view and download your official student documents."
              : "Upload, review, approve, and verify student documents."}
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => {
              resetForm();
              if (isStudent && studentOptions[0]) {
                setSelectedMongoStudentId(studentOptions[0].mongoId);
                setStudentNameInput(studentOptions[0].name);
                setStudentIdInput(studentOptions[0].id);
              }
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
          >
            <Upload size={18} />
            Upload Document
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Documents",
            value: documents.length,
            icon: FolderOpen,
          },
          {
            title: "Approved",
            value: approvedCount,
            icon: CheckCircle2,
          },
          {
            title: "Verified",
            value: verifiedCount,
            icon: ShieldCheck,
          },
          {
            title: "Pending / Rejected",
            value: `${pendingCount} / ${rejectedCount}`,
            icon: Clock,
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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Verified">Verified</option>
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

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : (
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
                      {doc.status === "Rejected" && doc.rejectionReason && (
                        <p className="mt-1 max-w-[180px] truncate text-xs text-red-600" title={doc.rejectionReason}>
                          {doc.rejectionReason}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
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

                        {canVerify && (
                          <>
                            <button
                              onClick={() => handleStatusChange(doc, "Approved")}
                              disabled={
                                updatingId === doc.id ||
                                doc.status === "Approved" ||
                                doc.status === "Verified"
                              }
                              title="Approve Document"
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <CheckCircle2 size={17} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(doc, "Verified")}
                              disabled={
                                updatingId === doc.id ||
                                doc.status !== "Approved"
                              }
                              title={
                                doc.status === "Approved"
                                  ? "Mark as Verified"
                                  : "Approve document first to verify"
                              }
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ShieldCheck size={17} />
                            </button>
                            <button
                              onClick={() => openRejectModal(doc)}
                              disabled={updatingId === doc.id || doc.status === "Rejected"}
                              title="Reject Document"
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <XCircle size={17} />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={updatingId === doc.id}
                            title="Delete"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
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
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && canUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Upload Student Document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Associate a valid document with a student record.
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
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              {!isStudent && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quick Select Registered Student
                  </label>
                  <select
                    value={selectedMongoStudentId}
                    onChange={(e) => handleSelectRegisteredStudent(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    <option value="">Choose registered student (or type details below)</option>
                    {studentOptions.map((student) => (
                      <option key={student.mongoId} value={student.mongoId}>
                        {student.name} ({student.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student Name *
                  </label>
                  <input
                    required={!isStudent}
                    disabled={isStudent}
                    value={studentNameInput}
                    onChange={(e) => {
                      setSelectedMongoStudentId("");
                      setStudentNameInput(e.target.value);
                    }}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student ID / Admission No *
                  </label>
                  <input
                    required={!isStudent}
                    disabled={isStudent}
                    value={studentIdInput}
                    onChange={(e) => {
                      setSelectedMongoStudentId("");
                      setStudentIdInput(e.target.value);
                    }}
                    placeholder="e.g. STU202601"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    Document Title *
                  </label>
                  <input
                    required
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g. Aadhaar Card"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this document..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Upload File *
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
                    uploading ||
                    !selectedFile ||
                    !documentName.trim() ||
                    (!isStudent && !studentNameInput.trim() && !studentIdInput.trim() && !selectedMongoStudentId) ||
                    selectedFile.size > 5 * 1024 * 1024
                  }
                  className="flex items-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Upload size={17} />
                  )}
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
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
                ["Document Title", previewDocument.documentName],
                ["Document Type", previewDocument.documentType],
                ...(previewDocument.description
                  ? [["Description", previewDocument.description]]
                  : []),
                ["File Name", previewDocument.fileName],
                ["File Size", previewDocument.fileSize],
                ["Upload Date", previewDocument.uploadDate],
                ...(previewDocument.uploadedByName
                  ? [["Uploaded By", previewDocument.uploadedByName]]
                  : []),
                ...(previewDocument.approvedByName
                  ? [
                      [
                        "Approved By",
                        previewDocument.approvedAt
                          ? `${previewDocument.approvedByName} (${previewDocument.approvedAt})`
                          : previewDocument.approvedByName,
                      ],
                    ]
                  : []),
                ...(previewDocument.verifiedByName
                  ? [
                      [
                        "Verified By",
                        previewDocument.verifiedAt
                          ? `${previewDocument.verifiedByName} (${previewDocument.verifiedAt})`
                          : previewDocument.verifiedByName,
                      ],
                    ]
                  : []),
                ...(previewDocument.rejectedByName
                  ? [
                      [
                        "Rejected By",
                        previewDocument.rejectedAt
                          ? `${previewDocument.rejectedByName} (${previewDocument.rejectedAt})`
                          : previewDocument.rejectedByName,
                      ],
                    ]
                  : []),
                ...(previewDocument.rejectionReason
                  ? [["Rejection Reason", previewDocument.rejectionReason]]
                  : []),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="max-w-[65%] text-right font-semibold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                    previewDocument.status
                  )}`}
                >
                  {previewDocument.status}
                </span>
              </div>

              {previewDocument.fileUrl &&
                previewDocument.fileUrl.startsWith("data:image/") && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={previewDocument.fileUrl}
                      alt={previewDocument.documentName}
                      className="max-h-64 w-full rounded object-contain"
                    />
                  </div>
                )}

              {previewDocument.fileUrl &&
                previewDocument.fileUrl.startsWith("data:application/pdf") && (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <iframe
                      src={previewDocument.fileUrl}
                      title={previewDocument.documentName}
                      className="h-64 w-full"
                    />
                  </div>
                )}

              {Array.isArray(previewDocument.history) &&
                previewDocument.history.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status History
                    </p>
                    <div className="space-y-2">
                      {previewDocument.history.map((entry, index) => (
                        <div
                          key={`${entry.action}-${index}`}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              {entry.action} — {entry.actorName || "Staff"}
                              {entry.actorRole ? ` (${entry.actorRole})` : ""}
                            </span>
                            <span className="text-slate-400">
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="mt-1 text-red-600">
                              Reason: {entry.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {canVerify && (
                <div className="space-y-3 border-t pt-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Approval & Verification Controls
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={
                        updatingId === previewDocument.id ||
                        previewDocument.status === "Approved" ||
                        previewDocument.status === "Verified"
                      }
                      onClick={() =>
                        handleStatusChange(previewDocument, "Approved")
                      }
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={
                        updatingId === previewDocument.id ||
                        previewDocument.status !== "Approved"
                      }
                      onClick={() =>
                        handleStatusChange(previewDocument, "Verified")
                      }
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShieldCheck size={15} />
                      Mark Verified
                    </button>
                    <button
                      type="button"
                      disabled={
                        updatingId === previewDocument.id ||
                        previewDocument.status === "Rejected"
                      }
                      onClick={() => openRejectModal(previewDocument)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  </div>
                </div>
              )}

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

      {/* Rejection Reason Modal */}
      {rejectTarget && canVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Reject Document
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {rejectTarget.documentName} — {rejectTarget.studentName}
                </p>
              </div>
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectError("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 p-5">
              {rejectError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {rejectError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why this document is rejected..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectError("");
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === rejectTarget.id || !rejectionReason.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}