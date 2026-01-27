import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { fileName, text } = await req.json();
  void text;

  const issues = [
    {
      id: "sig",
      severity: "error",
      title: "서명이 빠졌어요!",
      message: "소장님 결재란이 비어있네요. 현장에서 서명해 주세요.",
      bbox: { x: 0.73, y: 0.06, w: 0.22, h: 0.12 }
    },
    {
      id: "headcount",
      severity: "warn",
      title: "인원수가 안 맞아요",
      message: "TBM 일지에는 5명인데, 점검표에는 4명으로 되어 있어요.",
      bbox: { x: 0.13, y: 0.44, w: 0.30, h: 0.10 }
    },
    {
      id: "scaffold",
      severity: "error",
      title: "비계 설치 상태가 미흡해요",
      message: "안전난간/고정 상태 보강이 필요합니다.",
      bbox: { x: 0.12, y: 0.66, w: 0.76, h: 0.08 }
    }
  ];

  const chat = [
    {
      role: "ai",
      text: `올려주신 '${fileName}' 잘 받았습니다.\n전체적으로 잘 쓰셨는데, 확인할 부분이 ${issues.length}가지 보여요.`
    }
  ];

  return NextResponse.json({ fileName, issues, chat });
}
