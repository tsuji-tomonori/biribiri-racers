# BR-SEC-001 ルームの状態参照を参加者に制限する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-SEC-001-AC1: 異なるルームのトークンがある。参照または購読するとき、操作を拒否しトークンを状態配信に含めない。

検証: `backend/tests/test_rooms.py::test_api`
