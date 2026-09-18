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
  },

  /**
   * Basic backend health check.
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Deep health check checking backend, AI service, and Solana RPC.
   */
  checkDeepHealth: async () => {
    try {
      const response = await apiClient.get('/api/health/deep');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Generates a canonical JSON evidence package and SHA-256 fingerprint from match data.
   */
  createEvidence: async (match: any, threshold: number = 0.85) => {
    try {
      const response = await apiClient.post('/api/evidence/create', { match, threshold });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Verifies an off-chain evidence package against its claimed SHA-256 hash.
   */
  verifyEvidence: async (evidencePackage: any) => {
    try {
      const response = await apiClient.post('/api/evidence/verify', { evidencePackage });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Verifies off-chain evidence against the Solana blockchain ledger transaction.
   */
  verifyOnChain: async (transactionSignature: string, evidence: any, evidenceId?: string) => {
    try {
      const response = await apiClient.post('/api/verification/verify', {
        transactionSignature,
        evidence,
        evidenceId
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Searches the web for visually matching faces.
   */
  searchFaces: async (formData: FormData) => {
    try {
      const response = await apiClient.post('/api/search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Retrieves an evidence package by its deterministic evidence ID.
   */
  getEvidenceById: async (evidenceId: string) => {
    try {
      const response = await apiClient.get(`/api/evidence/${encodeURIComponent(evidenceId)}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
};

