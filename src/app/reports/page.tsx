// ```tsx
// "use client";

// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   ArrowRight,
//   BarChart3,
//   Users,
//   UserPlus,
//   CalendarCheck,
//   Wallet,
//   GraduationCap,
//   TrendingUp,
//   IndianRupee,
//   ClipboardList,
//   FileText,
// } from "lucide-react";

// const reportModules = [
//   {
//     title: "Admission Reports",
//     description:
//       "View new admissions, class-wise enrollment, and admission trends.",
//     href: "/reports/admission",
//     icon: UserPlus,
//     color: "bg-blue-100 text-blue-700",
//     tag: "Admissions",
//   },
//   {
//     title: "Attendance Reports",
//     description:
//       "Analyze attendance percentage, absentees, and class-wise records.",
//     href: "/reports/attendance",
//     icon: CalendarCheck,
//     color: "bg-green-100 text-green-700",
//     tag: "Attendance",
//   },
//   {
//     title: "Fees Reports",
//     description:
//       "Track fee collection, outstanding dues, and payment status.",
//     href: "/reports/fees",
//     icon: Wallet,
//     color: "bg-purple-100 text-purple-700",
//     tag: "Finance",
//   },
//   {
//     title: "Academic Performance",
//     description:
//       "Review exam results, subject averages, and student performance.",
//     href: "/reports/academic-performance",
//     icon: GraduationCap,
//     color: "bg-amber-100 text-amber-700",
//     tag: "Academics",
//   },
// ];

// const monthlyAdmissions = [
//   { month: "May", value: 45 },
//   { month: "Jun", value: 65 },
//   { month: "Jul", value: 82 },
//   { month: "Aug", value: 55 },
//   { month: "Sep", value: 72 },
//   { month: "Oct", value: 90 },
// ];

// const feeCollection = [
//   { month: "May", collected: 45, pending: 25 },
//   { month: "Jun", collected: 65, pending: 20 },
//   { month: "Jul", collected: 75, pending: 18 },
//   { month: "Aug", collected: 55, pending: 30 },
//   { month: "Sep", collected: 85, pending: 12 },
//   { month: "Oct", collected: 90, pending: 10 },
// ];

// export default function ReportsDashboardPage() {
//   const router = useRouter();

//   const stats = [
//     {
//       title: "Total Students",
//       value: "1,240",
//       subtitle: "Across all classes",
//       icon: Users,
//       color: "bg-blue-100 text-blue-700",
//     },
//     {
//       title: "Admissions This Month",
//       value: "90",
//       subtitle: "Demo monthly figure",
//       icon: UserPlus,
//       color: "bg-green-100 text-green-700",
//     },
//     {
//       title: "Attendance Rate",
//       value: "92.5%",
//       subtitle: "Demo attendance figure",
//       icon: CalendarCheck,
//       color: "bg-amber-100 text-amber-700",
//     },
//     {
//       title: "Fees Collected",
//       value: "₹18.5L",
//       subtitle: "Demo collection figure",
//       icon: IndianRupee,
//       color: "bg-purple-100 text-purple-700",
//     },
//   ];

//   return (
//     <main className="min-h-screen bg-slate-50 p-4 md:p-8">
//       <div className="mx-auto max-w-7xl space-y-7">

//         {/* Back Button */}
//         <button
//           type="button"
//           onClick={() => router.push("/dashboard")}
//           className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
//         >
//           <ArrowLeft size={18} />
//           Back to Dashboard
//         </button>

//         {/* Header */}
//         <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
//           <div>
//             <div className="mb-2 flex items-center gap-3">
//               <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
//                 <BarChart3 size={27} />
//               </div>
//               <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
//                 Reports & Analysis
//               </h1>
//             </div>

//             <p className="text-sm text-slate-500">
//               Monitor institutional performance through reports and analytics.
//             </p>
//           </div>

//           <div className="flex items-center gap-2 self-start rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 sm:self-auto">
//             <FileText size={17} />
//             Admin Reports
//           </div>
//         </section>

//         {/* Summary Cards */}
//         <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {stats.map((stat) => {
//             const Icon = stat.icon;

//             return (
//               <div
//                 key={stat.title}
//                 className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <p className="text-sm text-slate-500">
//                       {stat.title}
//                     </p>
//                     <h2 className="mt-2 text-2xl font-bold text-slate-800">
//                       {stat.value}
//                     </h2>
//                   </div>

//                   <div className={`rounded-xl p-3 ${stat.color}`}>
//                     <Icon size={22} />
//                   </div>
//                 </div>

