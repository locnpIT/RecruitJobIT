import apiClient from "@/lib/api-client";

export interface Province {
  id: number;
  ten: string;
  moTa: string | null;
}

export interface Ward {
  id: number;
  ten: string;
  moTa: string | null;
  tinhThanhId: number | null;
  tinhThanhTen: string | null;
}

export const locationService = {
  getProvinces: async (): Promise<Province[]> => {
    const response = await apiClient.get("/locations/tinh-thanh");
    return response.data.data as Province[];
  },

  getWards: async (tinhThanhId: number): Promise<Ward[]> => {
    const response = await apiClient.get("/locations/xa-phuong", {
      params: { tinhThanhId },
    });
    return response.data.data as Ward[];
  },
};
