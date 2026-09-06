from app.tools.design import OUT, generate


def test_generated_documents() -> None:
    first = generate()
    assert first == generate()
    for name, body in first.items():
        assert (OUT / name).read_text() == body
    assert "DynamoDB" in first["operations.gen.json"]
