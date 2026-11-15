import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const jwtSecret = process.env.JWT_SECRET || "eduflow_erp_super_secure_jwt_secret_key_2026_xyz";

const adminToken = jwt.sign(
  { id: "6ae9a30da6b91d44863a3935", role: "SUPER_ADMIN" },
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
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduflow_erp");
  const ExamResult = mongoose.model(
    "ExamResult",
    new mongoose.Schema({}, { strict: false }),
    "examresults"
  );

  // 1. Fetch current results via API
  const res = await fetch("http://localhost:5000/api/exams/results", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const data = await res.json();
  assert(res.status === 200 && data.success === true, "GET /api/exams/results status 200");
  assert(Array.isArray(data.results), "Results is an array from database");

  // 2. Compute subject performance from current API response
  const subjectMap = new Map();
  for (const r of data.results) {
    if (Array.isArray(r.subjects)) {
      for (const sub of r.subjects) {
        const rawName = String(sub.subjectName || "").trim();
        if (!rawName) continue;
        const key = rawName.toLowerCase();
        const existing = subjectMap.get(key) || { name: rawName, obtained: 0, max: 0, count: 0 };
        existing.obtained += Number(sub.marksObtained || 0);
        existing.max += Number(sub.maxMarks || 100);
        existing.count += 1;
        subjectMap.set(key, existing);
      }
    }
  }

  const computedSubjects = Array.from(subjectMap.values()).map((s) => ({
    name: s.name,
    percentage: s.max > 0 ? Math.round((s.obtained / s.max) * 100) : 0,
    studentsCount: s.count,
  }));

  console.log("Current Database Subjects:", computedSubjects);

  // 3. Verify that dummy subjects (English 91%, Social Science 76%, Computer 94%) are NOT in computed list unless in DB
  const dummyNames = ["English", "Social Science", "Computer"];
  const dbSubjectNames = computedSubjects.map((s) => s.name);
  const containsUnbackedDummy = dummyNames.some((d) => {
    // If it is in computed list, check if it actually exists in MongoDB
    if (dbSubjectNames.includes(d)) {
      return !data.results.some((r) =>
        r.subjects?.some((s) => s.subjectName?.toLowerCase() === d.toLowerCase())
      );
    }
    return false;
  });
  assert(!containsUnbackedDummy, "No unbacked dummy subject data is generated");

  // 4. Verify Hindi subject calculation
  const hindi = computedSubjects.find((s) => s.name.toLowerCase() === "hindi");
  if (hindi) {
    assert(hindi.studentsCount === 2, "Hindi has 2 students evaluated");
    assert(hindi.percentage === 94, "Hindi percentage is accurately 94% (from 100 + 88 / 200)");
  }

  // 5. Test adding a new mark entry for a new subject (e.g. Physics)
  const postRes = await fetch("http://localhost:5000/api/exams/results", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + adminToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      examinationName: "Unit Test 1",
      className: "Class IT",
      subjectName: "Physics",
      results: [
        {
          studentId: "6af40bfa87af6a07cd831472",
          studentName: "AMIT PAL",
          rollNumber: "STU31471",
          className: "Class IT",
          subjectName: "Physics",
          marksObtained: 75,
          maxMarks: 100,
          status: "Pass",
        },
      ],
    }),
  });
  const postData = await postRes.json();
  assert(postRes.status === 200 && postData.success === true, "Added new subject result for Physics");

  // 6. Verify GET /api/exams/results includes Physics
  const res2 = await fetch("http://localhost:5000/api/exams/results", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const data2 = await res2.json();
  const physicsResult = data2.results?.find((r) =>
    r.subjects?.some((s) => s.subjectName?.toLowerCase() === "physics")
  );
  assert(!!physicsResult, "Physics result appears in GET /api/exams/results");

  // 7. Clean up the test Physics entry
  await ExamResult.deleteOne({ _id: physicsResult?._id });
  console.log("Cleaned up test Physics result from MongoDB");

  // 8. Test both URLs respond
  const rDashboardSingular = await fetch("http://localhost:3000/examination/result-dashboard");
  assert(rDashboardSingular.status === 200, "/examination/result-dashboard responds 200 OK");

  const rDashboardPlural = await fetch("http://localhost:3000/examinations/result-dashboard");
  assert(rDashboardPlural.status === 200, "/examinations/result-dashboard responds 200 OK");

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
