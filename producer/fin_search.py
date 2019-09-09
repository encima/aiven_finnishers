from github import Github
from kafka import KafkaProducer
import threading
import time
import config

class User_Check_Thread(threading.Thread):

    def __init__(self, github, producer, user):
        threading.Thread.__init__(self)
        self.g = github
        self.user = user

    def search_empty(self, user):
        # self.check_github_rate()
        repos = user.get_repos()
        for repo in repos:
            size = repo.size
            commits = repo.get_commits()
            try:
                contents = repo.get_contents('/')
            except Exception as empty:
                print('Repo has no contents!')
            if commits.totalCount == 0 or len(contents) == (1 or 0):
                print(f'We have an empty? {repo.name}')
    

class Fin_Search:

    def __init__(self):
        self.g = Github(config.GITHUB_PAT)
        self.connect_kafka_producer()

    def connect_kafka_producer(self):
        self.producer = None
        try:
            self.producer = KafkaProducer(bootstrap_servers=[config.KAFKA_URL], 
                          api_version=(0, 10), 
                          security_protocol='SSL',
                          ssl_check_hostname=True,
                          ssl_cafile=config.SSL['ca'],
                          ssl_certfile=config.SSL['cert'],
                          ssl_keyfile=config.SSL['key'])
        except Exception as ex:
            print('Exception while connecting Kafka')
            print(str(ex))

    def publish_kafka_message(self, key, value):
        try:
            key_bytes = bytes(str(key), encoding='utf-8')
            value_bytes = bytes(str(value), encoding='utf-8')
            self.producer.send(config.KAFKA_TOPIC, key=key_bytes, value=value_bytes)
            self.producer.flush()
            print('Message published successfully.')
        except Exception as ex:
            print('Exception in publishing message')
            print(str(ex))

    def check_github_rate(self):
        rate_limit = self.g.get_rate_limit()
        rate = rate_limit.search
        if rate.remaining == 0:
            print(f'You have 0/{rate.limit} API calls remaining. Reset time: {rate.reset}. Sleeping')
            time.sleep(rate.reset)
        else:
            print(f'You have {rate.remaining}/{rate.limit} API calls remaining')

    def search_fins(self):
        self.check_github_rate()
        query = f'"" location:finland'
        result = self.g.search_users(query, order='desc')

        max_size = 1000
        print(f'Found {result.totalCount} users(s)')
        if result.totalCount > max_size:
            result = result[:max_size]

        for user in result:
            handle = user.login
            print(f'Searching user {handle} for unfinished repos')
            self.search_empty(user)
            # User_Check_Thread(self.g, user, None).start()

    def search_empty(self, user):
        self.check_github_rate()
        repos = user.get_repos()
        for repo in repos:
            size = repo.size
            commits = repo.get_commits()
            try:
                contents = repo.get_contents('/')
            except Exception as empty:
                print('Repo has no contents!')
            if commits.totalCount == 0 or len(contents) == (1 or 0):
                print(f'We have an empty? {repo.name}')
                key = {'user': user.login, 'repo': repo.name}
                value = {'url': repo.url, 'desc': repo.description}
                self.publish_kafka_message(key, value)



if __name__ == '__main__':
    s = Fin_Search()
    s.search_fins()

