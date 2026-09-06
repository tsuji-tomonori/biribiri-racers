# BR-RACE-001 最下位が決定した時点でレースを終了する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-RACE-001-AC1: 未確定が2人。1人の順位が確定するとき、残る1人の順位を確定して結果に遷移する。

検証: `backend/tests/test_rooms.py::test_ranking_and_gp`
