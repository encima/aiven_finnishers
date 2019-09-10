from . import config
from kafka import KafkaConsumer
import sys, json
from pony.orm import *

db = Database()


class User(db.Entity):
    username = Required(str)
    avatar_url = Required(str)
    owns = Set("Repo")


class Repo(db.Entity):
    name = Required(str)
    descrip = Optional(str)
    url = Required(str)
    owned_by = Required(User)
    has = Set("Release")


class Release(db.Entity):
    title = Optional(str)
    descrip = Optional(str)
    url = Required(str)
    part_of = Required(Repo)


class GithubConsumer:
    def __init__(self):
        try:
            self.con = KafkaConsumer(
                config.TOPIC,
                auto_offset_reset="earliest",
                bootstrap_servers=config.SERVERS,
                enable_auto_commit=False,
                security_protocol="SSL",
                ssl_check_hostname=True,
                ssl_cafile=config.SSL["ca"],
                ssl_certfile=config.SSL["cert"],
                ssl_keyfile=config.SSL["key"],
                group_id="python_consumer",
                # value_deserializer=lambda m: json.loads(m).decode('utf-8')
            )
        except Exception as e:
            print(f'Failed to connect to Kafka: {str(e)}')
            sys.exit(1)

        self.db_connect()
        print(f'Connection successful, listening for messages in: {config.TOPIC} topic')
        try:
            for msg in self.con:
                record = json.loads(msg.value)
                self.add_record(record)
        except (KeyboardInterrupt):
            sys.exit(0)
        except Exception as e:
            print(e)

    def db_connect(self):
        try:
            db.bind(
                provider="postgres",
                user=config.DB["user"],
                password=config.DB["pwd"],
                host=config.DB["host"],
                port=config.DB["port"],
                database=config.DB["db"],
                sslmode=config.DB['ssl'],
            )
        except Exception as e:
            print(f'Database connection failed with the following: {str(e)}')
            sys.exit(1)
        try:
            db.generate_mapping()
        except pony.ERDiagramError as erd_error:
            print(f'Mapping failed with the following: {str(erd_error)}')
            sys.exit(1)


    @db_session
    def add_record(self, record):
        """Check for existence of users and repositories before adding them to
        Postgres. Commit handled by session decorator
        
        Arguments:
            record {dict} -- Message from kafka topic containg details on user, repo and release
        """
        user = User.get(username=record["user"])
        if not user:
            user = User(username=record["user"], avatar_url=record["avatar_url"])
        repo = Repo.get(name=record["repo_name"], owned_by=user)
        if not repo:
            repo = Repo(
                name=record["repo_name"],
                descrip=record["repo_desc"] or '',
                url=record["repo_url"],
                owned_by=user,
            )
        release = Release(
            title=record["release_title"] or '',
            descrip=record["release_desc"] or '',
            url=record["release_url"],
            part_of=repo,
        )


if __name__ == "__main__":
    c = GithubConsumer()

