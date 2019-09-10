import pytest
from consumers import github_consumer as ghc, config
from kafka.admin import KafkaAdminClient, NewTopic
from pony.orm import *

@pytest.fixture(scope="module")
def client():
    config.KAFKA_TOPIC = 'test_producer'
    config.DB = config.TEST_DB
    s = ghc.GithubConsumer()
    assert s is not None
    yield s

@db_session
def test_valid_user(client):
    u = ghc.User(username='Terry')
    print(u)
    assert u is not None
