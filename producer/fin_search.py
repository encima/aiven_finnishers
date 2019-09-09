from github import Github
from kafka import KafkaProducer
import threading
import time, json
import config

class Fin_Search:
    def __init__(self):
        self.g = Github(config.GITHUB_PAT, api_preview=True)
        self.connect_kafka_producer()

    def connect_kafka_producer(self):
        self.producer = None
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=[config.KAFKA_URL],
                api_version=(0, 10),
                security_protocol="SSL",
                ssl_check_hostname=True,
                ssl_cafile=config.SSL["ca"],
                ssl_certfile=config.SSL["cert"],
                ssl_keyfile=config.SSL["key"],
                key_serializer=str.encode,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
        except Exception as ex:
            print("Exception while connecting Kafka")
            print(str(ex))

    def publish_kafka_message(self, key, value):
        try:
            self.producer.send(config.KAFKA_TOPIC, key=key, value=value)
            self.producer.flush()
            print("Message published successfully.")
        except Exception as ex:
            print("Exception in publishing message")
            print(str(ex))

    def check_github_rate(self):
        rate_limit = self.g.get_rate_limit()
        rate = rate_limit.search
        if rate.remaining == 0:
            print(
                f"You have 0/{rate.limit} API calls remaining. Reset time: {rate.reset}. Sleeping"
            )
            time.sleep(rate.reset)
        else:
            return

    def search_fins(self):
        self.check_github_rate()
        query = f'"" location:finland'
        result = self.g.search_users(query, sort='repositories', order='desc')

        max_size = 1000
        print(f"Found {result.totalCount} users(s)")
        if result.totalCount > max_size:
            result = result[:max_size]

        for user in result:
            handle = user.login
            print(f"Searching user {handle} for finnished repos")
            self.search_finished(user)

    def search_finished(self, user):
        self.check_github_rate()
        repos = user.get_repos()
        for repo in repos:
            try:
                self.check_github_rate()
                rel = repo.get_releases()
                if rel.totalCount > 0:
                    key = repo.url
                    value = {
                        "repo_name": repo.name,
                        "repo_url": repo.url,
                        "repo_desc": repo.description,
                        "user": user.login,
                        "avatar_url": user.avatar_url,
                        "release_title": rel[0].title,
                        "release_url": rel[0].url,
                        "release_desc": rel[0].body
                    }
                    self.publish_kafka_message(key, value)
                    return
            except Exception as e:
                print(str(e))
                pass


if __name__ == "__main__":
    s = Fin_Search()
    s.search_fins()

