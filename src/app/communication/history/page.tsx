// ```tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Search,
//   History,
//   Eye,
//   X,
//   MessageSquare,
//   Megaphone,
//   Bell,
// } from "lucide-react";

// type HistoryItem = {
//   id: number;
//   title: string;
//   type: "Message" | "Announcement" | "Notification";
//   recipient: string;
//   date: string;
//   status: "Sent" | "Delivered" | "Read" | "Failed";
//   description: string;
// };

// const initialHistory: HistoryItem[] = [
//   {
//     id: 1,
//     title: "Parent-Teacher Meeting",
//     type: "Announcement",
//     recipient: "All Parents",
//     date: "2026-10-24",
//     status: "Delivered",
//     description:
//       "Parent-teacher meeting is scheduled for Saturday at 10 AM.",
//   },
//   {
//     id: 2,
//     title: "Fee Payment Reminder",
//     type: "Message",
//     recipient: "Class 10 Students",
//     date: "2026-10-23",
//     status: "Read",
//     description:
//       "Please complete the pending fee payment before the due date.",
//   },
//   {
//     id: 3,
//     title: "Exam Schedule",
//     type: "Notification",
//     recipient: "All Students",
//     date: "2026-10-22",
//     status: "Sent",
//     description:
//       "The upcoming examination schedule has been published.",
//   },
//   {
//     id: 4,
//     title: "Holiday Notice",
//     type: "Announcement",
//     recipient: "All Users",
//     date: "2026-10-20",
//     status: "Delivered",
//     description:
//       "The institution will remain closed on the announced holiday.",
//   },
// ];

// export default function CommunicationHistoryPage() {
//   const router = useRouter();

//   const [history] = useState<HistoryItem[]>(initialHistory);
//   const [search, setSearch] = useState("");
//   const [typeFilter, setTypeFilter] = useState("All");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [selected, setSelected] = useState<HistoryItem | null>(null);

//   const filteredHistory = history.filter((item) => {
//     const searchText = search.toLowerCase();

//     const matchesSearch =
//       item.title.toLowerCase().includes(searchText) ||
//       item.recipient.toLowerCase().includes(searchText) ||
//       item.type.toLowerCase().includes(searchText);

//     const matchesType =
//       typeFilter === "All" || item.type === typeFilter;

//     const matchesStatus =
//       statusFilter === "All" || item.status === statusFilter;

//     return matchesSearch && matchesType && matchesStatus;
//   });

//   const statusStyle: Record<HistoryItem["status"], string> = {
//     Sent: "bg-blue-100 text-blue-700",
//     Delivered: "bg-green-100 text-green-700",
//     Read: "bg-purple-100 text-purple-700",
//     Failed: "bg-red-100 text-red-700",
//   };

//   const typeIcon = (type: HistoryItem["type"]) => {
//     if (type === "Announcement") {
//       return <Megaphone size={16} />;
//     }

//     if (type === "Notification") {
//       return <Bell size={16} />;
//     }

//     return <MessageSquare size={16} />;
//   };

//   return (
//     <main className="min-h-screen bg-slate-50 p-4 md:p-8">
//       <div className="mx-auto max-w-7xl space-y-6">

//         {/* Back Button */}
//         <button
//           type="button"
//           onClick={() => router.push("/communication")}
//           className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
//         >
//           <ArrowLeft size={18} />
//           Back to Communication
//         </button>

//         {/* Page Header */}
//         <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
//           <div>
//             <div className="mb-2 flex items-center gap-3">
//               <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
//                 <History size={25} />
//               </div>

//               <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
//                 Communication History
//               </h1>
//             </div>

//             <p className="text-sm text-slate-500">
//               View and track previous messages, announcements, and
//               notifications.
//             </p>
//           </div>

//           <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
//             <p className="text-sm text-slate-500">Total Records</p>
//             <p className="text-2xl font-bold text-slate-800">
//               {filteredHistory.length}
//             </p>
//           </div>
//         </section>

//         {/* Summary Cards */}
//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           {[
//             {
//               label: "Messages",
//               count: history.filter(
//                 (item) => item.type === "Message"
//               ).length,
//               icon: <MessageSquare size={20} />,
//             },
//             {
//               label: "Announcements",
//               count: history.filter(
//                 (item) => item.type === "Announcement"
//               ).length,
//               icon: <Megaphone size={20} />,
//             },
//             {
//               label: "Notifications",
//               count: history.filter(
//                 (item) => item.type === "Notification"
//               ).length,
//               icon: <Bell size={20} />,
//             },
//           ].map((card) => (
//             <div
//               key={card.label}
//               className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
//             >
//               <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
//                 {card.icon}
//               </div>

//               <div>
//                 <p className="text-sm text-slate-500">
//                   {card.label}
//                 </p>
//                 <p className="text-2xl font-bold text-slate-800">
//                   {card.count}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </section>

