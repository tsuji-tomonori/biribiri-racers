# BR-SYNC-001 参加者の入力から計算した位置と接触を同期する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-SYNC-001-AC1: レース進行中。入力イベントを送信するとき、サーバー計算した位置と接触回数を全参加者に配信する。

検証: `backend/tests/test_rooms.py::test_api`
