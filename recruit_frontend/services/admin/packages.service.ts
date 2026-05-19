import apiClient from "@/lib/api-client";
import type {
  AdminPackage,
  AdminPackageSubscription,
  CreatePackagePayload,
  UpdatePackagePayload,
} from "./types";

// Dùng cho màn admin/plans.
export const adminPackagesService = {
  listPackages: async (): Promise<AdminPackage[]> => {
    const response = await apiClient.get("/admin/packages");
    return response.data.data as AdminPackage[];
  },

  listPackageSubscriptions: async (): Promise<AdminPackageSubscription[]> => {
    const response = await apiClient.get("/admin/packages/subscriptions");
    return response.data.data as AdminPackageSubscription[];
  },

  createPackage: async (payload: CreatePackagePayload): Promise<AdminPackage> => {
    const response = await apiClient.post("/admin/packages", payload);
    return response.data.data as AdminPackage;
  },

  updatePackage: async (packageId: number, payload: UpdatePackagePayload): Promise<AdminPackage> => {
    const response = await apiClient.patch(`/admin/packages/${packageId}`, payload);
    return response.data.data as AdminPackage;
  },

  deletePackage: async (packageId: number): Promise<void> => {
    await apiClient.delete(`/admin/packages/${packageId}`);
  },
};
