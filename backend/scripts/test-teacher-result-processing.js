import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "eduflow_erp_super_secure_jwt_secret_key_2026_xyz";

const teacherToken = jwt.sign(
  { id: "6ae9ba8d5c59cac6a3c5f43e", role: "TEACHER" },
  jwtSecret,
  { expiresIn: "1d" }
);
const accountantToken = jwt.sign(
  { id: "6ae9b53f0e63cf9852ea2826", role: "ACCOUNTANT" },
  jwtSecret,
  { expiresIn: "1d" }
);
const studentToken = jwt.sign(
  { id: "6aeac49cb49b2d1e2bbd3ae6", role: "STUDENT" },
  jwtSecret,
  { expiresIn: "1d" }
);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("PASS:", message);
    passed++;
  } else {
    console.error("FAIL:", message);
    failed++;
  }
}

async function run() {
  // 1. Next.js Routes
  const r1 = await fetch("http://localhost:3000/examination/result-processing");
  assert(r1.status === 200, "/examination/result-processing HTTP 200 OK");

  const r2 = await fetch("http://localhost:3000/examinations/result-processing");
  assert(r2.status === 200, "/examinations/result-processing HTTP 200 OK");

  // 2. Teacher GET /api/exams
  const resExams = await fetch("http://localhost:5000/api/exams", {
    headers: { Authorization: "Bearer " + teacherToken },
  });
  const dataExams = await resExams.json();
  assert(resExams.status === 200 && dataExams.success === true, "Teacher GET /api/exams status 200");

  // 3. Teacher GET /api/students
  const resStudents = await fetch("http://localhost:5000/api/students", {
    headers: { Authorization: "Bearer " + teacherToken },
  });
  const dataStudents = await resStudents.json();
  assert(resStudents.status === 200 && dataStudents.students?.length > 0, "Teacher GET /api/students returns students");

  // 4. Teacher GET /api/exams/results
  const resResultsPre = await fetch("http://localhost:5000/api/exams/results", {
    headers: { Authorization: "Bearer " + teacherToken },
  });
  const dataResultsPre = await resResultsPre.json();
  assert(resResultsPre.status === 200 && Array.isArray(dataResultsPre.results), "Teacher GET /api/exams/results status 200 array");

  // 5. Teacher POST /api/exams/results (Marks Entry)
  const postRes = await fetch("http://localhost:5000/api/exams/results", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + teacherToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      examinationName: "Half Yearly",
      className: "Class IT",
      subjectName: "Hindi",
      results: [
        {
          studentId: "6af40bfa87af6a07cd831472",
          studentName: "AMIT PAL",
          rollNumber: "STU31471",
          className: "Class IT",
          subjectName: "Hindi",
          marksObtained: 100,
          maxMarks: 100,
          status: "Pass",
        },
        {
          studentId: "6af4009d8bfbbe9f552c9846",
          studentName: "Aman Patel",
          rollNumber: "STUD3AE6",
          className: "Class IT",
          subjectName: "Hindi",
          marksObtained: 88,
          maxMarks: 100,
          status: "Pass",
        },
      ],
    }),
  });
  const postData = await postRes.json();
  assert(postRes.status === 200 && postData.success === true, "Teacher POST /api/exams/results saves marks for AMIT PAL and Aman Patel");

  // 6. Verify GET /api/exams/results reflects saved marks
  const resResultsPost = await fetch("http://localhost:5000/api/exams/results", {
    headers: { Authorization: "Bearer " + teacherToken },
  });
  const dataResultsPost = await resResultsPost.json();
  assert(
    resResultsPost.status === 200 && dataResultsPost.results?.length >= 2,
    "Teacher GET /api/exams/results returns the saved results (" + dataResultsPost.results?.length + " results)"
  );

  // 7. Verify Teacher can view report card for the student
  const repCardRes = await fetch("http://localhost:5000/api/exams/report-card/6af40bfa87af6a07cd831472", {
    headers: { Authorization: "Bearer " + teacherToken },
  });
  const repCardData = await repCardRes.json();
  assert(repCardRes.status === 200 && repCardData.reportCard?.length > 0, "Teacher can view student report card");

  // 8. Verify Accountant is still forbidden (RBAC preserved)
  const accRes = await fetch("http://localhost:5000/api/exams/results", {
    headers: { Authorization: "Bearer " + accountantToken },
  });
  assert(accRes.status === 403, "Accountant cannot access exam results (RBAC preserved 403)");

  // 9. Verify Student cannot submit marks
  const studentSubmitRes = await fetch("http://localhost:5000/api/exams/results", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + studentToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      examinationName: "Half Yearly",
      className: "Class IT",
      subjectName: "Hindi",
      results: [],
    }),
  });
  assert(studentSubmitRes.status === 403, "Student cannot submit marks (RBAC preserved 403)");

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
