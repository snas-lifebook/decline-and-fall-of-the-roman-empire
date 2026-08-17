/**
 * 역할·칭호의 한국어. **화면에서만 바꾼다 — 데이터는 안 건드린다.**
 *
 * 화면 전체가 한국어인데 인물 상자와 속성표의 칭호만 영어로 떴다(`general`,
 * `Egypt pharaoh`, `noblewoman`). 원인이 둘이었다.
 *   1. 사전이 객체 화면 파일 안에 갇혀 있어 **가계도가 못 썼다.** 그래서 상자는
 *      100% 영문이었다
 *   2. 사전이 17개뿐이라 객체 화면도 63%만 덮었다
 *
 * **번역은 반드시 표시 단계에서만 한다.** `lib/family/sex.ts`가 `wife of`·`son of`
 * 같은 **영문 원문**을 읽어 남녀를 가른다. 데이터를 번역해 덮으면 그 판정이 통째로
 * 무너진다. 테스트가 이 조건을 지킨다.
 *
 * **데이터 쪽 문제는 이걸로 안 없어진다.** `emperor` 33건과 `황제` 14건이 같은 뜻인데
 * 따로 적혀 있다 — 화면은 둘 다 「황제」로 내지만, 레포를 직접 읽는 AI에게는 여전히
 * 두 값이다. 표기 통일은 `propose-change`로 데이터에서 풀 일이다.
 *
 * 모르는 값은 **원문 그대로** 낸다. 지어낸 번역을 채우지 않는다.
 */

