GITHUB_PAT="<TOKEN>"
KAFKA_URL=""
KAFKA_TOPIC="GITHUB_FINS"

SSL = {
  'ca': '',
  'cert': '',
  'key': '',
}

KAFKA_VAL_SCHEMA = """
{
   "namespace": "",
   "name": "value",
   "type": "record",
   "fields" : [
     {"name" : "user", "type" : "string"},
     {"name" : "avatar_url", "type" : "string"},
     {"name" : "repo_name", "type" : "string"},
     {"name" : "repo_url", "type" : "string"},
     {"name" : "repo_desc", "type" : "string"},
     {"name" : "release_title", "type" : "string"},
     {"name" : "release_desc", "type" : "string"}
     {"name" : "release_url", "type" : "string"}
   ]
}
"""

KAFKA_KEY_SCHEMA = """
{
   "namespace": "aiven.kafka",
   "name": "key",
   "type": "record",
   "fields" : [
     {"name" : "repo", "type" : "string"}
   ]
}
"""
