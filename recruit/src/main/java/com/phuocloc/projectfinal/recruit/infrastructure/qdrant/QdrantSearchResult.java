package com.phuocloc.projectfinal.recruit.infrastructure.qdrant;

import java.util.Map;

/**
 * Kết quả search một point từ Qdrant.
 */
public record QdrantSearchResult(
        String id,
        double score,
        Map<String, Object> payload
) {
}
