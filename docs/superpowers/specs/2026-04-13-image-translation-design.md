# 상세페이지 이미지 번역+합성 기능 설계

**날짜**: 2026-04-13  
**프로젝트**: 딸깍소싱 (dgs)  
**기능**: 1688 상품 이미지의 중국어 텍스트를 한글로 번역하여 자연스럽게 합성

---

## 1. 목표

상세페이지 생성기(`/detail-generator`)에서 1688 상품 URL을 입력하면:
- 메인 이미지 + 상세 HTML 이미지 전체를 수집
- 중국어 텍스트가 감지된 이미지만 선별
- OCR → 번역 → 인페인팅 → 한글 렌더링 파이프라인 실행
- HTML 내보내기 시 원본 이미지를 처리된 이미지로 자동 교체

---

## 2. 아키텍처

### 파이프라인 흐름

```
"생성하기" 클릭
    ├─ Phase 1: 상품 데이터 fetch          (기존)
    ├─ Phase 2: 13섹션 텍스트 AI 생성     (기존, 병렬)
    └─ Phase 3: 이미지 번역+합성          (신규, Phase 1과 병렬)
           ├─ 이미지 URL 수집 (메인 + 상세 HTML)
           ├─ Clova OCR → 중국어 감지 + 바운딩박스
           ├─ 미감지 이미지 스킵
           ├─ Papago → 중국어→한글 번역
           ├─ SD2-Inpainting → 텍스트 영역 배경 복원
           └─ Sharp → 한글 텍스트 렌더링 → base64 PNG
```

### 기술 스택

| 단계 | 기술 | 비용 |
|---|---|---|
| OCR | Naver Clova OCR | 무료 50,000회/월 |
| 번역 | Naver Papago (기존) | 기존 사용 중 |
| 인페인팅 | `runwayml/stable-diffusion-inpainting` (HF) | 무료 티어 |
| 텍스트 렌더링 | Sharp + NanumGothic 폰트 | 무료 |

---

## 3. 파일 구조

### 신규 파일

```
src/lib/clova-ocr.ts
src/lib/sd-inpainting.ts
src/lib/text-renderer.ts
src/lib/image-processor.ts
src/app/api/detail-generator/process-images/route.ts
font/NanumGothic.ttf
```

### 수정 파일

```
src/app/(sourcing)/detail-generator/page.tsx
src/components/detail-generator/GenerationProgress.tsx
src/components/detail-generator/ExportToolbar.tsx
```

---

## 4. API 인터페이스

### `POST /api/detail-generator/process-images`

**Request**
```typescript
{ imageUrls: string[] }
```

**Response**
```typescript
{
  processed: {
    originalUrl: string
    dataUrl: string   // base64 PNG
    translatedTexts: { original: string; korean: string }[]
  }[]
  skipped: string[]  // 중국어 미감지 이미지
}
```

---

## 5. 각 모듈 상세

### `src/lib/clova-ocr.ts`
- Naver Clova OCR API 호출
- 이미지를 서버에서 fetch → base64 변환 (CORS 우회)
- 응답에서 중국어 텍스트 + 바운딩박스 추출
- 중국어 감지 여부 판단 (한자 유니코드 범위: `\u4e00-\u9fff`)

```typescript
export interface OcrResult {
  text: string
  boundingBox: { x: number; y: number }[]  // 4개 꼭짓점
}

export async function detectChineseText(imageUrl: string): Promise<OcrResult[]>
```

### `src/lib/sd-inpainting.ts`
- HF `runwayml/stable-diffusion-inpainting` 호출
- 입력: 원본 이미지(base64) + 마스크(base64, 텍스트 영역=흰색)
- 출력: 텍스트 제거된 이미지(base64)
- 타임아웃: 60초
- 프롬프트: `"clean product background, no text, high quality"`

```typescript
export async function inpaintImage(
  imageBase64: string,
  maskBase64: string
): Promise<string>  // base64 PNG
```

### `src/lib/text-renderer.ts`
- Sharp + NanumGothic 폰트로 한글 텍스트 렌더링
- 바운딩박스 크기에 맞춰 폰트 사이즈 자동 조정
- 텍스트 색상: 원본 이미지의 해당 영역 평균색 반전값 사용

```typescript
export async function renderKoreanText(
  imageBase64: string,
  texts: { korean: string; boundingBox: { x: number; y: number }[] }[]
): Promise<string>  // base64 PNG
```

### `src/lib/image-processor.ts`
- 위 모듈들을 조합하는 오케스트레이터
- 이미지 병렬 처리 (최대 3개 동시)
- 각 이미지: OCR → 번역(Papago) → 마스크 생성 → 인페인팅 → 한글 렌더링

### `src/app/api/detail-generator/process-images/route.ts`
- POST 핸들러
- 최대 처리 이미지 수 제한: 15개 (메인 5 + 상세 10)
- 처리 실패 이미지는 원본 URL 유지 (에러 전파 안 함)

---

## 6. 프론트엔드 변경

### `GenerationProgress.tsx`
기존 `fetching → generating → done`에 `processing-images` 스텝 추가:
```
데이터 수집 → 이미지 번역 중 → AI 텍스트 생성 → 완료
```

### `page.tsx`
Phase 1 완료 후 Phase 2(텍스트 생성)와 Phase 3(이미지 처리)를 `Promise.all`로 병렬 실행.
처리된 이미지 맵 `processedImages: Map<string, string>` 상태로 관리.

### `ExportToolbar.tsx`
HTML 내보내기 시 `<img src="...">` 태그의 원본 URL을 `processedImages` 맵에서 조회하여 base64로 교체.

---

## 7. 환경변수

```
CLOVA_OCR_SECRET=      # Naver Cloud Platform → AI Services → OCR
CLOVA_OCR_API_URL=     # OCR 도메인 생성 후 발급되는 고유 URL
```

**Clova OCR 설정 방법:**
1. [Naver Cloud Platform](https://www.ncloud.com) 로그인
2. AI Services → OCR → 도메인 생성 (일반 인식)
3. Secret Key + API URL 발급

---

## 8. 에러 처리

- OCR 실패 → 해당 이미지 스킵, 원본 유지
- 인페인팅 실패 → 해당 이미지 스킵, 원본 유지
- 전체 이미지 처리 실패 → 텍스트 생성 결과는 정상 표시 (이미지만 원본)
- 처리 시간 초과 (90초) → 완료된 것만 반환

---

## 9. 제약 사항

- 처리 이미지 최대 15개/요청 (속도 제한)
- SD-Inpainting 무료 티어: 속도 느릴 수 있음 (이미지당 20~40초)
- 처리된 이미지는 세션 메모리에만 저장 (새로고침 시 사라짐)
- 폰트 색상 자동 감지는 근사값 (완벽하지 않을 수 있음)
