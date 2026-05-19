import apiClient from "@/lib/api-client";
import type { AdminCatalogItem, UpsertAdminCatalogItemPayload } from "./types";

// Dùng cho màn admin/catalogs.
export const adminCatalogsService = {
  listSystemRoles: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/system-roles");
    return response.data.data as AdminCatalogItem[];
  },

  createSystemRole: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/system-roles", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateSystemRole: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/system-roles/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteSystemRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/system-roles/${id}`);
  },

  listCompanyRoles: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/company-roles");
    return response.data.data as AdminCatalogItem[];
  },

  createCompanyRole: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/company-roles", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateCompanyRole: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/company-roles/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteCompanyRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/company-roles/${id}`);
  },

  listProofTypes: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/proof-types");
    return response.data.data as AdminCatalogItem[];
  },

  createProofType: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/proof-types", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateProofType: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/proof-types/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteProofType: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/proof-types/${id}`);
  },

  listCertificateTypes: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/certificate-types");
    return response.data.data as AdminCatalogItem[];
  },

  createCertificateType: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/certificate-types", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateCertificateType: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/certificate-types/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteCertificateType: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/certificate-types/${id}`);
  },
};
