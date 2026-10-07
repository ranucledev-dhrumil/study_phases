from tortoise.contrib.fastapi import RegisterTortoise

DATABASE_URL = "sqlite://tortoise_demo/tortoise.db"


def get_tortoise():
    return RegisterTortoise(
        db_url=DATABASE_URL,
        modules={
            "models": ["tortoise_demo.models"],
        },
        generate_schemas=True,
    )