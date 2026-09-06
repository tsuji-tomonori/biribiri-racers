# BR-GP-001 グランプリで全コースを順番に進める

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-GP-001-AC1: グランプリが開始される。各戦の結果が確定するとき、登録された全コースを順に進めて総合点を確定する。

検証: `backend/tests/test_rooms.py::test_ranking_and_gp`
