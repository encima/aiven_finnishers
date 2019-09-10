import pytest
from producers import github_producer as ghp, config
from kafka.admin import KafkaAdminClient, NewTopic


def test_client():
    config.KAFKA_TOPIC = 'test_producer'
    s = ghp.GithubProducer()
    assert s is not None