//         {/* History Table */}
//         <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

//           {/* Search and Filters */}
//           <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">
//             <div className="relative flex-1">
//               <Search
//                 size={18}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//               />

//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search title, recipient, or type..."
//                 className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>

//             <select
//               value={typeFilter}
//               onChange={(e) => setTypeFilter(e.target.value)}
//               className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
//             >
//               <option value="All">All Types</option>
//               <option value="Message">Messages</option>
//               <option value="Announcement">Announcements</option>
//               <option value="Notification">Notifications</option>
//             </select>

//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
//             >
//               <option value="All">All Statuses</option>
//               <option value="Sent">Sent</option>
//               <option value="Delivered">Delivered</option>
//               <option value="Read">Read</option>
//               <option value="Failed">Failed</option>
//             </select>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[850px] text-left text-sm">
//               <thead className="bg-slate-50 text-xs uppercase text-slate-500">
//                 <tr>
//                   <th className="px-5 py-4 font-semibold">
//                     Communication
//                   </th>
//                   <th className="px-5 py-4 font-semibold">Type</th>
//                   <th className="px-5 py-4 font-semibold">Recipient</th>
//                   <th className="px-5 py-4 font-semibold">Date</th>
//                   <th className="px-5 py-4 font-semibold">Status</th>
//                   <th className="px-5 py-4 text-right font-semibold">
//                     Action
//                   </th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-slate-100">
//                 {filteredHistory.map((item) => (
//                   <tr
//                     key={item.id}
//                     className="transition hover:bg-amber-50/40"
//                   >
//                     <td className="px-5 py-4">
//                       <p className="font-semibold text-slate-800">
//                         {item.title}
//                       </p>
//                       <p className="mt-1 text-xs text-slate-500">
//                         ID: COM-
//                         {item.id.toString().padStart(4, "0")}
//                       </p>
//                     </td>

//                     <td className="px-5 py-4">
//                       <span className="inline-flex items-center gap-2 text-slate-600">
//                         {typeIcon(item.type)}
//                         {item.type}
//                       </span>
//                     </td>

//                     <td className="px-5 py-4 text-slate-600">
//                       {item.recipient}
//                     </td>

//                     <td className="px-5 py-4 text-slate-600">
//                       {item.date}
//                     </td>

//                     <td className="px-5 py-4">
//                       <span
//                         className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[item.status]}`}
//                       >
//                         {item.status}
//                       </span>
//                     </td>

//                     <td className="px-5 py-4 text-right">
//                       <button
//                         type="button"
//                         onClick={() => setSelected(item)}
//                         className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50"
//                       >
//                         <Eye size={15} />
//                         View
//                       </button>
//                     </td>
//                   </tr>
//                 ))}

//                 {filteredHistory.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-5 py-12 text-center"
//                     >
//                       <History
//                         className="mx-auto mb-3 text-slate-300"
//                         size={32}
//                       />

//                       <p className="font-medium text-slate-600">
//                         No communication records found
//                       </p>

//                       <p className="mt-1 text-sm text-slate-400">
//                         Try changing your search or filters.
//                       </p>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
//             Showing {filteredHistory.length} of {history.length} records
//           </div>
//         </section>
//       </div>

//       {/* Details Modal */}
//       {selected && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
//           onClick={() => setSelected(null)}
//         >
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="communication-details-title"
//             className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Modal Header */}
//             <div className="flex items-center justify-between border-b border-slate-200 p-5">
//               <h2
//                 id="communication-details-title"
//                 className="text-lg font-bold text-slate-800"
//               >
//                 Communication Details
//               </h2>

//               <button
//                 type="button"
//                 onClick={() => setSelected(null)}
//                 className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
//                 aria-label="Close details"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {/* Modal Content */}
//             <div className="space-y-4 p-5">
//               <div>
//                 <p className="text-xs text-slate-500">Title</p>
//                 <p className="mt-1 font-semibold text-slate-800">
//                   {selected.title}
//                 </p>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-xs text-slate-500">Type</p>
//                   <p className="mt-1 text-sm text-slate-800">
//                     {selected.type}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-slate-500">Recipient</p>
//                   <p className="mt-1 text-sm text-slate-800">
//                     {selected.recipient}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-slate-500">Date</p>
//                   <p className="mt-1 text-sm text-slate-800">
//                     {selected.date}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-slate-500">Status</p>
//                   <span
//                     className={"mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold" `${statusStyle[selected.status]}`}
//                   >
//                     {selected.status}
//                   </span>
//                 </div>
//               </div>

//               <div>
//                 <p className="text-xs text-slate-500">Content</p>
//                 <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
//                   {selected.description}
//                 </p>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="flex justify-end border-t border-slate-200 p-4">
//               <button
//                 type="button"
//                 onClick={() => setSelected(null)}
//                 className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }
// `