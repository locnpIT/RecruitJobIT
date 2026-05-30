import { adminCandidateProofsService } from "@/services/admin/candidate-proofs.service";
import { adminCatalogsService } from "@/services/admin/catalogs.service";
import { adminCompaniesService } from "@/services/admin/companies.service";
import { adminJobsService } from "@/services/admin/jobs.service";
import { adminPackagesService } from "@/services/admin/packages.service";
import { adminStatsService } from "@/services/admin/stats.service";
import { adminUsersService } from "@/services/admin/users.service";

export * from "@/services/admin/types";

// Backward-compatible facade để giữ import cũ ở các màn admin hiện tại.
export const adminService = {
  getStats: adminStatsService.getStats,
  validateSession: adminStatsService.validateSession,

  listUsers: adminUsersService.listUsers,
  updateUserStatus: adminUsersService.updateUserStatus,
  deleteUser: adminUsersService.deleteUser,

  listCompanies: adminCompaniesService.listCompanies,
  getCompanyDetail: adminCompaniesService.getCompanyDetail,
  approveCompany: adminCompaniesService.approveCompany,
  rejectCompany: adminCompaniesService.rejectCompany,

  listPackages: adminPackagesService.listPackages,
  listPackageSubscriptions: adminPackagesService.listPackageSubscriptions,
  createPackage: adminPackagesService.createPackage,
  updatePackage: adminPackagesService.updatePackage,
  deletePackage: adminPackagesService.deletePackage,

  listJobs: adminJobsService.listJobs,
  getJobDetail: adminJobsService.getJobDetail,
  approveJob: adminJobsService.approveJob,
  rejectJob: adminJobsService.rejectJob,
  hideJob: adminJobsService.hideJob,

  listCandidateProofs: adminCandidateProofsService.listCandidateProofs,
  approveCandidateProof: adminCandidateProofsService.approveCandidateProof,
  rejectCandidateProof: adminCandidateProofsService.rejectCandidateProof,

  listSystemRoles: adminCatalogsService.listSystemRoles,
  createSystemRole: adminCatalogsService.createSystemRole,
  updateSystemRole: adminCatalogsService.updateSystemRole,
  deleteSystemRole: adminCatalogsService.deleteSystemRole,

  listCompanyRoles: adminCatalogsService.listCompanyRoles,
  createCompanyRole: adminCatalogsService.createCompanyRole,
  updateCompanyRole: adminCatalogsService.updateCompanyRole,
  deleteCompanyRole: adminCatalogsService.deleteCompanyRole,

  listProofTypes: adminCatalogsService.listProofTypes,
  createProofType: adminCatalogsService.createProofType,
  updateProofType: adminCatalogsService.updateProofType,
  deleteProofType: adminCatalogsService.deleteProofType,

  listCertificateTypes: adminCatalogsService.listCertificateTypes,
  createCertificateType: adminCatalogsService.createCertificateType,
  updateCertificateType: adminCatalogsService.updateCertificateType,
  deleteCertificateType: adminCatalogsService.deleteCertificateType,
};
