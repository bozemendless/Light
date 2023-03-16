import re

def validate_email(email):
    email_regex = r'^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$'
    is_email_valid = bool(re.search(email_regex, email))
    return is_email_valid

def validate_username(username):
    username_regex = r'^[A-Za-z0-9]{2,32}$'
    is_username_valid = bool(re.search(username_regex, username))
    return is_username_valid

def validate_password(password):
    password_regex = r'.{6,72}$'
    is_password_valid = bool(re.search(password_regex, password))
    return is_password_valid