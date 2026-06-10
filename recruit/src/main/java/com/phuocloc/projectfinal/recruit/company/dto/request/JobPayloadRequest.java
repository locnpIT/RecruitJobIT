package com.phuocloc.projectfinal.recruit.company.dto.request;

import java.time.LocalDateTime;
import java.util.List;

public interface JobPayloadRequest {

    String getTieuDe();

    Integer getNganhNgheId();

    String getMoTa();

    String getYeuCau();

    String getPhucLoi();

    Boolean getBatBuocCV();

    String getMauCvUrl();

    Integer getLoaiHinhLamViecId();

    Integer getCapDoKinhNghiemId();

    Integer getLuongToiThieu();

    Integer getLuongToiDa();

    Integer getSoLuongTuyen();

    LocalDateTime getDenHanLuc();

    List<Integer> getKyNangIds();
}
