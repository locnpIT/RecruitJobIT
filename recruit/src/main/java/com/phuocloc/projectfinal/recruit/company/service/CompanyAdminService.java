package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.dto.request.CompanyProofUploadBatchRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.RegisterCompanyPackageRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateApplicationStatusRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.SendInterviewMailRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyInfoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyLogoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyProofRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminJobResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminMeResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminProofResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyJobMetadataResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageOverviewResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageRegistrationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyAdminService {

    private final CompanyAdminProfileService profileService;
    private final CompanyAdminProofService proofService;
    private final CompanyAdminJobService jobService;
    private final CompanyAdminApplicationService applicationService;
    private final CompanyAdminPackageService packageService;

    @Transactional(readOnly = true)
    public CompanyAdminMeResponse getMe(AppUserPrinciple principal) {
        // Facade giữ contract cũ cho controller; nghiệp vụ chi tiết nằm ở các service chuyên trách.
        return profileService.getMe(principal);
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminMeResponse.ThongTinChiNhanh> getBranches(AppUserPrinciple principal) {
        return profileService.getBranches(principal);
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy updateLogo(AppUserPrinciple principal, UpdateCompanyLogoRequest request) {
        return profileService.updateLogo(principal, request);
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy updateCompanyInfo(AppUserPrinciple principal, UpdateCompanyInfoRequest request) {
        return profileService.updateCompanyInfo(principal, request);
    }

    @Transactional
    public CompanyAdminProofResponse uploadProofDocument(AppUserPrinciple principal, UpdateCompanyProofRequest request) {
        return proofService.uploadProofDocument(principal, request);
    }

    @Transactional(readOnly = true)
    public List<CompanyProofTypeResponse> listProofTypes() {
        return proofService.listProofTypes();
    }

    @Transactional(readOnly = true)
    public CompanyJobMetadataResponse getJobMetadata() {
        return jobService.getJobMetadata();
    }

    @Transactional
    public List<CompanyAdminProofResponse> uploadProofDocuments(AppUserPrinciple principal, CompanyProofUploadBatchRequest request) {
        return proofService.uploadProofDocuments(principal, request);
    }

    @Transactional
    public CompanyAdminMeResponse.ThongTinCongTy resubmitCompany(AppUserPrinciple principal) {
        return profileService.resubmitCompany(principal);
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminJobResponse> listJobs(AppUserPrinciple principal, Integer chiNhanhId) {
        return jobService.listJobs(principal, chiNhanhId);
    }

    @Transactional
    public CompanyAdminJobResponse createJob(AppUserPrinciple principal, CreateCompanyJobRequest request) {
        return jobService.createJob(principal, request);
    }

    @Transactional
    public CompanyAdminJobResponse updateJob(AppUserPrinciple principal, Long jobId, UpdateCompanyJobRequest request) {
        return jobService.updateJob(principal, jobId, request);
    }

    @Transactional
    public void deleteJob(AppUserPrinciple principal, Long jobId) {
        jobService.deleteJob(principal, jobId);
    }

    @Transactional(readOnly = true)
    public List<CompanyAdminApplicationResponse> listApplications(AppUserPrinciple principal, Integer chiNhanhId) {
        return applicationService.listApplications(principal, chiNhanhId);
    }

    @Transactional(readOnly = true)
    public CompanyAdminApplicationResponse getApplicationDetail(AppUserPrinciple principal, Long applicationId) {
        return applicationService.getApplicationDetail(principal, applicationId);
    }

    @Transactional(readOnly = true)
    public CompanyAdminApplicationResponse getCandidateProfileForJob(AppUserPrinciple principal, Long jobId, Long profileId) {
        return applicationService.getCandidateProfileForJob(principal, jobId, profileId);
    }

    @Transactional
    public CompanyAdminApplicationResponse updateApplicationStatus(
            AppUserPrinciple principal,
            Long applicationId,
            UpdateApplicationStatusRequest request
    ) {
        return applicationService.updateApplicationStatus(principal, applicationId, request);
    }

    @Transactional
    public CompanyAdminApplicationResponse sendInterviewEmail(
            AppUserPrinciple principal,
            Long applicationId,
            SendInterviewMailRequest request
    ) {
        return applicationService.sendInterviewEmail(principal, applicationId, request);
    }

    @Transactional(readOnly = true)
    public CompanyPackageOverviewResponse listPackages(AppUserPrinciple principal) {
        return packageService.listPackages(principal);
    }

    @Transactional
    public CompanyPackageRegistrationResponse registerPackage(AppUserPrinciple principal, RegisterCompanyPackageRequest request) {
        return packageService.registerPackage(principal, request);
    }
}
