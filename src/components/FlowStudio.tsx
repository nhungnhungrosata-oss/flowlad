'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, ImagePlus, Loader2, Maximize2, RefreshCcw, Trash2, Video } from 'lucide-react';

type Tab = 'video' | 'image';
type HistoryItem = { id: string; type: Tab; prompt: string; url?: string; urls?: string[]; createdAt: string };

type ApiResponse = { ok: boolean; message?: string; [key: string]: unknown };

const videoModels = ['veo-3.1-fast', 'veo-3.1-quality', 'veo-3.1-lite', 'veo-3.1-lite-low-priority', 'omni-flash'];
const imageModels = ['imagen-4', 'nano-banana-2', 'nano-banana-pro'];

function fileListToArray(list: FileList | null) {
  return list ? Array.from(list) : [];
}

async function uploadAsset(file: File, onStatus: (text: string) => void) {
  onStatus(`Đang upload ảnh: ${file.name}`);
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/flow/asset/upload', { method: 'POST', body: form });
  const data = (await res.json()) as ApiResponse & { mediaGenerationId?: string };
  if (!res.ok || !data.ok || !data.mediaGenerationId) throw new Error(data.message || `File upload lỗi: ${file.name}`);
  return data.mediaGenerationId;
}

function UploadBox({ label, multiple, max, onChange }: { label: string; multiple?: boolean; max?: number; onChange: (files: File[]) => void }) {
  return (
    <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-indigo-300/50 hover:bg-white/[0.07]">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <ImagePlus className="h-4 w-4 text-indigo-300" />
        <span>{label}</span>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="mt-3 w-full cursor-pointer text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        onChange={(event) => onChange(fileListToArray(event.target.files).slice(0, max))}
      />
    </label>
  );
}

