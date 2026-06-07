package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.CreateAdminUserRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.CreatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewJobRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpsertCatalogItemRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateUserStatusRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCatalogItemResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCandidateProofResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminDashboardStatsResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchHealthResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminElasticsearchReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageSubscriptionResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantExperienceReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminQdrantReindexResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminReportResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminUserResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Facade service cho khu vực admin.
 *
 * <p>Controller admin chỉ làm nhiệm vụ nhận request và kiểm quyền,
 * còn lớp này điều phối các service con theo từng module quản trị.</p>
 */
public class AdminService {

    private final AdminStatsService adminStatsService;
    private final AdminUserService adminUserService;
    private final AdminCompanyService adminCompanyService;
    private final AdminPackageService adminPackageService;
    private final AdminJobService adminJobService;
    private final AdminReportService adminReportService;
    private final AdminCandidateProofService adminCandidateProofService;
    private final AdminCatalogService adminCatalogService;
    private final AdminSearchIndexService adminSearchIndexService;

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getStats() {
        return adminStatsService.getStats();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(String keyword, String role, String status) {
        return adminUserService.listUsers(keyword, role, status);
    }

    @Transactional
    public AdminUserResponse createUser(CreateAdminUserRequest request) {
        return adminUserService.createUser(request);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        return adminUserService.updateUserStatus(userId, request);
    }

    @Transactional
    public void deleteUser(Long userId) {
        adminUserService.deleteUser(userId);
    }

    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> listCompanies(String status) {
        return adminCompanyService.listCompanies(status);
    }

    @Transactional
    public AdminCompanyResponse approveCompany(Long companyId) {
        return adminCompanyService.approveCompany(companyId);
    }

    @Transactional
    public AdminCompanyResponse rejectCompany(Long companyId, ReviewCompanyRequest request) {
        return adminCompanyService.rejectCompany(companyId, request);
    }

    @Transactional(readOnly = true)
    public AdminCompanyDetailResponse getCompanyDetail(Long companyId) {
        return adminCompanyService.getCompanyDetail(companyId);
    }

    @Transactional(readOnly = true)
    public List<AdminPackageResponse> listPackages() {
        return adminPackageService.listPackages();
    }

    @Transactional(readOnly = true)
    public List<AdminPackageSubscriptionResponse> listPackageSubscriptions() {
        return adminPackageService.listPackageSubscriptions();
    }

    @Transactional
    public AdminPackageResponse createPackage(CreatePackageRequest request) {
        return adminPackageService.createPackage(request);
    }

    @Transactional
    public AdminPackageResponse updatePackage(Long packageId, UpdatePackageRequest request) {
        return adminPackageService.updatePackage(packageId, request);
    }

    @Transactional
    public void deletePackage(Long packageId) {
        adminPackageService.deletePackage(packageId);
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> listJobs(String keyword, String company, String status, String industry, String location) {
        return adminJobService.listJobs(keyword, company, status, industry, location);
    }

    @Transactional(readOnly = true)
    public AdminJobDetailResponse getJobDetail(Long jobId) {
        return adminJobService.getJobDetail(jobId);
    }

    @Transactional
    public AdminJobResponse approveJob(Long jobId) {
        return adminJobService.approveJob(jobId);
    }

    @Transactional
    public AdminJobResponse rejectJob(Long jobId, ReviewJobRequest request) {
        return adminJobService.rejectJob(jobId, request);
    }

    @Transactional
    public AdminJobResponse hideJob(Long jobId) {
        return adminJobService.hideJob(jobId);
    }

    @Transactional(readOnly = true)
    public List<AdminCandidateProofResponse> listCandidateProofs(String status) {
        return adminCandidateProofService.listProofs(status);
    }

    @Transactional
    public AdminCandidateProofResponse approveCandidateProof(String type, Long proofId) {
        return adminCandidateProofService.approve(type, proofId);
    }

    @Transactional
    public AdminCandidateProofResponse rejectCandidateProof(String type, Long proofId) {
        return adminCandidateProofService.reject(type, proofId);
    }

    @Transactional(readOnly = true)
    public AdminReportResponse getReport(String range) {
        return adminReportService.getReport(range);
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listSystemRoles() {
        return adminCatalogService.listSystemRoles();
    }

    @Transactional
    public AdminCatalogItemResponse createSystemRole(UpsertCatalogItemRequest request) {
        return adminCatalogService.createSystemRole(request);
    }

    @Transactional
    public AdminCatalogItemResponse updateSystemRole(Long id, UpsertCatalogItemRequest request) {
        return adminCatalogService.updateSystemRole(id, request);
    }

    @Transactional
    public void deleteSystemRole(Long id) {
        adminCatalogService.deleteSystemRole(id);
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listCompanyRoles() {
        return adminCatalogService.listCompanyRoles();
    }

    @Transactional
    public AdminCatalogItemResponse createCompanyRole(UpsertCatalogItemRequest request) {
        return adminCatalogService.createCompanyRole(request);
    }

    @Transactional
    public AdminCatalogItemResponse updateCompanyRole(Long id, UpsertCatalogItemRequest request) {
        return adminCatalogService.updateCompanyRole(id, request);
    }

    @Transactional
    public void deleteCompanyRole(Long id) {
        adminCatalogService.deleteCompanyRole(id);
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listProofTypes() {
        return adminCatalogService.listProofTypes();
    }

    @Transactional
    public AdminCatalogItemResponse createProofType(UpsertCatalogItemRequest request) {
        return adminCatalogService.createProofType(request);
    }

    @Transactional
    public AdminCatalogItemResponse updateProofType(Long id, UpsertCatalogItemRequest request) {
        return adminCatalogService.updateProofType(id, request);
    }

    @Transactional
    public void deleteProofType(Long id) {
        adminCatalogService.deleteProofType(id);
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogItemResponse> listCertificateTypes() {
        return adminCatalogService.listCertificateTypes();
    }

    @Transactional
    public AdminCatalogItemResponse createCertificateType(UpsertCatalogItemRequest request) {
        return adminCatalogService.createCertificateType(request);
    }

    @Transactional
    public AdminCatalogItemResponse updateCertificateType(Long id, UpsertCatalogItemRequest request) {
        return adminCatalogService.updateCertificateType(id, request);
    }

    @Transactional
    public void deleteCertificateType(Long id) {
        adminCatalogService.deleteCertificateType(id);
    }

    @Transactional(readOnly = true)
    public AdminElasticsearchHealthResponse getElasticsearchHealth() {
        return adminSearchIndexService.getElasticsearchHealth();
    }

    @Transactional(readOnly = true)
    public AdminElasticsearchReindexResponse reindexPublicJobs() {
        return adminSearchIndexService.reindexPublicJobs();
    }

    @Transactional
    public AdminQdrantReindexResponse reindexQdrantJobsAndProfiles() {
        return adminSearchIndexService.reindexQdrantJobsAndProfiles();
    }

    @Transactional
    public AdminQdrantExperienceReindexResponse reindexWorkExperiences() {
        return adminSearchIndexService.reindexWorkExperiences();
    }
}
