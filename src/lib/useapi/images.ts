import { z } from 'zod';
import { getServerEnv } from './env';
import { ensureHealthyAccount } from './accounts';
import { useapiFetch } from './client';

export const imageCreateSchema = z.object({
  prompt: z.string().min(1, 'Prompt không được để trống').max(6000),
  model: z.enum(['imagen-4', 'nano-banana-2', 'nano-banana-pro']),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  count: z.coerce.number().int().min(1).max(4),
  references: z.array(z.string()).max(10).default([])
});

export type ImageCreateInput = z.infer<typeof imageCreateSchema>;

export async function createImage(input: ImageCreateInput) {
  await ensureHealthyAccount();
  const { email } = getServerEnv();
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    model: input.model,
    aspectRatio: input.aspectRatio,
    count: input.count,
    email
  };
  input.references.forEach((ref, index) => {
    body[`reference_${index + 1}`] = ref;
  });
  return useapiFetch<unknown>('/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
