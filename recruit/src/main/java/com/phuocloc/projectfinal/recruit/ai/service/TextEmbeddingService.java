package com.phuocloc.projectfinal.recruit.ai.service;

import java.util.List;

/**
 * Contract sinh vector embedding từ text.
 * Tách interface để sau này dễ thay bằng model embedding bên ngoài (OpenAI, local model...).
 */
public interface TextEmbeddingService {

    List<Float> taoVector(String noiDung);
}

