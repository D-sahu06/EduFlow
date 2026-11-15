import Admission from "../models/Admission.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
  resolveActiveUserIdsByRoles,
} from "../services/notification.service.js";

// @desc    Get all admission applications
// @route   GET /api/admissions/applications
// @access  Private (applications view permission)
export const getApplications = async (req, res, next) => {
  try {
    const { status, className, search, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (className) filter.applyingForClass = className;
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const query = Admission.find(filter).sort({ createdAt: -1 });
    const parsedLimit = Number.parseInt(String(limit ?? ""), 10);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      query.limit(parsedLimit);
    }

    const applications = await query;

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit new admission application
// @route   POST /api/admissions/apply
// @access  Public / Private (newAdmission permission)
export const submitApplication = async (req, res, next) => {
  try {
    const {
      applicantName,
      email,
      phone,
      applyingForClass,
      previousQualification,
      previousSchool,
      previousPercentage,
      guardianName,
      guardianPhone,
    } = req.body;

    if (
      !applicantName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !applyingForClass?.trim() ||
      previousPercentage === undefined ||
      previousPercentage === null ||
      previousPercentage === "" ||
      Number.isNaN(Number(previousPercentage)) ||
      !guardianName?.trim() ||
      !guardianPhone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Applicant name, email, phone, class, previous percentage, and guardian details are required.",
      });
    }

    let applicationNumber = `APP-${Date.now().toString().slice(-6)}`;
    while (await Admission.exists({ applicationNumber })) {
      applicationNumber = `APP-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    }

    const application = await Admission.create({
      applicationNumber,
      applicantName: applicantName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      applyingForClass: applyingForClass.trim(),
      previousQualification: previousQualification?.trim() || "",
      previousSchool: previousSchool?.trim() || "",
      previousPercentage: Number(previousPercentage),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      status: "Pending",
    });

    await dispatchNotificationSafe(async () => {
      const adminIds = await resolveActiveUserIdsByRoles(["SUPER_ADMIN", "ADMIN", "PRINCIPAL"]);
      await createNotificationsForUsers({
        recipientIds: adminIds,
        excludeUserId: req.user?._id || null,
        title: `New Admission Application #${application.applicationNumber}`,
        message: `${application.applicantName} submitted an application for ${application.applyingForClass}.`,
        category: "General System Notifications",
        priority: "Medium",
        link: "/admission/applications",
        actorId: req.user?._id || null,
        actorName: req.user?.name || application.applicantName,
        metadata: { applicationId: application._id },
      });
    });

    res.status(201).json({
      success: true,
      message: `Admission application submitted successfully. Application #${applicationNumber}.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PUT /api/admissions/applications/:id/status
// @access  Private (applications edit/approve permission)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, meritRank, remarks } = req.body;
    const paramId = req.params.id;

    const application = paramId.match(/^[0-9a-fA-F]{24}$/)
      ? await Admission.findById(paramId)
      : await Admission.findOne({ applicationNumber: paramId });

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (status) application.status = status;
    if (meritRank !== undefined) application.meritRank = meritRank;
    if (remarks) application.remarks = remarks;
    application.reviewedBy = req.user._id;

    await application.save();

    if (status) {
      await dispatchNotificationSafe(async () => {
        const recipientIds = await resolveActiveUserIdsByRoles([
          "SUPER_ADMIN",
          "ADMIN",
          "PRINCIPAL",
        ]);
        await createNotificationsForUsers({
          recipientIds,
          excludeUserId: req.user._id,
          title: `Admission Application ${status}: #${application.applicationNumber}`,
          message: `${application.applicantName}'s application for ${application.applyingForClass} was marked as ${status}.`,
          category: "General System Notifications",
          priority: "Medium",
          link: "/admission/applications",
          actorId: req.user._id,
          actorName: req.user.name,
          metadata: { applicationId: application._id, status },
        });
      });
    }

    res.json({
      success: true,
      message: `Application #${application.applicationNumber} updated to ${status}.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get merit list
// @route   GET /api/admissions/merit-list
// @access  Private (meritList view permission)
export const getMeritList = async (req, res, next) => {
  try {
    const { className } = req.query;
    const filter = { status: { $in: ["Merit List", "Approved"] } };

    if (className) filter.applyingForClass = className;

    const meritList = await Admission.find(filter).sort({
      previousPercentage: -1,
      createdAt: 1,
    });

    // Assign temporary ranks based on sort order if meritRank is not manually set
    const rankedList = meritList.map((item, index) => ({
      ...item.toObject(),
      rank: item.meritRank || index + 1,
    }));

    res.json({
      success: true,
      count: rankedList.length,
      meritList: rankedList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admission statistics
// @route   GET /api/admissions/stats
// @access  Private (admissionDashboard view permission)
export const getAdmissionStats = async (req, res, next) => {
  try {
    // Group all applications in one snapshot so total = pending + approved + rejected.
    // "Pending", "Under Review", and "Merit List" have not received a final approval/rejection decision yet.
    const statusAgg = await Admission.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let approved = 0;
    let rejected = 0;
    let pending = 0;

    for (const item of statusAgg) {
      if (item._id === "Approved") {
        approved += item.count;
      } else if (item._id === "Rejected") {
        rejected += item.count;
      } else {
        pending += item.count;
      }
    }

    const total = approved + rejected + pending;
    const decisionsMade = approved + rejected;
    const approvalRate = `${total > 0 ? Math.round((approved / total) * 100) : 0}%`;

    // Monthly breakdown
    const monthlyAgg = await Admission.aggregate([
      {
        $match: { createdAt: { $ne: null } },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyApplications = monthlyAgg.map((item) => ({
      month: months[(item._id || 1) - 1] || "N/A",
      count: item.count,
    }));
    const monthlyTrends = months.map((m, idx) => {
      const found = monthlyAgg.find((item) => item._id === idx + 1);
      return { month: m, value: found ? found.count : 0 };
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      stats: {
        total,
        approved,
        pending,
        rejected,
        decisionsMade,
        approvalRate,
        monthlyApplications,
        totalApplications: total,
        pendingCount: pending,
        approvedCount: approved,
        rejectedCount: rejected,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};
