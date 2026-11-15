const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function login(username, password) {
  const res = await request("/auth/login", "POST", { username, password });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("==================================================");
  console.log("EduFlow ERP - Complete 6-Role Authorization & RBAC Test Suite");
  console.log("==================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. SUPER ADMIN TESTS
    // -------------------------------------------------------------------------
    console.log(">>> Testing Role 1: SUPER ADMIN (admin)");
    const superAdminToken = await login("admin", "Admin@12345");
    assert(!!superAdminToken, "Super Admin authenticates via JWT");

    const saUsers = await request("/users", "GET", null, superAdminToken);
    assert(saUsers.status === 200 && Array.isArray(saUsers.data.users), "Super Admin can view all users");

    const tempUser = {
      username: `test_user_${Date.now().toString().slice(-4)}`,
      email: `test_${Date.now().toString().slice(-4)}@eduflow.com`,
      password: "TestUser@123",
      role: "TEACHER",
      firstName: "Test",
      lastName: "Teacher",
    };
    const saCreateUser = await request("/users", "POST", tempUser, superAdminToken);
    assert(saCreateUser.status === 201, "Super Admin can create any user account");

    const createdUserId = saCreateUser.data?.user?._id;
    if (createdUserId) {
      const saDelUser = await request(`/users/${createdUserId}`, "DELETE", null, superAdminToken);
      assert(saDelUser.status === 200, "Super Admin can delete user accounts");
    }

    const saStudents = await request("/students", "GET", null, superAdminToken);
    assert(saStudents.status === 200 && saStudents.data.students.length >= 4, "Super Admin can view all institutional students");

    const saFees = await request("/fees/structures", "GET", null, superAdminToken);
    assert(saFees.status === 200, "Super Admin can view fee structures");

    const saOverview = await request("/reports/overview", "GET", null, superAdminToken);
    assert(saOverview.status === 200 && saOverview.data.overview.totalStudents !== undefined, "Super Admin can view institutional overview");

    // -------------------------------------------------------------------------
    // 2. ADMIN TESTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Testing Role 2: ADMIN (school_admin)");
    const adminToken = await login("school_admin", "Admin@123");
    assert(!!adminToken, "Admin authenticates via JWT");

    const admUsers = await request("/users", "GET", null, adminToken);
    assert(admUsers.status === 200, "Admin can view all users");

    const admCreateSA = await request("/users", "POST", {
      username: "hacked_admin",
      email: "hacked_admin@eduflow.com",
      password: "Password@123",
      role: "SUPER_ADMIN",
    }, adminToken);
    assert(admCreateSA.status === 403, "Admin CANNOT create a Super Admin account (403 Forbidden)");

    // Find Super Admin user id to attempt update & delete
    const saUserObj = saUsers.data.users.find(u => u.role === "SUPER_ADMIN");
    if (saUserObj) {
      const admEditSA = await request(`/users/${saUserObj._id}`, "PUT", { name: "Compromised Name" }, adminToken);
      assert(admEditSA.status === 403, "Admin CANNOT modify Super Admin account (403 Forbidden)");

      const admDeleteSA = await request(`/users/${saUserObj._id}`, "DELETE", null, adminToken);
      assert(admDeleteSA.status === 403, "Admin CANNOT delete Super Admin account (403 Forbidden)");
    }

    const admStudents = await request("/students", "GET", null, adminToken);
    assert(admStudents.status === 200, "Admin can access institutional students");

    const admAttendance = await request("/attendance/stats", "GET", null, adminToken);
    assert(admAttendance.status === 200, "Admin can view attendance stats");

    // -------------------------------------------------------------------------
    // 3. PRINCIPAL TESTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Testing Role 3: PRINCIPAL (principal)");
    const principalToken = await login("principal", "Principal@123");
    assert(!!principalToken, "Principal authenticates via JWT");

    const prinStudents = await request("/students", "GET", null, principalToken);
    assert(prinStudents.status === 200, "Principal can view all students");

    // Principal cannot delete students
    const firstStudent = prinStudents.data.students[0];
    if (firstStudent) {
      const prinDelStu = await request(`/students/${firstStudent._id}`, "DELETE", null, principalToken);
      assert(prinDelStu.status === 403, "Principal CANNOT delete student records (403 Forbidden)");
    }

    // Principal cannot create fee structures
    const prinCreateFee = await request("/fees/structures", "POST", {
      className: "Class 9",
      tuitionFee: 50000,
    }, principalToken);
    assert(prinCreateFee.status === 403, "Principal CANNOT configure fee structures (403 Forbidden)");

    // Principal cannot record payments
    const prinPayFee = await request("/fees/pay", "POST", {
      studentId: firstStudent?._id,
      amount: 10000,
    }, principalToken);
    assert(prinPayFee.status === 403, "Principal CANNOT record financial payments (403 Forbidden)");

    // Principal cannot create Super Admin
    const prinCreateSA = await request("/users", "POST", {
      username: "prin_sa_attempt",
      email: "prin_sa@eduflow.com",
      password: "Password@123",
      role: "SUPER_ADMIN",
    }, principalToken);
    assert(prinCreateSA.status === 403, "Principal CANNOT create Super Admin account (403 Forbidden)");

    // -------------------------------------------------------------------------
    // 4. TEACHER TESTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Testing Role 4: TEACHER (teacher)");
    const teacherToken = await login("teacher", "Teacher@123");
    assert(!!teacherToken, "Teacher authenticates via JWT");

    // Teacher can only view assigned students (Class 10 and Class 11)
    const teachStudents = await request("/students", "GET", null, teacherToken);
    assert(teachStudents.status === 200, "Teacher can view assigned students");
    const anyUnassigned = teachStudents.data.students.some(s => s.className !== "Class 10" && s.className !== "Class 11");
    assert(!anyUnassigned, "Teacher ONLY sees students belonging to assigned classes");

    // Teacher cannot create student
    const teachCreateStu = await request("/students", "POST", {
      name: "Illegitimate Student",
      className: "Class 10",
    }, teacherToken);
    assert(teachCreateStu.status === 403, "Teacher CANNOT create student records (403 Forbidden)");

    // Teacher can mark attendance for assigned class
    const teachMarkAssigned = await request("/attendance/mark", "POST", {
      date: new Date().toISOString().slice(0, 10),
      className: "Class 10",
      records: [{ studentId: firstStudent._id, status: "Present" }],
    }, teacherToken);
    assert(teachMarkAssigned.status === 200, "Teacher CAN mark attendance for assigned classes");

    // Teacher CANNOT mark attendance for unassigned class
    const teachMarkUnassigned = await request("/attendance/mark", "POST", {
      date: new Date().toISOString().slice(0, 10),
      className: "Class 12",
      records: [{ studentId: firstStudent._id, status: "Present" }],
    }, teacherToken);
    assert(teachMarkUnassigned.status === 403, "Teacher CANNOT mark attendance for unassigned class (403 Forbidden)");

    // Teacher CANNOT access financial endpoints
    const teachFees = await request("/fees/structures", "GET", null, teacherToken);
    assert(teachFees.status === 403, "Teacher CANNOT access fee structures (403 Forbidden)");

    const teachPay = await request("/fees/pay", "POST", { amount: 5000 }, teacherToken);
    assert(teachPay.status === 403, "Teacher CANNOT record payments (403 Forbidden)");

    // Teacher CANNOT access user management
    const teachUsers = await request("/users", "GET", null, teacherToken);
    assert(teachUsers.status === 403, "Teacher CANNOT access user management (403 Forbidden)");

    // Teacher can apply for own leave
    const teachLeave = await request("/attendance/leaves", "POST", {
      leaveType: "Medical",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      reason: "Flu recovery",
    }, teacherToken);
    assert(teachLeave.status === 201, "Teacher CAN submit leave application");

    // Teacher CANNOT approve leaves
    if (teachLeave.data?.leave?._id) {
      const teachApprove = await request(`/attendance/leaves/${teachLeave.data.leave._id}/status`, "PUT", {
        status: "Approved",
      }, teacherToken);
      assert(teachApprove.status === 403, "Teacher CANNOT approve leave requests (403 Forbidden)");
    }

    // -------------------------------------------------------------------------
    // 5. STUDENT TESTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Testing Role 5: STUDENT (student)");
    const studentToken = await login("student", "Student@123");
    assert(!!studentToken, "Student authenticates via JWT");

    // Student only sees their own student record
    const stuList = await request("/students", "GET", null, studentToken);
    assert(stuList.status === 200, "Student can query student endpoint");
    assert(stuList.data.students.length === 1 && stuList.data.students[0].email === "student@eduflow.com",
      "Student query strictly isolated to own student profile (length = 1)");

    // Student cannot view another student's profile directly
    const otherStudent = saStudents.data.students.find(s => s.email !== "student@eduflow.com");
    if (otherStudent) {
      const stuOtherProfile = await request(`/students/${otherStudent._id}`, "GET", null, studentToken);
      assert(stuOtherProfile.status === 403, "Student CANNOT access another student's record by ID (403 Forbidden)");
    }

    // Student cannot mark attendance
    const stuMark = await request("/attendance/mark", "POST", {
      date: new Date().toISOString().slice(0, 10),
      className: "Class 10",
      records: [{ studentId: "STU001", status: "Present" }],
    }, studentToken);
    assert(stuMark.status === 403, "Student CANNOT mark attendance (403 Forbidden)");

    // Student can apply for leave
    const stuLeave = await request("/attendance/leaves", "POST", {
      leaveType: "Casual",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      reason: "Family event",
    }, studentToken);
    assert(stuLeave.status === 201, "Student CAN submit leave application");

    // Student can update permitted profile fields
    const stuProfileUpdate = await request("/users/profile", "PUT", {
      phone: "+91 99999 88888",
      address: "Updated Residence, New Delhi",
      role: "ADMIN", // attempt privilege escalation
    }, studentToken);
    assert(stuProfileUpdate.status === 200, "Student CAN update personal profile fields");
    assert(stuProfileUpdate.data.user.role === "STUDENT", "Student CANNOT escalate their own role to ADMIN");

    // Student cannot access user management
    const stuUsers = await request("/users", "GET", null, studentToken);
    assert(stuUsers.status === 403, "Student CANNOT access user management (403 Forbidden)");

    // Student cannot access institutional overview
    const stuOverview = await request("/reports/overview", "GET", null, studentToken);
    assert(stuOverview.status === 403, "Student CANNOT access institutional overview report (403 Forbidden)");

    // -------------------------------------------------------------------------
    // 6. ACCOUNTANT TESTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Testing Role 6: ACCOUNTANT (accountant)");
    const accountantToken = await login("accountant", "Accountant@123");
    assert(!!accountantToken, "Accountant authenticates via JWT");

    // Accountant can manage fees
    const accFees = await request("/fees/structures", "GET", null, accountantToken);
    assert(accFees.status === 200, "Accountant can view fee structures");

    const accCreateFee = await request("/fees/structures", "POST", {
      className: `Class Test ${Date.now().toString().slice(-4)}`,
      tuitionFee: 65000,
      examinationFee: 5000,
    }, accountantToken);
    assert(accCreateFee.status === 201, "Accountant CAN create fee structures");

    const accPay = await request("/fees/pay", "POST", {
      studentId: firstStudent._id,
      studentName: firstStudent.name,
      className: firstStudent.className,
      amount: 15000,
      paymentMethod: "Bank Transfer",
    }, accountantToken);
    assert(accPay.status === 201, "Accountant CAN record fee payments & receipts", JSON.stringify(accPay));

    const accReports = await request("/reports/fees", "GET", null, accountantToken);
    assert(accReports.status === 200, "Accountant CAN access financial reports");

    // Accountant CANNOT access academic records
    const accStudents = await request("/students", "GET", null, accountantToken);
    assert(accStudents.status === 403, "Accountant CANNOT access student academic records (403 Forbidden)");

    const accTeachers = await request("/teachers", "GET", null, accountantToken);
    assert(accTeachers.status === 403, "Accountant CANNOT access teacher faculty records (403 Forbidden)");

    const accAttendance = await request("/attendance", "GET", null, accountantToken);
    assert(accAttendance.status === 403, "Accountant CANNOT access student attendance (403 Forbidden)");

    const accExams = await request("/exams", "GET", null, accountantToken);
    assert(accExams.status === 403, "Accountant CANNOT access academic examinations (403 Forbidden)");

    const accUsers = await request("/users", "GET", null, accountantToken);
    assert(accUsers.status === 403, "Accountant CANNOT access user management (403 Forbidden)");

    console.log("\n==================================================");
    console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL TEST SUITE ERROR:", error);
    process.exit(1);
  }
}

runTestSuite();
