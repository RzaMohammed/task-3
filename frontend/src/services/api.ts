import axios from 'axios';
import { PipelineResponse } from '../types/pipeline';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000 // 60s max for full end-to-end pipeline
});

export const apiService = {
  /**
   * Executes the full pipeline with the uploaded image.
   */
  runPipeline: async (imageFile: File): Promise<PipelineResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.post<PipelineResponse>('/api/pipeline/run', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as PipelineResponse;
      }
      return {
        success: false,
        status: 'VERIFICATION_FAILED',
        message: error.message || 'Network connection to backend server failed.'
      };
    }
  },

  /**
   * Performs blockchain health check.
   */
  getBlockchainHealth: async () => {
    try {
      const response = await apiClient.get('/api/blockchain/health');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
