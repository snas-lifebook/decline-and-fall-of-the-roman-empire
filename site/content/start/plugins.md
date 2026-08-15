---
title: 플러그인 두 개 켜기
summary: 표와 지도가 그려지게 만듭니다. 두 개만 켜면 되고 5분이면 끝납니다.
---

옵시디언에 기능을 더하는 것을 플러그인이라고 합니다. 이 자료는 두 개를 씁니다 — 목록을 자동으로 그려주는 **Dataview**, 지도를 띄워주는 **Leaflet**입니다.

## 안 켜면 이렇게 보입니다

왜 켜야 하는지부터 보시는 게 빠릅니다.

목록이 있어야 할 자리가 비어 있습니다.

![플러그인을 켜지 않아 동적 목록이 뜨지 않은 화면](/guide/plugins/01-no-dataview.webp)

인물 노트를 열어도 관계 표가 그려지지 않습니다.

![플러그인 없이 연 인물 노트 화면](/guide/plugins/02-entity-note.webp)

지도가 있어야 할 자리도 빈칸입니다.

![플러그인을 켜지 않아 지도가 뜨지 않은 화면](/guide/plugins/03-no-map.webp)

## Dataview를 켭니다

1. 설정창으로 이동합니다

   ![옵시디언 설정창](/guide/plugins/04-settings.webp)

2. 커뮤니티 플러그인으로 이동합니다

   ![설정창의 커뮤니티 플러그인 항목](/guide/plugins/05-community-plugins.webp)

3. `제한 모드 종료`를 누릅니다

   옵시디언이 처음에는 바깥에서 만든 플러그인을 막아둡니다. 그걸 푸는 버튼입니다.

   ![제한 모드 종료 버튼](/guide/plugins/06-exit-restricted.webp)

4. `탐색`을 누릅니다

   ![커뮤니티 플러그인의 탐색 버튼](/guide/plugins/07-browse.webp)

5. `Dataview`를 검색합니다

   ![플러그인 검색창에 Dataview를 입력한 화면](/guide/plugins/08-search-dataview.webp)

6. `설치`를 누릅니다

   ![Dataview 플러그인의 설치 버튼](/guide/plugins/09-install.webp)

7. `활성화`를 누릅니다

   설치만 하고 활성화를 안 하면 아무 일도 일어나지 않습니다. 여기까지 하셔야 합니다.

   ![Dataview 플러그인의 활성화 버튼](/guide/plugins/10-enable.webp)

## Leaflet도 같은 방식입니다

8. 검색어만 `Leaflet`으로 바꿔서 5번부터 7번을 한 번 더 하시면 됩니다.

   ![Leaflet 플러그인을 설치하는 화면](/guide/plugins/11-leaflet.webp)

## 제대로 켜졌는지 봅니다

설치된 플러그인 목록에 둘 다 있고 켜져 있으면 됩니다.

![설치된 플러그인 목록에 Dataview와 Leaflet이 있는 화면](/guide/plugins/12-installed.webp)

볼트로 돌아가면 아까 비어 있던 자리에 목록과 지도가 그려집니다. 그려지는 목록의 원본은 [인물·관계 데이터](link:repo-ontology)입니다.

![플러그인을 켠 뒤 목록과 지도가 정상적으로 그려진 화면](/guide/plugins/13-final-result.webp)

여기서 막히시면 화면 아래 「한 줄 남기기」로 알려주세요. 흔한 일입니다. 그리고 이 둘을 안 켜도 **글 자체는 그대로 읽힙니다.** 목록과 지도만 안 보일 뿐입니다.
