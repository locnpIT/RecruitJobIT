package com.phuocloc.projectfinal.recruit.infrastructure.bootstrap;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.TinhThanhRepository;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class VietnamLocalitySeeder implements ApplicationRunner {

    private static final String PROVINCE_RESOURCE = "bootstrap/vietnam-provinces.tsv";
    private static final String WARD_RESOURCE = "bootstrap/vietnam-wards.tsv";

    private final TinhThanhRepository tinhThanhRepository;
    private final XaPhuongRepository xaPhuongRepository;

    public VietnamLocalitySeeder(
            TinhThanhRepository tinhThanhRepository,
            XaPhuongRepository xaPhuongRepository
    ) {
        this.tinhThanhRepository = tinhThanhRepository;
        this.xaPhuongRepository = xaPhuongRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<String, TinhThanh> provinceByName = tinhThanhRepository.findAll().stream()
                .filter(item -> item.getTen() != null)
                .collect(Collectors.toMap(
                        item -> normalize(item.getTen()),
                        item -> item,
                        (left, right) -> left,
                        HashMap::new
                ));

        Map<String, ProvinceRow> provinceRows = loadProvinceRows().stream()
                .collect(Collectors.toMap(
                        row -> normalize(row.name()),
                        row -> row,
                        (left, right) -> left,
                        HashMap::new
                ));

        List<TinhThanh> provincesToSave = new ArrayList<>();
        for (ProvinceRow row : provinceRows.values()) {
            if (provinceByName.containsKey(normalize(row.name()))) {
                continue;
            }
            provincesToSave.add(TinhThanh.builder()
                    .ten(row.name())
                    .moTa(row.description())
                    .build());
        }
        if (!provincesToSave.isEmpty()) {
            tinhThanhRepository.saveAll(provincesToSave);
            tinhThanhRepository.flush();
            provinceByName = tinhThanhRepository.findAll().stream()
                    .filter(item -> item.getTen() != null)
                    .collect(Collectors.toMap(
                            item -> normalize(item.getTen()),
                            item -> item,
                            (left, right) -> left,
                            HashMap::new
                    ));
        }

        Map<String, XaPhuong> wardByKey = xaPhuongRepository.findAll().stream()
                .filter(item -> item.getTen() != null && item.getTinhThanh() != null && item.getTinhThanh().getTen() != null)
                .collect(Collectors.toMap(
                        item -> wardKey(item.getTinhThanh().getTen(), item.getTen()),
                        item -> item,
                        (left, right) -> left,
                        HashMap::new
                ));

        List<WardRow> wardRows = loadWardRows();

        List<XaPhuong> wardsToSave = new ArrayList<>();
        for (WardRow row : wardRows) {
            TinhThanh province = provinceByName.get(normalize(row.province()));
            if (province == null) {
                continue;
            }
            String key = wardKey(province.getTen(), row.name());
            if (wardByKey.containsKey(key)) {
                continue;
            }
            wardsToSave.add(XaPhuong.builder()
                    .ten(row.name())
                    .moTa(row.description())
                    .tinhThanh(province)
                    .build());
        }
        if (!wardsToSave.isEmpty()) {
            xaPhuongRepository.saveAll(wardsToSave);
        }
    }

    private List<ProvinceRow> loadProvinceRows() {
        return loadProvinceResource(PROVINCE_RESOURCE);
    }

    private List<WardRow> loadWardRows() {
        List<WardRow> rows = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource(WARD_RESOURCE);
        try (InputStream inputStream = resource.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean headerSkipped = false;
            while ((line = reader.readLine()) != null) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }
                if (line.isBlank()) {
                    continue;
                }
                String[] parts = line.split("	", -1);
                if (parts.length < 4) {
                    continue;
                }
                rows.add(new WardRow(parts[0].trim(), parts[1].trim(), parts[2].trim(), parts[3].trim()));
            }
            return rows;
        } catch (IOException ex) {
            throw new IllegalStateException("Không thể đọc dữ liệu địa phương từ resource: " + WARD_RESOURCE, ex);
        }
    }

    private List<ProvinceRow> loadProvinceResource(String resourcePath) {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        try (InputStream inputStream = resource.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            List<ProvinceRow> rows = new ArrayList<>();
            String line;
            boolean headerSkipped = false;
            while ((line = reader.readLine()) != null) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }
                if (line.isBlank()) {
                    continue;
                }
                String[] parts = line.split("	", -1);
                if (parts.length < 3) {
                    continue;
                }
                rows.add(new ProvinceRow(parts[0].trim(), parts[1].trim(), parts[2].trim()));
            }
            return rows;
        } catch (IOException ex) {
            throw new IllegalStateException("Không thể đọc dữ liệu địa phương từ resource: " + resourcePath, ex);
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static String wardKey(String provinceName, String wardName) {
        return normalize(provinceName) + "::" + normalize(wardName);
    }

    private record ProvinceRow(String code, String name, String description) {
    }

    private record WardRow(String code, String province, String name, String description) {
    }
}
