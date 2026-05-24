"use client";

import { AuthLayout, AuthSectionHeader } from "../../components/AuthLayout";
import { AuthTabs } from "../../components/AuthTabs";
import { OwnerBranchesSection } from "./components/OwnerBranchesSection";
import { OwnerCompanyInfoSection } from "./components/OwnerCompanyInfoSection";
import { OwnerPersonalInfoSection } from "./components/OwnerPersonalInfoSection";
import { OwnerProofUploadSection } from "./components/OwnerProofUploadSection";
import { OwnerSubmitBar } from "./components/OwnerSubmitBar";
import { useOwnerRegister } from "./hooks/useOwnerRegister";

// Client container cho trang /auth/register/owner.
export function OwnerRegisterClient() {
  const form = useOwnerRegister();

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-5xl space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <AuthSectionHeader
          title="Đăng ký công ty tuyển dụng"
          description="Thiết lập hồ sơ doanh nghiệp, khai báo chi nhánh và gửi yêu cầu xét duyệt một lần."
        />

        <div className="mt-5">
          <AuthTabs current="owner" />
        </div>

        <form className="mt-8 space-y-8" onSubmit={form.handleSubmit(form.onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OwnerPersonalInfoSection register={form.register} errors={form.errors} />
            <OwnerCompanyInfoSection register={form.register} errors={form.errors} />
          </div>

          <OwnerBranchesSection
            fields={form.fields}
            watchedBranches={form.watchedBranches}
            errors={form.errors}
            register={form.register}
            setValue={form.setValue}
            primaryBranchIndex={form.primaryBranchIndex}
            provinceOptions={form.provinceOptions}
            wardOptionsByProvinceId={form.wardOptionsByProvinceId}
            wardLoadingProvinceIds={form.wardLoadingProvinceIds}
            getProvinceLabel={form.getProvinceLabel}
            onAddBranch={form.addBranch}
            onRemoveBranch={form.removeBranch}
            onSetPrimaryBranch={form.setPrimaryBranchIndex}
          />

          <OwnerProofUploadSection
            proofTypes={form.proofTypes}
            proofTypesLoading={form.proofTypesLoading}
            proofRows={form.proofRows}
            proofError={form.proofError}
            onAddRow={form.addProofRow}
            onRemoveRow={form.removeProofRow}
            onTypeChange={form.updateProofType}
            onFileChange={form.updateProofFile}
          />

          <OwnerSubmitBar isLoading={form.isLoading} />
        </form>
      </div>
    </AuthLayout>
  );
}
