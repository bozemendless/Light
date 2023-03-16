from .utils import *
def test_validate_email():
    assert validate_email('test@gmail.com') == True
    assert validate_email('test.gmail.com') == False
    assert validate_email('test@123.com') == True
    assert validate_email('test@abc.123.com') == True
    assert validate_email('test@abc..com') == False
    assert validate_email('@gmail.com') == False

def test_validate_username():
    assert validate_username('jesse') == True
    assert validate_username('jesse123') == True
    assert validate_username('jesse.hou') == False
    assert validate_username('') == False
    assert validate_username('a') == False

def test_validate_password():
    assert validate_password('abc123') == True
    assert validate_password('pwd') == False
    assert validate_password('A1b2C3!') == True
    assert validate_password('') == False