/**
 * Centralized error message system with actionable guidance
 */

export interface ErrorDetails {
  title: string;
  message: string;
  solution?: string;
  action?: string;
  type: "error" | "warning" | "info";
}

export const ErrorMessages = {
  // Image Quality Errors
  IMAGE_TOO_SMALL: (): ErrorDetails => ({
    title: "이미지 파일이 너무 작습니다",
    message: "파일 크기가 10KB 미만입니다. 압축되거나 손상된 이미지일 수 있습니다.",
    solution: "원본 사진을 사용하거나 더 높은 품질로 다시 촬영해주세요.",
    action: "다시 업로드",
    type: "error",
  }),

  IMAGE_LOW_RESOLUTION: (width: number, height: number): ErrorDetails => ({
    title: "이미지 해상도가 낮습니다",
    message: `현재 해상도: ${width}×${height}. 텍스트 인식이 어려울 수 있습니다.`,
    solution: "최소 800×600 이상의 해상도로 촬영해주세요. 휴대폰 카메라 설정에서 '고화질' 또는 '원본' 모드를 선택하세요.",
    action: "다시 촬영",
    type: "error",
  }),

  IMAGE_POOR_QUALITY: (): ErrorDetails => ({
    title: "이미지 품질이 불량합니다",
    message: "문서 인식이 실패하거나 부정확할 수 있습니다.",
    solution: "밝은 조명에서 문서 전체가 잘 보이도록 다시 촬영하세요. 손떨림을 방지하고 평평한 곳에 문서를 놓으세요.",
    action: "촬영 가이드 보기",
    type: "warning",
  }),

  // Document Content Errors
  EMPTY_DOCUMENT: (): ErrorDetails => ({
    title: "문서에 내용이 없습니다",
    message: "업로드된 파일이 비어 있거나 텍스트를 읽을 수 없습니다.",
    solution: "올바른 문서 파일인지 확인하세요. PDF가 암호화되어 있지 않은지, 이미지가 손상되지 않았는지 확인하세요.",
    action: "다른 파일 선택",
    type: "error",
  }),

  EMPTY_FILE: (): ErrorDetails => ({
    title: "빈 파일입니다",
    message: "파일 크기가 0바이트입니다.",
    solution: "내용이 있는 문서를 업로드해주세요. 파일이 완전히 다운로드/생성되었는지 확인하세요.",
    action: "다시 시도",
    type: "error",
  }),

  // Validation Errors
  VALIDATION_FAILED: (details?: string): ErrorDetails => ({
    title: "문서 검증에 실패했습니다",
    message: details || "AI가 문서를 분석하는 중 오류가 발생했습니다.",
    solution: "문서가 안전 점검 관련 서류인지 확인하세요. 잠시 후 다시 시도하거나 다른 형식(PDF/이미지)으로 업로드해보세요.",
    action: "다시 시도",
    type: "error",
  }),

  VALIDATION_ERROR: (errorMessage?: string): ErrorDetails => ({
    title: "검증 중 오류가 발생했습니다",
    message: errorMessage || "예상치 못한 오류가 발생했습니다.",
    solution: "인터넷 연결을 확인하세요. 문제가 계속되면 관리자에게 문의하세요.",
    action: "새로고침",
    type: "error",
  }),

  NOT_SAFETY_DOCUMENT: (): ErrorDetails => ({
    title: "안전 점검 문서가 아닙니다",
    message: "업로드된 문서는 산업안전 점검표, TBM 결과, 위험성 평가 보고서 등이 아닌 것으로 보입니다.",
    solution: "다음 문서 유형을 업로드하세요:\n• 산업안전 점검표\n• 작업 전 안전점검표(TBM)\n• 위험성 평가 보고서\n• 작업허가서",
    action: "올바른 문서 선택",
    type: "error",
  }),

  // Project Errors
  PROJECT_CREATE_FAILED: (): ErrorDetails => ({
    title: "프로젝트 생성 실패",
    message: "프로젝트를 생성하는 중 오류가 발생했습니다.",
    solution: "프로젝트 이름이 중복되지 않았는지 확인하세요. 네트워크 연결을 확인하고 다시 시도하세요.",
    action: "다시 시도",
    type: "error",
  }),

  PROJECT_DELETE_FAILED: (): ErrorDetails => ({
    title: "프로젝트 삭제 실패",
    message: "프로젝트를 삭제할 수 없습니다.",
    solution: "해당 프로젝트에 아직 처리 중인 작업이 있을 수 있습니다. 잠시 후 다시 시도하세요.",
    action: "다시 시도",
    type: "error",
  }),

  // History Errors
  LOAD_HISTORY_FAILED: (): ErrorDetails => ({
    title: "기록을 불러올 수 없습니다",
    message: "과거 검증 기록을 가져오는 중 오류가 발생했습니다.",
    solution: "페이지를 새로고침하거나 잠시 후 다시 시도하세요.",
    action: "새로고침",
    type: "error",
  }),

  // PDF Export Errors
  PDF_EXPORT_FAILED: (details?: string): ErrorDetails => ({
    title: "PDF 내보내기 실패",
    message: details || "보고서를 PDF로 변환하는 중 오류가 발생했습니다.",
    solution: "브라우저 팝업 차단을 해제하세요. 문제가 계속되면 Chrome 또는 Edge 브라우저를 사용하세요.",
    action: "다시 시도",
    type: "error",
  }),

  // Upload Errors
  TEMP_MASTER_DOC_UPLOAD_FAILED: (): ErrorDetails => ({
    title: "마스터 문서 업로드 실패",
    message: "임시 마스터 안전 계획서를 업로드할 수 없습니다.",
    solution: "파일이 PDF 형식인지 확인하세요. 파일 크기가 너무 크지 않은지(권장: 10MB 이하) 확인하세요.",
    action: "다른 파일 선택",
    type: "error",
  }),

  // Network Errors
  NETWORK_ERROR: (): ErrorDetails => ({
    title: "네트워크 연결 오류",
    message: "서버와 통신할 수 없습니다.",
    solution: "인터넷 연결을 확인하세요. Wi-Fi 또는 모바일 데이터가 활성화되어 있는지 확인하세요.",
    action: "다시 시도",
    type: "error",
  }),

  // Generic Success Messages
  SUCCESS: (action: string): ErrorDetails => ({
    title: "성공",
    message: `${action}이(가) 완료되었습니다.`,
    type: "info",
  }),
};

/**
 * Format error details into a user-friendly message
 */
export function formatErrorMessage(error: ErrorDetails): string {
  let message = `${error.title}`;

  if (error.message) {
    message += `\n${error.message}`;
  }

  if (error.solution) {
    message += `\n\n💡 해결 방법: ${error.solution}`;
  }

  return message;
}

/**
 * Get a simple one-line error message
 */
export function getSimpleErrorMessage(error: ErrorDetails): string {
  return error.title;
}
