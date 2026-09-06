# BR-FREE-001 フリー対戦で毎回コースを選べる

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-FREE-001-AC1: フリー対戦の待機中。ホストがコースを選ぶとき、次のレースに選択コースを使用する。

検証: `backend/tests/test_rooms.py::test_api`
