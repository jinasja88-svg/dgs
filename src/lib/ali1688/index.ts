/**
 * 1688 직접 API 모듈
 *
 * TMAPI를 대체하여 1688 내부 API를 직접/프록시 경유로 호출.
 *
 * 환경변수:
 * - ALI1688_PROXY_URL: 중국 프록시 서버 URL (설정 시 프록시 경유)
 * - ALI1688_PROXY_SECRET: 프록시 서버 인증 토큰
 */

export {
  uploadImage,
  searchByImage,
  searchByKeyword,
  getItemDetail,
  imageUrlToBase64,
} from './client';

export type {
  Ali1688UploadResult,
  Ali1688SearchItem,
  Ali1688ImageSearchResult,
  Ali1688ItemDetail,
} from './client';

export {
  mapSearchItemToProduct,
  mapDetailToProduct,
} from './mapper';

export { acquireToken, invalidateToken } from './mtop';
