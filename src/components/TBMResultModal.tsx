"use client";

type Props = {
  open: boolean;
  data: any;
  onClose: () => void;
};

export default function TBMResultModal({ open, data, onClose }: Props) {
  if (!open) return null;

  const summary = data?.summary ?? data?.result?.summary ?? "";
  const issues = data?.issues ?? data?.result?.issues ?? [];
  const transcript = data?.transcript ?? data?.result?.transcript ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">TBM 요약 및 주의사항</h2>
          <button
            className="rounded-md px-3 py-1 text-sm hover:bg-gray-100"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <h3 className="font-medium">요약</h3>
            <div className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {summary || "요약 결과가 없습니다."}
            </div>
          </section>

          <section>
            <h3 className="font-medium">주의사항</h3>
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
              {Array.isArray(issues) && issues.length > 0 ? (
                <ul className="list-disc pl-5">
                  {issues.map((it: any, idx: number) => (
                    <li key={idx} className="whitespace-pre-wrap">
                      {typeof it === "string" ? it : JSON.stringify(it)}
                    </li>
                  ))}
                </ul>
              ) : (
                "주의사항 결과가 없습니다."
              )}
            </div>
          </section>

          <section>
            <h3 className="font-medium">전사(Transcript)</h3>
            <div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {transcript || "전사 결과가 없습니다."}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