//                 <p className="mt-3 text-xs text-slate-500">
//                   {stat.subtitle}
//                 </p>
//               </div>
//             );
//           })}
//         </section>

//         {/* Report Modules */}
//         <section>
//           <div className="mb-4">
//             <h2 className="text-xl font-bold text-slate-800">
//               Reports Modules
//             </h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Select a report to explore detailed records and analysis.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//             {reportModules.map((module) => {
//               const Icon = module.icon;

//               return (
//                 <button
//                   key={module.title}
//                   type="button"
//                   onClick={() => router.push(module.href)}
//                   className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md sm:p-6"
//                 >
//                   <div className="flex items-start justify-between gap-4">
//                     <div
//                       className={`rounded-xl p-3 ${module.color}`}
//                     >
//                       <Icon size={25} />
//                     </div>

//                     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
//                       {module.tag}
//                     </span>
//                   </div>

//                   <h3 className="mt-5 text-lg font-bold text-slate-800">
//                     {module.title}
//                   </h3>

//                   <p className="mt-2 text-sm leading-6 text-slate-500">
//                     {module.description}
//                   </p>

//                   <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-amber-700">
//                     <span>View Report</span>
//                     <ArrowRight
//                       size={18}
//                       className="transition group-hover:translate-x-1"
//                     />
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </section>

//         {/* Charts */}
//         <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

//           {/* Admission Chart */}
//           <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//             <div className="mb-6 flex items-center justify-between gap-3">
//               <div>
//                 <h2 className="font-bold text-slate-800">
//                   Admission Trends
//                 </h2>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Monthly admission index (demo data)
//                 </p>
//               </div>

//               <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
//                 <TrendingUp size={20} />
//               </div>
//             </div>

//             <div className="flex h-56 items-end gap-3 border-b border-l border-slate-200 px-3 pb-2 pt-4 sm:gap-5">
//               {monthlyAdmissions.map((item) => (
//                 <div
//                   key={item.month}
//                   className="flex h-full flex-1 flex-col items-center justify-end gap-2"
//                 >
//                   <span className="text-xs font-semibold text-slate-600">
//                     {item.value}
//                   </span>

//                   <div
//                     className="w-full max-w-12 rounded-t-md bg-amber-400 transition hover:bg-amber-500"
//                     style={{ height: `${item.value}%` }}
//                     title={`${item.month}: ${item.value}`}
//                   />

//                   <span className="text-xs text-slate-500">
//                     {item.month}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Fees Chart */}
//           <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//             <div className="mb-6 flex items-center justify-between gap-3">
//               <div>
//                 <h2 className="font-bold text-slate-800">
//                   Fee Collection Analysis
//                 </h2>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Monthly collection vs pending index (demo data)
//                 </p>
//               </div>

//               <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
//                 <Wallet size={20} />
//               </div>
//             </div>

            
// <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-600">
//   <span className="flex items-center gap-2">
//     <span className="h-3 w-3 rounded-sm bg-amber-400" />
//     Collected
//   </span>

//   <span className="flex items-center gap-2">
//     <span className="h-3 w-3 rounded-sm bg-slate-300" />
//     Pending
//   </span>
// </div>

      
//               <div className="flex h-48 items-end gap-3 border-b border-l border-slate-200 px-3 pb-2 pt-4 sm:gap-5">
//                 {feeCollection.map((item) => (
//                   <div
//                     key={item.month}
//                     className="flex h-full flex-1 flex-col items-center justify-end gap-2"
//                   >
//                     <div className="flex h-full w-full max-w-12 items-end gap-1">
//                       <div
//                         className="flex-1 rounded-t-sm bg-amber-400"
//                         style={{ height: `${item.collected}%` }}
//                         title={`Collected index: ${item.collected}`}
//                       />
//                       <div
//                         className="flex-1 rounded-t-sm bg-slate-300"
//                         style={{ height: `${item.pending}%` }}
//                         title={`Pending index: ${item.pending}`}
//                       />
//                     </div>

//                     <span className="text-xs text-slate-500">
//                       {item.month}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </section>

//           {/* Quick Info */}




//         {/* Quick Info */}
//         <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
//           <div className="rounded-lg bg-white p-3 text-amber-700">
//             <ClipboardList size={23} />
//           </div>

//           <div>
//             <h3 className="font-semibold text-slate-800">
//               Reporting Overview
//             </h3>
//             <p className="mt-1 text-sm leading-6 text-slate-600">
//               Choose a module above to view detailed reports. Summary figures
//               and charts currently use sample data and should be connected to
//               your ERP backend before being used for official reporting.
//             </p>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }
// `