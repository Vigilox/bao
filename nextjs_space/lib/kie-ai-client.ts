/**
 * Kie.AI API Client
 * Handles image and video generation using Nano Banana, Veo 3.1, and Sora 2
 */

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY ?? '';
const KIE_AI_API_URL = process.env.KIE_AI_API_URL ?? 'https://api.kie.ai/api/v1';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type OutputFormat = 'PNG' | 'JPEG';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Sora 2 specific types
export type Sora2Model = 
  | 'sora-2-text-to-video' 
  | 'sora-2-image-to-video'
  | 'sora-2-pro-text-to-video' 
  | 'sora-2-pro-image-to-video'
  | 'sora-2-pro-storyboard'
  | 'sora-2-characters';

export type Sora2AspectRatio = 'Portrait' | 'Landscape';
export type Sora2Duration = '10s' | '15s' | '25s';
export type Sora2Quality = 'Standard' | 'High';

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  model?: 'google/nano-banana' | 'google/nano-banana-pro';
}

export interface ImageEditParams {
  prompt: string;
  imageUrls: string[]; // Up to 10 images
  aspectRatio?: AspectRatio;
}

export interface VideoGenerationParams {
  prompt: string;
  aspectRatio?: AspectRatio;
  imageUrl?: string; // For image-to-video
  duration?: number; // 5-10 seconds
}

export interface Sora2VideoParams {
  prompt: string;
  model?: Sora2Model;
  aspectRatio?: Sora2AspectRatio;
  duration?: Sora2Duration;
  quality?: Sora2Quality;
  removeWatermark?: boolean;
  imageUrl?: string; // For image-to-video
  characterIds?: string[]; // For character animations
}

export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  resultUrl?: string;
  error?: string;
}

export interface GenerationResult {
  taskId: string;
  status: TaskStatus;
  resultUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

class KieAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = KIE_AI_API_KEY;
    this.baseUrl = KIE_AI_API_URL;
  }

  /**
   * Make authenticated request to Kie.AI API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response?.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || `API request failed: ${response?.status} ${response?.statusText}`
        );
      }

      return await response.json() as T;
    } catch (error) {
      console.error('Kie.AI API Error:', error);
      throw error;
    }
  }

  /**
   * Generate an image using Nano Banana
   */
  async generateImage(params: ImageGenerationParams): Promise<GenerationResult> {
    try {
      const response = await this.makeRequest<any>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify({
          model: params?.model || 'google/nano-banana',
          prompt: params?.prompt,
          aspect_ratio: params?.aspectRatio || '16:9',
          output_format: params?.outputFormat || 'PNG',
        }),
      });

      return {
        taskId: response?.taskId || response?.task_id || '',
        status: 'pending',
        metadata: response,
      };
    } catch (error: any) {
      return {
        taskId: '',
        status: 'failed',
        error: error?.message || 'Failed to generate image',
      };
    }
  }

  /**
   * Edit an existing image using Nano Banana Edit
   */
  async editImage(params: ImageEditParams): Promise<GenerationResult> {
    try {
      const response = await this.makeRequest<any>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify({
          model: 'google/nano-banana-edit',
          prompt: params?.prompt,
          image_urls: params?.imageUrls || [],
          aspect_ratio: params?.aspectRatio || '16:9',
        }),
      });

      return {
        taskId: response?.taskId || response?.task_id || '',
        status: 'pending',
        metadata: response,
      };
    } catch (error: any) {
      return {
        taskId: '',
        status: 'failed',
        error: error?.message || 'Failed to edit image',
      };
    }
  }

  /**
   * Generate a video using Veo 3.1 Fast
   */
  async generateVideo(params: VideoGenerationParams): Promise<GenerationResult> {
    try {
      const requestBody: any = {
        prompt: params?.prompt,
        aspect_ratio: params?.aspectRatio || '16:9',
      };

      if (params?.imageUrl) {
        requestBody.image_url = params.imageUrl;
      }

      if (params?.duration) {
        requestBody.duration = params.duration;
      }

      const response = await this.makeRequest<any>('/video/veo3/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return {
        taskId: response?.taskId || response?.task_id || '',
        status: 'pending',
        metadata: response,
      };
    } catch (error: any) {
      return {
        taskId: '',
        status: 'failed',
        error: error?.message || 'Failed to generate video',
      };
    }
  }

  /**
   * Generate a video using Sora 2
   * Supports text-to-video, image-to-video, and character animations
   */
  async generateVideoSora2(params: Sora2VideoParams): Promise<GenerationResult> {
    try {
      // Determine the model based on params
      let model = params?.model;
      if (!model) {
        // Auto-select model based on whether imageUrl is provided
        model = params?.imageUrl ? 'sora-2-text-to-video' : 'sora-2-text-to-video';
        if (params?.imageUrl) {
          model = params?.quality === 'High' ? 'sora-2-pro-image-to-video' : 'sora-2-image-to-video';
        } else if (params?.quality === 'High') {
          model = 'sora-2-pro-text-to-video';
        }
      }

      // Build the input object for Sora 2
      const input: any = {
        prompt: params?.prompt,
        aspect_ratio: params?.aspectRatio || 'Landscape',
        n_frames: params?.duration || '10s',
        size: params?.quality || 'Standard',
        remove_watermark: params?.removeWatermark ?? false,
      };

      // Add image URL for image-to-video
      if (params?.imageUrl) {
        input.image_urls = [params.imageUrl];
      }

      // Add character IDs if provided
      if (params?.characterIds && params.characterIds.length > 0) {
        input.character_id_list = params.characterIds.slice(0, 5); // Max 5 characters
      }

      const requestBody = {
        model,
        input,
      };

      const response = await this.makeRequest<any>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return {
        taskId: response?.taskId || response?.task_id || '',
        status: 'pending',
        metadata: { ...response, model },
      };
    } catch (error: any) {
      return {
        taskId: '',
        status: 'failed',
        error: error?.message || 'Failed to generate video with Sora 2',
      };
    }
  }

  /**
   * Check the status of a generation task
   */
  async checkTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
      const response = await this.makeRequest<any>(`/jobs/task/${taskId}`, {
        method: 'GET',
      });

      const status = this.normalizeStatus(response?.status);
      
      return {
        taskId,
        status,
        resultUrl: response?.result_url || response?.resultUrl || response?.output_url,
        error: response?.error || response?.errorMessage,
      };
    } catch (error: any) {
      return {
        taskId,
        status: 'failed',
        error: error?.message || 'Failed to check task status',
      };
    }
  }

  /**
   * Poll task status until completion or failure
   */
  async pollTaskStatus(
    taskId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (status: TaskStatus) => void;
    } = {}
  ): Promise<TaskResponse> {
    const maxAttempts = options?.maxAttempts || 60; // 5 minutes at 5s intervals
    const intervalMs = options?.intervalMs || 5000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.checkTaskStatus(taskId);
      
      options?.onProgress?.(result?.status);

      if (result?.status === 'completed' || result?.status === 'failed') {
        return result;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return {
      taskId,
      status: 'failed',
      error: 'Task polling timeout exceeded',
    };
  }

  /**
   * Normalize status strings from API
   */
  private normalizeStatus(status?: string): TaskStatus {
    const normalized = (status || '').toLowerCase();
    
    if (normalized.includes('complet') || normalized === 'success') {
      return 'completed';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'failed';
    }
    if (normalized.includes('process') || normalized.includes('running')) {
      return 'processing';
    }
    return 'pending';
  }
}

// Export singleton instance
export const kieAIClient = new KieAIClient();
