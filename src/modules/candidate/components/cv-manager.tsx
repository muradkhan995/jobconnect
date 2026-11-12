"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client/api";

type Cv = {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  createdAt: string;
};

const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Upload, download and delete CVs (FR-CAN-005). Max 5; PDF or Word; up to 5 MB. */
export function CvManager({ cvs, max }: { cvs: Cv[]; max: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy("upload");
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/v1/candidate/cvs", {
      method: "POST",
      body,
    }).catch(() => null);
    setBusy(null);
    if (input.current) input.current.value = "";
    if (!res?.ok) {
      const problem = (await res?.json().catch(() => null)) as {
        title?: string;
      } | null;
      setMessage({
        tone: "error",
        text: problem?.title ?? "Upload failed. Please try again.",
      });
      return;
    }
    setMessage({ tone: "success", text: `${file.name} uploaded.` });
    router.refresh();
  }

  async function download(id: string) {
    setBusy(id);
    const result = await callApi<{ url: string }>(
      `/api/v1/candidate/cvs/${id}/download-url`,
      { method: "GET" },
    );
    setBusy(null);
    if (result.ok) window.open(result.data.url, "_blank", "noopener");
    else setMessage({ tone: "error", text: result.message });
  }

  async function remove(cv: Cv) {
    if (
      !window.confirm(
        `Delete ${cv.originalFilename}? Applications you already sent keep their copy.`,
      )
    )
      return;
    setBusy(cv.id);
    const result = await callApi(`/api/v1/candidate/cvs/${cv.id}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok && result.status !== 204)
      setMessage({ tone: "error", text: result.message });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {cvs.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No CVs yet. Upload one to start applying.
        </p>
      ) : (
        <ul
          className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
          aria-label="Your CVs"
        >
          {cvs.map((cv) => (
            <li
              key={cv.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <span>
                <span className="block font-medium">{cv.originalFilename}</span>
                <span className="text-xs text-zinc-500">
                  {size(cv.sizeBytes)} · added{" "}
                  {new Date(cv.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </span>
              <span className="flex gap-2">
                <Button
                  variant="secondary"
                  loading={busy === cv.id}
                  onClick={() => download(cv.id)}
                >
                  Download
                  <span className="sr-only"> {cv.originalFilename}</span>
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => remove(cv)}
                >
                  Delete<span className="sr-only"> {cv.originalFilename}</span>
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {cvs.length < max ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv-file" className="text-sm font-medium">
            Upload a CV
          </label>
          <input
            ref={input}
            id="cv-file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={busy === "upload"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
            aria-describedby="cv-file-hint"
            className="text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-4 file:font-medium dark:file:border-zinc-700 dark:file:bg-zinc-900"
          />
          <p
            id="cv-file-hint"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            PDF or Word (.docx), up to 5 MB. {max - cvs.length} of {max} slots
            left.
          </p>
        </div>
      ) : (
        <p className="text-sm">
          You have {max} CVs – delete one to upload another.
        </p>
      )}
    </div>
  );
}
