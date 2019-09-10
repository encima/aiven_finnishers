from github import Github
from kafka import KafkaProducer
import threading
from functools import wraps
import time, json
import config

def check_github_rate(f):
    def wrapper(*args):
        rate_limit = args[0].g.get_rate_limit()
        rate = rate_limit.search
        if rate.remaining == 0:
            print(
                f"You have 0/{rate.limit} API calls remaining. Reset time: {rate.reset}. Sleeping"
            )
            time.sleep(rate.reset)
        return f(*args)
    return wrapper

class Fin_Search:
    g = None

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
        except Exception as e:
            print(f"Exception while connecting Kafka: {str(e)}")

    def publish_kafka_message(self, key, value):
        try:
            self.producer.send(config.KAFKA_TOPIC, key=key, value=value)
            self.producer.flush()
            print("Message published")
        except Exception as e:
            print(f"Exception in publishing message: {str(e)}")

    @check_github_rate
    def search_fins(self):
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

    @check_github_rate
    def search_finished(self, user):
        repos = user.get_repos()
        for repo in repos:
            if self.search_releases(repo, user):
                return

    @check_github_rate
    def search_releases(self, repo, user):
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
            return True
        return False

if __name__ == "__main__":
    s = Fin_Search()
    s.search_fins()

