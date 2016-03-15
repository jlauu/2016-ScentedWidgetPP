import os

class Config(object):
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
