import base64
import json

from fastapi.testclient import TestClient

from app.local import app


def test_local_websocket_contract() -> None:
    with TestClient(app) as client:
        config = client.get("/api/config").json()
        assert config["websocketUrl"] == "ws://127.0.0.1:4322/event/realtime"
        response = client.post("/api/rooms", json={"name": "wire-test", "color": 0}).json()
        code = response["room"]["code"]
        credential = response["credentials"]["token"]
        auth = {"Authorization": code + ":" + credential, "host": config["httpHost"]}
        header = base64.urlsafe_b64encode(json.dumps(auth).encode()).decode().rstrip("=")
        with client.websocket_connect(
            "/event/realtime", subprotocols=["aws-appsync-event-ws", "header-" + header]
        ) as ws:
            ws.send_json({"type": "connection_init"})
            assert ws.receive_json()["type"] == "connection_ack"
            ws.send_json(
                {
                    "type": "subscribe",
                    "id": "room",
                    "channel": "/rooms/" + code,
                    "authorization": auth,
                }
            )
            assert ws.receive_json()["type"] == "subscribe_success"
            data = ws.receive_json()
            assert data["type"] == "data"
            assert json.loads(data["event"][0])["code"] == code
            assert credential not in json.dumps(data)
