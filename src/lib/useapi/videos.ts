import { z } from 'zod';
import { getServerEnv } from './env';
import { ensureHealthyAccount } from './accounts';
import { useapiFetch } from './client';

export const videoCreateSchema = z.object({
  prompt: z.string().min(1, 'Prompt không được để trống').max(6000),
  model: z.enum(['veo-3.1-fast', 'veo-3.1-quality', 'veo-3.1-lite', 'veo-3.1-lite-low-priority', 'omni-flash']),
  aspectRatio: z.enum(['16:9', '9:16']),
  duration: z.coerce.number().int().min(4).max(10),
  startImage: z.string().optional(),
  endImage: z.string().optional(),
  references: z.array(z.string()).max(3).default([])
});

export type VideoCreateInput = z.infer<typeof videoCreateSchema>;

function normalizeAspectRatio(value: '16:9' | '9:16') {
  return value === '16:9' ? 'landscape' : 'portrait';
}

export async function createVideo(input: VideoCreateInput) {
  await ensureHealthyAccount();
  const { email } = getServerEnv();
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    model: input.model,
    aspectRatio: normalizeAspectRatio(input.aspectRatio),
    duration: input.duration,
    count: 1,
    email,
    async: true
  };
  if (input.startImage) body.startImage = input.startImage;
  if (input.endImage) body.endImage = input.endImage;
  input.references.forEach((ref, index) => {
    body[`referenceImage_${index + 1}`] = ref;
  });
  return useapiFetch<unknown>('/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function getVideoJob(jobId: string) {
  const cleanJobId = jobId.trim();

  // useapi.net Google Flow job IDs may contain ':' characters.
  // Their /jobs/{jobId} endpoint expects the original job id in the path.
  // Encoding ':' as %3A can trigger "Invalid job ID format", so keep the id raw.
  return useapiFetch<unknown>(`/jobs/${cleanJobId}`);
}
