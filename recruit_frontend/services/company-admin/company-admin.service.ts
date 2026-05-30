import { companyAdminApplicationsService } from "@/services/company-admin/applications.service";
import { companyAdminHrService } from "@/services/company-admin/hr.service";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import { companyAdminPackagesService } from "@/services/company-admin/packages.service";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";

export * from "@/services/company-admin/types";

// Backward-compatible facade để không break import hiện tại.
// Phase sau có thể migrate dần sang từng service domain rồi xoá facade này.
export const companyAdminService = {
  getMe: companyAdminSettingsService.getMe,
  getBranches: companyAdminSettingsService.getBranches,
  getCompanyProofTypes: companyAdminSettingsService.getCompanyProofTypes,
  updateCompanyLogo: companyAdminSettingsService.updateCompanyLogo,
  updateCompanyInfo: companyAdminSettingsService.updateCompanyInfo,
  resubmitCompany: companyAdminSettingsService.resubmitCompany,
  uploadCompanyProof: companyAdminSettingsService.uploadCompanyProof,
  uploadCompanyProofs: companyAdminSettingsService.uploadCompanyProofs,

  getCompanyPackages: companyAdminPackagesService.getCompanyPackages,
  registerCompanyPackage: companyAdminPackagesService.registerCompanyPackage,

  getJobs: companyAdminJobsService.getJobs,
  getJobMetadata: companyAdminJobsService.getJobMetadata,
  createJob: companyAdminJobsService.createJob,
  updateJob: companyAdminJobsService.updateJob,
  deleteJob: companyAdminJobsService.deleteJob,

  getApplications: companyAdminApplicationsService.getApplications,
  getApplicationDetail: companyAdminApplicationsService.getApplicationDetail,
  updateApplicationStatus: companyAdminApplicationsService.updateApplicationStatus,

  getHrs: companyAdminHrService.getHrs,
  createHr: companyAdminHrService.createHr,
  updateHr: companyAdminHrService.updateHr,
  deleteHr: companyAdminHrService.deleteHr,
};
