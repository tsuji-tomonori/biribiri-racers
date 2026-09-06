# BR-ROOM-001 ログインなしでルームを作成する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-ROOM-001-AC1: 参加者が名前を入力する。作成するとき、匿名の参加トークンと6文字コードを返す。

検証: `backend/tests/test_rooms.py::test_api`