export const ROLE_KO: Record<string, string> = {
  // 제위·왕위
  emperor: '황제',
  empress: '황후',
  'byzantine emperor': '비잔틴 황제',
  'future emperor': '훗날의 황제',
  'usurper emperor': '찬탈 황제',
  emperor_puppet: '허수아비 황제',
  empress_dowager: '황태후',
  'general, emperor': '장군·황제',
  'prince, emperor': '왕자·황제',
  king: '왕',
  queen: '왕비',
  prince: '왕자',
  princess: '공주',
  'king of numidia': '누미디아 왕',
  'king of pontus': '폰토스 왕',
  'king of armenia': '아르메니아 왕',
  'king of england': '잉글랜드 왕',
  'macedonian king': '마케도니아 왕',
  'egypt pharaoh': '이집트 파라오',
  'prince of egypt': '이집트 왕자',
  'egyptian regent': '이집트 섭정',
  'ottoman sultan': '오스만 술탄',
  'islamic ruler title': '이슬람 군주 칭호',
  'islamic dynasty': '이슬람 왕조',
  'first caliph': '초대 칼리프',

  // 관직
  consul: '집정관',
  'roman consul': '로마 집정관',
  senator: '원로원 의원',
  'roman senator': '로마 원로원 의원',
  governor: '총독',
  censor: '감찰관',
  dictator: '독재관',
  prefect: '장관',
  'prefect of the praetorian guard': '근위대장',
  praetorian_prefect: '근위대장',
  'second triumvir': '제2차 삼두정 일원',
  'financial officer': '재무관',
  chamberlain: '시종장',
  official: '관리',
  'governing body': '통치 기구',
  system: '제도',

  // 군
  general: '장군',
  'roman general': '로마 장군',
  'egyptian general': '이집트 장군',
  'macedonian general': '마케도니아 장군',
  eunuch_general: '환관 장군',
  commander: '사령관',
  'roman commander': '로마 사령관',
  'genoese commander': '제노바 사령관',
  military_commander: '군 사령관',
  'military leader': '군사 지도자',
  'roman admiral': '로마 제독',
  officer: '장교',
  'roman officer': '로마 장교',
  soldier: '군인',
  'imperial guard': '근위대',
  invader: '침입자',
  'central asian conqueror': '중앙아시아 정복자',

  // 신분·관계
  nobleman: '귀족',
  aristocrat: '귀족',
  noblewoman: '귀족 여성',
  'roman noblewoman': '로마 귀족 여성',
  concubine: '후궁',
  eunuch: '환관',
  wife: '아내',
  daughter: '딸',
  boy: '소년',
  'young child': '어린아이',
  ancestor: '조상',
  'wife of octavianus': '옥타비아누스의 아내',
  "octavianus's wife": '옥타비아누스의 아내',
  'sister of octavianus': '옥타비아누스의 누이',
  "caesar's heir": '카이사르의 후계자',
  "caesar's sister": '카이사르의 누이',
  'son of pompey': '폼페이우스의 아들',
  // 「first」가 아니라 「early」다. 순서를 단정하지 않는 말로 옮긴다
  'early husband': '이전 남편',
  'uncle, protector': '숙부·후견인',
  'merchant widow, wife of muhammad': '상인 미망인·무함마드의 아내',
  'tribal leader': '부족장',
  leader: '지도자',
  'slave-leader': '노예 지도자',

  // 종교·학예
  religion: '종교',
  'religious sect': '종파',
  bishop: '주교',
  'prophet, founder of islam': '예언자·이슬람 창시자',
  founder: '창시자',
  philosopher: '철학자',
  'philosopher, tutor': '철학자·가정교사',
  historian: '역사가',
  poet: '시인',
  orator: '웅변가',
  'author, socialite': '저술가·사교계 인사',
  soothsayer: '점술가',
  politician: '정치인',
  witness: '목격자',
  mythological_figure: '신화적 인물',

  // 흥행·기타
  gladiator: '검투사',
  gladiator_type: '검투사 유형',
  beast_keeper: '맹수 사육사',
  'roman province': '로마 속주',

  /*
   * 아래는 2026-08-17 감사에서 나온 것들이다. **라벨은 한국어인데 값이 영어로**
   * 나가고 있었다 — `종류: place`, `지역: Middle East`. 89장 118건이고 그중 셋은
   * 타입 키 자체(`place`·`institution`)라 「화면에 원시 키 금지」 직접 위반이었다.
   *
   * 종류·지역처럼 **분류를 뜻하는 값**과 흔한 지명만 담는다. 사람 이름·고유 지명
   * (`Colonae Promontorium`·`Thurii`)은 **원문 그대로 둔다** — 라틴어 표기가 그
   * 자체로 정보고, 억지로 옮기면 책과 어긋난다.
   */
  // 분류를 뜻하는 값
  place: '지명',
  city: '도시',
  region: '지역',
  territory: '영역',
  sea: '바다',
  river: '강',
  strait: '해협',
  gate: '성문',
  building: '건물',
  institution: '제도',
  empire: '제국',
  'empire name': '제국 이름',
  civilization: '문명',
  language: '언어',
  church: '교회',
  'religious site': '종교 시설',
  'religious group': '종교 집단',
  'state religion': '국교',
  'priest class': '사제 계급',
  'ethnic group': '민족',
  'political faction': '정치 파벌',
  'religious and political movement': '종교·정치 운동',
  'historical period': '시대',
  'barbarian kingdom': '이민족 왕국',
  'maritime republic': '해양 공화국',
  'military unit': '군 부대',
  'military force': '군대',
  'elite force': '정예 부대',
  'strategic location': '요충지',
  'islamic empire': '이슬람 제국',
  'islamic calendar origin': '이슬람력 기원',
  spouse: '배우자',
  // 관직 라틴어 — 본문이 그대로 쓰는 말이라 한글 옆에 원문을 남긴다
  tribunus: '호민관(tribunus)',
  praetor: '법무관(praetor)',
  aediles: '조영관(aediles)',
  quaestor: '재무관(quaestor)',
  // 흔한 지명. 책이 한글로 부르는 것만 옮긴다
  italy: '이탈리아',
  europe: '유럽',
  africa: '아프리카',
  greece: '그리스',
  spain: '에스파냐',
  cyprus: '키프로스',
  arabia: '아라비아',
  mecca: '메카',
  mediterranean: '지중해',
  constantinople: '콘스탄티노플',
  'middle east': '중동',
  'central asia': '중앙아시아',
  'sassanid persia': '사산조 페르시아',
  sparta: '스파르타',
  arabic: '아랍어',
  battle: '전투',
  execution: '처형',
  // 관계를 적은 값. 위쪽 「옥타비아누스의 아내」와 같은 계열이다
  'uncle of muhammad': '무함마드의 숙부',
  'grandfather of muhammad': '무함마드의 조부',
  'great-grandfather of muhammad': '무함마드의 증조부',
  'predecessor of phocas': '포카스의 전임자',
  'successor to justinian i': '유스티니아누스 1세의 후계자',
  'founded constantinople': '콘스탄티노플을 세움',
  'recovery of western territories': '서방 영토 수복',
  'lost by byzantine empire': '비잔틴 제국이 잃음',
  sassanid: '사산조',
  muhammad: '무함마드',
  'byzantine capital': '비잔틴 수도',
  'abbasid dynasty': '아바스 왕조',
  'timurid empire': '티무르 제국',
  'decline and fall of the roman empire': '로마제국쇠망사',
  /*
   * **여기서 멈춘다.** `Colonae Promontorium`·`Fretum Herculeum`·`Thurii`는 라틴어
   * 고유명이고 본문이 그 표기를 그대로 쓴다. 옮기면 책과 어긋나고, 옮길 한국어
   * 정본도 없다. 모르는 값은 원문 그대로 낸다 — 지어낸 번역을 채우지 않는다.
   */
}

export function roleKo(v: string): string {
  return ROLE_KO[v.toLowerCase()] ?? v
}
