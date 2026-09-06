# BR-ROOM-002 ルームの同時参加を10人に制限する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-ROOM-002-AC1: 10人が参加済み。11人目が参加するとき、409で拒否し10人を超えない。

検証: `backend/tests/test_rooms.py::test_ten_players`
