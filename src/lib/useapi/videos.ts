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

export type VideoCreateResult = {
  jobId: string;
  raw: unknown;
};

const JOB_ID_KEYS = ['jobid', 'jobId', 'jobID', 'job_id'] as const;

// Real Google Flow job ids from useapi.net include account metadata, for example:
// j0710012726614091522v-u2916-email:user@example.com-bot:google-flow
// Keep validation strict against path/query injection, but allow '@' because it is part of the provider job id.
const JOB_ID_PATTERN = /^[A-Za-z0-9_:.\-/@]+$/;

function normalizeAspectRatio(value: '16:9' | '9:16') {
  return value === '16:9' ? 'landscape' : 'portrait';
}

export function isValidGoogleFlowJobId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 512) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/[?#\s]/.test(trimmed)) return false;
  return JOB_ID_PATTERN.test(trimmed);
}

function findJobIdByContract(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;

  for (const key of JOB_ID_KEYS) {
    const candidate = record[key];
    if (isValidGoogleFlowJobId(candidate)) return candidate.trim();
  }

  const knownContainers = ['job', 'data', 'result', 'response'];
  for (const key of knownContainers) {
    const found = findJobIdByContract(record[key]);
    if (found) return found;
  }

  return undefined;
}

function summarizeProviderShape(value: unknown) {
  if (!value || typeof value !== 'object') return typeof value;
  const record = value as Record<string, unknown>;
  return {
    keys: Object.keys(record),
    jobFields: JOB_ID_KEYS.reduce<Record<string, string>>((acc, key) => {
      const field = record[key];
      if (typeof field === 'string') acc[key] = field.slice(0, 120);
      return acc;
    }, {})
  };
}

export function parseVideoCreateResult(raw: unknown): VideoCreateResult {
  const jobId = findJobIdByContract(raw);
  if (!jobId) {
    throw new Error(`Không nhận được jobid hợp lệ từ useapi.net. Provider shape: ${JSON.stringify(summarizeProviderShape(raw))}`);
  }
  return { jobId, raw };
}

export async function createVideo(input: VideoCreateInput): Promise<VideoCreateResult> {
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

  const raw = await useapiFetch<unknown>('/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return parseVideoCreateResult(raw);
}

export async function getVideoJob(jobId: string) {
  const cleanJobId = jobId.trim();
  if (!isValidGoogleFlowJobId(cleanJobId)) {
    throw new Error('JobId không hợp lệ, không gửi request poll sang useapi.net');
  }

  // useapi.net documents jobId as a path parameter for /jobs/{jobId}.
  // Always URL-encode it so ':' '@' '/' and other special characters remain one safe path segment.
  return useapiFetch<unknown>(`/jobs/${encodeURIComponent(cleanJobId)}`);
}
