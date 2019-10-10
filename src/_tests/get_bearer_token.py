# Taken from the broadinstitute/mcnulty repository
import sys
import json
from oauth2client.service_account import ServiceAccountCredentials
from httplib2 import Http


def getUserToken(argv):
  
  user_email = argv[0]
  scopes = ['profile', 'email', 'openid']

  credentials = ServiceAccountCredentials.from_json_keyfile_dict(
    json.loads(argv[1]), scopes=scopes)

  delegated = credentials.create_delegated(user_email)
  delegated.refresh(Http())
  token = delegated.access_token
  print(token)

if __name__ == "__main__":
  getUserToken(sys.argv[1:])
  