# FastAPI implementation design

AUTO-GENERATED. DO NOT EDIT.

| Method | Path | Operation | Access | Requirements |
|---|---|---|---|---|
| POST | /api/rooms/{code}/commands | roomCommand | member | ['BR-RACE-001', 'BR-SYNC-001', 'BR-GP-001', 'BR-FREE-001'] |
| POST | /api/rooms | createRoom | public | ['BR-ROOM-001'] |
| POST | /api/rooms/{code}/join | joinRoom | public | ['BR-ROOM-002'] |
| GET | /api/rooms/{code} | readRoom | member | ['BR-SEC-001'] |
| GET | /api/config | getConfig | public | ['BR-AWS-001'] |
| GET | /api/health | health | public | ['BR-AWS-001'] |