export default function FlowStudio() {
  const [tab, setTab] = useState<Tab>('video');
  const [status, setStatus] = useState('Sẵn sàng');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [videoPrompt, setVideoPrompt] = useState('A cinematic product ad, smooth camera movement, professional lighting, no text, no logo');
  const [videoModel, setVideoModel] = useState(videoModels[0]);
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('9:16');
  const [duration, setDuration] = useState(8);
  const [startImage, setStartImage] = useState<File[]>([]);
  const [endImage, setEndImage] = useState<File[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  const [imagePrompt, setImagePrompt] = useState('A premium product photo in Google Flow style, studio lighting, sharp details, no text, no logo');
  const [imageModel, setImageModel] = useState(imageModels[0]);
  const [imageRatio, setImageRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1');
  const [imageCount, setImageCount] = useState(2);
  const [imageRefs, setImageRefs] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const activePrompt = tab === 'video' ? videoPrompt : imagePrompt;

  async function checkAccount() {
    setStatus('Đang kiểm tra account Google Flow');
    const res = await fetch('/api/flow/account');
    const data = (await res.json()) as ApiResponse;
    if (!res.ok || !data.ok) throw new Error(data.message || 'Không kiểm tra được account');
  }

  async function handleCreateVideo() {
    try {
      setError(''); setLoading(true); setProgress(8); setVideoUrl('');
      await checkAccount();
      const uploadedStart = startImage[0] ? await uploadAsset(startImage[0], setStatus) : undefined;
      const uploadedEnd = endImage[0] ? await uploadAsset(endImage[0], setStatus) : undefined;
      const refs: string[] = [];
      for (const file of referenceImages) refs.push(await uploadAsset(file, setStatus));
      setStatus('Đang gửi job tạo video'); setProgress(28);
      const res = await fetch('/api/flow/video/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, model: videoModel, aspectRatio: videoRatio, duration, startImage: uploadedStart, endImage: uploadedEnd, references: refs })
      });
      const data = (await res.json()) as ApiResponse & { jobId?: string };
      if (!res.ok || !data.ok || !data.jobId) throw new Error(data.message || 'Không nhận được jobId');
      setStatus('Đang tạo video'); setProgress(40);
      await pollVideoJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo video'); setStatus('Có lỗi xảy ra'); setLoading(false);
    }
  }

  async function pollVideoJob(jobId: string) {
    let tick = 0;
    return new Promise<void>((resolve, reject) => {
      pollRef.current = setInterval(async () => {
        try {
          tick += 1;
          setProgress((p) => Math.min(92, p + 4));
          setStatus(tick % 2 === 0 ? 'Đang tải kết quả' : 'Đang tạo video');
          const res = await fetch(`/api/flow/video/job?id=${encodeURIComponent(jobId)}`);
          const data = (await res.json()) as ApiResponse & { raw?: any; videoUrl?: string };
          if (!res.ok || !data.ok) throw new Error(data.message || 'Job lỗi');
          const raw = data.raw as Record<string, unknown> | undefined;
          const providerStatus = String(raw?.status || '').toLowerCase();
          if (providerStatus === 'failed') throw new Error(String(raw?.error || raw?.message || 'Job video thất bại'));
          if (providerStatus === 'completed' || data.videoUrl) {
            if (!data.videoUrl) throw new Error('Job completed nhưng không có videoUrl');
            const finalUrl = data.videoUrl;
            if (pollRef.current) clearInterval(pollRef.current);
            setVideoUrl(finalUrl); setProgress(100); setStatus('Hoàn thành'); setLoading(false);
            const item: HistoryItem = { id: crypto.randomUUID(), type: 'video', prompt: videoPrompt, url: finalUrl, createdAt: new Date().toLocaleString('vi-VN') };
            setHistory((prev) => [item, ...prev].slice(0, 12));
            resolve();
          }
        } catch (error) {
          if (pollRef.current) clearInterval(pollRef.current);
          reject(error);
        }
      }, 5000);
    });
  }

  async function handleCreateImage() {
    try {
      setError(''); setLoading(true); setProgress(10); setImageUrls([]);
      await checkAccount();
      const refs: string[] = [];
      for (const file of imageRefs) refs.push(await uploadAsset(file, setStatus));
      setStatus('Đang tạo hình ảnh'); setProgress(55);
      const res = await fetch('/api/flow/image/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, model: imageModel, aspectRatio: imageRatio, count: imageCount, references: refs })
      });
      const data = (await res.json()) as ApiResponse & { imageUrls?: string[] };
      if (!res.ok || !data.ok) throw new Error(data.message || 'Lỗi tạo hình ảnh');
      const urls = data.imageUrls || [];
      setImageUrls(urls); setProgress(100); setStatus('Hoàn thành'); setLoading(false);
      const item: HistoryItem = { id: crypto.randomUUID(), type: 'image', prompt: imagePrompt, urls, createdAt: new Date().toLocaleString('vi-VN') };
      setHistory((prev) => [item, ...prev].slice(0, 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo hình ảnh'); setStatus('Có lỗi xảy ra'); setLoading(false);
    }
  }

  const resultCount = useMemo(() => (videoUrl ? 1 : 0) + imageUrls.length, [videoUrl, imageUrls]);

  return (
    <main className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-glow backdrop-blur md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm text-indigo-200">useapi.net Google Flow API</p><h1 className="text-2xl font-bold tracking-tight">Flow Studio</h1></div>
          <div className="flex rounded-2xl bg-black/30 p-1">
            <button onClick={() => setTab('video')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'video' ? 'bg-white text-slate-950' : 'text-slate-300'}`}><Video className="mr-2 inline h-4 w-4"/>Tạo Video</button>
            <button onClick={() => setTab('image')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'image' ? 'bg-white text-slate-950' : 'text-slate-300'}`}><ImagePlus className="mr-2 inline h-4 w-4"/>Tạo Hình Ảnh</button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
            <textarea value={activePrompt} onChange={(e) => tab === 'video' ? setVideoPrompt(e.target.value) : setImagePrompt(e.target.value)} rows={8} className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm outline-none ring-indigo-400/40 placeholder:text-slate-500 focus:ring-2" placeholder="Nhập prompt..." />

            {tab === 'video' ? <div className="mt-5 space-y-4">
              <UploadBox label="Upload ảnh bắt đầu startImage" onChange={setStartImage}/>
              <UploadBox label="Upload ảnh kết thúc endImage" onChange={setEndImage}/>
              <UploadBox label="Upload ảnh tham chiếu referenceImage_1..3" multiple max={3} onChange={setReferenceImages}/>
              <Select label="Model" value={videoModel} options={videoModels} onChange={setVideoModel}/>
              <Select label="Tỷ lệ" value={videoRatio} options={['16:9','9:16']} onChange={(v) => setVideoRatio(v as '16:9' | '9:16')}/>
              <Select label="Thời lượng" value={String(duration)} options={['8']} onChange={(v) => setDuration(Number(v))}/>
              <ActionButton loading={loading} onClick={handleCreateVideo} label="Tạo video" />
            </div> : <div className="mt-5 space-y-4">
              <UploadBox label="Upload ảnh tham chiếu reference_1..10" multiple max={10} onChange={setImageRefs}/>
              <Select label="Model" value={imageModel} options={imageModels} onChange={setImageModel}/>
              <Select label="Tỷ lệ" value={imageRatio} options={['16:9','9:16','1:1']} onChange={(v) => setImageRatio(v as '16:9' | '9:16' | '1:1')}/>
              <Select label="Số ảnh" value={String(imageCount)} options={['1','2','3','4']} onChange={(v) => setImageCount(Number(v))}/>
              <ActionButton loading={loading} onClick={handleCreateImage} label="Tạo hình ảnh" />
            </div>}

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-sm"><span>{status}</span><span>{progress}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${progress}%` }}/></div>
              {error ? <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p> : null}
            </div>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Preview kết quả</h2><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{resultCount} kết quả</span></div>
            <div className="min-h-[520px] rounded-3xl border border-dashed border-white/15 bg-black/30 p-4">
              {loading ? <div className="flex h-[480px] flex-col items-center justify-center text-slate-300"><Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-300"/><p>{status}</p></div> : null}
              {!loading && tab === 'video' && videoUrl ? <ResultVideo url={videoUrl} prompt={videoPrompt} onClear={() => setVideoUrl('')} onRetry={handleCreateVideo}/> : null}
              {!loading && tab === 'image' && imageUrls.length ? <ImageGallery urls={imageUrls} prompt={imagePrompt} onUseAsStart={(url) => { setTab('video'); setStatus('Hãy tải ảnh này về rồi upload vào startImage nếu cần dùng lại làm ảnh đầu video.'); }} onRetry={handleCreateImage}/> : null}
              {!loading && !videoUrl && imageUrls.length === 0 ? <div className="flex h-[480px] items-center justify-center text-center text-slate-400"><p>Kết quả sẽ hiển thị ở đây: video MP4 hoặc gallery ảnh.</p></div> : null}
            </div>

            <div className="mt-5"><h3 className="mb-3 text-sm font-semibold text-slate-300">Lịch sử kết quả</h3><div className="grid gap-3 md:grid-cols-2">
              {history.map((item) => <button key={item.id} onClick={() => item.type === 'video' && item.url ? (setTab('video'), setVideoUrl(item.url), setVideoPrompt(item.prompt)) : (setTab('image'), setImageUrls(item.urls || []), setImagePrompt(item.prompt))} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left text-sm hover:bg-white/[0.08]"><div className="mb-1 text-xs uppercase text-indigo-200">{item.type} • {item.createdAt}</div><p className="line-clamp-2 text-slate-300">{item.prompt}</p></button>)}
            </div></div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block text-sm text-slate-300">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white outline-none">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
function ActionButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return <button disabled={loading} onClick={onClick} className="w-full rounded-2xl bg-indigo-500 px-5 py-4 font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin"/> : null}{label}</button>;
}
function ResultVideo({ url, prompt, onClear, onRetry }: { url: string; prompt: string; onClear: () => void; onRetry: () => void }) {
  return <div><video src={url} controls className="max-h-[560px] w-full rounded-2xl bg-black"/><div className="mt-4 flex flex-wrap gap-2"><a href={url} download className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950"><Download className="mr-1 inline h-4 w-4"/>Tải video</a><button onClick={onRetry} className="rounded-xl bg-white/10 px-3 py-2 text-sm"><RefreshCcw className="mr-1 inline h-4 w-4"/>Tạo lại</button><button onClick={() => navigator.clipboard.writeText(prompt)} className="rounded-xl bg-white/10 px-3 py-2 text-sm"><Copy className="mr-1 inline h-4 w-4"/>Sao chép prompt</button><button onClick={onClear} className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100"><Trash2 className="mr-1 inline h-4 w-4"/>Xóa kết quả</button></div></div>;
}
function ImageGallery({ urls, prompt, onUseAsStart, onRetry }: { urls: string[]; prompt: string; onUseAsStart: (url: string) => void; onRetry: () => void }) {
  return <div className="grid gap-4 md:grid-cols-2">{urls.map((url, i) => <div key={url} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><img src={url} alt={`Generated ${i + 1}`} className="aspect-square w-full rounded-xl object-cover"/><div className="mt-3 flex flex-wrap gap-2"><a href={url} download className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-slate-950"><Download className="mr-1 inline h-3 w-3"/>Tải ảnh</a><a href={url} target="_blank" className="rounded-lg bg-white/10 px-2 py-1.5 text-xs"><Maximize2 className="mr-1 inline h-3 w-3"/>Phóng to</a><button onClick={() => onUseAsStart(url)} className="rounded-lg bg-indigo-500/30 px-2 py-1.5 text-xs">Dùng làm startImage</button><button onClick={onRetry} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs">Tạo lại</button><button onClick={() => navigator.clipboard.writeText(prompt)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs">Copy prompt</button></div></div>)}</div>;
}
