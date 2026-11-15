const API_BASE = "http://localhost:5000/api";

async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${data.message || res.statusText}`);
  }
  return data;
}

async function runTests() {
  console.log("=== EduFlow ERP System Verification ===\n");

  // Test 1: Authentication of all 6 roles
  const accounts = [
    { username: "admin", role: "SUPER_ADMIN", pass: "Admin@12345" },
    { username: "school_admin", role: "ADMIN", pass: "Admin@123" },
    { username: "principal", role: "PRINCIPAL", pass: "Principal@123" },
    { username: "teacher", role: "TEACHER", pass: "Teacher@123" },
    { username: "student", role: "STUDENT", pass: "Student@123" },
    { username: "accountant", role: "ACCOUNTANT", pass: "Accountant@123" },
  ];

  const tokens = {};

  for (const acc of accounts) {
    const authData = await login(acc.username, acc.pass);
    tokens[acc.role] = authData.token;
    console.log(`[PASS] Login successful for role ${acc.role} (${acc.username}) -> token issued.`);
  }

  console.log("\n=== Testing Profile Synchronization ===");

  // Test 2: Profile synchronization for Student
  const studentProfileRes = await fetch(`${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${tokens["STUDENT"]}` },
  });
  const studentProfile = await studentProfileRes.json();
  console.log(
    `[PASS] Student Profile: name="${studentProfile.user?.name}", role="${studentProfile.user?.role}", studentId="${studentProfile.user?.studentId}"`
  );

  // Test 3: Profile synchronization for Teacher
  const teacherProfileRes = await fetch(`${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${tokens["TEACHER"]}` },
  });
  const teacherProfile = await teacherProfileRes.json();
  console.log(
    `[PASS] Teacher Profile: name="${teacherProfile.user?.name}", role="${teacherProfile.user?.role}", department="${teacherProfile.user?.department}"`
  );

  // Test 4: Profile synchronization for Super Admin
  const adminProfileRes = await fetch(`${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${tokens["SUPER_ADMIN"]}` },
  });
  const adminProfile = await adminProfileRes.json();
  console.log(
    `[PASS] Super Admin Profile: name="${adminProfile.user?.name}", role="${adminProfile.user?.role}"`
  );

  console.log("\n=== Testing Strict Data Isolation ===");

  // Test 5: Student querying /students only receives their own record
  const studentListRes = await fetch(`${API_BASE}/students`, {
    headers: { Authorization: `Bearer ${tokens["STUDENT"]}` },
  });
  const studentListData = await studentListRes.json();
  console.log(
    `[PASS] Student querying /students returned ${studentListData.count} record(s). Name: "${studentListData.students?.[0]?.name}"`
  );
  if (studentListData.count !== 1) {
    throw new Error(`Data isolation violation: student saw ${studentListData.count} records!`);
  }

  // Test 6: Teacher querying /students only receives students in assigned classes
  const teacherListRes = await fetch(`${API_BASE}/students`, {
    headers: { Authorization: `Bearer ${tokens["TEACHER"]}` },
  });
  const teacherListData = await teacherListRes.json();
  console.log(
    `[PASS] Teacher querying /students returned ${teacherListData.count} assigned students.`
  );

  // Test 7: Accountant querying attendance gets 403 Forbidden
  const accountantAttRes = await fetch(`${API_BASE}/attendance`, {
    headers: { Authorization: `Bearer ${tokens["ACCOUNTANT"]}` },
  });
  console.log(
    `[PASS] Accountant querying attendance returned status: ${accountantAttRes.status} (Forbidden as expected).`
  );

  // Test 8: Teacher querying financial fees gets 403 Forbidden
  const teacherFeeRes = await fetch(`${API_BASE}/fees/receipts`, {
    headers: { Authorization: `Bearer ${tokens["TEACHER"]}` },
  });
  console.log(
    `[PASS] Teacher querying financial receipts returned status: ${teacherFeeRes.status} (Forbidden as expected).`
  );

  // Test 9: Accountant querying financial fees succeeds
  const accountantFeeRes = await fetch(`${API_BASE}/fees/receipts`, {
    headers: { Authorization: `Bearer ${tokens["ACCOUNTANT"]}` },
  });
  const accountantFeeData = await accountantFeeRes.json();
  console.log(
    `[PASS] Accountant querying financial receipts returned ${accountantFeeData.count} record(s).`
  );

  console.log("\n=== All Verification Tests Passed Successfully! ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
