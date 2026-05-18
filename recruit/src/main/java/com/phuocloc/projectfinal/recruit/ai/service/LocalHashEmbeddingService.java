package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Embedding nội bộ dạng hash-vector để chạy ổn định không cần gọi API ngoài.
 *
 * <p>Đây là baseline kỹ thuật cho luận văn/MVP:
 * vector sinh ra deterministic và đủ dùng cho indexing + truy vấn gần đúng.
 * Khi cần chất lượng semantic cao hơn, chỉ cần thay implementation của
 * {@link TextEmbeddingService} bằng model embedding thực tế.</p>
 */
@Service
@RequiredArgsConstructor
public class LocalHashEmbeddingService implements TextEmbeddingService {

    private final QdrantProperties qdrantProperties;

    @Override
    /**
     * Sinh vector từ text bằng kỹ thuật hashed bag-of-words.
     *
     * <p>Mục tiêu của bản này là ổn định và tái lập được (deterministic),
     * phù hợp môi trường đồ án chưa dùng external embedding provider.</p>
     */
    public List<Float> taoVector(String noiDung) {
        int vectorSize = Math.max(qdrantProperties.getVectorSize(), 32);
        float[] vector = new float[vectorSize];

        String normalized = StringUtils.hasText(noiDung) ? noiDung.toLowerCase(Locale.ROOT) : "";
        String[] tokens = Arrays.stream(normalized.split("[^\\p{L}\\p{N}]+"))
                .filter(StringUtils::hasText)
                .toArray(String[]::new);

        if (tokens.length == 0) {
            return toFloatList(vector);
        }

        for (String token : tokens) {
            int hash = token.hashCode();
            int index1 = Math.floorMod(hash, vectorSize);
            int index2 = Math.floorMod(hash * 31 + token.length(), vectorSize);
            float weight = 1.0f + Math.min(token.length(), 16) * 0.03f;
            vector[index1] += weight;
            vector[index2] += weight * 0.5f;
        }

        normalizeL2(vector);
        return toFloatList(vector);
    }

    /**
     * Chuẩn hóa L2 để vector có cùng thang đo, thuận lợi cho cosine distance.
     */
    private void normalizeL2(float[] vector) {
        double norm = 0.0;
        for (float value : vector) {
            norm += value * value;
        }
        if (norm <= 0.0) {
            return;
        }
        double inv = 1.0 / Math.sqrt(norm);
        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) (vector[i] * inv);
        }
    }

    /**
     * Chuyển mảng primitive sang List để tương thích JSON body gửi Qdrant.
     */
    private List<Float> toFloatList(float[] vector) {
        List<Float> result = new ArrayList<>(vector.length);
        for (float value : vector) {
            result.add(value);
        }
        return result;
    }
}
